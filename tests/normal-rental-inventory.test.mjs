import assert from "node:assert/strict";
import test from "node:test";
import { groupNormalRentalInventoryCards, normalizeNormalRentalInventory, normalRentalModelHref, shouldOpenInventoryComparison } from "../src/lib/normal-rental/inventory-core.ts";
import { getNormalRentalBookingContext, NORMAL_RENTAL_ZONES, resolveNormalRentalLeadCode } from "../src/lib/normal-rental/zones.ts";

const rate = (within, outside) => ({ withDriver: { withinCity: { daily: within, weekly: within * 6 }, outsideCity: { daily: outside, monthly: outside * 25 } } });
const model = { id: "corolla-model", data: { model: "Toyota Corolla", imageURL: "https://images.example/corolla.jpg", category: "Sedan", seatingCapacity: "5" } };
const lahoreVendor = { id: "vendor-lhr", data: { name: "Lahore Vendor", zoneId: "lahore", active: true } };
const validLahore = { id: "inventory-lhr", data: { zoneId: "lahore", active: true, modelSourceCarId: "corolla-model", modelKey: "toyota-corolla", modelName: "Toyota Corolla", vendorId: "vendor-lhr", pricing: rate(7000, 9000), imageOverride: null } };
const resolveLahore = ({ inventory = [validLahore], vendors = [lahoreVendor] } = {}) => normalizeNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", legacyCars: [model], legacyVendors: [], operationsInventory: inventory, operationsVendors: vendors });

test("Twin Cities legacy inventory resolves with its existing vendor and pricing", () => {
  const results = normalizeNormalRentalInventory({
    zoneId: "twin_cities", cityId: "islamabad",
    legacyCars: [{ ...model, data: { ...model.data, cityList: ["islamabad"], active: true, vendorId: "vendor-isb", pricing: rate(5000, 6500) } }],
    legacyVendors: [{ id: "vendor-isb", data: { name: "Islamabad Vendor" } }], operationsInventory: [], operationsVendors: [],
  });
  assert.equal(results.length, 1); assert.equal(results[0].vendorName, "Islamabad Vendor"); assert.equal(results[0].pricing.withDriver.withinCity.daily, 5000);
});

test("valid active Lahore inventory resolves without Twin Cities data", () => {
  const results = resolveLahore(); assert.equal(results.length, 1); assert.equal(results[0].zoneId, "lahore"); assert.equal(results[0].pricing.withDriver.withinCity.daily, 7000);
});
test("inactive Lahore inventory is excluded", () => assert.deepEqual(resolveLahore({ inventory: [{ ...validLahore, data: { ...validLahore.data, active: false } }] }), []));
test("inactive Lahore vendor is excluded", () => assert.deepEqual(resolveLahore({ vendors: [{ ...lahoreVendor, data: { ...lahoreVendor.data, active: false } }] }), []));
test("Lahore inventory linked to a Twin Cities vendor is excluded", () => assert.deepEqual(resolveLahore({ vendors: [{ ...lahoreVendor, data: { ...lahoreVendor.data, zoneId: "twin_cities" } }] }), []));
test("Lahore with no inventory returns empty and never falls back", () => assert.deepEqual(resolveLahore({ inventory: [] }), []));
test("model image falls back to representative model image", () => assert.equal(resolveLahore()[0].imageURL, model.data.imageURL));
test("valid HTTPS image override wins", () => {
  const override = "https://images.example/lahore-corolla.jpg";
  assert.equal(resolveLahore({ inventory: [{ ...validLahore, data: { ...validLahore.data, imageOverride: override } }] })[0].imageURL, override);
});
test("Lahore pricing remains independent from legacy pricing", () => assert.equal(resolveLahore()[0].pricing.withDriver.outsideCity.daily, 9000));
test("Lahore model year belongs to the inventory record", () => {
  const inventory = [{ ...validLahore, data: { ...validLahore.data, modelYearLabel: "2022–2024" } }];
  assert.equal(resolveLahore({ inventory })[0].modelYearLabel, "2022–2024");
});
test("Lahore inventory without a model year remains eligible", () => {
  assert.equal(resolveLahore()[0].modelYearLabel, undefined);
});
test("existing inventory defaults to grouped public cards", () => {
  const first = resolveLahore()[0];
  const cards = groupNormalRentalInventoryCards([first, { ...first, inventoryId: "inventory-lhr-2" }]);
  assert.equal(first.showAsSeparateCard, false);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].options.length, 2);
});
test("separate inventory gets its own card and public label fallback", () => {
  const inventory = [{ ...validLahore, data: { ...validLahore.data, showAsSeparateCard: true, modelYearLabel: "2023 and Above" } }];
  const first = resolveLahore({ inventory })[0];
  const cards = groupNormalRentalInventoryCards([first]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].separate, true);
  assert.equal(cards[0].label, "Toyota Corolla — 2023 and Above");
  assert.equal(cards[0].options.length, 1);
});
test("separate inventory uses its explicit public label", () => {
  const inventory = [{ ...validLahore, data: { ...validLahore.data, showAsSeparateCard: true, publicLabel: "Corolla New Shape" } }];
  const cards = groupNormalRentalInventoryCards(resolveLahore({ inventory }));
  assert.equal(cards[0].label, "Corolla New Shape");
});
test("one grouped inventory option opens booking directly", () => {
  const card = groupNormalRentalInventoryCards(resolveLahore())[0];
  assert.equal(shouldOpenInventoryComparison(card), false);
  assert.equal(card.options[0].inventoryId, "inventory-lhr");
});
test("multiple grouped inventory options open comparison and retain exact IDs", () => {
  const first = resolveLahore()[0];
  const card = groupNormalRentalInventoryCards([first, { ...first, inventoryId: "inventory-lhr-2", modelYearLabel: "2022–2024" }])[0];
  assert.equal(shouldOpenInventoryComparison(card), true);
  assert.deepEqual(card.options.map((item) => item.inventoryId), ["inventory-lhr", "inventory-lhr-2"]);
});
test("a separate inventory card always opens booking directly", () => {
  const inventory = [{ ...validLahore, data: { ...validLahore.data, showAsSeparateCard: true } }];
  const card = groupNormalRentalInventoryCards(resolveLahore({ inventory }))[0];
  assert.equal(shouldOpenInventoryComparison(card), false);
  assert.equal(card.options.length, 1);
});
test("inventory variants consolidate on their underlying model URL", () => {
  const first = resolveLahore()[0];
  const variant = { ...first, publicLabel: "Toyota Corolla New Shape", modelYearLabel: "2022 and Above", showAsSeparateCard: true };
  assert.equal(normalRentalModelHref(first), "/cars/toyota-corolla/lahore/with-driver");
  assert.equal(normalRentalModelHref(variant), "/cars/toyota-corolla/lahore/with-driver");
});
test("Lahore uses LHR normal-rental code and Twin Cities IDs remain unchanged", () => {
  const context = getNormalRentalBookingContext("lahore");
  assert.equal(NORMAL_RENTAL_ZONES.lahore.publicEnabled, true); assert.equal(resolveNormalRentalLeadCode(context), "LHR");
  assert.equal(resolveNormalRentalLeadCode(getNormalRentalBookingContext("twin_cities", "islamabad")), "ISL");
});
