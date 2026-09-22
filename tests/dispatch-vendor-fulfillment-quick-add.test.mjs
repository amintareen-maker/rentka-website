import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  fulfillmentQuickAddBinding,
  isCurrentFulfillmentQuickAdd,
  normalizeVehicleRegistration,
  quickAddDocumentSummary,
  quickAddDriverId,
  quickAddVehicleId,
  validateVendorQuickAddDriver,
  validateVendorQuickAddVehicle,
} from "../src/lib/dispatch/vendor-fulfillment-quick-add-core.ts";

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const repository = source("src/lib/dispatch/vendor-offer-portal-repository.ts");
const actions = source("app/vendor/offer/[token]/actions.ts");
const vendorUi = source("app/vendor/offer/[token]/VendorOfferResponse.tsx");
const adminUi = source("app/admin/dispatch/AssignmentPanel.tsx");
const assignmentRepo = source("src/lib/dispatch/assignment-repository.ts");
const protectedRoute = source("app/api/admin/dispatch/supply-documents/route.ts");
const postAssignment = source("src/lib/dispatch/post-assignment-messaging-core.ts");
const context = { bookingOperationalId: "booking-1", offerId: "offer-1", vendorId: "vendor-1" };

test("vendor can add Driver with name and phone only", () => assert.deepEqual(validateVendorQuickAddDriver({ name: " Usama ", phone: "0302 0589999" }), { name: "Usama", mobileNumber: "0302 0589999", mobileNumberNormalized: "923020589999" }));
test("Driver name is required", () => assert.throws(() => validateVendorQuickAddDriver({ phone: "03020589999" }), /Driver name is required/));
test("Driver Mobile or WhatsApp is required", () => assert.throws(() => validateVendorQuickAddDriver({ name: "Usama" }), /Mobile \/ WhatsApp number is required/));
test("CNIC remains optional", () => assert.equal(quickAddDocumentSummary(undefined, "driver"), "Not provided"));
test("Driving licence remains optional", () => assert.doesNotThrow(() => validateVendorQuickAddDriver({ name: "Usama", phone: "03020589999" })));
test("optional CNIC upload is accepted through protected staging", () => { assert.match(actions, /cnic_front/); assert.match(actions, /stageDocument/); assert.equal(quickAddDocumentSummary([{ kind: "cnic_front" }], "driver"), "CNIC provided"); });
test("optional licence upload is accepted through protected staging", () => { assert.match(actions, /licence_front/); assert.equal(quickAddDocumentSummary([{ kind: "licence_front" }], "driver"), "Licence provided"); });
test("new Driver is linked to the authorized Vendor", () => { assert.match(repository, /vendorId: vendor\.id/); const trace = fulfillmentQuickAddBinding(context); assert.equal(trace.vendorId, "vendor-1"); });
test("new Driver is vendor-managed and never independent owner-driver", () => { const section = repository.slice(repository.indexOf("quickAddVendorDriver"), repository.indexOf("quickAddVendorVehicle")); assert.match(section, /supplyRelationship: "vendor_managed"/); assert.equal(section.includes("independent_owner_driver"), false); });
test("quick-added child Driver is not a direct initial offer recipient", () => { const section = repository.slice(repository.indexOf("quickAddVendorDriver"), repository.indexOf("quickAddVendorVehicle")); assert.equal(section.includes("dispatchOffers"), false); assert.equal(section.includes("recipientType"), false); });
test("vendor can add Vehicle with make model and registration", () => assert.deepEqual(validateVendorQuickAddVehicle({ make: " Suzuki ", model: " Alto ", registrationNumber: "abc-123" }), { make: "Suzuki", model: "Alto", registrationNumber: "ABC-123", registrationNumberNormalized: "ABC123" }));
test("Vehicle year is optional", () => assert.equal("modelYear" in validateVendorQuickAddVehicle({ make: "Suzuki", model: "Alto", registrationNumber: "ABC-123" }), false));
test("Vehicle registration document is optional", () => { assert.doesNotThrow(() => validateVendorQuickAddVehicle({ make: "Suzuki", model: "Alto", registrationNumber: "ABC-123" })); assert.match(actions, /vehicle_registration/); });
test("Vehicle photo is optional", () => { assert.match(actions, /vehiclePhoto/); assert.equal(quickAddDocumentSummary([], "vehicle"), "Not provided"); });
test("Vehicle registration number is required", () => assert.throws(() => validateVendorQuickAddVehicle({ make: "Suzuki", model: "Alto" }), /Registration number is required/));
test("new Vehicle is linked to the current Vendor and vendor-managed control", () => { const section = repository.slice(repository.indexOf("quickAddVendorVehicle"), repository.indexOf("submitVendorFulfillmentProposal")); assert.match(section, /vendorId: vendor\.id/); assert.match(section, /controlRelationship: "vendor_managed"/); });
test("duplicate Driver identity is deterministic by normalized Vendor phone", () => { assert.equal(quickAddDriverId("vendor-1", "923020589999"), quickAddDriverId("vendor-1", "923020589999")); assert.notEqual(quickAddDriverId("vendor-1", "923020589999"), quickAddDriverId("vendor-2", "923020589999")); assert.match(repository, /mobileNumberNormalized/); });
test("duplicate Vehicle identity uses normalized registration under one Vendor", () => { assert.equal(normalizeVehicleRegistration(" abc - 123 "), "ABC123"); assert.equal(quickAddVehicleId("vendor-1", "ABC123"), quickAddVehicleId("vendor-1", "ABC123")); assert.match(repository, /normalizeVehicleRegistration\(item\.data\(\)\.registrationNumberNormalized \|\| item\.data\(\)\.registrationNumber\)/); });
test("Save and Use immediately selects the returned Driver or Vehicle", () => { assert.match(vendorUi, /Save &amp; Use for This Booking/); assert.match(vendorUi, /setDriverId\(result\.option\.id\)/); assert.match(vendorUi, /setVehicleId\(result\.option\.id\)/); });
test("proposal clearly marks new supply", () => { assert.match(repository, /driverSubmittedDuringFulfillment/); assert.match(repository, /vehicleSubmittedDuringFulfillment/); assert.match(vendorUi, /New — RentKA review required/); });
test("Admin sees review state contact registration and document presence", () => { for (const marker of ["Needs RentKA review", "driverPhone", "registrationNumber", "driverDocumentSummary", "vehicleDocumentSummary", "Review driver", "Review vehicle"]) assert.ok(adminUi.includes(marker), marker); });
test("final assignment cannot bypass RentKA review", () => { assert.match(repository, /status: "offline", active: false/); assert.match(repository, /status: "inactive", active: false/); assert.match(assignmentRepo, /assignmentEligible: matches\.eligible\.some/); assert.match(adminUi, /!proposal\.assignmentEligible/); });
test("optional documents stay behind Admin authentication and protected reads", () => { const supplyRepository = source("src/lib/dispatch/repository.ts"); assert.match(protectedRoute, /hasAdminSession/); assert.match(protectedRoute, /readProtectedDocument/); assert.match(protectedRoute, /private, no-store/); assert.equal(vendorUi.includes("storagePath"), false); assert.match(supplyRepository, /fulfillmentQuickAdd:[\s\S]*createdAt: iso/); });
test("existing post-assignment messaging still reads assigned Driver phone and Vehicle registration", () => { assert.match(postAssignment, /mobileNumber|whatsappNumber/); assert.match(postAssignment, /registrationNumber/); });
test("quick add creates no WhatsApp or provider invocation", () => { const quickAddSection = repository.slice(repository.indexOf("quickAddVendorDriver"), repository.indexOf("submitVendorFulfillmentProposal")); for (const forbidden of ["sendTemplate", "sendText", "Dualhook", "whatsappOutboundMessages", "invokeDriverOfferProvider"]) assert.equal(quickAddSection.includes(forbidden), false, forbidden); assert.equal(isCurrentFulfillmentQuickAdd({ vendorId: "vendor-1", fulfillmentQuickAdd: fulfillmentQuickAddBinding(context) }, context), true); });
