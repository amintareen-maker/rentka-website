import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  DRIVER_SUPPLY_RELATIONSHIP_LABELS,
  SUPPLY_CLASSIFICATION_LABELS,
  VEHICLE_CONTROL_RELATIONSHIP_LABELS,
  assertDriverSupplyRelationship,
  assertIndependentOwnerDriverDesignation,
  assertVehicleControlRelationship,
  supplyRelationshipReview,
  supplyRosterCounts,
} from "../src/lib/dispatch/supply-classification.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const vendorPage = source("app/admin/vendors/page.tsx");
const driverPage = source("app/admin/drivers/page.tsx");
const vehiclePage = source("app/admin/vehicles/page.tsx");
const driverActions = source("app/admin/drivers/actions.ts");
const vehicleActions = source("app/admin/vehicles/actions.ts");
const repository = source("src/lib/dispatch/repository.ts");

test("supply account labels are clear and retain authoritative enum values", () => {
  assert.deepEqual(Object.values(SUPPLY_CLASSIFICATION_LABELS), ["Vendor Managed", "Independent Owner-Driver", "RentKA Internal", "Needs Review"]);
  assert.equal(DRIVER_SUPPLY_RELATIONSHIP_LABELS.vendor_managed, "Vendor Managed");
  assert.equal(VEHICLE_CONTROL_RELATIONSHIP_LABELS.independent_controlled, "Independently Controlled");
});

test("vendor-managed account supports one driver and one vehicle", () => {
  assert.deepEqual(supplyRosterCounts("vendor-a", [{ vendorId: "vendor-a" }], [{ vendorId: "vendor-a" }]), { drivers: 1, vehicles: 1 });
  assert.doesNotThrow(() => assertDriverSupplyRelationship("vendor_managed", "vendor_managed"));
  assert.doesNotThrow(() => assertVehicleControlRelationship("vendor_managed", "vendor_owned"));
});

test("vendor-managed account supports eight drivers and five vehicles", () => {
  const drivers = Array.from({ length: 8 }, () => ({ vendorId: "vendor-b" }));
  const vehicles = Array.from({ length: 5 }, () => ({ vendorId: "vendor-b" }));
  assert.deepEqual(supplyRosterCounts("vendor-b", drivers, vehicles), { drivers: 8, vehicles: 5 });
});

test("vendor-scoped driver filtering and listing use the selected supply account", () => {
  assert.match(driverPage, /!q\.vendor\|\|d\.vendorId===q\.vendor/);
  assert.match(driverPage, /name="vendor" defaultValue=\{q\.vendor/);
  assert.match(driverPage, /vendor=\$\{d\.vendorId\}&edit=\$\{d\.id\}/);
});

test("vendor-scoped vehicle filtering and listing use the selected supply account", () => {
  assert.match(vehiclePage, /!q\.vendor\|\|v\.vendorId===q\.vendor/);
  assert.match(vehiclePage, /name="vendor" defaultValue=\{q\.vendor/);
  assert.match(vehiclePage, /vendor=\$\{v\.vendorId\}&edit=\$\{v\.id\}/);
});

test("Add Driver preserves vendor context through form and redirects", () => {
  assert.match(vendorPage, /\/admin\/drivers\?vendor=\$\{vendor\.id\}#add-driver/);
  assert.match(driverPage, /name="vendorContext" value=\{scopedVendorId\}/);
  assert.match(driverActions, /vendorContext/);
  assert.match(driverActions, /saved=Driver saved/);
});

test("Add Vehicle preserves vendor context through form and redirects", () => {
  assert.match(vendorPage, /\/admin\/vehicles\?vendor=\$\{vendor\.id\}#add-vehicle/);
  assert.match(vehiclePage, /name="vendorContext" value=\{scopedVendorId\}/);
  assert.match(vehicleActions, /vendorContext/);
  assert.match(vehicleActions, /saved=Vehicle saved/);
});

test("Needs Review filter and account warning are explicit", () => {
  assert.match(vendorPage, /classification=unknown_needs_review/);
  assert.match(vendorPage, /NEEDS REVIEW/);
  assert.deepEqual(supplyRelationshipReview("unknown_needs_review", [], []), { valid: true, needsReview: true, contradictions: 0 });
});

test("unknown child relationships remain review-required without inference", () => {
  const review = supplyRelationshipReview("vendor_managed", [{ supplyRelationship: "unknown_needs_review" }], [{ controlRelationship: "unknown_needs_review" }]);
  assert.equal(review.needsReview, true);
  assert.equal(review.contradictions, 0);
});

test("vendor-managed account rejects an independent driver relationship", () => {
  assert.throws(() => assertDriverSupplyRelationship("vendor_managed", "independent_owner_driver"), /conflicts/);
});

test("vendor-managed account rejects an incompatible vehicle relationship", () => {
  assert.throws(() => assertVehicleControlRelationship("vendor_managed", "independent_controlled"), /conflicts/);
});

test("independent-owner-driver account accepts compatible driver and vehicle", () => {
  assert.doesNotThrow(() => assertDriverSupplyRelationship("independent_owner_driver", "independent_owner_driver"));
  assert.doesNotThrow(() => assertVehicleControlRelationship("independent_owner_driver", "independent_controlled"));
});

test("independent designation rejects a foreign or incompatible driver", () => {
  assert.throws(() => assertIndependentOwnerDriverDesignation("independent_owner_driver", "account-a", "driver-a", { id: "driver-a", vendorId: "account-b", supplyRelationship: "independent_owner_driver" }), /belonging to this supply account/);
  assert.throws(() => assertIndependentOwnerDriverDesignation("vendor_managed", "account-a", "driver-a", { id: "driver-a", vendorId: "account-a", supplyRelationship: "vendor_managed" }), /Only an independent/);
});

test("independent designation accepts only the account's compatible driver", () => {
  assert.doesNotThrow(() => assertIndependentOwnerDriverDesignation("independent_owner_driver", "account-a", "driver-a", { id: "driver-a", vendorId: "account-a", supplyRelationship: "independent_owner_driver" }));
  assert.match(vendorPage, /Independent offer recipient/);
});

test("RentKA internal account validates compatible internal resources", () => {
  assert.doesNotThrow(() => assertDriverSupplyRelationship("rentka_internal", "rentka_internal"));
  assert.doesNotThrow(() => assertVehicleControlRelationship("rentka_internal", "rentka_internal"));
});

test("classification change rejects contradictory children without rewriting them", () => {
  const driver = { supplyRelationship: "vendor_managed" };
  const vehicle = { controlRelationship: "vendor_owned" };
  const review = supplyRelationshipReview("independent_owner_driver", [driver], [vehicle]);
  assert.deepEqual(review, { valid: false, needsReview: true, contradictions: 2 });
  assert.deepEqual(driver, { supplyRelationship: "vendor_managed" });
  assert.deepEqual(vehicle, { controlRelationship: "vendor_owned" });
  assert.match(repository, /for \(const driver of drivers\.docs\) assertDriverSupplyRelationship/);
  assert.doesNotMatch(repository, /tx\.update\(driver\.ref/);
});

test("classification, designation, driver relationship and vehicle control changes are audited", () => {
  for (const marker of ["supply_classification_changed", "independent_owner_driver_designation_changed", "driver_supply_relationship_changed", "vehicle_control_relationship_changed"]) assert.match(repository, new RegExp(marker));
});

test("partner approval stays review-required while VF5 D6 consumes grouped supply", () => {
  const onboarding = source("src/lib/partner-applications/onboarding-core.ts");
  for (const marker of ['supplyClassification:"unknown_needs_review"', 'supplyRelationship:"unknown_needs_review"', 'controlRelationship:"unknown_needs_review"']) assert.match(onboarding, new RegExp(marker));
  const matching = source("src/lib/dispatch/matching-core.ts");
  const broadcast = source("src/lib/dispatch/broadcast-approval-repository.ts");
  assert.doesNotMatch(matching, /offerRecipientType|recipientType:"vendor"/);
  assert.match(broadcast, /projectSupplyRecipients/);
  assert.match(broadcast, /recipientType:projection\.recipientType/);
});
