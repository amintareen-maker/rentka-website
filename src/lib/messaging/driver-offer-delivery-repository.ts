import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent } from "../dispatch/booking-core";
import type { OperationalBooking } from "../dispatch/booking-types";
import type { DispatchBroadcast } from "../dispatch/broadcast-types";
import { issueSecureDriverOfferLink } from "../dispatch/driver-offer-portal-repository";
import { issueSecureVendorOfferLink } from "../dispatch/vendor-offer-portal-repository";
import type { DispatchOfferRecord } from "../dispatch/offer-types";
import { DISPATCH_COLLECTIONS } from "../dispatch/collections";
import type { DispatchDriver,DispatchVendor } from "../dispatch/types";
import { getWhatsAppOutboundProvider } from "./dualhook-whatsapp-outbound";
import { getDriverOfferDeliveryConfig } from "./driver-offer-delivery-config";
import { requireBookingOfferDeliveryConfig,requireDriverOfferDeliveryConfig } from "./driver-offer-delivery-config-core";
import { aggregateBroadcastStatus, assertBookingOfferSendable,assertDriverOfferSendable,bookingOfferTemplateComponents, driverOfferTemplateComponents, invokeDriverOfferProvider } from "./driver-offer-delivery-core";
import type { WhatsAppOutboundMessageJob, WhatsAppOutboundStatus } from "./whatsapp-outbox-types";

const OUTBOX = "whatsappOutboundMessages";
const BOOKINGS = "operationalBookings";
const OFFERS = "dispatchOffers";
const BROADCASTS = "dispatchBroadcasts";
const CONTROL = "dispatchBroadcastControl";

const doc = <T>(snap: FirebaseFirestore.DocumentSnapshot) => ({ ...snap.data(), id: snap.id }) as T;
const sanitizedReason = (error: unknown) => error instanceof Error && /expired/i.test(error.message) ? "offer_expired" : "stale_or_ineligible";

function updateBroadcastState(tx: FirebaseFirestore.Transaction, broadcastRef: FirebaseFirestore.DocumentReference, jobs: FirebaseFirestore.QuerySnapshot, changedJobId: string, changedStatus: WhatsAppOutboundStatus, now: FirebaseFirestore.FieldValue) {
  const statuses = jobs.docs.map(item => item.id === changedJobId ? changedStatus : item.data().status as WhatsAppOutboundStatus);
  tx.set(broadcastRef, { status: aggregateBroadcastStatus(statuses), updatedAt: now }, { merge: true });
}

export async function deliverDriverOfferJob(jobId: string) {
  const rawConfig = getDriverOfferDeliveryConfig();
  const db = getAdminDb();
  const jobRef = db.collection(OUTBOX).doc(jobId);
  const preflightSnap=await jobRef.get();
  if(!preflightSnap.exists)throw new Error("Offer delivery job was not found.");
  const preflight=doc<WhatsAppOutboundMessageJob>(preflightSnap);
  if(preflight.purpose==="booking_offer"&&(preflight.recipientType==="vendor"||preflight.recipientType==="independent_driver"))requireBookingOfferDeliveryConfig(rawConfig,preflight.recipientType);
  else requireDriverOfferDeliveryConfig(rawConfig);

  const claim = await db.runTransaction(async tx => {
    const jobSnap = await tx.get(jobRef);
    if (!jobSnap.exists) throw new Error("Driver offer delivery job was not found.");
    const job = doc<WhatsAppOutboundMessageJob>(jobSnap);
    if (job.status !== "queued" && !(job.status === "failed" && job.failureRetryable === true)) return { claimed: false as const, status: job.status };
    if (!job.broadcastId || !job.offerId) throw new Error("Driver offer delivery identity is incomplete.");
    const bookingRef = db.collection(BOOKINGS).doc(job.bookingOperationalId);
    const broadcastRef = bookingRef.collection(BROADCASTS).doc(job.broadcastId);
    const offerRef = bookingRef.collection(OFFERS).doc(job.offerId);
    const controlRef = bookingRef.collection(CONTROL).doc("current");
    const jobsQuery = db.collection(OUTBOX).where("broadcastId", "==", job.broadcastId);
    const [bookingSnap, broadcastSnap, offerSnap, controlSnap, jobsSnap] = await Promise.all([
      tx.get(bookingRef), tx.get(broadcastRef), tx.get(offerRef), tx.get(controlRef), tx.get(jobsQuery),
    ]);
    if (!bookingSnap.exists || !broadcastSnap.exists || !offerSnap.exists) throw new Error("Driver offer delivery context was not found.");
    const booking = doc<OperationalBooking>(bookingSnap);
    const broadcast = doc<DispatchBroadcast>(broadcastSnap);
    const offer = doc<DispatchOfferRecord>(offerSnap);
    let vendor:DispatchVendor|undefined,driver:DispatchDriver|undefined;
    if(job.purpose==="booking_offer"){
      if(offer.recipientType!=="vendor"&&offer.recipientType!=="independent_driver")throw new Error("Supplier offer recipient identity is invalid.");
      const vendorSnap=await tx.get(db.collection(DISPATCH_COLLECTIONS.vendors).doc(offer.supplyAccountId??""));
      if(!vendorSnap.exists)throw new Error("Supplier account was not found.");
      vendor=doc<DispatchVendor>(vendorSnap);
      if(offer.recipientType==="independent_driver"){
        const driverSnap=await tx.get(db.collection(DISPATCH_COLLECTIONS.drivers).doc(offer.recipientId??""));
        if(!driverSnap.exists)throw new Error("Independent owner-driver was not found.");
        driver=doc<DispatchDriver>(driverSnap);
      }
    }
    const attemptCount = job.attemptCount + 1;
    const now = FieldValue.serverTimestamp();
    try {
      const activeBroadcastId=String(controlSnap.data()?.activeBroadcastId??"");
      if(job.purpose==="booking_offer")assertBookingOfferSendable({job,booking,broadcast,offer,activeBroadcastId,vendor:vendor!,driver});
      else assertDriverOfferSendable({job,booking,broadcast,offer,activeBroadcastId});
    } catch (error) {
      const reason = sanitizedReason(error);
      tx.update(jobRef, { status: "cancelled", failureCode: reason, failureRetryable: false, failedAt: now });
      tx.set(offerRef, { notificationStatus: "cancelled", failureCode: reason, updatedAt: now }, { merge: true });
      updateBroadcastState(tx, broadcastRef, jobsSnap, job.id, "cancelled", now);
      tx.create(bookingRef.collection("events").doc(), auditEvent(job.purpose==="booking_offer"?"supplier_offer_send_prevented" as never:"driver_offer_send_prevented", now, { broadcastId: broadcast.id, offerId: offer.id, outboxJobId: job.id, attemptNumber: attemptCount, reason }));
      return { claimed: false as const, status: "cancelled" as const };
    }
    tx.update(jobRef, { status: "sending", attemptCount, claimedAt: now, claimedBy: "dispatch_admin", lastAttemptAt: now, failureCode: FieldValue.delete(), failureRetryable: FieldValue.delete() });
    tx.set(offerRef, { notificationStatus: "sending", updatedAt: now }, { merge: true });
    updateBroadcastState(tx, broadcastRef, jobsSnap, job.id, "sending", now);
    tx.create(bookingRef.collection("events").doc(), auditEvent(job.purpose==="booking_offer"?(attemptCount>1?"supplier_offer_delivery_retry" as never:"supplier_offer_send_started" as never):(attemptCount > 1 ? "driver_offer_delivery_retry" : "driver_offer_send_started"), now, { broadcastId: broadcast.id, offerId: offer.id, outboxJobId: job.id, attemptNumber: attemptCount,recipientType:job.recipientType }));
    return { claimed: true as const, job, booking, offer, attemptCount,target:job.purpose==="booking_offer"?assertBookingOfferSendable({job,booking,broadcast,offer,activeBroadcastId:String(controlSnap.data()?.activeBroadcastId??""),vendor:vendor!,driver}).target:offer.driverWhatsappNumber };
  });

  if (!claim.claimed) return { invoked: false as const, status: claim.status };
  let providerMessageId: string | undefined;
  try {
    const directRecipient=claim.job.purpose==="booking_offer"&&(claim.offer.recipientType==="vendor"||claim.offer.recipientType==="independent_driver")?claim.offer.recipientType:undefined;
    const config=directRecipient?requireBookingOfferDeliveryConfig(rawConfig,directRecipient):requireDriverOfferDeliveryConfig(rawConfig);
    const secure = directRecipient==="vendor"?await issueSecureVendorOfferLink(claim.job.bookingOperationalId,claim.offer.id):await issueSecureDriverOfferLink(claim.job.bookingOperationalId, claim.offer.id);
    const secureUrl = new URL(secure.url, config.publicBaseUrl).toString();
    const provider = getWhatsAppOutboundProvider("dualhook");
    const result = await invokeDriverOfferProvider(provider, {
      to: claim.target!,
      name: config.templateName,
      languageCode: config.templateLanguage,
      components: directRecipient?bookingOfferTemplateComponents(claim.booking,claim.offer,secureUrl):driverOfferTemplateComponents(claim.booking, claim.offer, secureUrl),
    });
    if (result.status !== "provider_accepted") {
      await finalizeDriverOfferAttempt(jobId, claim.job, claim.offer, claim.attemptCount, result.status, undefined, result.failureCode, result.retryable);
      return { invoked: true as const, status: result.status, attemptCount: claim.attemptCount };
    }
    providerMessageId = result.providerMessageId;
  } catch {
    await finalizeDriverOfferAttempt(jobId, claim.job, claim.offer, claim.attemptCount, "failed", undefined, "secure_offer_preparation_failed", false);
    return { invoked: true as const, status: "failed" as const, attemptCount: claim.attemptCount };
  }
  await finalizeDriverOfferAttempt(jobId, claim.job, claim.offer, claim.attemptCount, "provider_accepted", providerMessageId);
  return { invoked: true as const, status: "provider_accepted" as const, providerMessageId, attemptCount: claim.attemptCount };
}

export async function deliverApprovedBookingOfferJobs(broadcastId:string){
 const db=getAdminDb(),jobs=await db.collection(OUTBOX).where("broadcastId","==",broadcastId).get(),eligible=jobs.docs.filter(item=>item.data().purpose==="booking_offer");
 const results=[];for(const item of eligible){try{results.push({jobId:item.id,...await deliverDriverOfferJob(item.id)})}catch(error){results.push({jobId:item.id,invoked:false as const,status:"failed" as const,error:error instanceof Error?error.message:"Delivery preflight failed."})}}
 return{broadcastId,total:eligible.length,invokedCount:results.filter(item=>item.invoked).length,results};
}

export const deliverBookingOfferJob=deliverDriverOfferJob;

async function finalizeDriverOfferAttempt(jobId: string, job: WhatsAppOutboundMessageJob, offer: DispatchOfferRecord, attemptCount: number, status: "provider_accepted" | "failed" | "outcome_unknown", providerMessageId?: string, failureCode?: string, retryable = false) {
  const db = getAdminDb();
  const jobRef = db.collection(OUTBOX).doc(jobId);
  const bookingRef = db.collection(BOOKINGS).doc(job.bookingOperationalId);
  const offerRef = bookingRef.collection(OFFERS).doc(offer.id);
  const broadcastRef = bookingRef.collection(BROADCASTS).doc(job.broadcastId!);
  await db.runTransaction(async tx => {
    const [currentJob, jobsSnap] = await Promise.all([tx.get(jobRef), tx.get(db.collection(OUTBOX).where("broadcastId", "==", job.broadcastId))]);
    if (!currentJob.exists || currentJob.data()?.status !== "sending" || Number(currentJob.data()?.attemptCount) !== attemptCount) return;
    const now = FieldValue.serverTimestamp();
    tx.update(jobRef, {
      status,
      ...(providerMessageId ? { providerMessageId, providerAcceptedAt: now } : {}),
      ...(failureCode ? { failureCode, failureRetryable: retryable, failedAt: now } : {}),
    });
    tx.set(offerRef, {
      notificationStatus: status,
      ...(providerMessageId ? { providerMessageId, providerAcceptedAt: now } : {}),
      ...(failureCode ? { failureCode, failureRetryable: retryable, failedAt: now } : {}),
      updatedAt: now,
    }, { merge: true });
    updateBroadcastState(tx, broadcastRef, jobsSnap, jobId, status, now);
    const eventName=job.purpose==="booking_offer"
      ? status==="provider_accepted"?"supplier_offer_provider_accepted":status==="failed"?"supplier_offer_delivery_failed":"supplier_offer_delivery_unknown"
      : status==="provider_accepted"?"driver_offer_provider_accepted":status==="failed"?"driver_offer_delivery_failed":"driver_offer_delivery_unknown";
    tx.create(bookingRef.collection("events").doc(), auditEvent(eventName as never, now, { broadcastId: job.broadcastId, offerId: offer.id, outboxJobId: jobId, attemptNumber: attemptCount, recipientType:job.recipientType, ...(failureCode ? { failureCode, retryable } : {}) }));
  });
}
