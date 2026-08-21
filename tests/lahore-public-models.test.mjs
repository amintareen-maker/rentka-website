import assert from "node:assert/strict";
import test from "node:test";
import { groupEligibleLahoreModels, findEligibleLahoreModel } from "../src/lib/normal-rental/public-models.ts";

const option = (overrides = {}) => ({
  inventoryId: "inventory-lhr", source: "operations", zoneId: "lahore", cityId: "lahore",
  modelKey: "toyota-corolla", modelSlug: "toyota-corolla", modelName: "Toyota Corolla",
  vendorId: "vendor-lhr", vendorName: "Hidden Vendor", active: true, imageURL: "https://images.example/corolla.jpg",
  pricing: { withDriver: { withinCity: { daily: 7000 }, outsideCity: { daily: 9000 } } }, ...overrides,
});

test("active Lahore inventory creates one eligible model", () => {
  const models = groupEligibleLahoreModels([option(), option({ inventoryId: "inventory-lhr-2" })]);
  assert.equal(models.length, 1); assert.equal(models[0].modelSlug, "toyota-corolla"); assert.equal(models[0].inventory.length, 2);
});
test("non-Lahore and inactive normalized records cannot create a page", () => {
  assert.deepEqual(groupEligibleLahoreModels([option({ active: false }), option({ zoneId: "twin_cities", cityId: "islamabad" })]), []);
});
test("missing model has no eligible page and never falls back", () => assert.equal(findEligibleLahoreModel([option()], "honda-civic"), undefined));
