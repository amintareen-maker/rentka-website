import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertDriverSupplyRelationship,
  assertVehicleControlRelationship,
  automatedOfferRoutingEligible,
  LEGACY_DRIVER_RELATIONSHIP,
  LEGACY_SUPPLY_CLASSIFICATION,
  LEGACY_VEHICLE_CONTROL,
  offerRecipientType,
  supplyRosterCounts,
} from "../src/lib/dispatch/supply-classification.ts";
import { parseDriverForm, parseVehicleForm, parseVendorForm } from "../src/lib/dispatch/validation.ts";

const base = (extra = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "Test Supply", primaryPhone: "03001234567", whatsappNumber: "03001234567", priority: "normal", supplyClassification: "unknown_needs_review", ...extra })) form.set(key, value);
  form.set("zoneIds", "twin_cities");
  return form;
};

test("legacy records have safe review-required defaults", () => {
  assert.equal(LEGACY_SUPPLY_CLASSIFICATION, "unknown_needs_review");
  assert.equal(LEGACY_DRIVER_RELATIONSHIP, "unknown_needs_review");
  assert.equal(LEGACY_VEHICLE_CONTROL, "unknown_needs_review");
  assert.equal(automatedOfferRoutingEligible(LEGACY_SUPPLY_CLASSIFICATION), false);
  assert.equal(offerRecipientType(LEGACY_SUPPLY_CLASSIFICATION), "blocked_needs_review");
});

test("authoritative vendor classifications resolve future recipient types", () => {
  assert.equal(offerRecipientType("vendor_managed"), "vendor");
  assert.equal(offerRecipientType("independent_owner_driver"), "independent_driver");
  assert.equal(offerRecipientType("rentka_internal"), "rentka_internal");
  assert.equal(automatedOfferRoutingEligible("vendor_managed"), true);
  assert.equal(automatedOfferRoutingEligible("independent_owner_driver"), false);
  assert.equal(automatedOfferRoutingEligible("independent_owner_driver", "driver-1"), true);
  assert.equal(automatedOfferRoutingEligible("rentka_internal"), false);
});

test("driver relationship contradictions are rejected", () => {
  assert.doesNotThrow(() => assertDriverSupplyRelationship("vendor_managed", "vendor_managed"));
  assert.doesNotThrow(() => assertDriverSupplyRelationship("independent_owner_driver", "independent_owner_driver"));
  assert.doesNotThrow(() => assertDriverSupplyRelationship("rentka_internal", "rentka_internal"));
  assert.throws(() => assertDriverSupplyRelationship("vendor_managed", "independent_owner_driver"), /conflicts/);
  assert.throws(() => assertDriverSupplyRelationship("independent_owner_driver", "vendor_managed"), /conflicts/);
});

test("vehicle control contradictions are rejected", () => {
  assert.doesNotThrow(() => assertVehicleControlRelationship("vendor_managed", "vendor_owned"));
  assert.doesNotThrow(() => assertVehicleControlRelationship("vendor_managed", "vendor_managed"));
  assert.doesNotThrow(() => assertVehicleControlRelationship("independent_owner_driver", "independent_controlled"));
  assert.doesNotThrow(() => assertVehicleControlRelationship("rentka_internal", "rentka_internal"));
  assert.throws(() => assertVehicleControlRelationship("vendor_managed", "independent_controlled"), /conflicts/);
});

test("one supply account safely counts one driver and one vehicle", () => {
  assert.deepEqual(supplyRosterCounts("vendor-a", [{ vendorId: "vendor-a" }], [{ vendorId: "vendor-a" }]), { drivers: 1, vehicles: 1 });
});

test("one supply account safely counts eight drivers and five vehicles", () => {
  const drivers = Array.from({ length: 8 }, () => ({ vendorId: "vendor-b" }));
  const vehicles = Array.from({ length: 5 }, () => ({ vendorId: "vendor-b" }));
  assert.deepEqual(supplyRosterCounts("vendor-b", drivers, vehicles), { drivers: 8, vehicles: 5 });
});

test("forms parse authoritative classification fields", () => {
  assert.equal(parseVendorForm(base({ supplyClassification: "vendor_managed" })).supplyClassification, "vendor_managed");
  const driver = base({ name: "Driver", mobileNumber: "03001234567", vendorId: "vendor-a", supplyRelationship: "vendor_managed", status: "available", cnicVerificationState: "unknown", licenceState: "unknown" });
  assert.equal(parseDriverForm(driver).supplyRelationship, "vendor_managed");
  const vehicle = base({ vendorId: "vendor-a", controlRelationship: "vendor_owned", category: "Sedan", make: "Toyota", model: "Corolla", registrationNumber: "ABC-123", status: "available", documentationOverallState: "unknown", registrationState: "unknown", tokenChallanState: "unknown", permitState: "unknown", fitnessState: "unknown", insuranceState: "unknown" });
  assert.equal(parseVehicleForm(vehicle).controlRelationship, "vendor_owned");
});

test("admin forms expose classification, relationships, review filter, and scoped add actions", () => {
  const vendors = readFileSync(new URL("../app/admin/vendors/page.tsx", import.meta.url), "utf8");
  const drivers = readFileSync(new URL("../app/admin/drivers/page.tsx", import.meta.url), "utf8");
  const vehicles = readFileSync(new URL("../app/admin/vehicles/page.tsx", import.meta.url), "utf8");
  for (const marker of ["Supply classification", "Supply Classification Review Required", "Add Driver", "Add Vehicle", "View Drivers", "View Vehicles", "classification=unknown_needs_review"]) assert.ok(vendors.includes(marker), marker);
  assert.match(drivers, /Supply relationship/);
  assert.match(vehicles, /Supply\/control relationship/);
  assert.match(vendors, /supplyClassificationPresentation/);
});

test("classification changes are audited and VF5 D6 consumes authoritative grouped recipients", () => {
  const repository = readFileSync(new URL("../src/lib/dispatch/repository.ts", import.meta.url), "utf8");
  const broadcast = readFileSync(new URL("../src/lib/dispatch/broadcast-approval-repository.ts", import.meta.url), "utf8");
  assert.match(repository, /supply_classification_changed/);
  assert.match(repository, /LEGACY_SUPPLY_CLASSIFICATION/);
  assert.match(broadcast, /projectSupplyRecipients/);
  assert.match(broadcast, /selectSupplyBroadcastRecipients/);
  assert.match(broadcast, /recipientType:projection\.recipientType/);
});

test("partner approval keeps new records review-required without inferring independence", () => {
  const source = readFileSync(new URL("../src/lib/partner-applications/onboarding-core.ts", import.meta.url), "utf8");
  assert.match(source, /supplyClassification:"unknown_needs_review"/);
  assert.match(source, /supplyRelationship:"unknown_needs_review"/);
  assert.match(source, /controlRelationship:"unknown_needs_review"/);
});
