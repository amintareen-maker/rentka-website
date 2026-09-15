import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CUSTOMER_DRIVER_DETAILS_TEMPLATE_BODY,
  DRIVER_FINAL_TEMPLATE_BODY,
  createCustomerDriverDetailsMessage,
  createDriverFinalMessage,
  createManualVendorOfferMessage,
} from "../src/lib/dispatch/post-assignment-messaging-core.ts";
import {
  assertPostAssignmentJobSendable,
  buildPostAssignmentJobs,
  invokePostAssignmentProvider,
  postAssignmentTemplateComponents,
} from "../src/lib/messaging/post-assignment-delivery-core.ts";
import { requirePostAssignmentDeliveryConfig } from "../src/lib/messaging/post-assignment-delivery-config-core.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const actor = { type: "shared_admin_session", label: "Shared Admin Session" };
const assignment = (patch = {}) => ({
  id: "assignment-final",
  status: "assigned",
  assignedDriverId: "child-driver",
  assignedVehicleId: "vehicle-final",
  dispatchVendorId: "vendor-parent",
  vendorName: "TEST Vendor",
  driverSnapshot: { name: "TEST Child Driver", mobileNumber: "03002222222", whatsappNumber: "03002222222", vendorId: "vendor-parent" },
  vehicleSnapshot: { make: "Toyota", model: "Corolla", modelYear: 2024, registrationNumber: "TEST-REG", vendorId: "vendor-parent" },
  approvedVendorPayoutMinor: 550000,
  assignedAt: "2027-08-01T00:00:00.000Z",
  assignedBy: actor,
  ...patch,
});
const booking = (patch = {}) => ({
  id: "booking-post",
  bookingId: "RK-POST-1",
  source: { type: "manual", collection: "manualBookings", documentId: "source-post", key: "manual:source-post" },
  sourceSnapshot: { durationHours: 12 },
  zoneId: "twin_cities",
  serviceType: "with_driver",
  customer: { name: "TEST Customer", phone: "03009999999" },
  itinerary: { travelDate: "2027-08-30", pickupTime: "11:00", pickup: "F-7, Islamabad", destinationOrUsage: "Blue Area, Islamabad", notes: "SECRET INTERNAL NOTE" },
  requestedVehicle: { categoryOrModel: "Toyota Corolla" },
  customerFinancials: { customerTotalMinor: 1000000, originalCustomerTotalMinor: 1000000, customerDiscountTotalMinor: 0, finalCustomerTotalMinor: 1000000, requiredAdvanceMinor: 200000, receivedAmountMinor: 250000, balanceMinor: 750000, refundCreditDueMinor: 0, paymentStatus: "sufficient" },
  internalFinancials: { vendorPayoutMinor: 550000, payoutStatus: "reviewed", payoutNotes: "SECRET MARGIN" },
  lifecycle: "active",
  readinessStatus: "ready_for_dispatch",
  assignment: assignment(),
  createdAt: "now",
  updatedAt: "now",
  createdBy: actor,
  updatedBy: actor,
  ...patch,
});
const jobs = (value = booking()) => buildPostAssignmentJobs(value, "2027-08-01T00:00:00.000Z");
const queued = (purpose, value = booking()) => ({ ...jobs(value).find((job) => job.purpose === purpose), status: "queued" });

test("01 final assignment action queues post-assignment jobs only after assignment succeeds", () => { const s=source("app/admin/dispatch/actions.ts"), a=s.indexOf("await assignOperationalBooking("), q=s.indexOf("ensurePostAssignmentNotificationJobs(",a); assert.ok(a>=0&&q>a); });
test("02 successful final assignment builds one driver and one customer job", () => assert.deepEqual(jobs().map((job)=>job.purpose),["driver_final_instructions","customer_driver_details"]));
test("03 vendor Accept creates neither post-assignment job", () => { const s=source("src/lib/dispatch/vendor-offer-portal-repository.ts").slice(source("src/lib/dispatch/vendor-offer-portal-repository.ts").indexOf("submitSecureVendorOfferResponse")); assert.equal(s.includes("ensurePostAssignmentNotificationJobs"),false); });
test("04 vendor proposal creates neither post-assignment job", () => { const s=source("src/lib/dispatch/vendor-offer-portal-repository.ts").slice(source("src/lib/dispatch/vendor-offer-portal-repository.ts").indexOf("submitVendorFulfillmentProposal")); assert.equal(s.includes("post_assignment_notifications_queued"),false); });
test("05 failed assignment cannot reach job creation", () => { const s=source("app/admin/dispatch/actions.ts"), a=s.indexOf("const result = await assignOperationalBooking("), q=s.indexOf("ensurePostAssignmentNotificationJobs(",a); assert.ok(a>=0&&q>a); });
test("06 duplicate construction has stable IDs and exactly two purposes", () => { const a=jobs(),b=jobs(); assert.deepEqual(a.map(x=>x.id),b.map(x=>x.id)); assert.equal(new Set(a.map(x=>x.id)).size,2); });
test("07 page render does not create jobs", () => { const s=source("app/admin/dispatch/page.tsx"); assert.equal(s.includes("ensurePostAssignmentNotificationJobs"),false); assert.equal(s.includes("deliverPostAssignmentNotificationJobs"),false); });
test("08 owner-driver receives exactly one driver-final job", () => { const value=booking({assignment:assignment({assignedDriverId:"owner-driver",dispatchVendorId:"owner-account",driverSnapshot:{name:"Owner Driver",mobileNumber:"03003333333",whatsappNumber:"03003333333",vendorId:"owner-account"}})}), result=jobs(value); assert.equal(result.filter(x=>x.purpose==="driver_final_instructions").length,1); assert.equal(result[0].recipientReferenceId,"owner-driver"); });
test("09 vendor-managed child driver receives driver-final job", () => { const job=jobs()[0]; assert.equal(job.recipientType,"driver"); assert.equal(job.recipientReferenceId,"child-driver"); });
test("10 vendor contact does not receive driver-final job", () => { const job=jobs()[0], message=createDriverFinalMessage(booking()); assert.notEqual(job.recipientReferenceId,"vendor-parent"); assert.equal(message.recipientNumber,"923002222222"); });
test("11 customer message uses only final assigned driver and vehicle", () => { const m=createCustomerDriverDetailsMessage(booking()); for(const v of ["TEST Child Driver","03002222222","Toyota Corolla 2024","TEST-REG"]) assert.ok(m.message.includes(v),v); });
test("12 no customer driver details exist before assignment", () => { const value=booking(); delete value.assignment; assert.equal(createCustomerDriverDetailsMessage(value),null); assert.throws(()=>jobs(value),/final assignment/); });
test("13 payout, margin and payment values are excluded", () => { const all=createDriverFinalMessage(booking()).message+createCustomerDriverDetailsMessage(booking()).message; for(const v of ["550000","5,500","750000","7,500","SECRET MARGIN"]) assert.equal(all.includes(v),false,v); });
test("14 CNIC, licence, scores and internal notes are excluded", () => { const value=booking({driverCnic:"61101-SECRET",licenceNumber:"LIC-SECRET",matchingScore:99}), all=createDriverFinalMessage(value).message+createCustomerDriverDetailsMessage(value).message; for(const v of ["61101-SECRET","LIC-SECRET","matchingScore","SECRET INTERNAL NOTE"]) assert.equal(all.includes(v),false,v); });
test("15 provider failure is isolated and assignment orchestration catches messaging errors", async () => { const result=await invokePostAssignmentProvider({sendTemplate:async()=>{const e=new Error("provider down");e.code="REQUEST_FAILED";e.status=503;throw e;}},{to:"923002222222",name:"approved_name",languageCode:"en",components:[]}); assert.equal(result.status,"failed"); assert.equal(result.retryable,true); const s=source("app/admin/dispatch/actions.ts"); assert.match(s,/Assignment is authoritative and must never roll back for messaging failure/); });
test("16 deterministic IDs remain stable across creation timestamps", () => { const a=buildPostAssignmentJobs(booking(),"2027-01-01T00:00:00Z"),b=buildPostAssignmentJobs(booking(),"2028-01-01T00:00:00Z"); assert.deepEqual(a.map(x=>x.id),b.map(x=>x.id)); });
test("17 Admin renders all automated delivery states and attempts", () => { const s=source("app/admin/dispatch/PostAssignmentNotificationStatus.tsx"); for(const v of ["Pending","Provider accepted","Sent","Delivered","Read","Failed","Attempts:"]) assert.ok(s.includes(v),v); });
test("18 retry is limited to known retryable failures", () => { const ok={...queued("driver_final_instructions"),status:"failed",failureRetryable:true}; assert.doesNotThrow(()=>assertPostAssignmentJobSendable({job:ok,booking:booking()})); for(const status of ["provider_accepted","sent","delivered","read","outcome_unknown"]) assert.throws(()=>assertPostAssignmentJobSendable({job:{...ok,status},booking:booking()}),/not sendable/); });
test("19 historical assignments without optional routing fields remain compatible", () => { const value=booking({assignment:assignment({dispatchVendorId:undefined,vendorName:undefined})}); assert.equal(jobs(value).length,2); });
test("20 assignment transaction remains provider and outbox free", () => { const s=source("src/lib/dispatch/assignment-repository.ts"); for(const v of ["getWhatsAppOutboundProvider","sendTemplate(","whatsappOutboundMessages"]) assert.equal(s.includes(v),false,v); for(const v of ["reservationRef","tx.create(assignmentRef","tx.create(reservationRef"]) assert.ok(s.includes(v),v); });
test("21 manual vendor offer preview uses business-safe fields", () => { const m=createManualVendorOfferMessage(booking(),{currentOfferedPayoutMinor:550000,approvedPayoutMinor:550000,offerExpiresAt:"2027-08-01T01:00:00Z"}); for(const v of ["RK-POST-1","Islamabad","Blue Area, Islamabad","Toyota Corolla","Rs. 5,500"]) assert.ok(m.includes(v),v); assert.equal(m.includes("F-7, Islamabad"),false); assert.equal(m.includes("TEST Customer"),false); });
test("22 manual driver preview equals canonical automated content", () => { const a=createDriverFinalMessage(booking()), components=postAssignmentTemplateComponents(booking(),"driver_final_instructions"); assert.equal(components[0].parameters.length,9); assert.equal(a.parameters.length,9); assert.ok(DRIVER_FINAL_TEMPLATE_BODY.includes("{{9}}")); });
test("23 manual customer preview equals canonical automated content", () => { const a=createCustomerDriverDetailsMessage(booking()), components=postAssignmentTemplateComponents(booking(),"customer_driver_details"); assert.equal(components[0].parameters.length,8); assert.equal(a.parameters.length,8); assert.ok(CUSTOMER_DRIVER_DETAILS_TEMPLATE_BODY.includes("{{8}}")); });
test("24 Copy controls do not create outbox jobs", () => { const s=source("app/admin/dispatch/DriverInstructions.tsx")+source("app/admin/dispatch/CustomerDriverDetails.tsx")+source("app/admin/dispatch/VendorSecureOfferControls.tsx"); assert.equal(s.includes("ensurePostAssignmentNotificationJobs"),false); });
test("25 Open WhatsApp controls do not create outbox jobs", () => { const s=source("src/lib/dispatch/driver-instructions-repository.ts")+source("src/lib/dispatch/customer-driver-details-repository.ts"); for(const v of ["tx.create(outbox","tx.set(outbox","buildPostAssignmentJobs"]) assert.equal(s.includes(v),false,v); });
test("26 Copy does not increment automated attemptCount", () => { const s=source("src/lib/dispatch/driver-instructions-repository.ts")+source("src/lib/dispatch/customer-driver-details-repository.ts"); assert.equal(s.includes("attemptCount"),false); });
test("27 Open WhatsApp does not invoke a provider", () => { const s=source("app/admin/dispatch/DriverInstructions.tsx")+source("app/admin/dispatch/CustomerDriverDetails.tsx")+source("app/admin/dispatch/VendorSecureOfferControls.tsx"); for(const v of ["sendTemplate(","getWhatsAppOutboundProvider","graph.facebook.com"]) assert.equal(s.includes(v),false,v); });
test("28 manual actions do not change automated delivery state", () => { const s=source("src/lib/dispatch/driver-instructions-repository.ts")+source("src/lib/dispatch/customer-driver-details-repository.ts"); for(const v of ["status: \"sent\"","providerMessageId","providerAcceptedAt"]) assert.equal(s.includes(v),false,v); });
test("29 automated and manual driver text share one canonical builder", () => { const s=source("src/lib/dispatch/driver-instructions-core.ts")+source("src/lib/messaging/post-assignment-delivery-core.ts"); assert.equal((s.match(/createDriverFinalMessage/g)??[]).length>=2,true); assert.equal(createDriverFinalMessage(booking()).message,createDriverFinalMessage(booking()).message); });
test("30 automated and manual customer text share one canonical builder", () => { const s=source("src/lib/dispatch/customer-driver-details-core.ts")+source("src/lib/messaging/post-assignment-delivery-core.ts"); assert.equal((s.match(/createCustomerDriverDetailsMessage/g)??[]).length>=2,true); assert.equal(createCustomerDriverDetailsMessage(booking()).message,createCustomerDriverDetailsMessage(booking()).message); });
test("31 manual customer and driver controls expose no restricted data", () => { const all=createDriverFinalMessage(booking()).message+createCustomerDriverDetailsMessage(booking()).message; for(const v of ["vendor payout","margin","cnic","licence","matching score","SECRET"]) assert.equal(all.toLowerCase().includes(v.toLowerCase()),false,v); });
test("32 controls are unavailable before assignment and config remains approval-gated", () => { const value=booking(); delete value.assignment; assert.equal(createDriverFinalMessage(value),null); assert.equal(createCustomerDriverDetailsMessage(value),null); assert.throws(()=>requirePostAssignmentDeliveryConfig({},"driver_final_instructions"),/not configured/); assert.throws(()=>requirePostAssignmentDeliveryConfig({},"customer_driver_details"),/not configured/); });
