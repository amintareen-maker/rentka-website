import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent } from "../dispatch/booking-core";
import type { OperationalBooking } from "../dispatch/booking-types";
import type { DispatchBroadcast } from "../dispatch/broadcast-types";
import { issueSecureDriverOfferLink } from "../dispatch/driver-offer-portal-repository";
import type { DispatchOfferRecord } from "../dispatch/offer-types";
import { getWhatsAppOutboundProvider } from "./dualhook-whatsapp-outbound";
import { getDriverOfferDeliveryConfig } from "./driver-offer-delivery-config";
import { requireDriverOfferDeliveryConfig } from "./driver-offer-delivery-config-core";
import { aggregateBroadcastStatus, assertDriverOfferSendable, driverOfferTemplateComponents, invokeDriverOfferProvider } from "./driver-offer-delivery-core";
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
  const config = requireDriverOfferDeliveryConfig(getDriverOfferDeliveryConfig());
  const db = getAdminDb();
  const jobRef = db.collection(OUTBOX).doc(jobId);

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
    const attemptCount = job.attemptCount + 1;
    const now = FieldValue.serverTimestamp();
    try {
      assertDriverOfferSendable({ job, booking, broadcast, offer, activeBroadcastId: String(controlSnap.data()?.activeBroadcastId ?? "") });
    } catch (error) {
      const reason = sanitizedReason(error);
      tx.update(jobRef, { status: "cancelled", failureCode: reason, failureRetryable: false, failedAt: now });
      tx.set(offerRef, { notificationStatus: "cancelled", failureCode: reason, updatedAt: now }, { merge: true });
      updateBroadcastState(tx, broadcastRef, jobsSnap, job.id, "cancelled", now);
      tx.create(bookingRef.collection("events").doc(), auditEvent("driver_offer_send_prevented", now, { broadcastId: broadcast.id, offerId: offer.id, outboxJobId: job.id, attemptNumber: attemptCount, reason }));
      return { claimed: false as const, status: "cancelled" as const };
    }
    tx.update(jobRef, { status: "sending", attemptCount, claimedAt: now, claimedBy: "dispatch_admin", lastAttemptAt: now, failureCode: FieldValue.delete(), failureRetryable: FieldValue.delete() });
    tx.set(offerRef, { notificationStatus: "sending", updatedAt: now }, { merge: true });
    updateBroadcastState(tx, broadcastRef, jobsSnap, job.id, "sending", now);
    tx.create(bookingRef.collection("events").doc(), auditEvent(attemptCount > 1 ? "driver_offer_delivery_retry" : "driver_offer_send_started", now, { broadcastId: broadcast.id, offerId: offer.id, outboxJobId: job.id, attemptNumber: attemptCount }));
    return { claimed: true as const, job, booking, offer, attemptCount };
  });

  if (!claim.claimed) return { invoked: false as const, status: claim.status };

  let providerMessageId: string | undefined;
  try {
    const secure = await issueSecureDriverOfferLink(claim.job.bookingOperationalId, claim.offer.id);
    const secureUrl = new URL(secure.url, config.publicBaseUrl).toString();
    const provider = getWhatsAppOutboundProvider("dualhook");
    const result = await invokeDriverOfferProvider(provider, {
      to: claim.offer.driverWhatsappNumber,
      name: config.templateName,
      languageCode: config.templateLanguage,
      components: driverOfferTemplateComponents(claim.booking, claim.offer, secureUrl),
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
    tx.create(bookingRef.collection("events").doc(), auditEvent(status === "provider_accepted" ? "driver_offer_provider_accepted" : status === "failed" ? "driver_offer_delivery_failed" : "driver_offer_delivery_unknown", now, { broadcastId: job.broadcastId, offerId: offer.id, outboxJobId: jobId, attemptNumber: attemptCount, ...(failureCode ? { failureCode, retryable } : {}) }));
  });
}
