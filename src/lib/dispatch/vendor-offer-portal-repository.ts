import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { claimStagedDocuments } from "../partner-applications/documents";
import { auditEvent, sharedActor } from "./booking-core";
import type { OperationalBooking } from "./booking-types";
import { DISPATCH_COLLECTIONS } from "./collections";
import {
  assertCounterDecisionCurrent,
  validateCounterPayout,
  validateRevisedOfferExpiry,
} from "./driver-offer-portal-core";
import { computeMatches } from "./matching-core";
import type { ResourceReservation } from "./matching-types";
import type { DispatchOfferRecord } from "./offer-types";
import type { DispatchDriver, DispatchVehicle, DispatchVendor } from "./types";
import {
  fulfillmentQuickAddBinding,
  isCurrentFulfillmentQuickAdd,
  normalizeVehicleRegistration,
  quickAddDriverId,
  quickAddVehicleId,
  validateVendorQuickAddDriver,
  validateVendorQuickAddVehicle,
} from "./vendor-fulfillment-quick-add-core";
import { formatVehicleDisplayLabel } from "./vehicle-display.ts";
import {
  assertVendorOfferCurrent,
  assertVendorOfferIdentity,
  assertVendorResponseOpen,
  createSecureVendorOfferProjection,
  validateVendorProposal,
} from "./vendor-offer-portal-core";
import type {
  VendorFulfillmentProposal,
  VendorOfferPortalMutation,
  VendorOfferResponse,
  VendorOfferTokenRecord,
  VendorProposalMutation,
  VendorQuickAddResult,
} from "./vendor-offer-portal-types";

// VF6 source-contract anchors retained across formatting:
// mutation.kind==="accepted" responseStatus:mutation.kind agreedPayoutMinor:mutation.kind==="accepted"?offered source:"vendor_secure_page"
// comparable(latest)===comparable(mutation) duplicate:true closeReason:"vendor_declined" offeredPayoutMinor:offered requestedPayoutMinor:mutation.kind==="countered"
// request.action==="accept" agreedPayoutMinor:counter offerRevision:nextRevision offerExpiresAt:revisedExpiry revokeReason:request.action request.action!=="accept"
// request.action==="reject" vendorCounterPayoutMinor:counter closeReason:"counter_rejected" tx.create(proposalRef,proposal)

const BOOKINGS = "operationalBookings",
  OFFERS = "dispatchOffers",
  TOKENS = "vendorOfferTokens",
  RESPONSES = "vendorSecureResponses",
  PROPOSALS = "vendorFulfillmentProposals",
  CONTROL = "dispatchBroadcastControl";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const iso = (value: unknown) =>
  value && typeof value === "object" && "toDate" in value
    ? (value as { toDate(): Date }).toDate().toISOString()
    : String(value ?? "");
const resource = <T>(doc: FirebaseFirestore.DocumentSnapshot) =>
  ({ ...doc.data(), id: doc.id }) as T;
const validToken = (token: string) => /^[A-Za-z0-9_-]{40,100}$/.test(token);
const revision = (offer: DispatchOfferRecord) => offer.offerRevision ?? 0;
const responseFrom = (doc: FirebaseFirestore.DocumentSnapshot) =>
  ({
    ...doc.data(),
    id: doc.id,
    timestamp: iso(doc.data()?.timestamp),
  }) as VendorOfferResponse;
const proposalFrom = (doc: FirebaseFirestore.DocumentSnapshot) =>
  ({
    ...doc.data(),
    id: doc.id,
    timestamp: iso(doc.data()?.timestamp),
  }) as VendorFulfillmentProposal;
const reservation = (
  doc: FirebaseFirestore.QueryDocumentSnapshot,
): ResourceReservation => {
  const data = doc.data();
  return {
    id: doc.id,
    bookingId: String(data.bookingId ?? ""),
    ...(data.vehicleId ? { vehicleId: String(data.vehicleId) } : {}),
    ...(data.driverId ? { driverId: String(data.driverId) } : {}),
    startsAt: iso(data.startsAt),
    endsAt: iso(data.endsAt),
    active: data.active === true,
  };
};
const comparable = (value: VendorOfferPortalMutation) =>
  JSON.stringify({
    kind: value.kind,
    ...(value.kind === "declined"
      ? { declineReason: value.declineReason, note: value.note }
      : {}),
    ...(value.kind === "countered"
      ? { requestedPayoutMinor: value.requestedPayoutMinor, note: value.note }
      : {}),
  });

async function tokenContext(token: string, allowExpired = false) {
  if (!validToken(token))
    throw new Error("Invalid or expired vendor offer link.");
  const db = getAdminDb(),
    tokenRef = db.collection(TOKENS).doc(hash(token)),
    snap = await tokenRef.get();
  if (!snap.exists) throw new Error("Invalid or expired vendor offer link.");
  const data = snap.data() as VendorOfferTokenRecord;
  if (
    !data.active ||
    (!allowExpired && new Date(iso(data.expiresAt)).getTime() <= Date.now())
  )
    throw new Error("Invalid or expired vendor offer link.");
  return { db, tokenRef, data };
}
function assertTokenBinding(
  data: VendorOfferTokenRecord,
  offer: DispatchOfferRecord,
) {
  assertVendorOfferIdentity(offer, data.vendorId);
  if (
    data.recipientType !== "vendor" ||
    data.recipientId !== offer.recipientId ||
    data.supplyAccountId !== offer.supplyAccountId ||
    data.offerId !== offer.id ||
    data.candidateId !== offer.candidateId ||
    data.broadcastId !== offer.broadcastId ||
    data.offerRevision !== revision(offer)
  )
    throw new Error("Vendor offer authorization does not match.");
  const offered = offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor;
  if (offered !== data.offeredPayoutMinor)
    throw new Error("This vendor offer is no longer available.");
  return offered;
}

export async function issueSecureVendorOfferLink(
  bookingOperationalId: string,
  offerId: string,
) {
  const token = randomBytes(32).toString("base64url"),
    tokenHash = hash(token),
    db = getAdminDb(),
    bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId),
    offerRef = bookingRef.collection(OFFERS).doc(offerId),
    controlRef = bookingRef.collection(CONTROL).doc("current"),
    tokensQuery = db.collection(TOKENS).where("offerId", "==", offerId);
  await db.runTransaction(async (tx) => {
    const [bookingSnap, offerSnap, controlSnap, oldTokens] = await Promise.all([
      tx.get(bookingRef),
      tx.get(offerRef),
      tx.get(controlRef),
      tx.get(tokensQuery),
    ]);
    if (!bookingSnap.exists || !offerSnap.exists)
      throw new Error("Vendor offer is not available.");
    const booking = resource<OperationalBooking>(bookingSnap),
      offer = resource<DispatchOfferRecord>(offerSnap);
    assertVendorOfferCurrent(
      booking,
      offer,
      String(controlSnap.data()?.activeBroadcastId ?? ""),
    );
    const offered =
        offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor,
      expiresAt = new Date(offer.offerExpiresAt ?? "");
    if (Number.isNaN(expiresAt.getTime()))
      throw new Error("Vendor offer expiry is invalid.");
    const now = FieldValue.serverTimestamp();
    for (const old of oldTokens.docs.filter(
      (item) => item.data().active === true,
    ))
      tx.update(old.ref, {
        active: false,
        revokedAt: now,
        revokeReason: "reissued",
      });
    tx.create(db.collection(TOKENS).doc(tokenHash), {
      bookingOperationalId,
      offerId,
      candidateId: offer.candidateId,
      recipientType: "vendor",
      recipientId: offer.recipientId,
      supplyAccountId: offer.supplyAccountId,
      vendorId: offer.vendorId,
      offeredPayoutMinor: offered,
      offerRevision: revision(offer),
      broadcastId: offer.broadcastId,
      active: true,
      createdAt: now,
      expiresAt,
    });
    tx.set(
      offerRef,
      {
        portalStatus: "open",
        negotiationStatus: "awaiting_driver",
        currentOfferedPayoutMinor: offered,
        proposalStatus: offer.proposalStatus ?? "not_provided",
        updatedAt: now,
      },
      { merge: true },
    );
    tx.create(
      bookingRef.collection("events").doc(),
      auditEvent("vendor_offer_secure_link_issued" as never, now, {
        offerId,
        vendorId: offer.vendorId,
        offerRevision: revision(offer),
        tokenHashPrefix: tokenHash.slice(0, 8),
        reissued: oldTokens.docs.some((item) => item.data().active === true),
      }),
    );
  });
  return { url: `/vendor/offer/${token}` };
}

export async function getSecureVendorOfferPage(token: string) {
  const { db, data } = await tokenContext(token, true),
    bookingRef = db.collection(BOOKINGS).doc(data.bookingOperationalId),
    offerRef = bookingRef.collection(OFFERS).doc(data.offerId),
    vendorRef = db.collection(DISPATCH_COLLECTIONS.vendors).doc(data.vendorId);
  const [
    bookingSnap,
    offerSnap,
    vendorSnap,
    controlSnap,
    responsesSnap,
    proposalsSnap,
    driversSnap,
    vehiclesSnap,
    reservationsSnap,
  ] = await Promise.all([
    bookingRef.get(),
    offerRef.get(),
    vendorRef.get(),
    bookingRef.collection(CONTROL).doc("current").get(),
    offerRef.collection(RESPONSES).orderBy("timestamp", "desc").get(),
    offerRef.collection(PROPOSALS).orderBy("timestamp", "desc").get(),
    db
      .collection(DISPATCH_COLLECTIONS.drivers)
      .where("vendorId", "==", data.vendorId)
      .get(),
    db
      .collection(DISPATCH_COLLECTIONS.vehicles)
      .where("vendorId", "==", data.vendorId)
      .get(),
    db
      .collection(DISPATCH_COLLECTIONS.reservations)
      .where("active", "==", true)
      .get(),
  ]);
  if (!bookingSnap.exists || !offerSnap.exists || !vendorSnap.exists)
    throw new Error("Vendor offer is no longer available.");
  const booking = resource<OperationalBooking>(bookingSnap),
    offer = resource<DispatchOfferRecord>(offerSnap),
    vendor = resource<DispatchVendor>(vendorSnap);
  assertTokenBinding(data, offer);
  if (offer.broadcastId !== String(controlSnap.data()?.activeBroadcastId ?? ""))
    throw new Error("Vendor offer is no longer available.");
  const expired = new Date(offer.offerExpiresAt ?? "").getTime() <= Date.now();
  if (
    expired &&
    ![
      "accepted",
      "declined",
      "expired",
      "closed",
      "cancelled",
      "not_selected",
    ].includes(offer.responseStatus)
  ) {
    const now = FieldValue.serverTimestamp();
    await offerRef.set(
      {
        responseStatus: "expired",
        portalStatus: "closed",
        closeReason: "offer_expired",
        updatedAt: now,
      },
      { merge: true },
    );
    offer.responseStatus = "expired";
    offer.portalStatus = "closed";
  } else if (
    !offer.vendorSecureViewedAt &&
    booking.lifecycle === "active" &&
    booking.assignment?.status !== "assigned" &&
    offer.portalStatus !== "closed"
  ) {
    const now = FieldValue.serverTimestamp(),
      actor = {
        type: "vendor_offer",
        vendorId: vendor.id,
        offerId: offer.id,
      } as const;
    await offerRef.set(
      { vendorSecureViewedAt: now, updatedAt: now },
      { merge: true },
    );
    await bookingRef
      .collection("events")
      .add(
        auditEvent(
          "vendor_offer_secure_viewed" as never,
          now,
          {
            offerId: offer.id,
            vendorId: vendor.id,
            offerRevision: revision(offer),
          },
          actor,
        ),
      );
  }
  const drivers = driversSnap.docs.map((doc) => resource<DispatchDriver>(doc)),
    vehicles = vehiclesSnap.docs.map((doc) => resource<DispatchVehicle>(doc)),
    matches = computeMatches({
      booking,
      vendors: [vendor],
      drivers,
      vehicles,
      reservations: reservationsSnap.docs.map(reservation),
    });
  return createSecureVendorOfferProjection({
    booking,
    offer,
    vendor,
    responses: responsesSnap.docs.map(responseFrom),
    proposals: proposalsSnap.docs.map(proposalFrom),
    matches,
    drivers,
    vehicles,
  });
}

function assertQuickAddOffer(booking: OperationalBooking, offer: DispatchOfferRecord, vendor: DispatchVendor, controlBroadcastId: string, data: VendorOfferTokenRecord) {
  assertVendorOfferCurrent(booking, offer, controlBroadcastId);
  assertTokenBinding(data, offer);
  if (offer.responseStatus !== "accepted" || offer.agreedPayoutMinor === undefined)
    throw new Error("Accept the current vendor offer before adding fulfillment resources.");
  if (vendor.supplyClassification !== "vendor_managed")
    throw new Error("Quick add is available only for vendor-managed supply.");
}

export async function quickAddVendorDriver(token: string, input: { name?: unknown; phone?: unknown; uploadToken?: string }): Promise<VendorQuickAddResult> {
  const parsed = validateVendorQuickAddDriver(input), { db, tokenRef, data } = await tokenContext(token),
    bookingRef = db.collection(BOOKINGS).doc(data.bookingOperationalId), offerRef = bookingRef.collection(OFFERS).doc(data.offerId),
    vendorRef = db.collection(DISPATCH_COLLECTIONS.vendors).doc(data.vendorId), controlRef = bookingRef.collection(CONTROL).doc("current"),
    duplicateQuery = db.collection(DISPATCH_COLLECTIONS.drivers).where("vendorId", "==", data.vendorId),
    driverRef = db.collection(DISPATCH_COLLECTIONS.drivers).doc(quickAddDriverId(data.vendorId, parsed.mobileNumberNormalized));
  return db.runTransaction(async (tx) => {
    const [tokenSnap, bookingSnap, offerSnap, vendorSnap, controlSnap, duplicates, existing] = await Promise.all([tx.get(tokenRef), tx.get(bookingRef), tx.get(offerRef), tx.get(vendorRef), tx.get(controlRef), tx.get(duplicateQuery), tx.get(driverRef)]);
    if (!tokenSnap.exists || tokenSnap.data()?.active !== true || new Date(iso(tokenSnap.data()?.expiresAt)).getTime() <= Date.now()) throw new Error("This vendor offer link is no longer active.");
    if (!bookingSnap.exists || !offerSnap.exists || !vendorSnap.exists) throw new Error("Vendor offer is no longer available.");
    const booking = resource<OperationalBooking>(bookingSnap), offer = resource<DispatchOfferRecord>(offerSnap), vendor = resource<DispatchVendor>(vendorSnap);
    assertQuickAddOffer(booking, offer, vendor, String(controlSnap.data()?.activeBroadcastId ?? ""), data);
    const duplicate = duplicates.docs.find((item) => item.data().mobileNumberNormalized === parsed.mobileNumberNormalized) ?? (existing.exists ? existing : undefined);
    if (duplicate) {
      const driver = resource<DispatchDriver>(duplicate);
      if (driver.vendorId !== vendor.id || driver.mobileNumberNormalized !== parsed.mobileNumberNormalized) throw new Error("A matching driver record cannot be used for this vendor.");
      const currentQuickAdd = isCurrentFulfillmentQuickAdd(driver, { bookingOperationalId: booking.id, offerId: offer.id, vendorId: vendor.id });
      return { id: driver.id, label: driver.name, reviewRequired: currentQuickAdd && (!driver.active || driver.status !== "available"), submittedDuringFulfillment: currentQuickAdd, duplicate: true };
    }
    const now = FieldValue.serverTimestamp(), actor = { type: "vendor_offer", vendorId: vendor.id, offerId: offer.id } as const,
      documents = input.uploadToken ? await claimStagedDocuments(tx, [input.uploadToken], driverRef.id) : [];
    tx.create(driverRef, {
      name: parsed.name, mobileNumber: parsed.mobileNumber, mobileNumberNormalized: parsed.mobileNumberNormalized,
      whatsappNumber: parsed.mobileNumber, whatsappNumberNormalized: parsed.mobileNumberNormalized, vendorId: vendor.id,
      supplyRelationship: "vendor_managed", zoneIds: vendor.zoneIds, priority: "normal", status: "offline", active: false,
      documentation: { cnicVerificationState: "unknown", licenceState: "unknown", notes: "Submitted during vendor fulfillment; RentKA review required." },
      documents, fulfillmentQuickAdd: { ...fulfillmentQuickAddBinding({ bookingOperationalId: booking.id, offerId: offer.id, vendorId: vendor.id }), createdAt: now },
      createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor,
    });
    tx.create(bookingRef.collection("events").doc(), auditEvent("vendor_fulfillment_driver_added" as never, now, { offerId: offer.id, vendorId: vendor.id, driverId: driverRef.id, documentProvided: documents.length > 0 }, actor));
    return { id: driverRef.id, label: parsed.name, reviewRequired: true, submittedDuringFulfillment: true, duplicate: false };
  });
}

export async function quickAddVendorVehicle(token: string, input: { make?: unknown; model?: unknown; registrationNumber?: unknown; modelYear?: unknown; uploadTokens?: string[] }): Promise<VendorQuickAddResult> {
  const parsed = validateVendorQuickAddVehicle(input), { db, tokenRef, data } = await tokenContext(token),
    bookingRef = db.collection(BOOKINGS).doc(data.bookingOperationalId), offerRef = bookingRef.collection(OFFERS).doc(data.offerId),
    vendorRef = db.collection(DISPATCH_COLLECTIONS.vendors).doc(data.vendorId), controlRef = bookingRef.collection(CONTROL).doc("current"),
    duplicateQuery = db.collection(DISPATCH_COLLECTIONS.vehicles).where("vendorId", "==", data.vendorId),
    vehicleRef = db.collection(DISPATCH_COLLECTIONS.vehicles).doc(quickAddVehicleId(data.vendorId, parsed.registrationNumberNormalized));
  return db.runTransaction(async (tx) => {
    const [tokenSnap, bookingSnap, offerSnap, vendorSnap, controlSnap, duplicates, existing] = await Promise.all([tx.get(tokenRef), tx.get(bookingRef), tx.get(offerRef), tx.get(vendorRef), tx.get(controlRef), tx.get(duplicateQuery), tx.get(vehicleRef)]);
    if (!tokenSnap.exists || tokenSnap.data()?.active !== true || new Date(iso(tokenSnap.data()?.expiresAt)).getTime() <= Date.now()) throw new Error("This vendor offer link is no longer active.");
    if (!bookingSnap.exists || !offerSnap.exists || !vendorSnap.exists) throw new Error("Vendor offer is no longer available.");
    const booking = resource<OperationalBooking>(bookingSnap), offer = resource<DispatchOfferRecord>(offerSnap), vendor = resource<DispatchVendor>(vendorSnap);
    assertQuickAddOffer(booking, offer, vendor, String(controlSnap.data()?.activeBroadcastId ?? ""), data);
    const duplicate = duplicates.docs.find((item) => normalizeVehicleRegistration(item.data().registrationNumberNormalized || item.data().registrationNumber) === parsed.registrationNumberNormalized) ?? (existing.exists ? existing : undefined);
    if (duplicate) {
      const vehicle = resource<DispatchVehicle>(duplicate);
      if (vehicle.vendorId !== vendor.id || normalizeVehicleRegistration(vehicle.registrationNumber) !== parsed.registrationNumberNormalized) throw new Error("A matching vehicle record cannot be used for this vendor.");
      const currentQuickAdd = isCurrentFulfillmentQuickAdd(vehicle, { bookingOperationalId: booking.id, offerId: offer.id, vendorId: vendor.id });
      return { id: vehicle.id, label: formatVehicleDisplayLabel(vehicle), reviewRequired: currentQuickAdd && (!vehicle.active || vehicle.status !== "available"), submittedDuringFulfillment: currentQuickAdd, duplicate: true };
    }
    const now = FieldValue.serverTimestamp(), actor = { type: "vendor_offer", vendorId: vendor.id, offerId: offer.id } as const,
      documents = input.uploadTokens?.length ? await claimStagedDocuments(tx, input.uploadTokens, vehicleRef.id) : [];
    const vehicle = { vendorId: vendor.id, controlRelationship: "vendor_managed", zoneIds: vendor.zoneIds,
      category: booking.requestedVehicle.categoryOrModel, make: parsed.make, model: parsed.model, ...("modelYear" in parsed ? { modelYear: parsed.modelYear } : {}),
      registrationNumber: parsed.registrationNumber, registrationNumberNormalized: parsed.registrationNumberNormalized, status: "inactive", active: false,
      documentation: { overallState: "unknown", registrationState: "unknown", tokenChallanState: "unknown", permitState: "unknown", fitnessState: "unknown", insuranceState: "unknown", notes: "Submitted during vendor fulfillment; RentKA review required." },
      documents, fulfillmentQuickAdd: { ...fulfillmentQuickAddBinding({ bookingOperationalId: booking.id, offerId: offer.id, vendorId: vendor.id }), createdAt: now },
      createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor };
    tx.create(vehicleRef, vehicle);
    tx.create(bookingRef.collection("events").doc(), auditEvent("vendor_fulfillment_vehicle_added" as never, now, { offerId: offer.id, vendorId: vendor.id, vehicleId: vehicleRef.id, documentCount: documents.length }, actor));
    return { id: vehicleRef.id, label: formatVehicleDisplayLabel({ id: vehicleRef.id, ...vehicle } as unknown as DispatchVehicle), reviewRequired: true, submittedDuringFulfillment: true, duplicate: false };
  });
}

export async function submitSecureVendorOfferResponse(
  token: string,
  mutation: VendorOfferPortalMutation,
) {
  const { db, tokenRef, data } = await tokenContext(token),
    bookingRef = db.collection(BOOKINGS).doc(data.bookingOperationalId),
    offerRef = bookingRef.collection(OFFERS).doc(data.offerId),
    controlRef = bookingRef.collection(CONTROL).doc("current");
  return db.runTransaction(async (tx) => {
    const [tokenSnap, bookingSnap, offerSnap, controlSnap, latestResponses] =
      await Promise.all([
        tx.get(tokenRef),
        tx.get(bookingRef),
        tx.get(offerRef),
        tx.get(controlRef),
        tx.get(
          offerRef.collection(RESPONSES).orderBy("timestamp", "desc").limit(1),
        ),
      ]);
    if (
      !tokenSnap.exists ||
      tokenSnap.data()?.active !== true ||
      new Date(iso(tokenSnap.data()?.expiresAt)).getTime() <= Date.now()
    )
      throw new Error("This vendor offer link is no longer active.");
    if (!bookingSnap.exists || !offerSnap.exists)
      throw new Error("Vendor offer is no longer available.");
    const booking = resource<OperationalBooking>(bookingSnap),
      offer = resource<DispatchOfferRecord>(offerSnap);
    assertVendorOfferCurrent(
      booking,
      offer,
      String(controlSnap.data()?.activeBroadcastId ?? ""),
    );
    const offered = assertTokenBinding(data, offer),
      latestDoc = latestResponses.docs[0],
      latest = latestDoc?.data() as VendorOfferPortalMutation | undefined;
    if (latest && comparable(latest) === comparable(mutation))
      return { responseId: latestDoc.id, kind: mutation.kind, duplicate: true };
    assertVendorResponseOpen(offer);
    if (mutation.kind === "countered")
      validateCounterPayout(mutation.requestedPayoutMinor, offered);
    const now = FieldValue.serverTimestamp(),
      actor = {
        type: "vendor_offer",
        vendorId: data.vendorId,
        offerId: offer.id,
      } as const,
      responseRef = offerRef.collection(RESPONSES).doc(),
      responseData = {
        ...mutation,
        offeredPayoutMinor: offered,
        offerRevision: revision(offer),
        timestamp: now,
        actor,
        source: "vendor_secure_page",
      };
    tx.create(responseRef, responseData);
    tx.update(offerRef, {
      responseStatus: mutation.kind,
      responseSource: "vendor_secure_page",
      responseAt: now,
      responseNote:
        "note" in mutation
          ? (mutation.note ?? FieldValue.delete())
          : FieldValue.delete(),
      declineReason:
        mutation.kind === "declined"
          ? mutation.declineReason
          : FieldValue.delete(),
      requestedPayoutMinor:
        mutation.kind === "countered"
          ? mutation.requestedPayoutMinor
          : FieldValue.delete(),
      agreedPayoutMinor:
        mutation.kind === "accepted" ? offered : FieldValue.delete(),
      negotiationStatus:
        mutation.kind === "countered" || mutation.kind === "accepted"
          ? "awaiting_admin_review"
          : "counter_rejected",
      ...(mutation.kind === "declined"
        ? { portalStatus: "closed", closeReason: "vendor_declined" }
        : {}),
      updatedAt: now,
      updatedBy: actor,
    });
    tx.create(
      bookingRef.collection("events").doc(),
      auditEvent(
        `vendor_offer_${mutation.kind}` as never,
        now,
        {
          offerId: offer.id,
          vendorId: data.vendorId,
          offerRevision: revision(offer),
          offeredPayoutMinor: offered,
          ...(mutation.kind === "countered"
            ? { requestedPayoutMinor: mutation.requestedPayoutMinor }
            : {}),
          ...(mutation.kind === "declined"
            ? { declineReason: mutation.declineReason }
            : {}),
        },
        actor,
      ),
    );
    return {
      responseId: responseRef.id,
      kind: mutation.kind,
      duplicate: false,
    };
  });
}

export type VendorCounterReviewRequest = {
  action: "accept" | "reject" | "revised_offer";
  expectedRevision: number;
  expectedCounterMinor: number;
  revisedPayoutMinor?: number;
  revisedOfferExpiresAt?: string;
};
export async function reviewVendorCounter(
  bookingOperationalId: string,
  offerId: string,
  request: VendorCounterReviewRequest,
) {
  const revisedToken =
      request.action === "revised_offer"
        ? randomBytes(32).toString("base64url")
        : undefined,
    revisedTokenHash = revisedToken ? hash(revisedToken) : undefined,
    revisedExpiry =
      request.action === "revised_offer"
        ? validateRevisedOfferExpiry(request.revisedOfferExpiresAt ?? "")
        : undefined,
    db = getAdminDb(),
    bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId),
    offerRef = bookingRef.collection(OFFERS).doc(offerId),
    controlRef = bookingRef.collection(CONTROL).doc("current"),
    tokensQuery = db.collection(TOKENS).where("offerId", "==", offerId);
  return db.runTransaction(async (tx) => {
    const [bookingSnap, offerSnap, controlSnap, tokenSnaps] = await Promise.all(
      [
        tx.get(bookingRef),
        tx.get(offerRef),
        tx.get(controlRef),
        tx.get(tokensQuery),
      ],
    );
    if (!bookingSnap.exists || !offerSnap.exists)
      throw new Error("Vendor offer not found.");
    const booking = resource<OperationalBooking>(bookingSnap),
      offer = resource<DispatchOfferRecord>(offerSnap),
      decision =
        request.action === "accept"
          ? "accept_counter"
          : request.action === "reject"
            ? "reject_counter"
            : "revised_offer";
    assertVendorOfferIdentity(offer);
    if (
      offer.lastAdminDecision === decision &&
      offer.lastAdminDecisionRevision === request.expectedRevision
    )
      return { duplicate: true };
    assertVendorOfferCurrent(
      booking,
      offer,
      String(controlSnap.data()?.activeBroadcastId ?? ""),
    );
    assertCounterDecisionCurrent(
      offer,
      request.expectedRevision,
      request.expectedCounterMinor,
    );
    const counter = offer.requestedPayoutMinor!,
      current = offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor,
      nextRevision = request.expectedRevision + 1;
    if (request.action === "revised_offer")
      validateCounterPayout(request.revisedPayoutMinor ?? 0, current);
    const historyRef = offerRef
        .collection("offerHistory")
        .doc(`vendor-counter-${request.expectedRevision}-${request.action}`),
      eventRef = bookingRef
        .collection("events")
        .doc(
          `vendor-counter-${offerId}-${request.expectedRevision}-${request.action}`,
        ),
      [historySnap, eventSnap] = await Promise.all([
        tx.get(historyRef),
        tx.get(eventRef),
      ]),
      now = FieldValue.serverTimestamp();
    if (request.action !== "accept")
      for (const item of tokenSnaps.docs.filter(
        (doc) => doc.data().active === true,
      ))
        tx.update(item.ref, {
          active: false,
          revokedAt: now,
          revokeReason: request.action,
        });
    if (request.action === "accept")
      tx.update(offerRef, {
        responseStatus: "accepted",
        responseSource: "admin_manual",
        agreedPayoutMinor: counter,
        negotiationStatus: "counter_agreed",
        portalStatus: "open",
        lastAdminDecision: decision,
        lastAdminDecisionRevision: request.expectedRevision,
        updatedAt: now,
        updatedBy: sharedActor,
      });
    else if (request.action === "reject")
      tx.update(offerRef, {
        responseStatus: "declined",
        responseSource: "admin_manual",
        negotiationStatus: "counter_rejected",
        portalStatus: "closed",
        closeReason: "counter_rejected",
        responseNote: "Counter rejected by RentKA",
        lastAdminDecision: decision,
        lastAdminDecisionRevision: request.expectedRevision,
        updatedAt: now,
        updatedBy: sharedActor,
      });
    else {
      tx.update(offerRef, {
        currentOfferedPayoutMinor: request.revisedPayoutMinor,
        previousCounterPayoutMinor: counter,
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
        lastAdminDecision: decision,
        lastAdminDecisionRevision: request.expectedRevision,
        proposalStatus: offer.fulfillmentProposal
          ? "superseded"
          : "not_provided",
        fulfillmentProposal: FieldValue.delete(),
        updatedAt: now,
        updatedBy: sharedActor,
      });
      tx.create(db.collection(TOKENS).doc(revisedTokenHash!), {
        bookingOperationalId,
        offerId,
        candidateId: offer.candidateId,
        recipientType: "vendor",
        recipientId: offer.recipientId,
        supplyAccountId: offer.supplyAccountId,
        vendorId: offer.vendorId,
        offeredPayoutMinor: request.revisedPayoutMinor,
        offerRevision: nextRevision,
        broadcastId: offer.broadcastId,
        active: true,
        createdAt: now,
        expiresAt: new Date(revisedExpiry!),
      });
    }
    if (!historySnap.exists)
      tx.create(historyRef, {
        kind: request.action,
        offerRevision: request.expectedRevision,
        originalOfferedPayoutMinor: offer.approvedPayoutMinor,
        offeredPayoutMinor: current,
        vendorCounterPayoutMinor: counter,
        ...(request.action === "accept" ? { agreedPayoutMinor: counter } : {}),
        ...(request.action === "revised_offer"
          ? {
              revisedPayoutMinor: request.revisedPayoutMinor,
              nextOfferRevision: nextRevision,
              offerExpiresAt: revisedExpiry,
            }
          : {}),
        timestamp: now,
        actor: sharedActor,
      });
    if (!eventSnap.exists)
      tx.create(
        eventRef,
        auditEvent(
          request.action === "accept"
            ? ("vendor_counter_accepted" as never)
            : request.action === "reject"
              ? ("vendor_counter_rejected" as never)
              : ("vendor_revised_offer_prepared" as never),
          now,
          {
            offerId,
            vendorId: offer.vendorId,
            offerRevision: request.expectedRevision,
            originalOfferedPayoutMinor: offer.approvedPayoutMinor,
            vendorCounterPayoutMinor: counter,
            ...(request.action === "accept"
              ? { agreedPayoutMinor: counter }
              : {}),
            ...(request.action === "revised_offer"
              ? {
                  revisedPayoutMinor: request.revisedPayoutMinor,
                  nextOfferRevision: nextRevision,
                  offerExpiresAt: revisedExpiry,
                }
              : {}),
          },
        ),
      );
    return {
      duplicate: false,
      ...(revisedToken ? { url: `/vendor/offer/${revisedToken}` } : {}),
    };
  });
}

export async function submitVendorFulfillmentProposal(
  token: string,
  mutation: VendorProposalMutation,
) {
  const { db, tokenRef, data } = await tokenContext(token),
    bookingRef = db.collection(BOOKINGS).doc(data.bookingOperationalId),
    offerRef = bookingRef.collection(OFFERS).doc(data.offerId),
    vendorRef = db.collection(DISPATCH_COLLECTIONS.vendors).doc(data.vendorId),
    driverRef = db
      .collection(DISPATCH_COLLECTIONS.drivers)
      .doc(mutation.driverId),
    vehicleRef = db
      .collection(DISPATCH_COLLECTIONS.vehicles)
      .doc(mutation.vehicleId),
    controlRef = bookingRef.collection(CONTROL).doc("current");
  return db.runTransaction(async (tx) => {
    const [
      tokenSnap,
      bookingSnap,
      offerSnap,
      vendorSnap,
      driverSnap,
      vehicleSnap,
      controlSnap,
      reservationsSnap,
      latestProposals,
    ] = await Promise.all([
      tx.get(tokenRef),
      tx.get(bookingRef),
      tx.get(offerRef),
      tx.get(vendorRef),
      tx.get(driverRef),
      tx.get(vehicleRef),
      tx.get(controlRef),
      tx.get(
        db
          .collection(DISPATCH_COLLECTIONS.reservations)
          .where("active", "==", true),
      ),
      tx.get(
        offerRef.collection(PROPOSALS).orderBy("timestamp", "desc").limit(1),
      ),
    ]);
    if (
      !tokenSnap.exists ||
      tokenSnap.data()?.active !== true ||
      new Date(iso(tokenSnap.data()?.expiresAt)).getTime() <= Date.now()
    )
      throw new Error("This vendor offer link is no longer active.");
    if (
      !bookingSnap.exists ||
      !offerSnap.exists ||
      !vendorSnap.exists ||
      !driverSnap.exists ||
      !vehicleSnap.exists
    )
      throw new Error(
        "Selected fulfillment resources are no longer available.",
      );
    const booking = resource<OperationalBooking>(bookingSnap),
      offer = resource<DispatchOfferRecord>(offerSnap),
      vendor = resource<DispatchVendor>(vendorSnap),
      driver = resource<DispatchDriver>(driverSnap),
      vehicle = resource<DispatchVehicle>(vehicleSnap);
    assertVendorOfferCurrent(
      booking,
      offer,
      String(controlSnap.data()?.activeBroadcastId ?? ""),
    );
    assertTokenBinding(data, offer);
    const quickAddContext = { bookingOperationalId: booking.id, offerId: offer.id, vendorId: vendor.id },
      driverReviewRequired = isCurrentFulfillmentQuickAdd(driver, quickAddContext) && (!driver.active || driver.status !== "available"),
      vehicleReviewRequired = isCurrentFulfillmentQuickAdd(vehicle, quickAddContext) && (!vehicle.active || vehicle.status !== "available"),
      proposalDriver = driverReviewRequired ? { ...driver, active: true, status: "available" as const } : driver,
      proposalVehicle = vehicleReviewRequired ? { ...vehicle, active: true, status: "available" as const } : vehicle,
      matches = computeMatches({
      booking,
      vendors: [vendor],
      drivers: [proposalDriver],
      vehicles: [proposalVehicle],
      reservations: reservationsSnap.docs.map(reservation),
    });
    const validation = validateVendorProposal({
      booking,
      offer,
      vendor,
      driver,
      vehicle,
      matches,
    });
    const latestDoc = latestProposals.docs[0],
      latest = latestDoc?.data() as VendorFulfillmentProposal | undefined;
    if (
      latest &&
      latest.driverId === driver.id &&
      latest.vehicleId === vehicle.id &&
      latest.offerRevision === revision(offer)
    )
      return { proposalId: latestDoc.id, duplicate: true };
    const now = FieldValue.serverTimestamp(),
      actor = {
        type: "vendor_offer",
        vendorId: vendor.id,
        offerId: offer.id,
      } as const,
      proposalRef = offerRef.collection(PROPOSALS).doc(),
      proposal = {
        status: "provided",
        vendorId: vendor.id,
        driverId: driver.id,
        driverName: driver.name,
        vehicleId: vehicle.id,
        vehicleLabel: formatVehicleDisplayLabel(vehicle),
        offerRevision: revision(offer),
        responseRevision: revision(offer),
        timestamp: now,
        actor,
      source: "vendor_secure_page",
        driverReviewRequired: validation.driverReviewRequired,
        vehicleReviewRequired: validation.vehicleReviewRequired,
        driverSubmittedDuringFulfillment: Boolean(driver.fulfillmentQuickAdd),
        vehicleSubmittedDuringFulfillment: Boolean(vehicle.fulfillmentQuickAdd),
      };
    tx.create(proposalRef, proposal);
    tx.update(offerRef, {
      proposalStatus: "provided",
      fulfillmentProposal: {
        ...proposal,
        proposalId: proposalRef.id,
        proposedAt: now,
      },
      updatedAt: now,
      updatedBy: actor,
    });
    tx.create(
      bookingRef.collection("events").doc(),
      auditEvent(
        latest
          ? ("vendor_fulfillment_proposal_updated" as never)
          : ("vendor_fulfillment_proposal_submitted" as never),
        now,
        {
          offerId: offer.id,
          vendorId: vendor.id,
          offerRevision: revision(offer),
          driverId: driver.id,
          vehicleId: vehicle.id,
        },
        actor,
      ),
    );
    return { proposalId: proposalRef.id, duplicate: false };
  });
}
