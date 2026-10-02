import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import { runBookingDelivery } from "../src/lib/booking-delivery/core.ts";
import { adaptBookingDelivery, googleSheetPayload } from "../src/lib/booking-delivery/adapters.ts";
import { adaptSource } from "../src/lib/dispatch/booking-adapters.ts";
import { getNormalRentalBookingContext, normalRentalZoneForCity, NORMAL_RENTAL_ZONES, resolveNormalRentalLeadCode } from "../src/lib/normal-rental/zones.ts";
const require = createRequire(import.meta.url);
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function load(file, mocks, globals = {}) {
  const loaded = { exports: {} };
  vm.runInNewContext(ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module: loaded, exports: loaded.exports, require: id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), console: { info() {}, error() {} }, URL, Request, Response, AbortSignal, Date, ...globals });
  return loaded.exports;
}
function harness(city = "islamabad") {
  const zone = normalRentalZoneForCity(city);
  const records = new Map([["meta/counters", { leadCounter: 40 }]]), calls = { email: 0, googleSheet: 0, dispatch: 0 }, payloads = {};
  let queue = Promise.resolve(), sequence = 0, failSheet = false, failPreparation = false, release, emailPending = false;
  const snapshot = key => ({ exists: records.has(key), data: () => records.get(key) });
  function merge(previous, next) { const result = { ...previous }; for (const [key, value] of Object.entries(next)) result[key] = value && typeof value === "object" && !value.toDate && !Array.isArray(value) ? merge(previous?.[key] ?? {}, value) : value; return result; }
  const ref = (collection, id) => ({ id, key: `${collection}/${id}`, get: async () => snapshot(`${collection}/${id}`), set: async (data, options) => records.set(`${collection}/${id}`, options?.merge ? merge(records.get(`${collection}/${id}`) ?? {}, data) : data) });
  const db = { collection: name => ({ doc: (id = `auto-${++sequence}`) => ref(name, id) }), runTransaction: action => {
    const result = queue.then(() => action({ get: async r => snapshot(r.key), set: (r, data, options) => records.set(r.key, options?.merge ? merge(records.get(r.key) ?? {}, data) : data), update: (r, data) => records.set(r.key, { ...records.get(r.key), ...data }), create: (r, data) => { assert.ok(!records.has(r.key)); records.set(r.key, data); } }));
    queue = result.catch(() => {}); return result;
  } };
  const FieldValue = { serverTimestamp: () => { const value = new Date(); return { toDate: () => value }; } };
  const store = load("src/lib/booking-delivery/store.ts", { "server-only": {}, "firebase-admin/firestore": { FieldValue }, "../firebaseAdmin": { getAdminDb: () => db } });
  const service = load("src/lib/booking-delivery/service.ts", {
    "server-only": {}, "../firebaseAdmin": { getAdminDb: () => db }, "../dispatch/booking-adapters": { sourceCollection: () => "leads" },
    "../dispatch/booking-repository": { normalizeExistingSource: async (source, id) => { calls.dispatch++; payloads.dispatch = adaptSource(source, id, records.get(`leads/${id}`)); return { id: `operational-${id}` }; } },
    "../airport/notification": {}, "../ta-connections/booking": {}, "./adapters": { adaptBookingDelivery, googleSheetPayload },
  }, { fetch: async (url, init) => { const destination = url.pathname === "/api/lead-sheet" ? "googleSheet" : "email"; calls[destination]++; payloads[destination] = JSON.parse(init.body); if (destination === "email" && emailPending) await new Promise(resolve => { release = resolve; }); return { ok: !(destination === "googleSheet" && failSheet), status: 503, json: async () => ({ success: true, sheetStatus: "inserted" }) }; } });
  const orchestrator = load("src/lib/booking-delivery/orchestrator.ts", { "server-only": {}, "./core": { runBookingDelivery }, "./service": { ...service, loadBookingDelivery: async (...args) => { if (failPreparation) { failPreparation = false; throw new Error("response interrupted after persistence"); } return service.loadBookingDelivery(...args); } }, "./store": store });
  const item = { inventoryId: "raw-inventory", modelName: "Toyota Corolla", vendorId: "private-vendor", vendorName: "PRIVATE SUPPLIER", modelYear: 2025, zoneId: zone, cityId: city, source: zone === "lahore" ? "operations" : "legacy", pricing: { withDriver: { withinCity: { daily: 5000 }, outsideCity: { daily: 6000 } } } };
  const opaque = createHash("sha256").update(`rentka-${zone}:raw-inventory`).digest("base64url").slice(0, 24);
  const core = load("src/lib/normal-rental/lahore-lead.ts", {
    "firebase-admin/firestore": { FieldValue }, "next/server": { NextResponse: { json: (body, init) => new Response(JSON.stringify(body), { status: init?.status ?? 200 }) } },
    "@/lib/firebaseAdmin": { getAdminDb: () => db }, "@/lib/normal-rental/inventory-resolver": { resolveNormalRentalInventory: async () => [item] },
    "@/lib/normal-rental/inventory-core": { normalRentalPublicLabel: item => item.modelName }, "@/lib/normal-rental/zones": { getNormalRentalBookingContext, normalRentalZoneForCity, NORMAL_RENTAL_ZONES, resolveNormalRentalLeadCode },
    "@/lib/normal-rental/place-validation": { isValidPakistanPlace: () => true }, "@/lib/normal-rental/public-inventory": { publicNormalRentalOptionId: () => opaque },
    "@/lib/booking-delivery/orchestrator": orchestrator, "@/lib/dispatch/automatic-intake": { attemptAutomaticOperationalIntake: async () => { throw new Error("Public path must not call intake separately"); } },
  });
  const body = { cityId: city, zoneId: zone, inventoryId: opaque, pricingType: "withinCity", duration: "daily", pickupDate: "2026-10-05", preferredTime: "12:00", pickupAddress: "Pickup in Pakistan", pickupPlaceId: "place", pickupLatitude: 31.5, pickupLongitude: 74.3, customerName: "Test", phone: "03021234567", numberOfDays: 2, submissionKey: "12345678-1234-1234-1234-123456789abc" };
  return { calls, records, payloads, source: zone === "lahore" ? "lahore_normal" : "twin_cities_normal", submit: async () => { const response = await core.createLahoreLead(new Request("https://www.rentka.co/api/normal-rental-lead", { method: "POST", body: JSON.stringify(body) }), "rent_a_car_lahore"); assert.equal(response.status, 200); return response.json(); }, replay: async requested => { const id = [...records.keys()].find(key => key.startsWith("leads/")).slice(6); return orchestrator.orchestrateBookingDelivery(zone === "lahore" ? "lahore_normal" : "twin_cities_normal", id, "https://www.rentka.co", requested); }, failSheet: () => { failSheet = true; }, allowSheet: () => { failSheet = false; }, interrupt: () => { failPreparation = true; }, delayEmail: () => { emailPending = true; }, emailPending: () => Boolean(release), releaseEmail: () => release() };
}
for (const city of ["islamabad", "rawalpindi", "lahore"]) {
  test(`${city}: initial success, identical request and replay deliver each destination once`, async () => {
    const h = harness(city), first = await h.submit(), repeated = await h.submit(); await h.replay();
    assert.equal(first.leadId, repeated.leadId); assert.equal(h.records.get("meta/counters").leadCounter, 41);
    assert.deepEqual(h.calls, { email: 1, googleSheet: 1, dispatch: 1 });
    assert.doesNotMatch(JSON.stringify(first), /vendor|PRIVATE/);
    assert.equal(h.payloads.email.vendorId, "private-vendor"); assert.equal(h.payloads.googleSheet.vendorId, "private-vendor");
    assert.equal(h.payloads.googleSheet.packageDuration, "daily"); assert.equal(h.payloads.googleSheet.dailyRentalRate, 5000); assert.equal(h.payloads.googleSheet.estimatedRentalAmount, 10000);
    assert.equal(h.payloads.dispatch.zoneId, normalRentalZoneForCity(city));
    const saved = [...h.records].find(([key]) => key.startsWith("leads/"))[1]; assert.equal(saved.vendorId, "private-vendor");
    const delivery = [...h.records].find(([key]) => key.startsWith("bookingDeliveries/"))[1]; assert.equal(delivery.destinations.whatsapp.status, "customer_handoff");
  });
}
test("partial failure then destination replay retries only Sheets; successful email and dispatch are skipped", async () => {
  const h = harness(); h.failSheet(); const first = await h.submit(); assert.ok(first.integrationWarnings.includes("googleSheet failed"));
  h.allowSheet(); await h.replay(["googleSheet"]); await h.submit(); await h.replay();
  assert.deepEqual(h.calls, { email: 1, googleSheet: 2, dispatch: 1 });
});
test("interruption after saving a lead can recover delivery using the same persisted request", async () => {
  const h = harness(); h.interrupt(); const first = await h.submit(); assert.ok(first.integrationWarnings.length); assert.equal(h.calls.email, 0);
  const recovered = await h.submit(); assert.equal(recovered.leadId, first.leadId); assert.deepEqual(h.calls, { email: 1, googleSheet: 1, dispatch: 1 });
});
test("concurrent identical request cannot re-send an email claimed by the first request", async () => {
  const h = harness(); h.delayEmail(); const first = h.submit();
  while (!h.emailPending()) await new Promise(resolve => setTimeout(resolve, 1));
  const repeated = await h.submit(); assert.ok(repeated.integrationWarnings.includes("email processing"));
  h.releaseEmail(); await first; await h.replay(); assert.deepEqual(h.calls, { email: 1, googleSheet: 1, dispatch: 1 });
});
test("only the centralized public path remains; public client performs no second server fan-out", () => {
  assert.equal(existsSync(new URL("../src/lib/normal-rental/public-lead-delivery.ts", import.meta.url)), false);
  const core = read("src/lib/normal-rental/lahore-lead.ts"); assert.match(core, /orchestrateBookingDelivery\(deliverySource, leadRef\.id/); assert.doesNotMatch(core, /fetch\(|publicBookingDelivery/);
  assert.match(read("src/components/lahore/LahoreBookingClient.tsx"), /if \(prelaunch\) return;/);
});

test("historical Twin Cities leads retain raw car references and are compatible with centralized delivery", async () => {
  const h = harness("rawalpindi");
  h.records.set("leads/historical", { leadId: "RK-RAW-10", carId: "historical-car", vendorId: "private-vendor", vendorName: "PRIVATE SUPPLIER", carName: "Toyota Corolla", city: "Rawalpindi", name: "Legacy", phone: "03001234567", price: 7500, source: "website", pricingType: "withinCity", duration: "daily", pickupAddress: "Pickup", pickupDate: "2026-10-05", preferredTime: "12:00" });
  await h.replay(); await h.replay();
  assert.deepEqual(h.calls, { email: 1, googleSheet: 1, dispatch: 1 });
  assert.equal(h.payloads.email.carId, "historical-car");
  assert.equal(h.payloads.googleSheet.dailyRentalRate, 7500);
  assert.equal(h.payloads.dispatch.zoneId, "twin_cities");
});
