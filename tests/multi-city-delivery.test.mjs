import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness() {
  const lead = { leadId: "RK-ISL-21", city: "Islamabad", name: "Test", phone: "03021234567", carName: "Corolla", inventoryId: "raw-car", vendorId: "private-vendor", vendorName: "Private", dailyRentalRate: 5000, estimatedRentalAmount: 10000, numberOfDays: 2, pricingType: "withinCity", duration: "daily", source: "website", pickupAddress: "Pickup", pickupDate: "2026-10-04", preferredTime: "12:00" };
  const calls = [];
  let failSheet = false;
  let release;
  let waitForEmail = false;
  const snapshot = () => ({ exists: true, data: () => structuredClone(lead) });
  const ref = { get: async () => snapshot() };
  let transactionQueue = Promise.resolve();
  const db = { collection: () => ({ doc: () => ref }), runTransaction: (action) => {
    const result = transactionQueue.then(() => action({ get: async () => snapshot(), update: (_, data) => { for (const [key, value] of Object.entries(data)) { const [, destination] = key.split("."); (lead.publicBookingDelivery ??= {})[destination] = value; } } }));
    transactionQueue = result.catch(() => {});
    return result;
  } };
  const mocks = { "server-only": {}, "../firebaseAdmin": { getAdminDb: () => db }, "../dispatch/automatic-intake": { attemptAutomaticOperationalIntake: async (...args) => { calls.push({ dispatch: args }); return { id: "operational" }; } } };
  const module = { exports: {} };
  const source = readFileSync(new URL("../src/lib/normal-rental/public-lead-delivery.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, require: id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), URL, AbortSignal, Date,
    fetch: async (url, init) => { calls.push({ path: url.pathname, payload: JSON.parse(init.body) }); if (waitForEmail && url.pathname === "/api/lead-booking") await new Promise(resolve => { release = resolve; }); return { ok: !(failSheet && url.pathname === "/api/lead-sheet"), status: 503, json: async () => ({ success: true, sheetStatus: "inserted" }) }; },
  });
  return { lead, calls, deliver: (...args) => module.exports.deliverPublicNormalRentalLead(...args), failSheet: () => { failSheet = true; }, allowSheet: () => { failSheet = false; }, delayEmail: () => { waitForEmail = true; }, releaseEmail: () => release(), emailPending: () => Boolean(release) };
}
const args = ["twin_cities_normal", "persisted-doc", "https://www.rentka.co/api/normal-rental-lead"];
test("public delivery uses saved ownership, prices and tracked endpoints for both zones", async () => {
  for (const source of ["twin_cities_normal", "lahore_normal"]) {
    const h = harness();
    assert.deepEqual(Array.from(await h.deliver(source, ...args.slice(1))), []);
    assert.equal(h.calls.find(call => call.path === "/api/lead-booking").payload.vendorId, "private-vendor");
    assert.equal(h.calls.find(call => call.path === "/api/lead-sheet").payload.estimatedRentalAmount, 10000);
    assert.deepEqual(h.calls.find(call => call.dispatch).dispatch, [source, "persisted-doc"]);
  }
});
test("completed deliveries are skipped on a repeated persisted request", async () => {
  const h = harness();
  await h.deliver(...args); await h.deliver(...args);
  assert.equal(h.calls.length, 3);
});
test("replay retries only a failed destination", async () => {
  const h = harness(); h.failSheet();
  assert.deepEqual(Array.from(await h.deliver(...args)), ["Google Sheets failed"]);
  h.allowSheet();
  assert.deepEqual(Array.from(await h.deliver(...args)), []);
  assert.equal(h.calls.filter(call => call.path === "/api/lead-sheet").length, 2);
  assert.equal(h.calls.filter(call => call.path === "/api/lead-booking").length, 1);
  assert.equal(h.calls.filter(call => call.dispatch).length, 1);
});
test("an overlapping replay cannot claim an email already processing", async () => {
  const h = harness(); h.delayEmail();
  const first = h.deliver(...args);
  while (!h.emailPending()) await new Promise(resolve => setTimeout(resolve, 1));
  assert.ok(Array.from(await h.deliver(...args)).includes("email is still processing"));
  h.releaseEmail(); await first;
  assert.equal(h.calls.filter(call => call.path === "/api/lead-booking").length, 1);
});
test("private preview leads cause no public delivery", async () => {
  const h = harness(); h.lead.adminPrivateTest = true;
  assert.deepEqual(Array.from(await h.deliver(...args)), []);
  assert.equal(h.calls.length, 0);
});
