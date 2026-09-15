import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DRIVER_SETUP_INCOMPLETE_MESSAGE,
  DRIVER_SETUP_LABELS,
  driverSetupClassification,
  parseDriverSetupChoice,
  requireVendorDriverChoice,
} from "../src/lib/dispatch/driver-setup.ts";
import {
  LEGACY_DRIVER_RELATIONSHIP,
  LEGACY_SUPPLY_CLASSIFICATION,
  LEGACY_VEHICLE_CONTROL,
} from "../src/lib/dispatch/supply-classification.ts";
import { projectSupplyRecipients } from "../src/lib/dispatch/supply-recipient-projection.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const actor = { type: "shared_admin_session" };
const vendor = (patch = {}) => ({ id: "amin", name: "amin tareen", primaryPhone: "03001111111", primaryPhoneNormalized: "923001111111", whatsappNumber: "03001111111", whatsappNumberNormalized: "923001111111", zoneIds: ["twin_cities"], priority: "normal", active: true, supplyClassification: "independent_owner_driver", independentOwnerDriverId: "amin-driver", createdAt: "now", updatedAt: "now", createdBy: actor, updatedBy: actor, ...patch });
const driver = (patch = {}) => ({ id: "amin-driver", name: "amin tareen", mobileNumber: "03001111111", mobileNumberNormalized: "923001111111", whatsappNumber: "03001111111", whatsappNumberNormalized: "923001111111", vendorId: "amin", supplyRelationship: "independent_owner_driver", zoneIds: ["twin_cities"], priority: "normal", status: "available", active: true, documentation: { cnicVerificationState: "verified", licenceState: "verified" }, createdAt: "now", updatedAt: "now", createdBy: actor, updatedBy: actor, ...patch });
const vehicle = (patch = {}) => ({ id: "amin-car", vendorId: "amin", controlRelationship: "independent_controlled", zoneIds: ["twin_cities"], category: "Sedan", make: "Toyota", model: "Corolla", registrationNumber: "SAFE-1", status: "available", active: true, documentation: { overallState: "verified", registrationState: "verified", tokenChallanState: "verified", permitState: "verified", fitnessState: "verified", insuranceState: "verified" }, createdAt: "now", updatedAt: "now", createdBy: actor, updatedBy: actor, ...patch });
const pair = { id: "pair", vendor: { id: "amin", name: "amin tareen" }, driver: { id: "amin-driver", name: "amin tareen" }, vehicle: { id: "amin-car", label: "Toyota Corolla", registrationNumber: "SAFE-1" }, score: 80, compatibility: "exact_category", reasons: ["eligible"], manuallyIncluded: false };

test("I will drive myself maps safely to independent owner-driver", () => {
  assert.equal(DRIVER_SETUP_LABELS.self, "I will drive myself");
  assert.equal(parseDriverSetupChoice("self"), "self");
  assert.equal(driverSetupClassification("self"), "independent_owner_driver");
});

test("self-driving owner becomes matching eligible when other requirements pass", () => {
  const result = projectSupplyRecipients({ pairCandidates: [pair], vendors: [vendor()], drivers: [driver()], vehicles: [vehicle()], zoneId: "twin_cities" });
  assert.equal(result.eligible.length, 1);
  assert.equal(result.eligible[0].recipientReferenceId, "amin-driver");
  assert.equal(result.eligible[0].recipientTypeIntent, "independent_driver");
});

test("self-driving owner requires no separate driver selection", () => {
  assert.equal(requireVendorDriverChoice("self", "amin", undefined, []), undefined);
});

test("one of my drivers preserves vendor-first managed flow", () => {
  const managedVendor = vendor({ supplyClassification: "vendor_managed", independentOwnerDriverId: undefined });
  const managedDriver = driver({ supplyRelationship: "vendor_managed" });
  const managedVehicle = vehicle({ controlRelationship: "vendor_managed" });
  const result = projectSupplyRecipients({ pairCandidates: [pair], vendors: [managedVendor], drivers: [managedDriver], vehicles: [managedVehicle], zoneId: "twin_cities" });
  assert.equal(DRIVER_SETUP_LABELS.vendor_driver, "One of my drivers will drive");
  assert.equal(driverSetupClassification("vendor_driver"), "vendor_managed");
  assert.equal(result.eligible[0].recipientTypeIntent, "vendor");
  assert.equal(result.eligible[0].recipientReferenceId, "amin");
});

test("vendor child-driver selection remains scoped to that vendor", () => {
  const drivers = [driver(), driver({ id: "foreign", vendorId: "other" })];
  assert.equal(requireVendorDriverChoice("vendor_driver", "amin", "amin-driver", drivers), "amin-driver");
  assert.throws(() => requireVendorDriverChoice("vendor_driver", "amin", "foreign", drivers), /this vendor's drivers/);
});

test("old technical warning is absent from normal UI", () => {
  const visible = [source("app/join-rentka/PartnerApplicationForm.tsx"), source("app/admin/vendors/page.tsx"), source("src/lib/dispatch/supply-recipient-projection.ts")].join("\n");
  assert.ok(visible.includes("Who will drive this vehicle?"));
  assert.ok(visible.includes("Complete Driver Setup"));
  assert.ok(visible.includes(DRIVER_SETUP_INCOMPLETE_MESSAGE));
  assert.equal(visible.includes("Independent owner-driver designation is missing"), false);
});

test("incomplete setup remains safely blocked from matching", () => {
  const result = projectSupplyRecipients({ pairCandidates: [pair], vendors: [vendor({ supplyClassification: "unknown_needs_review", independentOwnerDriverId: undefined })], drivers: [driver({ supplyRelationship: "unknown_needs_review" })], vehicles: [vehicle({ controlRelationship: "unknown_needs_review" })], zoneId: "twin_cities" });
  assert.equal(result.eligible.length, 0);
  assert.match(result.excluded[0].reason, /Driver setup incomplete/);
});

test("historical records retain safe compatibility defaults", () => {
  assert.equal(LEGACY_SUPPLY_CLASSIFICATION, "unknown_needs_review");
  assert.equal(LEGACY_DRIVER_RELATIONSHIP, "unknown_needs_review");
  assert.equal(LEGACY_VEHICLE_CONTROL, "unknown_needs_review");
});

test("driver setup creates no assignment or reservation", () => {
  const repository = source("src/lib/dispatch/repository.ts").slice(source("src/lib/dispatch/repository.ts").indexOf("export async function completeDispatchVendorDriverSetup"));
  assert.equal(repository.includes("dispatchAssignments"), false);
  assert.equal(repository.includes("dispatchResourceReservations"), false);
  assert.equal(repository.includes("assignOperationalBooking"), false);
});

test("driver setup triggers no WhatsApp or provider action", () => {
  const action = source("app/admin/vendors/actions.ts").slice(source("app/admin/vendors/actions.ts").indexOf("export async function completeDriverSetup"));
  const repository = source("src/lib/dispatch/repository.ts").slice(source("src/lib/dispatch/repository.ts").indexOf("export async function completeDispatchVendorDriverSetup"));
  for (const marker of ["whatsappOutboundMessages", "deliverDriverOfferJob", "sendTemplate(", "sendText(", "Dualhook"])
    assert.equal((action + repository).includes(marker), false, marker);
});
