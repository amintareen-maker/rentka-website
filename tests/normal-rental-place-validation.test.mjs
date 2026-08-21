import assert from "node:assert/strict";
import test from "node:test";
import { isValidPakistanPlace } from "../src/lib/normal-rental/place-validation.ts";

const lahore = { address: "DHA Phase 5, Lahore, Pakistan", placeId: "lahore-place", latitude: 31.4697, longitude: 74.4089 };

test("accepts a structured Lahore Google place", () => {
  assert.equal(isValidPakistanPlace(lahore), true);
});

test("rejects typed text without a selected place ID", () => {
  assert.equal(isValidPakistanPlace({ ...lahore, placeId: "" }), false);
});

test("rejects missing coordinates", () => {
  assert.equal(isValidPakistanPlace({ ...lahore, latitude: Number.NaN }), false);
});

test("rejects coordinates outside Pakistan", () => {
  assert.equal(isValidPakistanPlace({ ...lahore, latitude: 51.5072, longitude: -0.1276 }), false);
});
