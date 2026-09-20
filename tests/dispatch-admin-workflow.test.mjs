import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  deriveAdminDispatchWorkflow,
  splitCurrentSupplierOffers,
} from "../src/lib/dispatch/admin-workflow-core.ts";

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const offer = (patch = {}) => ({
  id: "offer-1",
  bookingOperationalId: "booking-1",
  bookingId: "RK-WORKFLOW",
  candidateId: "candidate-1",
  approvedPayoutMinor: 350000,
  offerStage: "prepared",
  responseStatus: "not_recorded",
  createdAt: "now",
  updatedAt: "now",
  createdBy: { type: "shared_admin_session" },
  updatedBy: { type: "shared_admin_session" },
  offerRevision: 1,
  broadcastId: "broadcast-1",
  recipientType: "vendor",
  ...patch,
});
const flow = patch => deriveAdminDispatchWorkflow({
  lifecycle: "active",
  readinessStatus: "ready_for_dispatch",
  assigned: false,
  matchesOpen: false,
  offers: [],
  assignmentReady: false,
  ...patch,
});

test("01 current workflow stage derives booking readiness", () => assert.equal(flow({ readinessStatus: "awaiting_advance" }).currentStage, "readiness"));
test("02 only the current stage is marked current", () => assert.equal(flow({}).stages.filter(item => item.state === "current").length, 1));
test("03 completed stages expose compact summaries", () => assert.equal(flow({ matchesOpen: true }).stages[0].summary, "Booking ready for dispatch"));
test("04 future stages remain future until relevant", () => assert.equal(flow({}).stages.find(item => item.id === "assignment").state, "future"));
test("05 supplier responses contain only actually offered records", () => assert.deepEqual(flow({ offers: [offer()] }).currentOffers.map(item => item.id), ["offer-1"]));
test("06 accepted declined and countered states drive clear stages", () => {
  assert.equal(flow({ offers: [offer({ responseStatus: "countered" })] }).nextAction, "Review Supplier Counter");
  assert.equal(flow({ offers: [offer({ responseStatus: "declined" })] }).dispatchState, "Waiting for supplier response");
  assert.equal(flow({ offers: [offer({ responseStatus: "accepted" })] }).currentStage, "fulfillment");
});
test("07 current response is separated from historical revision", () => {
  const result = splitCurrentSupplierOffers([offer(), offer({ id: "offer-2", offerRevision: 2, broadcastId: "broadcast-2" })], "broadcast-2");
  assert.deepEqual(result.current.map(item => item.id), ["offer-2"]);
  assert.deepEqual(result.historical.map(item => item.id), ["offer-1"]);
});
test("08 counter actions are actionable only on current counter", () => {
  const result = flow({ offers: [offer({ responseStatus: "countered" })] });
  assert.equal(result.currentStage, "responses");
  assert.equal(result.historicalOffers.length, 0);
});
test("09 vendor fulfillment follows accepted vendor offer", () => assert.equal(flow({ offers: [offer({ responseStatus: "accepted" })] }).currentStage, "fulfillment"));
test("10 owner-driver skips vendor fulfillment", () => {
  const result = flow({ offers: [offer({ responseStatus: "accepted", recipientType: "independent_driver" })], assignmentReady: true });
  assert.equal(result.currentStage, "assignment");
  assert.equal(result.stages.find(item => item.id === "fulfillment").state, "skipped");
});
test("11 final assignment appears only when valid", () => {
  const accepted = offer({ responseStatus: "accepted", recipientType: "independent_driver" });
  assert.notEqual(flow({ offers: [accepted], assignmentReady: false }).currentStage, "assignment");
  assert.equal(flow({ offers: [accepted], assignmentReady: true }).currentStage, "assignment");
});
test("12 assigned booking moves to notification stage", () => assert.equal(flow({ assigned: true }).currentStage, "notifications"));
test("13 Find Matches URL preserves the open booking", () => {
  const page = source("app/admin/dispatch/page.tsx");
  assert.ok(page.includes('params.set("open", id)'));
  assert.ok(page.includes('params.set("matches", id)'));
  assert.ok(page.includes('#booking-${id}'));
});
test("14 action refresh preserves booking focus", () => assert.ok(source("app/admin/dispatch/BookingWorkflow.tsx").includes("scrollIntoView")));
test("15 pending controls prevent duplicate action submission", () => assert.ok(source("app/admin/dispatch/InlineActionForm.tsx").includes("disabled={pending}")));
test("16 historical dispatch functionality remains rendered", () => assert.ok(source("app/admin/dispatch/page.tsx").includes("View offer history")));
test("17 payment controls remain available", () => assert.ok(source("app/admin/dispatch/page.tsx").includes("Record Payment")));
test("18 payout controls remain available", () => assert.ok(source("app/admin/dispatch/page.tsx").includes("Review Vendor Payout")));
test("19 manual fallback remains available", () => assert.ok(source("app/admin/dispatch/VendorSecureOfferControls.tsx").includes("Open WhatsApp")));
test("20 audit history remains collapsed", () => assert.match(source("app/admin/dispatch/page.tsx"), /Audit history/));
test("21 vendor-first privacy remains in the secure projection", () => assert.ok(source("src/lib/dispatch/vendor-offer-portal-core.ts").includes("item.vendor.id===vendor.id")));
test("22 owner-driver flow remains explicit", () => assert.ok(source("src/lib/dispatch/supply-recipient-projection.ts").includes("independent_owner_driver")));
test("23 presentation rendering invokes no WhatsApp provider", () => {
  const files = ["src/lib/dispatch/admin-workflow-core.ts", "app/admin/dispatch/BookingWorkflow.tsx"].map(source).join("\n");
  assert.equal(files.includes("invokeDriverOfferProvider"), false);
});
test("24 presentation rendering performs no Firebase mutation", () => {
  const files = ["src/lib/dispatch/admin-workflow-core.ts", "app/admin/dispatch/BookingWorkflow.tsx"].map(source).join("\n");
  for (const marker of ["getAdminDb", "runTransaction", "tx.update", "tx.create"]) assert.equal(files.includes(marker), false);
});
