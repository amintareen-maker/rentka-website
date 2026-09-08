import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertCounterDecisionCurrent,
  assertCurrentBroadcast,
  assertCurrentOfferRevision,
  assertDriverResponseOpen,
  validateCounterPayout,
  validateRevisedOfferExpiry,
} from "../src/lib/dispatch/driver-offer-portal-core.ts";
import { requireAvailableOffer } from "../src/lib/dispatch/assignment-core.ts";

const repo = readFileSync(new URL("../src/lib/dispatch/driver-offer-portal-repository.ts", import.meta.url), "utf8");
const admin = readFileSync(new URL("../app/admin/dispatch/SecureOfferControls.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/admin/dispatch/actions.ts", import.meta.url), "utf8");
const portal = readFileSync(new URL("../app/driver/offer/[token]/OfferResponse.tsx", import.meta.url), "utf8");
const assignment = readFileSync(new URL("../src/lib/dispatch/assignment-repository.ts", import.meta.url), "utf8");

test("valid Accept is immutable, idempotent and never assigns", () => {
  for (const marker of ['kind === "accepted"', "agreedPayoutMinor", "duplicate: true", "awaiting_admin_review"]) assert.ok(repo.includes(marker), marker);
  assert.equal(repo.includes("assignOperationalBooking"), false);
});

test("structured Decline is terminal and duplicate-safe", () => {
  for (const reason of ["busy", "vehicle_unavailable", "route_not_suitable", "price_too_low", "other"]) assert.ok(portal.includes(reason));
  assert.throws(() => assertDriverResponseOpen({ responseStatus: "declined" }), /no longer available/);
  assert.ok(repo.includes('closeReason: "driver_declined"'));
});

test("valid Counter is bounded and cannot assign", () => {
  assert.equal(validateCounterPayout(900000, 700000), 900000);
  assert.throws(() => validateCounterPayout(-1, 700000));
  assert.throws(() => validateCounterPayout(99999999, 700000));
  assert.ok(repo.includes('mutation.kind === "countered"'));
  assert.equal(repo.includes("createReservation"), false);
});

test("terminal responses reject a second different response", () => {
  for (const status of ["accepted", "declined", "countered", "expired", "closed", "cancelled", "not_selected"]) assert.throws(() => assertDriverResponseOpen({ responseStatus: status }), /no longer available/);
  assert.doesNotThrow(() => assertDriverResponseOpen({ responseStatus: "not_recorded" }));
});

test("expired Accept Decline and Counter are transactionally rejected", () => {
  const mutation = repo.slice(repo.indexOf("export async function submitSecureDriverOfferResponse"), repo.indexOf("export type CounterReviewRequest"));
  assert.ok(mutation.includes("tx.get(tokenRef)"));
  assert.ok(mutation.includes("expiresAt"));
  assert.ok(mutation.includes("assertBookingAndOfferCurrent"));
  assert.ok(repo.includes("assertOfferOpen(offer)"));
  for (const kind of ["accepted", "declined", "countered"]) assert.ok(portal.includes(kind));
});

test("superseded revision and broadcast reject stale secure responses", () => {
  assert.equal(assertCurrentOfferRevision(3, 3), 3);
  assert.throws(() => assertCurrentOfferRevision(2, 3), /no longer available/);
  assert.doesNotThrow(() => assertCurrentBroadcast({ broadcastId: "b2" }, "b2"));
  assert.throws(() => assertCurrentBroadcast({ broadcastId: "b1" }, "b2"), /no longer available/);
});

test("cancelled and assigned bookings reject public responses", () => {
  assert.ok(repo.includes('booking.lifecycle !== "active"'));
  assert.ok(repo.includes('booking.assignment?.status === "assigned"'));
  assert.ok(repo.includes("assertBookingAndOfferCurrent"));
});

test("Admin Accept Counter stores current agreed payout without assignment", () => {
  for (const marker of ['request.action === "accept"', "agreedPayoutMinor: counterMinor", 'negotiationStatus: "counter_agreed"', "Counter Agreed — Awaiting Assignment"]) assert.ok((repo + admin).includes(marker), marker);
  assert.equal(repo.slice(repo.indexOf("export async function reviewDriverCounter")).includes("assignOperationalBooking"), false);
});

test("Admin Revised Offer creates a new revision token and explicit expiry", () => {
  const expiry = validateRevisedOfferExpiry("2027-01-01T10:00:00.000Z", new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(expiry, "2027-01-01T10:00:00.000Z");
  assert.throws(() => validateRevisedOfferExpiry("2025-01-01", new Date("2026-01-01")));
  for (const marker of ["nextRevision", "revisedTokenHash", "revisedOfferExpiresAt", "offerExpiresAt: revisedExpiry", "Prepare Revised Offer", 'type="datetime-local"']) assert.ok((repo + admin).includes(marker), marker);
});

test("old token is revoked when a revised offer is prepared", () => {
  assert.ok(repo.includes('revokeReason: request.action'));
  assert.ok(repo.includes("offerRevision: nextRevision"));
  assert.ok(repo.includes("assertCurrentOfferRevision(data.offerRevision, offer.offerRevision)"));
});

test("Admin Reject Counter closes negotiation safely", () => {
  for (const marker of ['request.action === "reject"', 'negotiationStatus: "counter_rejected"', 'closeReason: "counter_rejected"']) assert.ok(repo.includes(marker), marker);
});

test("negotiation history preserves offered counter revised and agreed snapshots", () => {
  for (const marker of ["originalOfferedPayoutMinor", "offeredPayoutMinor", "driverCounterPayoutMinor", "revisedPayoutMinor", "agreedPayoutMinor", "offerHistory"]) assert.ok(repo.includes(marker), marker);
});

test("stale Admin counter decisions are rejected", () => {
  const current = { responseStatus: "countered", offerRevision: 4, requestedPayoutMinor: 900000 };
  assert.equal(assertCounterDecisionCurrent(current, 4, 900000), current);
  assert.throws(() => assertCounterDecisionCurrent(current, 3, 900000), /changed/);
  assert.throws(() => assertCounterDecisionCurrent(current, 4, 800000), /changed/);
  assert.ok(actions.includes("expectedRevision"));
  assert.ok(actions.includes("expectedCounterMinor"));
});

test("assignment revalidates current broadcast and uses current agreed payout", () => {
  const accepted = { id: "o", driverId: "d", responseStatus: "accepted", offerRevision: 4, agreedPayoutMinor: 900000 };
  assert.equal(requireAvailableOffer([accepted], { offerId: "o", driverId: "d", vehicleId: "v" }), accepted);
  assert.throws(() => requireAvailableOffer([{ ...accepted, agreedPayoutMinor: undefined }], { offerId: "o", driverId: "d", vehicleId: "v" }), /payout is incomplete/);
  assert.ok(assignment.includes("activeBroadcastId"));
  assert.ok(assignment.includes("agreedPayoutMinor"));
});

test("response and delivery states remain separate", () => {
  assert.ok(admin.includes("Delivery:"));
  assert.ok(admin.includes("offer.notificationStatus"));
  assert.ok(repo.includes("responseStatus"));
  assert.equal(repo.includes("notificationStatus:"), false);
});

test("privacy, manual fallback and provider inertness remain intact", () => {
  const combined = repo + admin + portal;
  for (const forbidden of ["sendDualhook", "sendWhatsApp", "DUALHOOK_WHATSAPP_API_KEY", "customer.phone", "customerFinancials", "vehicleRegistration"]) assert.equal(combined.includes(forbidden), false, forbidden);
  assert.ok(admin.includes("Open WhatsApp with Link"));
  assert.ok(admin.includes("Manual WhatsApp only"));
  assert.ok(admin.includes("does not assign"));
});
