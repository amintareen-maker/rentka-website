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
    if (!jobSnap.exists || jobSnap.data()?.purpose !== "driver_offer") return { matched: false, ignored: true };
    const job = jobSnap.data()!;
    const next = nextDeliveryStatus(job.status as WhatsAppOutboundStatus, incoming);
    if (next === job.status) return { matched: true, duplicate: true, status: next };
    const bookingRef = db.collection(BOOKINGS).doc(String(job.bookingOperationalId));
    const offerRef = bookingRef.collection(OFFERS).doc(String(job.offerId));
    const broadcastRef = bookingRef.collection(BROADCASTS).doc(String(job.broadcastId));
    const jobsSnap = await tx.get(db.collection(OUTBOX).where("broadcastId", "==", job.broadcastId));
    const now = FieldValue.serverTimestamp();
    const timestampField = next === "sent" ? "sentAt" : next === "delivered" ? "deliveredAt" : next === "read" ? "readAt" : "failedAt";
    const failure = next === "failed" ? { failureCode: event.errorCode ? `meta_${event.errorCode.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40)}` : "provider_confirmed_failure", failureRetryable: false } : {};
    tx.update(jobRef, { status: next, [timestampField]: now, ...failure });
    tx.set(offerRef, { notificationStatus: next, [timestampField]: now, ...failure, updatedAt: now }, { merge: true });
    const statuses = jobsSnap.docs.map(item => item.id === jobRef.id ? next : item.data().status as WhatsAppOutboundStatus);
    tx.set(broadcastRef, { status: aggregateBroadcastStatus(statuses), updatedAt: now }, { merge: true });
    tx.set(bookingRef.collection("events").doc(`delivery-${jobRef.id}-${next}`), auditEvent("driver_offer_delivery_status_changed", now, { broadcastId: job.broadcastId, offerId: job.offerId, outboxJobId: jobRef.id, deliveryStatus: next, ...(next === "failed" ? { failureCode: failure.failureCode } : {}) }));
    return { matched: true, duplicate: false, status: next };
  });
}
