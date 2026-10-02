import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { normalizeNormalRentalInventory, normalRentalModelHref, normalRentalStartingPrice, groupNormalRentalInventoryCards } from "../src/lib/normal-rental/inventory-core.ts";
import { normalRentalZoneForCity, PUBLIC_NORMAL_RENTAL_ZONES } from "../src/lib/normal-rental/zones.ts";
import { adaptSource } from "../src/lib/dispatch/booking-adapters.ts";
import { formatLahoreWhatsAppVehicleLines } from "../src/lib/normal-rental/lead-output.ts";

const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function load(file, mocks) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), console, URL, Response, Request }, { filename: file });
  return loaded.exports;
}
const rate = (daily) => ({ withDriver: { withinCity: { daily, weekly: daily * 6 }, outsideCity: { daily: daily + 1000 } } });
const model = { id: "corolla", data: { model: "Toyota Corolla", imageURL: "https://example.com/car.png", active: false } };
const vendor = { id: "vendor", data: { name: "PRIVATE SUPPLIER", zoneId: "lahore", active: true } };
const option = { id: "inventory", data: { zoneId: "lahore", active: true, vendorId: "vendor", modelSourceCarId: "corolla", modelKey: "toyota-corolla", pricing: rate(7000) } };
const lahore = (options = [option], vendors = [vendor]) => normalizeNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", legacyCars: [model], legacyVendors: [], operationsInventory: options, operationsVendors: vendors });
const twin = (carPatch = {}, vendorPatch = {}, cityId = "islamabad") => normalizeNormalRentalInventory({ zoneId: "twin_cities", cityId, legacyCars: [{ id: "legacy-car", data: { model: "Toyota Corolla", cityList: ["rawalpindi"], vendorId: "legacy-vendor", active: true, pricing: rate(5000), ...carPatch } }], legacyVendors: [{ id: "legacy-vendor", data: { name: "PRIVATE TWIN SUPPLIER", ...vendorPatch } }], operationsInventory: [], operationsVendors: [] });
let resolved = [];
const publicApi = load("src/lib/normal-rental/public-inventory.ts", {
  "server-only": {}, "./inventory-resolver": { resolveNormalRentalInventory: async () => resolved },
  "./public-models": {}, "../seo": { isValidVehicleRoute: (slug, city, service) => slug === "toyota-corolla" && ["islamabad", "rawalpindi"].includes(city) && service === "with-driver" },
});

test("configured selector includes both active zones and resolves each city safely", () => {
  assert.deepEqual(PUBLIC_NORMAL_RENTAL_ZONES.map((zone) => zone.defaultCityId), ["islamabad", "lahore"]);
  assert.equal(normalRentalZoneForCity("rawalpindi"), "twin_cities");
  assert.equal(normalRentalZoneForCity("lahore"), "lahore");
  assert.equal(normalRentalZoneForCity("karachi"), undefined);
});
test("homepage and Lahore projection have identical eligible models and rates, updated from admin data", async () => {
  for (const options of [[option], [{ ...option, data: { ...option.data, pricing: rate(8200) } }], [{ ...option, data: { ...option.data, active: false } }]]) {
    resolved = lahore(options);
    assert.equal(JSON.stringify(await publicApi.getPublicNormalRentalInventory("lahore", "lahore")), JSON.stringify(publicApi.toPublicLahoreInventory(resolved)));
  }
  assert.equal(lahore()[0].pricing.withDriver.withinCity.daily, 7000);
  assert.equal(lahore([{ ...option, data: { ...option.data, active: false } }]).length, 0);
  assert.equal(lahore([option], [{ ...vendor, data: { ...vendor.data, active: false } }]).length, 0);
  assert.equal(lahore([option], []).length, 0);
  assert.equal(lahore()[0].active, true, "legacy representative active flag does not override operational inventory activation");
});
test("Twin Cities eligibility shares zone supply while respecting explicit activation and service flags", () => {
  assert.equal(twin().length, 1);
  assert.equal(twin({}, {}, "rawalpindi").length, 1);
  assert.equal(twin({ active: false }).length, 0);
  assert.equal(twin({}, { active: false }).length, 0);
  assert.equal(twin({ supports: { withDriver: false } }).length, 0);
  assert.equal(twin({ supports: { withinCity: false } })[0].pricing.withDriver.withinCity.daily, undefined);
  assert.equal(twin({ pricing: rate(NaN) }).length, 0);
});
test("both public projections omit vendor identities and raw IDs while internal ownership remains", () => {
  for (const inventory of [lahore(), twin()]) {
    const projected = publicApi.toPublicNormalRentalInventory(inventory);
    assert.equal(projected.length, 1);
    assert.doesNotMatch(JSON.stringify(projected), /vendor|PRIVATE SUPPLIER|PRIVATE TWIN SUPPLIER/);
    assert.notEqual(projected[0].inventoryId, inventory[0].inventoryId);
    assert.ok(inventory[0].vendorId);
    assert.ok(inventory[0].vendorName);
  }
  assert.equal(publicApi.publicLahoreOptionId("inventory"), publicApi.publicNormalRentalOptionId("inventory", "lahore"));
});
test("display minimum comes from eligible rates and route keeps city/service semantics", () => {
  const inventory = publicApi.toPublicLahoreInventory([...lahore(), { ...lahore()[0], inventoryId: "other", pricing: rate(6000) }]);
  assert.equal(groupNormalRentalInventoryCards(inventory).length, 1);
  assert.equal(normalRentalStartingPrice(inventory), 6000);
  for (const city of ["islamabad", "rawalpindi", "lahore"]) assert.equal(normalRentalModelHref(inventory[0], city), `/cars/toyota-corolla/${city}/with-driver`);
  assert.ok(formatLahoreWhatsAppVehicleLines({ carName: "Corolla", pricingType: "withinCity", duration: "daily", rate: 5000, cityLabel: "Rawalpindi" }).includes("Service: Within Rawalpindi"));
});

function leadHarness(inventory) {
  const records = new Map([["meta/counters", { leadCounter: 20 }]]);
  const deliveries = [];
  let sequence = 0;
  const snapshot = (key) => ({ exists: records.has(key), data: () => records.get(key) });
  const db = { collection: (name) => ({ doc: (id = `auto-${++sequence}`) => ({ key: `${name}/${id}`, id, get: async () => snapshot(`${name}/${id}`) }) }), runTransaction: async (action) => action({ get: async (ref) => snapshot(ref.key), update: (ref, data) => records.set(ref.key, { ...records.get(ref.key), ...data }), create: (ref, data) => { assert.ok(!records.has(ref.key)); records.set(ref.key, data); } }) };
  const core = load("src/lib/normal-rental/lahore-lead.ts", {
    "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => "timestamp" } },
    "next/server": { NextResponse: { json: (body, init) => new Response(JSON.stringify(body), { status: init?.status ?? 200 }) } },
    "@/lib/firebaseAdmin": { getAdminDb: () => db },
    "@/lib/normal-rental/inventory-resolver": { resolveNormalRentalInventory: async ({ zoneId }) => inventory.filter((item) => item.zoneId === zoneId) },
    "@/lib/normal-rental/inventory-core": { normalRentalPublicLabel: (item) => item.modelName },
    "@/lib/normal-rental/zones": requireZone(),
    "@/lib/normal-rental/place-validation": { isValidPakistanPlace: ({ placeId, latitude, longitude }) => !!placeId && Number.isFinite(latitude) && Number.isFinite(longitude) },
    "@/lib/normal-rental/public-inventory": publicApi,
    "@/lib/dispatch/automatic-intake": { attemptAutomaticOperationalIntake: async () => ({ id: "preview-intake" }) },
    "@/lib/booking-delivery/orchestrator": { orchestrateBookingDelivery: async (...args) => { if (!deliveries.some((previous) => previous[0] === args[0] && previous[1] === args[1])) deliveries.push(args); return { result: {} }; } },
  });
  return { core, records, deliveries };
}
function requireZone() {
  return load("src/lib/normal-rental/zones.ts", {});
}
const payload = (item, cityId) => ({ cityId, zoneId: normalRentalZoneForCity(cityId), inventoryId: publicApi.publicNormalRentalOptionId(item.inventoryId, item.zoneId), pricingType: "withinCity", duration: "daily", pickupDate: "2026-10-04", preferredTime: "12:00", pickupAddress: "Pakistan pickup", pickupPlaceId: "place", pickupLatitude: 31.5, pickupLongitude: 74.3, customerName: "Test", phone: "03021234567", numberOfDays: 2, entryPoint: "homepage", submissionKey: "12345678-1234-1234-1234-123456789abc", vendorId: "ATTACKER", price: 1 });
const request = (body) => new Request("https://www.rentka.co/api/normal-rental-lead", { method: "POST", body: JSON.stringify(body) });
test("server books both zones without public vendor selection and preserves operations/dispatch contracts", async () => {
  for (const [inventory, cityId, code, flow] of [[lahore(), "lahore", "LHR", "lahore_normal"], [twin(), "islamabad", "ISL", "twin_cities_normal"], [twin({}, {}, "rawalpindi"), "rawalpindi", "RAW", "twin_cities_normal"]]) {
    const harness = leadHarness(inventory);
    const response = await harness.core.createLahoreLead(request(payload(inventory[0], cityId)), "rent_a_car_lahore");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.leadId, `RK-${code}-21`);
    assert.doesNotMatch(JSON.stringify(body), /vendor|PRIVATE/);
    const saved = [...harness.records].find(([key]) => key.startsWith("leads/"))[1];
    assert.equal(saved.vendorId, inventory[0].vendorId);
    assert.equal(saved.price, inventory[0].pricing.withDriver.withinCity.daily);
    assert.equal(saved.estimatedRentalAmount, saved.price * 2);
    assert.equal(saved.zoneId, inventory[0].zoneId);
    assert.equal(saved.country, "PK");
    assert.equal(saved.service, "withDriver");
    assert.equal(harness.deliveries[0][0], flow);
    if (inventory[0].source === "legacy") assert.equal(saved.carId, inventory[0].inventoryId);
    const operational = adaptSource(flow, "doc", saved);
    assert.equal(operational.zoneId, inventory[0].zoneId);
    assert.equal(operational.requestedVehicle.categoryOrModel, inventory[0].modelName);
    assert.equal(operational.customerFinancials.customerTotalMinor, saved.estimatedRentalAmount * 100);
  }
});
test("same request is idempotent, changed payload is rejected, and unavailable options cannot create a lead", async () => {
  const inventory = lahore(), harness = leadHarness(inventory), body = payload(inventory[0], "lahore");
  const first = await (await harness.core.createLahoreLead(request(body), "rent_a_car_lahore")).json();
  const second = await (await harness.core.createLahoreLead(request(body), "rent_a_car_lahore")).json();
  assert.equal(first.leadId, second.leadId);
  assert.equal(harness.records.get("meta/counters").leadCounter, 21);
  assert.equal(harness.deliveries.length, 1);
  assert.equal((await harness.core.createLahoreLead(request({ ...body, numberOfDays: 3 }), "rent_a_car_lahore")).status, 409);
  assert.equal((await leadHarness([]).core.createLahoreLead(request(body), "rent_a_car_lahore")).status, 409);
  assert.equal((await harness.core.createLahoreLead(request({ ...body, zoneId: "twin_cities" }), "rent_a_car_lahore")).status, 400);
});
test("Twin Cities retains free-text trip locations while Lahore keeps structured-place validation", async () => {
  for (const [inventory, cityId, status] of [[twin(), "islamabad", 200], [lahore(), "lahore", 400]]) {
    const body = { ...payload(inventory[0], cityId), pickupPlaceId: "", pickupLatitude: null, pickupLongitude: null };
    const harness = leadHarness(inventory);
    const response = await harness.core.createLahoreLead(request(body), "rent_a_car_lahore");
    assert.equal(response.status, status);
    if (status === 200) {
      const saved = [...harness.records].find(([key]) => key.startsWith("leads/"))[1];
      assert.equal(saved.pickupAddress, body.pickupAddress);
      assert.equal(saved.pickupLatitude, null);
      assert.equal(saved.pickupMapLink, null);
    }
  }
});
test("homepage filters stay client state, canonicals/schema/discovery links stay separated", () => {
  const home = read("app/page.tsx"), client = read("src/components/HomePageClient.tsx"), hero = read("src/components/HeroBanner.tsx");
  assert.match(home, /canonical: "https:\/\/www\.rentka\.co\/"/);
  assert.match(home, /metadataBase: null/);
  assert.match(home, /RentKA \| Car Rental with Driver in Islamabad, Rawalpindi & Lahore/);
  assert.match(hero, /Islamabad, Rawalpindi &amp; Lahore/);
  assert.equal((home.match(/"@type": "Organization"/g) || []).length, 1);
  assert.equal((home.match(/"@type": "WebSite"/g) || []).length, 1);
  assert.doesNotMatch(home, /"@type": "CarRental"|"@type": "LocalBusiness"/);
  assert.match(home, /mainEntity: homeFaqs\.map/);
  assert.match(home, /\{homeFaqs\.map/);
  assert.doesNotMatch(client, /pushState|router\.push|useSearchParams|vendorId|vendorName|useCars/);
  for (const link of ["/airport-transfer", "/one-way-drop", "/travel-guides"]) assert.ok(client.includes(`href="${link}"`));
  assert.match(client, /href=\{`\/rent-a-car-\$\{cityId\}`\}/);
  for (const city of ["islamabad", "rawalpindi", "lahore"]) {
    const page = read(`app/rent-a-car-${city}/page.tsx`);
    assert.ok(page.includes(`https://www.rentka.co/rent-a-car-${city}`));
    assert.doesNotMatch(page, /"@type": "LocalBusiness"|"@type": "CarRental"/);
    assert.match(page, /"@type": "Service"/);
    assert.match(page, /provider:/);
  }
  assert.doesNotMatch(read("app/sitemap.ts"), /\?city=|\?service=/);
  assert.match(read("app/robots.ts"), /allow: "\/"/);
  assert.ok(read("src/lib/seo.ts").includes('`${SITE_URL}/#organization`'));
  const invalidation = read("app/admin/pricing/actions.ts");
  assert.match(invalidation, /revalidatePath\("\/"\)/);
  assert.match(invalidation, /NORMAL_RENTAL_ZONES\[zoneId\]\.cityIds/);
});
