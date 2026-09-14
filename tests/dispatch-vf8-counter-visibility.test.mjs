import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { supplierResponsePresentation } from "../src/lib/dispatch/admin-presentation.ts";
import { serializeDispatchOfferRecord } from "../src/lib/dispatch/offer-types.ts";

const actor = { type: "shared_admin_session" };
const vendorCounter = (patch = {}) => ({
  id: "vendor-offer",
  bookingOperationalId: "booking",
  bookingId: "RK-VF8-COUNTER",
  vendorId: "vendor-a",
  candidateId: "vendor-a",
  recipientType: "vendor",
  recipientId: "vendor-a",
  supplyAccountId: "vendor-a",
  recipientDisplayName: "Al farooq transporter",
  approvedPayoutMinor: 350000,
  currentOfferedPayoutMinor: 350000,
  requestedPayoutMinor: 450000,
  offerStage: "prepared",
  responseStatus: "countered",
  negotiationStatus: "awaiting_admin_review",
  notificationStatus: "provider_accepted",
  offerRevision: 1,
  createdAt: "now",
  updatedAt: "now",
  createdBy: actor,
  updatedBy: actor,
  ...patch,
});
const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = source("app/admin/dispatch/page.tsx");
const vendorUi = source("app/admin/dispatch/VendorSecureOfferControls.tsx");
const matchUi = source("app/admin/dispatch/MatchPanel.tsx");
const presentation = () => supplierResponsePresentation(vendorCounter());

test("vendor countered offer appears in the Admin dispatch read model", () => {
  assert.equal(
    presentation().responseLabel,
    "Countered — Awaiting RentKA Review",
  );
  assert.match(page, /q\.open \? getDispatchOfferPanel\(q\.open\)/);
});
test("vendor name is shown", () =>
  assert.equal(presentation().recipientName, "Al farooq transporter"));
test("original payout is shown", () => {
  assert.equal(presentation().originalPayoutMinor, 350000);
  assert.match(vendorUi, /Original payout:/);
});
test("counter payout is shown", () => {
  assert.equal(presentation().counterPayoutMinor, 450000);
  assert.match(vendorUi, /Vendor counter:/);
});
test("counter response label clearly awaits RentKA review", () =>
  assert.equal(
    presentation().responseLabel,
    "Countered — Awaiting RentKA Review",
  ));
test("Accept Counter control is visible", () =>
  assert.match(vendorUi, />\s*Accept Counter\s*</));
test("Revise Offer control is visible", () =>
  assert.match(vendorUi, />\s*Revise Offer\s*</));
test("Reject Counter control is visible", () =>
  assert.match(vendorUi, />\s*Reject Counter\s*</));
test("vendor counter rendering does not require driverId", () =>
  assert.doesNotThrow(() =>
    supplierResponsePresentation(vendorCounter({ driverId: undefined })),
  ));
test("historical driver counter rendering remains supported", () => {
  const view = supplierResponsePresentation(
    vendorCounter({
      recipientType: undefined,
      recipientDisplayName: undefined,
      driverName: "Historical Driver",
      driverId: "driver-a",
    }),
  );
  assert.equal(view.recipientName, "Historical Driver");
  assert.equal(view.supplierType, "Driver");
  assert.equal(view.responseLabel, "Countered — Awaiting RentKA Review");
});
test("providerAcceptedAt remains safely serialized", () => {
  const timestamp = {
    toDate: () => new Date("2026-09-14T12:20:35.987Z"),
  };
  const value = serializeDispatchOfferRecord(
    {
      ...vendorCounter(),
      createdAt: timestamp,
      updatedAt: timestamp,
      providerAcceptedAt: timestamp,
    },
    "vendor-offer",
  );
  assert.equal(value.providerAcceptedAt, "2026-09-14T12:20:35.987Z");
  assert.doesNotThrow(() => JSON.stringify(value));
});
test("delivery state remains separate from response state", () => {
  const view = presentation();
  assert.equal(view.deliveryLabel, "Provider accepted");
  assert.equal(view.responseLabel, "Countered — Awaiting RentKA Review");
});
test("rendering does not invoke a provider", () => {
  const rendering =
    source("src/lib/dispatch/admin-presentation.ts") + page + matchUi;
  for (const marker of [
    "getWhatsAppOutboundProvider",
    "invokeDriverOfferProvider",
    "sendTemplate(",
    "sendText(",
  ])
    assert.equal(rendering.includes(marker), false, marker);
});
test("counter rendering does not assign Driver or Vehicle", () => {
  const rendering =
    source("src/lib/dispatch/admin-presentation.ts") + vendorUi + matchUi;
  for (const marker of [
    "assignOperationalBooking",
    "dispatchAssignments",
    "assignmentRef",
    "reservationRef",
  ])
    assert.equal(rendering.includes(marker), false, marker);
});
