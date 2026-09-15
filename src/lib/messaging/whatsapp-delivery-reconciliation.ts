import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent } from "../dispatch/booking-core";
import { aggregateBroadcastStatus } from "./driver-offer-delivery-core";
import type { WhatsAppOutboundStatus } from "./whatsapp-outbox-types";
import { nextDeliveryStatus, type DeliveryWebhookStatus } from "./whatsapp-delivery-core";

const OUTBOX = "whatsappOutboundMessages";
const BOOKINGS = "operationalBookings";
const OFFERS = "dispatchOffers";
const BROADCASTS = "dispatchBroadcasts";
export async function reconcileWhatsAppDeliveryStatus(event: { messageId: string; status: string; errorCode?: string }) {
  if (!event.messageId || !["sent", "delivered", "read", "failed"].includes(event.status)) return { matched: false, ignored: true };
  const incoming = event.status as DeliveryWebhookStatus;
  const db = getAdminDb();
  const match = await db.collection(OUTBOX).where("providerMessageId", "==", event.messageId).limit(1).get();
  if (match.empty) return { matched: false, ignored: true };
  const jobRef = match.docs[0].ref;
  return db.runTransaction(async tx => {
    const jobSnap = await tx.get(jobRef);
    if (!jobSnap.exists) return { matched: false, ignored: true };
    const job = jobSnap.data()!;
    const purpose = String(job.purpose);
    if (!["driver_offer", "booking_offer", "driver_final_instructions", "customer_driver_details"].includes(purpose))
      return { matched: false, ignored: true };
    const next = nextDeliveryStatus(job.status as WhatsAppOutboundStatus, incoming);
    if (next === job.status) return { matched: true, duplicate: true, status: next };
    const bookingRef = db.collection(BOOKINGS).doc(String(job.bookingOperationalId));
    const offerPurpose = purpose === "driver_offer" || purpose === "booking_offer";
    const offerRef = offerPurpose ? bookingRef.collection(OFFERS).doc(String(job.offerId)) : null;
    const broadcastRef = offerPurpose ? bookingRef.collection(BROADCASTS).doc(String(job.broadcastId)) : null;
    const jobsSnap = offerPurpose
      ? await tx.get(db.collection(OUTBOX).where("broadcastId", "==", job.broadcastId))
      : null;
    const now = FieldValue.serverTimestamp();
    const timestampField = next === "sent" ? "sentAt" : next === "delivered" ? "deliveredAt" : next === "read" ? "readAt" : "failedAt";
    const failure = next === "failed" ? { failureCode: event.errorCode ? `meta_${event.errorCode.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40)}` : "provider_confirmed_failure", failureRetryable: false } : {};
    tx.update(jobRef, { status: next, [timestampField]: now, ...failure });
    if (offerPurpose && offerRef && broadcastRef && jobsSnap) {
      tx.set(offerRef, { notificationStatus: next, [timestampField]: now, ...failure, updatedAt: now }, { merge: true });
      const statuses = jobsSnap.docs.map(item => item.id === jobRef.id ? next : item.data().status as WhatsAppOutboundStatus);
      tx.set(broadcastRef, { status: aggregateBroadcastStatus(statuses), updatedAt: now }, { merge: true });
      tx.set(bookingRef.collection("events").doc(`delivery-${jobRef.id}-${next}`), auditEvent(purpose === "booking_offer" ? "supplier_offer_delivery_status_changed" as never : "driver_offer_delivery_status_changed", now, { broadcastId: job.broadcastId, offerId: job.offerId, outboxJobId: jobRef.id, deliveryStatus: next, ...(next === "failed" ? { failureCode: failure.failureCode } : {}) }));
    } else {
      tx.set(bookingRef.collection("events").doc(`delivery-${jobRef.id}-${next}`), auditEvent("post_assignment_notification_delivery_status_changed" as never, now, { assignmentId: job.assignmentId, purpose, outboxJobId: jobRef.id, deliveryStatus: next, ...(next === "failed" ? { failureCode: failure.failureCode } : {}) }));
    }
    return { matched: true, duplicate: false, status: next };
  });
}
