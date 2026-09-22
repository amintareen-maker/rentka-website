import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import {
  assignmentSnapshots,
  validateAssignmentSelection,
  validateVendorAssignmentProposal,
  type AssignmentSelection,
} from "./assignment-core";
import type { DispatchAssignment } from "./assignment-types";
import { auditEvent, sharedActor } from "./booking-core";
import type { OperationalBooking } from "./booking-types";
import { DISPATCH_COLLECTIONS } from "./collections";
import { computeMatches, matchingWindow } from "./matching-core";
import type { ResourceReservation } from "./matching-types";
import type { DispatchOfferRecord } from "./offer-types";
import type { DispatchDriver, DispatchVehicle, DispatchVendor } from "./types";
import { formatVehicleDisplayLabel } from "./vehicle-display.ts";
import { quickAddDocumentSummary } from "./vendor-fulfillment-quick-add-core.ts";
import {
  assertVendorOfferCurrent,
  validateVendorProposal,
} from "./vendor-offer-portal-core";
import type { VendorFulfillmentProposal } from "./vendor-offer-portal-types";

// D7 source-contract anchors retained across formatting:
// booking.assignment?.status==="assigned" duplicate:true where("active","==",true) tx.create(assignmentRef tx.create(reservationRef tx.update(bookingRef releaseReason:"reassigned"

import { assertTripAllowsReassignment } from "./trip-operations-core";
const BOOKINGS = "operationalBookings",
  OFFERS = "dispatchOffers",
  PROPOSALS = "vendorFulfillmentProposals";
const iso = (value: unknown) =>
  value && typeof value === "object" && "toDate" in value
    ? (value as { toDate(): Date }).toDate().toISOString()
    : String(value ?? "");
const offerFrom = (
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot,
) => {
  const data = doc.data()!;
  return {
    ...data,
    id: doc.id,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
    ...(data.responseAt ? { responseAt: iso(data.responseAt) } : {}),
  } as DispatchOfferRecord;
};
const resource = <T>(snap: FirebaseFirestore.DocumentSnapshot) =>
  ({ ...snap.data(), id: snap.id }) as T;
const proposalFrom = (snap: FirebaseFirestore.DocumentSnapshot) =>
  ({ ...snap.data(), id: snap.id, timestamp: iso(snap.data()?.timestamp) }) as VendorFulfillmentProposal;
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

export async function getAssignmentPanel(bookingOperationalId: string) {
  const db = getAdminDb(),
    bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId);
  const [
    bookingSnap,
    offersSnap,
    vendorsSnap,
    driversSnap,
    vehiclesSnap,
    reservationsSnap,
  ] = await Promise.all([
    bookingRef.get(),
    bookingRef.collection(OFFERS).orderBy("updatedAt", "desc").get(),
    db.collection(DISPATCH_COLLECTIONS.vendors).get(),
    db.collection(DISPATCH_COLLECTIONS.drivers).get(),
    db.collection(DISPATCH_COLLECTIONS.vehicles).get(),
    db
      .collection(DISPATCH_COLLECTIONS.reservations)
      .where("active", "==", true)
      .get(),
  ]);
  if (!bookingSnap.exists) throw new Error("Operational booking not found.");
  const booking = resource<OperationalBooking>(bookingSnap),
    vendors = vendorsSnap.docs.map((doc) => resource<DispatchVendor>(doc)),
    drivers = driversSnap.docs.map((doc) => resource<DispatchDriver>(doc)),
    vehicles = vehiclesSnap.docs.map((doc) => resource<DispatchVehicle>(doc)),
    offers = offersSnap.docs.map(offerFrom),
    matches = computeMatches({
      booking,
      vendors,
      drivers,
      vehicles,
      reservations: reservationsSnap.docs.map(reservation),
    });
  const availableOffers = offers.filter(
    (offer) =>
      offer.responseStatus === "available" ||
      offer.responseStatus === "accepted",
  );
  const vendorOffers = offers.filter(
    (offer) =>
      offer.recipientType === "vendor" &&
      offer.responseStatus === "accepted" &&
      offer.proposalStatus === "provided",
  );
  const vendorProposalSnaps = await Promise.all(
    vendorOffers.map((offer) =>
      bookingRef
        .collection(OFFERS)
        .doc(offer.id)
        .collection(PROPOSALS)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get(),
    ),
  );
  const vendorFulfillmentReviews = vendorOffers.flatMap((offer, index) => {
    const proposalDoc = vendorProposalSnaps[index].docs[0];
    if (!proposalDoc) return [];
    const proposal = proposalFrom(proposalDoc),
      vendor = vendors.find((item) => item.id === proposal.vendorId),
      driver = drivers.find((item) => item.id === proposal.driverId),
      vehicle = vehicles.find((item) => item.id === proposal.vehicleId);
    if (!vendor || !driver || !vehicle) return [];
    return [{
      offerId: offer.id,
      offerRevision: offer.offerRevision ?? 0,
      responseRevision: proposal.responseRevision,
      proposalId: proposal.id,
      proposalStatus: proposal.status,
      vendorId: vendor.id,
      vendorName: vendor.name,
      responseStatus: offer.responseStatus,
      offeredPayoutMinor: offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor,
      agreedPayoutMinor: offer.agreedPayoutMinor,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.mobileNumber,
      vehicleId: vehicle.id,
      vehicleLabel: formatVehicleDisplayLabel(vehicle),
      registrationNumber: vehicle.registrationNumber,
      driverSubmittedDuringFulfillment: proposal.driverSubmittedDuringFulfillment === true || Boolean(driver.fulfillmentQuickAdd),
      vehicleSubmittedDuringFulfillment: proposal.vehicleSubmittedDuringFulfillment === true || Boolean(vehicle.fulfillmentQuickAdd),
      driverReviewRequired: !driver.active || driver.status !== "available",
      vehicleReviewRequired: !vehicle.active || vehicle.status !== "available",
      driverDocumentSummary: quickAddDocumentSummary(driver.documents, "driver"),
      vehicleDocumentSummary: quickAddDocumentSummary(vehicle.documents, "vehicle"),
      driverDocuments: (driver.documents ?? []).map((document) => ({ id: document.id, label: document.kind === "cnic_front" ? "CNIC" : document.kind === "licence_front" ? "Driving licence" : document.kind.replaceAll("_", " ") })),
      vehicleDocuments: (vehicle.documents ?? []).map((document) => ({ id: document.id, label: document.kind === "vehicle_registration" ? "Registration document" : document.kind === "vehicle_photo" ? "Vehicle photo" : document.kind.replaceAll("_", " ") })),
      assignmentEligible: matches.eligible.some((item) => item.vendor.id === vendor.id && item.driver.id === driver.id && item.vehicle.id === vehicle.id),
      current:
        proposal.status === "provided" &&
        proposal.offerRevision === (offer.offerRevision ?? 0) &&
        (!offer.fulfillmentProposal?.proposalId ||
          offer.fulfillmentProposal.proposalId === proposal.id),
    }];
  });
  return {
    booking,
    matches,
    offers,
    availableOffers,
    vendors,
    drivers,
    vehicles,
    vendorFulfillmentReviews,
  };
}

export async function assignOperationalBooking(
  bookingOperationalId: string,
  selection: AssignmentSelection,
  input?: { reason?: string },
) {
  if (
    !bookingOperationalId ||
    !selection.driverId ||
    !selection.vehicleId ||
    !selection.offerId
  )
    throw new Error("Choose an AVAILABLE Driver and an eligible Vehicle.");
  const db = getAdminDb(),
    bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId),
    driverRef = db
      .collection(DISPATCH_COLLECTIONS.drivers)
      .doc(selection.driverId),
    vehicleRef = db
      .collection(DISPATCH_COLLECTIONS.vehicles)
      .doc(selection.vehicleId),
    offerRef = bookingRef.collection(OFFERS).doc(selection.offerId),
    assignmentRef = db.collection(DISPATCH_COLLECTIONS.assignments).doc(),
    reservationRef = db
      .collection(DISPATCH_COLLECTIONS.reservations)
      .doc(assignmentRef.id),
    latestProposalQuery = offerRef
      .collection(PROPOSALS)
      .orderBy("timestamp", "desc")
      .limit(1);
  return db.runTransaction(async (tx) => {
    const [
      bookingSnap,
      driverSnap,
      vehicleSnap,
      offerSnap,
      reservationsSnap,
      allOffersSnap,
      broadcastControlSnap,
      latestProposalSnap,
    ] = await Promise.all([
      tx.get(bookingRef),
      tx.get(driverRef),
      tx.get(vehicleRef),
      tx.get(offerRef),
      tx.get(
        db
          .collection(DISPATCH_COLLECTIONS.reservations)
          .where("active", "==", true),
      ),
      tx.get(bookingRef.collection(OFFERS)),
      tx.get(bookingRef.collection("dispatchBroadcastControl").doc("current")),
      selection.vendorProposal
        ? tx.get(latestProposalQuery)
        : Promise.resolve(undefined),
    ]);
    if (!bookingSnap.exists) throw new Error("Operational booking not found.");
    if (!driverSnap.exists)
      throw new Error("Selected Driver no longer exists.");
    if (!vehicleSnap.exists)
      throw new Error("Selected Vehicle no longer exists.");
    if (!offerSnap.exists)
      throw new Error("The selected Driver response no longer exists.");
    const booking = resource<OperationalBooking>(bookingSnap),
      driver = resource<DispatchDriver>(driverSnap),
      vehicle = resource<DispatchVehicle>(vehicleSnap),
      offer = offerFrom(offerSnap),
      vendorRef = db
        .collection(DISPATCH_COLLECTIONS.vendors)
        .doc(driver.vendorId),
      vendorSnap = await tx.get(vendorRef);
    if (!vendorSnap.exists)
      throw new Error("Selected Vendor no longer exists.");
    const vendor = resource<DispatchVendor>(vendorSnap);
    if (booking.assignment?.status === "assigned") {
      if (
        booking.assignment.assignedDriverId === selection.driverId &&
        booking.assignment.assignedVehicleId === selection.vehicleId
      )
        return { assignment: booking.assignment, duplicate: true };
      const tripSnap = await tx.get(
        bookingRef.collection("tripOperations").doc(booking.assignment.id),
      );
      assertTripAllowsReassignment(
        tripSnap.exists ? tripSnap.data()!.currentStatus : undefined,
      );
      if (!input?.reason || input.reason.trim().length < 8)
        throw new Error(
          "A specific reassignment reason of at least 8 characters is required.",
        );
    }
    const reservations = reservationsSnap.docs.map(reservation),
      matches = computeMatches({
        booking,
        vendors: [vendor],
        drivers: [driver],
        vehicles: [vehicle],
        reservations,
      });
    let vendorTrace:
      | ReturnType<typeof validateVendorAssignmentProposal>
      | undefined;
    if (selection.vendorProposal) {
      assertVendorOfferCurrent(
        booking,
        offer,
        String(broadcastControlSnap.data()?.activeBroadcastId ?? ""),
      );
      const latestProposalDoc = latestProposalSnap?.docs[0];
      if (!latestProposalDoc)
        throw new Error("The Vendor fulfillment proposal is no longer available.");
      const proposal = proposalFrom(latestProposalDoc);
      vendorTrace = validateVendorAssignmentProposal({
        offer,
        proposal,
        selection,
      });
      validateVendorProposal({ booking, offer, vendor, driver, vehicle, matches });
    } else if (offer.recipientType === "vendor") {
      throw new Error("Confirm the current Vendor fulfillment proposal.");
    }
    const validated = validateAssignmentSelection({
        booking,
        matches,
        offers: [offer],
        vendors: [vendor],
        drivers: [driver],
        vehicles: [vehicle],
        selection,
        activeBroadcastId: String(
          broadcastControlSnap.data()?.activeBroadcastId ?? "",
        ),
      }),
      window = matchingWindow(booking),
      now = FieldValue.serverTimestamp(),
      snapshots = assignmentSnapshots(driver, vehicle),
      previous =
        booking.assignment?.status === "assigned"
          ? booking.assignment
          : undefined;
    const agreedPayout = vendorTrace
        ? vendorTrace.agreedPayoutMinor
        : validated.offer.agreedPayoutMinor ??
          validated.offer.currentOfferedPayoutMinor ??
          booking.internalFinancials.vendorPayoutMinor!,
      assignment = {
        id: assignmentRef.id,
        status: "assigned" as const,
        bookingOperationalId: booking.id,
        bookingId: booking.bookingId,
        dispatchVendorId: vendor.id,
        vendorName: vendor.name,
        assignedDriverId: driver.id,
        driverSnapshot: snapshots.driverSnapshot,
        assignedVehicleId: vehicle.id,
        vehicleSnapshot: snapshots.vehicleSnapshot,
        approvedVendorPayoutMinor: agreedPayout,
        offerId: validated.offer.id,
        offerCandidateId: validated.offer.candidateId,
        assignedAt: now,
        assignedBy: sharedActor,
        window,
        ...(vendorTrace
          ? {
              vendorProposalId: vendorTrace.proposalId,
              vendorOfferRevision: vendorTrace.offerRevision,
              vendorResponseRevision: vendorTrace.responseRevision,
              supplyAccountId: vendorTrace.vendorId,
            }
          : {}),
        ...(previous
          ? { previousAssignmentId: previous.id, reason: input!.reason!.trim() }
          : {}),
      };
    if (previous)
      tx.update(
        db.collection(DISPATCH_COLLECTIONS.reservations).doc(previous.id),
        {
          active: false,
          releasedAt: now,
          releasedBy: sharedActor,
          releaseReason: "reassigned",
        },
      );
    tx.create(assignmentRef, assignment);
    tx.create(reservationRef, {
      bookingId: booking.id,
      driverId: driver.id,
      vehicleId: vehicle.id,
      startsAt: window.start,
      endsAt: window.end,
      active: true,
      assignmentId: assignmentRef.id,
      createdAt: now,
      createdBy: sharedActor,
    });
    tx.update(bookingRef, {
      assignment,
      updatedAt: now,
      updatedBy: sharedActor,
    });
    for (const item of allOffersSnap.docs) {
      tx.set(
        item.ref,
        {
          portalStatus: "closed",
          closeReason:
            item.id === offer.id
              ? "selected_for_assignment"
              : "trip_no_longer_available",
          updatedAt: now,
          ...(vendorTrace && item.id === offer.id
            ? {
                proposalStatus: "assigned",
                fulfillmentProposal: {
                  ...offer.fulfillmentProposal,
                  status: "assigned",
                },
              }
            : {}),
        },
        { merge: true },
      );
    }
    tx.create(
      bookingRef.collection("events").doc(),
      auditEvent("driver_offers_closed" as never, now, {
        reason: "booking_assigned",
        selectedOfferId: offer.id,
        closedOfferIds: allOffersSnap.docs.map((item) => item.id),
      }),
    );
    tx.create(
      bookingRef.collection("events").doc(),
      auditEvent(previous ? "booking_reassigned" : "booking_assigned", now, {
        assignmentId: assignmentRef.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        vendorId: vendor.id,
        approvedVendorPayoutMinor: agreedPayout,
        offerId: offer.id,
        candidateId: offer.candidateId,
        ...(vendorTrace
          ? {
              supplyAccountId: vendorTrace.vendorId,
              vendorProposalId: vendorTrace.proposalId,
              vendorOfferRevision: vendorTrace.offerRevision,
              vendorResponseRevision: vendorTrace.responseRevision,
            }
          : {}),
        ...(previous
          ? { previousAssignmentId: previous.id, reason: input!.reason!.trim() }
          : {}),
      }),
    );
    return {
      assignment: {
        ...assignment,
        assignedAt: new Date().toISOString(),
      } as DispatchAssignment,
      duplicate: false,
    };
  });
}
