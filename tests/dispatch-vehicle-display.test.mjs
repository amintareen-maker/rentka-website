import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatVehicleDisplayLabel } from "../src/lib/dispatch/vehicle-display.ts";
import { createSecureVendorOfferProjection } from "../src/lib/dispatch/vendor-offer-portal-core.ts";
import { createCustomerDriverDetailsProjection } from "../src/lib/dispatch/customer-driver-details-core.ts";
import { createDriverFinalMessage } from "../src/lib/dispatch/post-assignment-messaging-core.ts";

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const vehicle = (id, registrationNumber, vendorId = "vendor-1", patch = {}) => ({
  id,
  vendorId,
  make: "Honda",
  model: "City",
  modelYear: 2023,
  registrationNumber,
  ...patch,
});
const pair = (vendorId, item) => ({
  id: `pair-${item.id}`,
  vendor: { id: vendorId, name: vendorId },
  vehicle: {
    id: item.id,
    label: formatVehicleDisplayLabel(item),
    registrationNumber: item.registrationNumber,
  },
  driver: { id: `driver-${vendorId}`, name: `Driver ${vendorId}` },
  score: 90,
  compatibility: "exact_model",
  reasons: [],
});
const vendor = { id: "vendor-1", name: "Vendor One" };
const booking = {
  id: "booking-1",
  bookingId: "RK-VEHICLE-DISPLAY",
  lifecycle: "active",
  serviceType: "within_city",
  customer: { name: "Customer", phone: "03000000000" },
  itinerary: {
    pickup: "Blue Area, Islamabad",
    destinationOrUsage: "F-8, Islamabad",
    travelDate: "2099-01-02",
    pickupTime: "10:00",
  },
  requestedVehicle: { categoryOrModel: "Sedan" },
  sourceSnapshot: { durationHours: 8 },
};
const offer = {
  id: "offer-1",
  bookingOperationalId: booking.id,
  bookingId: booking.bookingId,
  broadcastId: "broadcast-1",
  offerRevision: 1,
  vendorId: vendor.id,
  recipientType: "vendor",
  recipientId: vendor.id,
  supplyAccountId: vendor.id,
  approvedPayoutMinor: 350000,
  currentOfferedPayoutMinor: 350000,
  responseStatus: "accepted",
  proposalStatus: "not_provided",
  portalStatus: "open",
  offerExpiresAt: "2099-01-03T00:00:00.000Z",
};
const secureProjection = () => {
  const own = vehicle("vehicle-own", "ICT-123"),
    foreign = vehicle("vehicle-foreign", "LHR-999", "vendor-2");
  return createSecureVendorOfferProjection({
    booking,
    offer,
    vendor,
    matches: {
      bookingId: booking.bookingId,
      ready: true,
      window: { start: "2099-01-02T05:00:00.000Z", end: "2099-01-02T13:00:00.000Z", basis: "test" },
      top: [],
      eligible: [pair(vendor.id, own), pair("vendor-2", foreign)],
      excluded: [],
    },
  });
};
const assignedBooking = {
  ...booking,
  assignment: {
    id: "assignment-1",
    status: "assigned",
    assignedDriverId: "driver-1",
    assignedVehicleId: "vehicle-own",
    driverSnapshot: {
      name: "Driver One",
      mobileNumber: "03001111111",
      whatsappNumber: "03001111111",
    },
    vehicleSnapshot: vehicle("vehicle-own", "ICT-123"),
  },
};

test("standard vehicle display includes make model year and registration", () => {
  assert.equal(formatVehicleDisplayLabel(vehicle("v1", "ICT-123")), "Honda City 2023 — ICT-123");
});

test("same make model and year remain distinguishable by registration", () => {
  assert.notEqual(formatVehicleDisplayLabel(vehicle("v1", "ICT-123")), formatVehicleDisplayLabel(vehicle("v2", "ICT-456")));
});

test("missing year is omitted cleanly", () => {
  assert.equal(formatVehicleDisplayLabel(vehicle("v1", "ICT-123", "vendor-1", { modelYear: undefined })), "Honda City — ICT-123");
});

test("missing registration uses the safe fallback", () => {
  assert.equal(formatVehicleDisplayLabel(vehicle("v1", "   ")), "Honda City 2023 — Registration not added");
});

test("vendor sees registration for its own eligible vehicle", () => {
  assert.deepEqual(secureProjection().eligibleVehicles, [{ id: "vehicle-own", label: "Honda City 2023 — ICT-123" }]);
});

test("vendor cannot see another vendor vehicle registration", () => {
  assert.equal(JSON.stringify(secureProjection()).includes("LHR-999"), false);
});

test("Admin proposal review uses the registration-inclusive proposal label", () => {
  const repository = source("src/lib/dispatch/assignment-repository.ts"),
    panel = source("app/admin/dispatch/AssignmentPanel.tsx");
  assert.ok(repository.includes("vehicleLabel: formatVehicleDisplayLabel(vehicle)"));
  assert.ok(panel.includes("{proposal.vehicleLabel}"));
});

test("Admin assignment selection and current assignment show registration-inclusive labels", () => {
  const panel = source("app/admin/dispatch/AssignmentPanel.tsx");
  assert.ok(panel.includes("{item.label} — docs"));
  assert.ok(panel.includes("formatVehicleDisplayLabel(current.vehicleSnapshot)"));
});

test("post-assignment customer and driver details retain registration", () => {
  const driverMessage = createDriverFinalMessage(assignedBooking),
    customerProjection = createCustomerDriverDetailsProjection(assignedBooking);
  assert.equal(driverMessage.parameters[5], "Honda City 2023 — ICT-123");
  assert.equal(customerProjection.vehicleLabel, "Honda City 2023 — ICT-123");
  assert.ok(customerProjection.message.includes("ICT-123"));
});

test("display formatting does not change the canonical vehicle ID", () => {
  assert.equal(secureProjection().eligibleVehicles[0].id, "vehicle-own");
});

test("assignment business logic remains independent of display formatting", () => {
  assert.equal(source("src/lib/dispatch/assignment-core.ts").includes("formatVehicleDisplayLabel"), false);
});

test("vehicle display paths do not invoke messaging providers", () => {
  const formatter = source("src/lib/dispatch/vehicle-display.ts"),
    portal = source("src/lib/dispatch/vendor-offer-portal-core.ts");
  for (const marker of ["sendTemplate(", "sendText(", "invokeDriverOfferProvider"]) {
    assert.equal(formatter.includes(marker), false);
    assert.equal(portal.includes(marker), false);
  }
});
