import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AIRPORTS, getAirportDefinition, isAirportId } from "../src/lib/airport/constants.ts";
import { calculateAirportFare } from "../src/lib/airport/pricing.ts";
import { airportBookingId, airportCounterDocumentId, nextAirportSequence } from "../src/lib/airport/counter.ts";
import { nextAirportPricingVersion } from "../src/lib/airport/versioning.ts";
import { airportWhatsAppContext } from "../src/lib/airport/whatsapp.ts";
import { getBookableAirportRules, isAirportPricingReady } from "../src/lib/airport/activation.ts";

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const corolla = { id:"corolla", modelKey:"toyota-corolla", name:"Toyota Corolla", active:true, pricingConfigured:true, passengers:4, luggage:"standard", minimumFare:5000, includedKm:25, additionalKmRate:110, operationalKm:0, pickupAdjustment:0, dropoffAdjustment:0, lateNightSurcharge:750, lateNightEnabled:true, waitingAllowanceMinutes:45, additionalWaitingRate:500, operationalAllowance:0, fuelIncluded:true, tollIncluded:false, parkingIncluded:false };

test("airport registry keeps Islamabad and Lahore isolated", () => {
  assert.deepEqual(Object.keys(AIRPORTS), ["islamabad", "lahore"]);
  assert.equal(getAirportDefinition("islamabad").airportCode, "ISB");
  assert.equal(getAirportDefinition("lahore").airportCode, "LHE");
  assert.notEqual(AIRPORTS.islamabad.place.placeId, AIRPORTS.lahore.place.placeId);
  assert.equal(isAirportId("karachi"), false);
});

test("Islamabad fare formula remains unchanged", () => {
  assert.deepEqual(calculateAirportFare(corolla, 25, "airportPickup", "12:00"), { price:5000, operationalKm:0, additionalCustomerKm:0 });
  assert.equal(calculateAirportFare(corolla, 35, "airportDropoff", "12:00").price, 6100);
  assert.equal(calculateAirportFare(corolla, 25, "airportPickup", "23:00").price, 5750);
});

test("airport pricing storage is per-airport and legacy fallback is Islamabad-only", async () => {
  const config = await source("src/lib/airport/config.ts");
  assert.match(config, /collection\("airportPricingConfigurations"\)\.doc\(airportId\)/);
  assert.match(config, /if\(airportId==="islamabad"\)\{const legacy=/);
  assert.doesNotMatch(config, /airportId==="lahore"[^\n]*legacy/);
});

test("customer eligibility intersects fleet, active state, and configured valid pricing", async () => {
  const config = await source("src/lib/airport/config.ts");
  assert.match(config, /keys\.has\(airportRuleModelKey\(rule\)\)/);
  const activation = await source("src/lib/airport/activation.ts");
  assert.match(activation, /rule\.active && rule\.pricingConfigured === true && airportRuleHasValidPricing\(rule\)/);
  const admin = await source("app/admin/airport-pricing/page.tsx");
  assert.match(admin, /pricingConfigured:false/);
  assert.match(admin, /minimumFare:0/);
});

test("booking trusts persisted quote identity and price", async () => {
  const booking = await source("app/api/bookings/airport/route.ts");
  assert.match(booking, /collection\("airportQuotes"\)\.doc\(body\.quoteId\)/);
  assert.match(booking, /quotedTotal: selectedOption\.price/);
  assert.match(booking, /airportId = isAirportId\(quote\.airportId\) \? quote\.airportId : "islamabad"/);
  assert.match(booking, /pricingVersion: Number\(quote\.pricingVersion\)/);
});

test("hub and airport pages retain distinct canonical paths", async () => {
  const hub = await source("app/airport-transfer/page.tsx");
  const lahore = await source("app/airport-car-rental-lahore/page.tsx");
  const islamabad = await source("app/airport-car-rental-islamabad/page.tsx");
  assert.match(hub, /canonical:\s*"https:\/\/www\.rentka\.co\/airport-transfer"/);
  assert.match(hub, /title:\{absolute:"Airport Transfer Pakistan/);
  assert.match(lahore, /https:\/\/www\.rentka\.co\/airport-car-rental-lahore/);
  assert.match(lahore, /"@type":"FAQPage"/);
  assert.match(islamabad, /airport-car-rental-islamabad/);
});
test("airport counters and booking prefixes are airport-specific", () => {
  assert.equal(airportCounterDocumentId("islamabad"), "islamabadAirportBookings");
  assert.equal(airportCounterDocumentId("lahore"), "lahoreAirportBookings");
  assert.equal(nextAirportSequence(1472), 1473);
  assert.equal(nextAirportSequence(undefined), 1001);
  assert.equal(airportBookingId(AIRPORTS.islamabad, 1473), "RK-ISB-ARPT-1473");
  assert.equal(airportBookingId(AIRPORTS.lahore, 1001), "RK-LHE-ARPT-1001");
});

test("airport pricing versions start at one and increment persisted versions once", () => {
  assert.equal(nextAirportPricingVersion(), 1);
  assert.equal(nextAirportPricingVersion(1), 2);
  assert.equal(nextAirportPricingVersion(27), 28);
});

test("WhatsApp widget recognizes all airport routes with city-correct context", () => {
  assert.match(airportWhatsAppContext("/airport-car-rental-islamabad").message, /Islamabad/);
  assert.match(airportWhatsAppContext("/airport-car-rental-lahore").message, /Lahore/);
  assert.match(airportWhatsAppContext("/airport-transfer").message, /airport transfer/i);
  assert.equal(airportWhatsAppContext("/rent-a-car-lahore"), null);
});

test("booking transaction selects the airport counter after loading the immutable quote", async () => {
  const booking = await source("app/api/bookings/airport/route.ts");
  assert.match(booking, /transaction\.get\(quoteRef\)[\s\S]*airportCounterDocumentId\(airportId\)[\s\S]*transaction\.get\(counterRef\)/);
  assert.doesNotMatch(booking, /doc\("islamabadAirportBookings"\)/);
});
test("Lahore activation requires enabled plus at least one valid bookable fleet rule", () => {
  const validCorolla = { ...corolla, active:true, pricingConfigured:true };
  const unconfiguredAlto = { ...corolla, id:"suzuki-alto", modelKey:"suzuki-alto", name:"Suzuki Alto", active:false, pricingConfigured:false, minimumFare:0, additionalKmRate:0 };
  const unconfiguredCivic = { ...corolla, id:"honda-civic", modelKey:"honda-civic", name:"Honda Civic", active:false, pricingConfigured:false, minimumFare:0, additionalKmRate:0 };
  assert.equal(isAirportPricingReady(false, [validCorolla]), false, "disabled airport remains unavailable");
  assert.equal(isAirportPricingReady(true, [unconfiguredAlto, unconfiguredCivic]), false, "enabled airport without an eligible rule remains unavailable");
  assert.equal(isAirportPricingReady(true, [validCorolla]), true, "one eligible Corolla activates booking");
  assert.equal(isAirportPricingReady(true, [validCorolla, unconfiguredAlto, unconfiguredCivic]), true, "unconfigured models do not block activation");
  assert.deepEqual(getBookableAirportRules([validCorolla, unconfiguredAlto, unconfiguredCivic]).map(rule=>rule.modelKey), ["toyota-corolla"], "only eligible vehicles are customer-visible");
});

test("Islamabad eligible pricing remains ready under the shared activation rule", () => {
  assert.equal(isAirportPricingReady(true, [corolla]), true);
  assert.deepEqual(getBookableAirportRules([corolla]).map(rule=>rule.id), ["corolla"]);
});
test("WhatsApp widget defers pathname-dependent markup until after client mount", async () => {
  const widget = await source("src/components/WhatsAppWidget.tsx");
  assert.equal(widget.includes("useSyncExternalStore(subscribeToClientMount, getClientSnapshot, getServerSnapshot)"), true);
  assert.equal(widget.includes("const getServerSnapshot = () => false"), true);
  assert.match(widget, /if \(!mounted\) return null/);
});
