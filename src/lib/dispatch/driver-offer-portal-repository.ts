import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent, sharedActor } from "./booking-core";
import type { OperationalBooking } from "./booking-types";
import {
  assertCounterDecisionCurrent,
  assertCurrentBroadcast,
  assertCurrentOfferRevision,
  assertDriverResponseOpen,
  createSecureDriverOfferProjection,
  validateCounterPayout,
  validateRevisedOfferExpiry,
} from "./driver-offer-portal-core";
import type { DriverOfferPortalMutation, DriverOfferResponse, DriverOfferTokenRecord } from "./driver-offer-portal-types";
import { directDriverOfferIdentity,type DispatchOfferRecord } from "./offer-types";
import { assertOfferOpen, isOfferExpired } from "./dispatch-orchestration-core.ts";

const BOOKINGS = "operationalBookings";
const OFFERS = "dispatchOffers";
const TOKENS = "driverOfferTokens";
const RESPONSES = "secureResponses";
const CONTROL = "dispatchBroadcastControl";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value
  ? (value as { toDate(): Date }).toDate().toISOString()
  : String(value ?? "");
const response = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const data = doc.data()!;
  return { ...data, id: doc.id, timestamp: iso(data.timestamp) } as DriverOfferResponse;
};
const validToken = (token: string) => /^[A-Za-z0-9_-]{40,100}$/.test(token);
const fallbackTokenExpiry = (booking: OperationalBooking) => {
  const tripEnd = new Date(booking.assignment?.window.end ?? `${booking.itinerary.travelDate}T23:59:59+05:00`).getTime();
  return new Date(Math.max(Date.now() + 86400000, tripEnd + 3600000));
};
const offerRevision = (offer: DispatchOfferRecord) => offer.offerRevision ?? 0;

function assertBookingAndOfferCurrent(booking: OperationalBooking, offer: DispatchOfferRecord, activeBroadcastId?: string) {
  if (booking.lifecycle !== "active" || booking.assignment?.status === "assigned") throw new Error("This offer is no longer available.");
  assertOfferOpen(offer);
  assertCurrentBroadcast(offer, activeBroadcastId);
  if (offer.broadcastId && booking.internalFinancials.vendorPayoutMinor !== offer.approvedPayoutMinor) throw new Error("This offer is no longer available.");
}

export async function issueSecureDriverOfferLink(bookingOperationalId: string, offerId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hash(token);
  const db = getAdminDb();
  const bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId);
  const offerRef = bookingRef.collection(OFFERS).doc(offerId);
  const controlRef = bookingRef.collection(CONTROL).doc("current");
  const tokensQuery = db.collection(TOKENS).where("offerId", "==", offerId);

  await db.runTransaction(async tx => {
    const [bookingSnap, offerSnap, controlSnap, oldTokens] = await Promise.all([
      tx.get(bookingRef), tx.get(offerRef), tx.get(controlRef), tx.get(tokensQuery),
    ]);
    if (!bookingSnap.exists || !offerSnap.exists) throw new Error("Offer is not available.");
    const booking = { ...bookingSnap.data(), id: bookingSnap.id } as OperationalBooking;
    const offer = { ...offerSnap.data(), id: offerSnap.id } as DispatchOfferRecord;
    const identity = directDriverOfferIdentity(offer);
    assertBookingAndOfferCurrent(booking, offer, String(controlSnap.data()?.activeBroadcastId ?? ""));

    const now = FieldValue.serverTimestamp();
    for (const old of oldTokens.docs.filter(doc => doc.data().active === true)) tx.update(old.ref, { active: false, revokedAt: now, revokeReason: "reissued" });
    tx.create(db.collection(TOKENS).doc(tokenHash), {
      bookingOperationalId,
      offerId,
      candidateId: offer.candidateId,
      driverId: identity.driverId,
      vendorId: identity.vendorId,
      offeredPayoutMinor: offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor,
      offerRevision: offerRevision(offer),
      ...(offer.broadcastId ? { broadcastId: offer.broadcastId } : {}),
      active: true,
      createdAt: now,
      expiresAt: offer.offerExpiresAt ? new Date(offer.offerExpiresAt) : fallbackTokenExpiry(booking),
    });
    tx.set(offerRef, {
      portalStatus: "open",
      negotiationStatus: "awaiting_driver",
      currentOfferedPayoutMinor: offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor,
      updatedAt: now,
    }, { merge: true });
    tx.create(bookingRef.collection("events").doc(), auditEvent("driver_offer_secure_link_issued", now, {
      offerId,
      driverId: identity.driverId,
      offerRevision: offerRevision(offer),
      tokenHashPrefix: tokenHash.slice(0, 8),
      reissued: oldTokens.docs.some(doc => doc.data().active === true),
    }));
  });
  return { url: `/driver/offer/${token}` };
}

async function tokenContext(token: string, allowExpired = false) {
  if (!validToken(token)) throw new Error("Invalid or expired offer link.");
  const db = getAdminDb();
  const tokenRef = db.collection(TOKENS).doc(hash(token));
  const tokenSnap = await tokenRef.get();
  if (!tokenSnap.exists) throw new Error("Invalid or expired offer link.");
  const data = tokenSnap.data() as DriverOfferTokenRecord;
  if (!data.active || (!allowExpired && new Date(iso(data.expiresAt)).getTime() <= Date.now())) throw new Error("Invalid or expired offer link.");
  return { db, tokenRef, data };
}

export async function getSecureDriverOfferPage(token: string) {
  const { db, data } = await tokenContext(token, true);
  const bookingRef = db.collection(BOOKINGS).doc(data.bookingOperationalId);
  const offerRef = bookingRef.collection(OFFERS).doc(data.offerId);
  const [bookingSnap, offerSnap, controlSnap, responsesSnap] = await Promise.all([
    bookingRef.get(),
    offerRef.get(),
    bookingRef.collection(CONTROL).doc("current").get(),
    offerRef.collection(RESPONSES).orderBy("timestamp", "desc").get(),
  ]);
  if (!bookingSnap.exists || !offerSnap.exists) throw new Error("Offer is no longer available.");
  const booking = { ...bookingSnap.data(), id: bookingSnap.id } as OperationalBooking;
  const offer = { ...offerSnap.data(), id: offerSnap.id } as DispatchOfferRecord;
  const identity=directDriverOfferIdentity(offer);
  if (identity.driverId !== data.driverId || identity.vendorId !== data.vendorId || offer.candidateId !== data.candidateId) throw new Error("Offer authorization does not match.");
  assertCurrentOfferRevision(data.offerRevision, offer.offerRevision);
  assertCurrentBroadcast(offer, String(controlSnap.data()?.activeBroadcastId ?? ""));

  if (isOfferExpired(offer.offerExpiresAt) && !["accepted", "declined", "expired", "closed", "cancelled", "not_selected"].includes(offer.responseStatus)) {
    const now = FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.set(offerRef, { responseStatus: "expired", portalStatus: "closed", closeReason: "offer_expired", updatedAt: now }, { merge: true });
    batch.set(bookingRef.collection("events").doc(`offer-expired-${offer.id}-${offerRevision(offer)}`), auditEvent("driver_offer_response_changed", now, { offerId: offer.id, driverId: identity.driverId, offerRevision: offerRevision(offer), responseStatus: "expired" }));
    await batch.commit();
    offer.responseStatus = "expired";
    offer.portalStatus = "closed";
  } else if (!offer.secureViewedAt && booking.lifecycle === "active" && booking.assignment?.status !== "assigned" && offer.portalStatus !== "closed") {
    const now = FieldValue.serverTimestamp();
    await offerRef.set({ secureViewedAt: now, updatedAt: now }, { merge: true });
    await bookingRef.collection("events").add(auditEvent("driver_offer_secure_viewed", now, { offerId: offer.id, driverId: identity.driverId, offerRevision: offerRevision(offer) }, { type: "driver_offer", driverId: identity.driverId, offerId: offer.id } as never));
  }
  return createSecureDriverOfferProjection(booking, { ...offer, secureViewedAt: offer.secureViewedAt ?? new Date().toISOString() }, responsesSnap.docs.map(response));
}

export async function submitSecureDriverOfferResponse(token: string, mutation: DriverOfferPortalMutation) {
  const { db, tokenRef, data } = await tokenContext(token);
  const bookingRef = db.collection(BOOKINGS).doc(data.bookingOperationalId);
  const offerRef = bookingRef.collection(OFFERS).doc(data.offerId);
  const controlRef = bookingRef.collection(CONTROL).doc("current");

  return db.runTransaction(async tx => {
    const [tokenSnap, bookingSnap, offerSnap, controlSnap, latestResponses] = await Promise.all([
      tx.get(tokenRef), tx.get(bookingRef), tx.get(offerRef), tx.get(controlRef),
      tx.get(offerRef.collection(RESPONSES).orderBy("timestamp", "desc").limit(1)),
    ]);
    if (!tokenSnap.exists || tokenSnap.data()?.active !== true || new Date(iso(tokenSnap.data()?.expiresAt)).getTime() <= Date.now()) throw new Error("This offer link is no longer active.");
    if (!bookingSnap.exists || !offerSnap.exists) throw new Error("Offer is no longer available.");
    const booking = { ...bookingSnap.data(), id: bookingSnap.id } as OperationalBooking;
    const offer = { ...offerSnap.data(), id: offerSnap.id } as DispatchOfferRecord;
    assertBookingAndOfferCurrent(booking, offer, String(controlSnap.data()?.activeBroadcastId ?? ""));
    const identity=directDriverOfferIdentity(offer);
    if (identity.driverId !== data.driverId || identity.vendorId !== data.vendorId || offer.candidateId !== data.candidateId) throw new Error("Offer authorization does not match.");
    assertCurrentOfferRevision(data.offerRevision, offer.offerRevision);
    const offered = offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor;
    if (offered !== data.offeredPayoutMinor) throw new Error("This offer is no longer available.");

    const latestDoc = latestResponses.docs[0];
    const latest = latestDoc?.data() as DriverOfferPortalMutation | undefined;
    const comparable = (value: DriverOfferPortalMutation) => JSON.stringify({
      kind: value.kind,
      ...(value.kind === "declined" ? { declineReason: value.declineReason, note: value.note } : {}),
      ...(value.kind === "countered" ? { requestedPayoutMinor: value.requestedPayoutMinor, note: value.note } : {}),
    });
    if (latest && comparable(latest) === comparable(mutation)) return { responseId: latestDoc.id, kind: mutation.kind, duplicate: true };
    assertDriverResponseOpen(offer);
    if (mutation.kind === "countered") validateCounterPayout(mutation.requestedPayoutMinor, offered);

    const now = FieldValue.serverTimestamp();
    const actor = { type: "driver_offer", driverId: identity.driverId, offerId: offer.id } as const;
    const responseRef = offerRef.collection(RESPONSES).doc();
    const responseData = { ...mutation, offeredPayoutMinor: offered, offerRevision: offerRevision(offer), timestamp: now, actor, source: "driver_secure_page" };
    tx.create(responseRef, responseData);
    tx.update(offerRef, {
      responseStatus: mutation.kind,
      responseSource: "driver_secure_page",
      responseAt: now,
      responseNote: "note" in mutation ? mutation.note ?? FieldValue.delete() : FieldValue.delete(),
      declineReason: mutation.kind === "declined" ? mutation.declineReason : FieldValue.delete(),
      requestedPayoutMinor: mutation.kind === "countered" ? mutation.requestedPayoutMinor : FieldValue.delete(),
      agreedPayoutMinor: mutation.kind === "accepted" ? offered : FieldValue.delete(),
      negotiationStatus: mutation.kind === "countered" ? "awaiting_admin_review" : mutation.kind === "accepted" ? "awaiting_admin_review" : "counter_rejected",
      ...(mutation.kind === "declined" ? { portalStatus: "closed", closeReason: "driver_declined" } : {}),
      updatedAt: now,
      updatedBy: actor,
    });
    tx.create(bookingRef.collection("events").doc(), auditEvent(`driver_offer_${mutation.kind}`, now, {
      offerId: offer.id,
      driverId: identity.driverId,
      offerRevision: offerRevision(offer),
      offeredPayoutMinor: offered,
      ...(mutation.kind === "countered" ? { requestedPayoutMinor: mutation.requestedPayoutMinor } : {}),
      ...(mutation.kind === "declined" ? { declineReason: mutation.declineReason } : {}),
    }, actor as never));
    return { responseId: responseRef.id, kind: mutation.kind, duplicate: false };
  });
}

export type CounterReviewRequest = {
  action: "accept" | "reject" | "revised_offer";
  expectedRevision: number;
  expectedCounterMinor: number;
  revisedPayoutMinor?: number;
  revisedOfferExpiresAt?: string;
};

export async function reviewDriverCounter(bookingOperationalId: string, offerId: string, request: CounterReviewRequest) {
  const revisedToken = request.action === "revised_offer" ? randomBytes(32).toString("base64url") : undefined;
  const revisedTokenHash = revisedToken ? hash(revisedToken) : undefined;
  const revisedExpiry = request.action === "revised_offer" ? validateRevisedOfferExpiry(request.revisedOfferExpiresAt ?? "") : undefined;
  const db = getAdminDb();
  const bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId);
  const offerRef = bookingRef.collection(OFFERS).doc(offerId);
  const controlRef = bookingRef.collection(CONTROL).doc("current");
  const tokensQuery = db.collection(TOKENS).where("offerId", "==", offerId);

  return db.runTransaction(async tx => {
    const [bookingSnap, offerSnap, controlSnap, tokenSnaps] = await Promise.all([
      tx.get(bookingRef), tx.get(offerRef), tx.get(controlRef), tx.get(tokensQuery),
    ]);
    if (!bookingSnap.exists || !offerSnap.exists) throw new Error("Offer not found.");
    const booking = { ...bookingSnap.data(), id: bookingSnap.id } as OperationalBooking;
    const offer = { ...offerSnap.data(), id: offerSnap.id } as DispatchOfferRecord;
    const identity = directDriverOfferIdentity(offer);

    const decisionName = request.action === "accept" ? "accept_counter" : request.action === "reject" ? "reject_counter" : "revised_offer";
    if (offer.lastAdminDecision === decisionName && offer.lastAdminDecisionRevision === request.expectedRevision) {
      return { duplicate: true, ...(request.action === "revised_offer" ? {} : {}) };
    }
    assertBookingAndOfferCurrent(booking, offer, String(controlSnap.data()?.activeBroadcastId ?? ""));
    assertCounterDecisionCurrent(offer, request.expectedRevision, request.expectedCounterMinor);
    const counterMinor = offer.requestedPayoutMinor!;
    const currentMinor = offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor;
    const nextRevision = request.expectedRevision + 1;
    if (request.action === "revised_offer") validateCounterPayout(request.revisedPayoutMinor ?? 0, currentMinor);

    const historyRef = offerRef.collection("offerHistory").doc(`counter-${request.expectedRevision}-${request.action}`);
    const eventRef = bookingRef.collection("events").doc(`counter-${offerId}-${request.expectedRevision}-${request.action}`);
    const [historySnap, eventSnap] = await Promise.all([tx.get(historyRef), tx.get(eventRef)]);
    const now = FieldValue.serverTimestamp();
    for (const item of tokenSnaps.docs.filter(doc => doc.data().active === true)) tx.update(item.ref, { active: false, revokedAt: now, revokeReason: request.action });

    if (request.action === "accept") {
      tx.update(offerRef, {
        responseStatus: "accepted",
        responseSource: "admin_manual",
        agreedPayoutMinor: counterMinor,
        negotiationStatus: "counter_agreed",
        portalStatus: "closed",
        closeReason: "counter_agreed",
        lastAdminDecision: decisionName,
        lastAdminDecisionRevision: request.expectedRevision,
        updatedAt: now,
        updatedBy: sharedActor,
      });
    } else if (request.action === "reject") {
      tx.update(offerRef, {
        responseStatus: "declined",
        responseSource: "admin_manual",
        negotiationStatus: "counter_rejected",
        portalStatus: "closed",
        closeReason: "counter_rejected",
        responseNote: "Counter rejected by RentKA",
        lastAdminDecision: decisionName,
        lastAdminDecisionRevision: request.expectedRevision,
        updatedAt: now,
        updatedBy: sharedActor,
      });
    } else {
      tx.update(offerRef, {
        currentOfferedPayoutMinor: request.revisedPayoutMinor,
        previousCounterPayoutMinor: counterMinor,
        responseStatus: "not_recorded",
        responseSource: "admin_manual",
        requestedPayoutMinor: FieldValue.delete(),
        agreedPayoutMinor: FieldValue.delete(),
        responseAt: FieldValue.delete(),
        negotiationStatus: "awaiting_driver",
        portalStatus: "open",
        closeReason: FieldValue.delete(),
        offerRevision: nextRevision,
        offerExpiresAt: revisedExpiry,
        lastAdminDecision: decisionName,
        lastAdminDecisionRevision: request.expectedRevision,
        updatedAt: now,
        updatedBy: sharedActor,
      });
      tx.create(db.collection(TOKENS).doc(revisedTokenHash!), {
        bookingOperationalId,
        offerId,
        candidateId: offer.candidateId,
        driverId: identity.driverId,
        vendorId: identity.vendorId,
        offeredPayoutMinor: request.revisedPayoutMinor,
        offerRevision: nextRevision,
        ...(offer.broadcastId ? { broadcastId: offer.broadcastId } : {}),
        active: true,
        createdAt: now,
        expiresAt: new Date(revisedExpiry!),
      });
    }

    if (!historySnap.exists) tx.create(historyRef, {
      kind: request.action,
      offerRevision: request.expectedRevision,
      originalOfferedPayoutMinor: offer.approvedPayoutMinor,
      offeredPayoutMinor: currentMinor,
      driverCounterPayoutMinor: counterMinor,
      ...(request.action === "accept" ? { agreedPayoutMinor: counterMinor } : {}),
      ...(request.action === "revised_offer" ? { revisedPayoutMinor: request.revisedPayoutMinor, nextOfferRevision: nextRevision, offerExpiresAt: revisedExpiry } : {}),
      timestamp: now,
      actor: sharedActor,
    });
    if (!eventSnap.exists) tx.create(eventRef, auditEvent(
      request.action === "accept" ? "driver_counter_accepted" : request.action === "reject" ? "driver_counter_rejected" : "driver_revised_offer_prepared",
      now,
      {
        offerId,
        driverId: identity.driverId,
        offerRevision: request.expectedRevision,
        originalOfferedPayoutMinor: offer.approvedPayoutMinor,
        driverCounterPayoutMinor: counterMinor,
        ...(request.action === "accept" ? { agreedPayoutMinor: counterMinor } : {}),
        ...(request.action === "revised_offer" ? { revisedPayoutMinor: request.revisedPayoutMinor, nextOfferRevision: nextRevision, offerExpiresAt: revisedExpiry } : {}),
      },
    ));
    return { duplicate: false, ...(revisedToken ? { url: `/driver/offer/${revisedToken}` } : {}) };
  });
}

export async function closeSecureOffersAfterCancellation(bookingOperationalId: string) {
  const db = getAdminDb();
  const bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId);
  const offers = await bookingRef.collection(OFFERS).get();
  const open = offers.docs.filter(doc => doc.data().portalStatus !== "closed");
  if (!open.length) return;
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const item of open) batch.set(item.ref, { portalStatus: "closed", closeReason: "booking_cancelled", updatedAt: now }, { merge: true });
  batch.create(bookingRef.collection("events").doc(), auditEvent("driver_offers_closed", now, { reason: "booking_cancelled", offerIds: open.map(item => item.id) }));
  await batch.commit();
}
