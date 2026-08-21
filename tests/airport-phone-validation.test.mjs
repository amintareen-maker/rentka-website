import test from "node:test";
import assert from "node:assert/strict";
import { isValidAirportPhone, normalizeAirportPhone } from "../src/lib/airport/phone.ts";

for (const phone of [
  "03020589999",
  "+923020589999",
  "+447911123456",
  "+971501234567",
  "+12025550123",
]) {
  test(`accepts ${phone}`, () => assert.equal(isValidAirportPhone(phone), true));
}

test("preserves the international prefix while removing display separators", () => {
  assert.equal(normalizeAirportPhone(" +44 (7911) 123-456 "), "+447911123456");
});

for (const phone of ["", "   ", "3020589999", "+", "+0123456789", "+44abc123", "+1234567", "+1234567890123456"]) {
  test(`rejects invalid input ${JSON.stringify(phone)}`, () => assert.equal(isValidAirportPhone(phone), false));
}
