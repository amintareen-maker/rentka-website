import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import type { BookingDeliveryPayload, DeliveryDestination, DestinationOutcome } from "./types";

export const deliveryDocumentId = (source: string, sourceDocumentId: string) => createHash("sha256").update(`${source}:${sourceDocumentId}`).digest("hex");

export const deliveryStore = {
  async start(destination: DeliveryDestination, payload: BookingDeliveryPayload) {
    const db = getAdminDb(), ref = db.collection("bookingDeliveries").doc(deliveryDocumentId(payload.source, payload.sourceDocumentId));
    return db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref), existing = snapshot.data()?.destinations?.[destination];
      if (["delivered", "not_applicable", "customer_handoff"].includes(existing?.status)) return false;
      const processingAt = existing?.lastAttemptAt?.toDate?.();
      if (existing?.status === "processing" && processingAt instanceof Date && Date.now() - processingAt.getTime() < 5 * 60_000) return false;
      const now = FieldValue.serverTimestamp();
      transaction.set(ref, { bookingId: payload.bookingId, source: payload.source, sourceDocumentId: payload.sourceDocumentId,
        createdAt: snapshot.exists ? snapshot.data()?.createdAt : now, updatedAt: now,
        destinations: { [destination]: { status: "processing", attempts: Number(existing?.attempts ?? 0) + 1, lastAttemptAt: now, error: null } } }, { merge: true });
      return true;
    });
  },
  async read(destination: DeliveryDestination, payload: BookingDeliveryPayload): Promise<DestinationOutcome> {
    const snapshot = await getAdminDb().collection("bookingDeliveries").doc(deliveryDocumentId(payload.source, payload.sourceDocumentId)).get();
    const saved = snapshot.data()?.destinations?.[destination];
    return { status: saved?.status ?? "processing", ...(saved?.error ? { error: saved.error } : {}) };
  },
  async finish(destination: DeliveryDestination, payload: BookingDeliveryPayload, outcome: DestinationOutcome) {
    const now = FieldValue.serverTimestamp();
    await getAdminDb().collection("bookingDeliveries").doc(deliveryDocumentId(payload.source, payload.sourceDocumentId)).set({ updatedAt: now,
      destinations: { [destination]: { status: outcome.status, error: outcome.error ?? null,
        ...(outcome.status === "delivered" ? { deliveredAt: now } : {}),
        ...(outcome.status === "customer_handoff" ? { handoffRecordedAt: now } : {}),
        ...(outcome.providerMessageId ? { providerMessageId: outcome.providerMessageId } : {}),
        ...(outcome.operationalBookingId ? { operationalBookingId: outcome.operationalBookingId } : {}),
        ...(outcome.sheetStatus ? { sheetStatus: outcome.sheetStatus } : {}) } } }, { merge: true });
  },
};

export async function recordReplay(payload: BookingDeliveryPayload, destination: DeliveryDestination, actor: string, result: unknown) {
  await getAdminDb().collection("bookingDeliveries").doc(deliveryDocumentId(payload.source, payload.sourceDocumentId)).collection("events")
    .add({ type: "destination_replay", destination, actor, result, timestamp: FieldValue.serverTimestamp() });
}
