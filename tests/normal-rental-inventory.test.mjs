import assert from "node:assert/strict";
import test from "node:test";
import { normalizeNormalRentalInventory } from "../src/lib/normal-rental/inventory-core.ts";
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
test("Lahore uses LHR normal-rental code and Twin Cities IDs remain unchanged", () => {
  const context = getNormalRentalBookingContext("lahore");
  assert.equal(NORMAL_RENTAL_ZONES.lahore.publicEnabled, true); assert.equal(resolveNormalRentalLeadCode(context), "LHR");
  assert.equal(resolveNormalRentalLeadCode(getNormalRentalBookingContext("twin_cities", "islamabad")), "ISL");
});
