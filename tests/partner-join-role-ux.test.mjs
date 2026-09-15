import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectSupplyRecipients } from "../src/lib/dispatch/supply-recipient-projection.ts";
import { newDriverPayload, resolveApprovalClassification } from "../src/lib/partner-applications/onboarding-core.ts";
import { validateSubmission } from "../src/lib/partner-applications/validation.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const vehicle = (index = 1) => ({ make: "Toyota", model: `Corolla ${index}`, modelYear: 2022, registrationNumber: `ICT-${index}`, category: "Sedan", uploadTokens: [] });
const namedDriver = (index = 1) => ({ key: `driver-${index}`, name: `Driver ${index}`, mobile: `03020000${String(index).padStart(3, "0")}`, whatsapp: `03020000${String(index).padStart(3, "0")}`, zoneIds: ["twin_cities"], cnicNumber: `6110112345${String(index).padStart(3, "0")}`.slice(0, 13), licenceNumber: `ISL-${index}`, licenceExpiryDate: "01/01/2028", uploadTokens: [] });
const owner = () => ({ applicationType: "ownerDriver", drivingSetup: "self", name: "Ali Owner", mobile: "03020589999", whatsapp: "03020589999", zoneIds: ["twin_cities"], cnicNumber: "6110112345671", licenceNumber: "ISL-1", licenceExpiryDate: "01/01/2028", availability: "available_after_approval", consent: true, vehicles: [vehicle()], uploadTokens: [] });
const fleet = (drivingSetup, drivers = []) => ({ applicationType: "vendor", drivingSetup, name: "Sara Owner", businessName: "North Fleet", mobile: "03020589999", whatsapp: "03020589999", zoneIds: ["twin_cities"], ...(drivingSetup === "self" ? { cnicNumber: "6110112345671", licenceNumber: "ISL-2", licenceExpiryDate: "01/01/2028" } : {}), consent: true, drivers, vehicles: [vehicle()], uploadTokens: [] });

test("owner-driver completes without creating another driver", () => {
  const result = validateSubmission(owner());
  assert.equal(result.drivingSetup, "self");
  assert.equal(result.availability, "available_after_approval");
  assert.equal(result.drivers.length, 0);
});

test("owner-driver maps safely to the independent owner-driver classification", () => {
  assert.equal(resolveApprovalClassification("ownerDriver", "independent_owner_driver", "self"), "independent_owner_driver");
});

test("fleet applicant can add multiple vehicles", () => {
  const result = validateSubmission({ ...fleet("vendor_driver", [namedDriver()]), vehicles: Array.from({ length: 5 }, (_, index) => vehicle(index + 1)) });
  assert.equal(result.vehicles.length, 5);
});

test("fleet applicant can add multiple drivers", () => {
  const result = validateSubmission(fleet("vendor_driver", Array.from({ length: 8 }, (_, index) => namedDriver(index + 1))));
  assert.equal(result.drivers.length, 8);
});

test("fleet applicant may choose self-drive and use the contact as driver", () => {
  const result = validateSubmission(fleet("self"));
  assert.equal(result.drivers.length, 0);
  assert.equal(resolveApprovalClassification("vendor", "independent_owner_driver", result.drivingSetup), "independent_owner_driver");
  const application = { ...result, id: "app", applicationId: "RK-PA-1", status: "new", documents: [], consent: { accepted: true, textVersion: "2026-08-26", acceptedAt: "now" }, createdAt: "now", updatedAt: "now", createdBy: { type: "public_applicant" }, updatedBy: { type: "public_applicant" } };
  assert.equal(newDriverPayload(application, "vendor", "now", { type: "shared_admin_session" }, "independent_owner_driver").name, "Sara Owner");
});

test("fleet applicant may choose one of its own drivers", () => {
  const result = validateSubmission(fleet("vendor_driver", [namedDriver()]));
  assert.equal(result.drivingSetup, "vendor_driver");
  assert.equal(result.drivers[0].relationshipIntent, "vendor_managed");
  assert.equal(resolveApprovalClassification("vendor", "vendor_managed", result.drivingSetup), "vendor_managed");
});

test("public form uses only plain role and driving wording", () => {
  const form = source("app/join-rentka/PartnerApplicationForm.tsx");
  for (const text of ["How do you work?", "I own a vehicle and drive myself", "I manage vehicles and drivers", "Who will drive this vehicle?", "I will drive myself", "One of my drivers will drive", "Add a driver", "Add another vehicle", "I am available for bookings after RentKA approves my application."]) assert.ok(form.includes(text), text);
  for (const text of ["Independent owner-driver designation is missing", "supply classification", "vendor-managed supply", "owner-driver relationship"]) assert.equal(form.toLowerCase().includes(text.toLowerCase()), false, text);
});

test("Admin receives clear type, driving setup, vehicle, and driver information", () => {
  const page = source("app/admin/partner-applications/page.tsx"), approval = source("app/admin/partner-applications/ApprovalForm.tsx");
  for (const text of ["Owner-driver", "Vendor / Fleet", "Driving setup", "Drives himself", "Uses own drivers", "Vehicles", "Drivers"]) assert.ok((page + approval).includes(text), text);
  assert.ok(approval.includes('name="supplyClassification" required'));
});

test("vendor-first dispatch remains unchanged for fleet applicants using drivers", () => {
  const actor = { type: "shared_admin_session" }, vendor = { id: "v1", name: "North Fleet", primaryPhone: "03020589999", primaryPhoneNormalized: "923020589999", whatsappNumber: "03020589999", whatsappNumberNormalized: "923020589999", zoneIds: ["twin_cities"], priority: "normal", active: true, supplyClassification: "vendor_managed", createdAt: "now", updatedAt: "now", createdBy: actor, updatedBy: actor }, driver = { id: "d1", name: "Driver 1", mobileNumber: "03020000001", mobileNumberNormalized: "923020000001", whatsappNumber: "03020000001", whatsappNumberNormalized: "923020000001", vendorId: "v1", supplyRelationship: "vendor_managed", zoneIds: ["twin_cities"], priority: "normal", status: "available", active: true, documentation: {}, createdAt: "now", updatedAt: "now", createdBy: actor, updatedBy: actor }, car = { id: "car1", vendorId: "v1", controlRelationship: "vendor_managed", zoneIds: ["twin_cities"], category: "Sedan", make: "Toyota", model: "Corolla", registrationNumber: "ICT-1", status: "available", active: true, documentation: {}, createdAt: "now", updatedAt: "now", createdBy: actor, updatedBy: actor }, pair = { id: "pair", vendor: { id: "v1", name: "North Fleet" }, driver: { id: "d1", name: "Driver 1" }, vehicle: { id: "car1", label: "Toyota Corolla", registrationNumber: "ICT-1" }, score: 80, compatibility: "exact_category", reasons: ["eligible"], manuallyIncluded: false };
  const result = projectSupplyRecipients({ pairCandidates: [pair], vendors: [vendor], drivers: [driver], vehicles: [car], zoneId: "twin_cities" });
  assert.equal(result.eligible[0].recipientTypeIntent, "vendor");
  assert.equal(result.eligible[0].recipientReferenceId, "v1");
});

test("form setup invokes no WhatsApp or provider operation", () => {
  const inspected = [source("app/join-rentka/PartnerApplicationForm.tsx"), source("src/lib/partner-applications/onboarding.ts"), source("src/lib/partner-applications/repository.ts")].join("\n");
  for (const marker of ["deliverDriverOfferJob", "whatsappOutboundMessages", "sendTemplate(", "sendText(", "Dualhook"]) assert.equal(inspected.includes(marker), false, marker);
});
