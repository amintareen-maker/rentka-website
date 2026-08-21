import assert from "node:assert/strict";
import test from "node:test";
import { parseTestLeadResponse } from "../src/lib/normal-rental/test-lead-response.ts";

test("accepts a successful JSON response", () => {
  const result = parseTestLeadResponse(JSON.stringify({
    ok: true, leadId: "RK-LHR-1125", reviewLink: "https://example.test/review",
    inventory: {}, dailyRentalRate: 10000, estimatedRentalAmount: 20000,
  }), true, 200);
  assert.equal(result.leadId, "RK-LHR-1125");
});

test("preserves a controlled server error", () => {
  assert.throws(() => parseTestLeadResponse('{"ok":false,"error":"Inventory unavailable"}', false, 409), /Inventory unavailable/);
});

test("warns against resubmitting after an empty response", () => {
  assert.throws(() => parseTestLeadResponse("", false, 500), /check Firestore before resubmitting/i);
});

test("warns against resubmitting after a non-JSON response", () => {
  assert.throws(() => parseTestLeadResponse("Internal Server Error", false, 500), /non-JSON response.*check Firestore before resubmitting/i);
});
