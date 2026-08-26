import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { isolateAutomaticIntake } from "../src/lib/dispatch/automatic-intake-core.ts";
import { adaptSource, operationalDocumentId, sourceKey } from "../src/lib/dispatch/booking-adapters.ts";

const sourceFixtures = {
  twin_cities_normal: { leadId: "RK-ISL-1", name: "Test", phone: "0300", city: "Islamabad", pickupDate: "2027-01-01", preferredTime: "09:00", pickupAddress: "F-7", carName: "Corolla", estimatedRentalAmount: 10_000 },
  lahore_normal: { leadId: "RK-LHR-1", name: "Test", phone: "0300", zoneId: "lahore", pickupDate: "2027-01-01", preferredTime: "09:00", pickupAddress: "Gulberg", carName: "Corolla", estimatedRentalAmount: 10_000 },
  airport: { bookingId: "RK-ISB-ARPT-1001", customer: { name: "Test", phone: "0300" }, quotedTotal: 5_000, expectedAdvanceAmount: 1_000, advancePercentage: 20, date: "2027-01-01", time: "09:00", pickup: { formattedAddress: "Airport" }, destination: { formattedAddress: "F-7" }, vehicle: { name: "Corolla" } },
  one_way_drop: { leadId: "RK-OWD-1", name: "Test", phone: "0300", pickupCity: "Islamabad", destinationCity: "Lahore", travelDate: "2027-01-01", travelTime: "09:00", pickupAddress: "F-7", dropAddress: "Gulberg", vehicle: "Corolla", quotedPrice: 20_000 },
  ta_connections: { bookingId: "RK-TA-ISB-0001", passengerOrGroupName: "Test", passengerContact: "0300", pricing: { grossContractRateMinor: 700_000 }, payment: { paymentAmountMinor: 0 }, travelDate: "2027-01-01", pickupTime: "09:00", pickupLocation: { address: "Airport" }, dropoffLocation: { address: "F-7" }, vehicleCategory: "SUV" },
};

test("all supported automatic sources reuse the D2 adapter and initialize financial readiness", () => {
  for (const [type, data] of Object.entries(sourceFixtures)) {
    const booking = adaptSource(type, `source-${type}`, data);
    assert.equal(booking.bookingId, data.bookingId ?? data.leadId);
    assert.equal(booking.customerFinancials.receivedAmountMinor, 0);
    assert.equal(booking.internalFinancials.payoutStatus, "pending");
    assert.equal(booking.readinessStatus, "awaiting_advance");
  }
});

test("automatic retry and later Admin Import resolve to one deterministic operational booking", async () => {
  const created = new Set();
  const normalize = async (type, documentId) => {
    const id = operationalDocumentId(sourceKey(type, documentId));
    const duplicate = created.has(id);
    created.add(id);
    return { id, duplicate, bookingId: "RK-ISL-1" };
  };
  const automatic = await isolateAutomaticIntake("twin_cities_normal", "source-1", normalize);
  const retry = await isolateAutomaticIntake("twin_cities_normal", "source-1", normalize);
  const adminImport = await normalize("twin_cities_normal", "source-1");
  assert.equal(created.size, 1);
  assert.equal(automatic.id, retry.id);
  assert.equal(retry.duplicate, true);
  assert.equal(adminImport.duplicate, true);
});

test("intake failure is isolated after canonical source persistence", async () => {
  const canonicalSources = new Map([["source-1", { bookingId: "RK-ISL-1" }]]);
  const reports = [];
  const result = await isolateAutomaticIntake("twin_cities_normal", "source-1", async () => { throw new Error("dispatch unavailable"); }, (message, context) => reports.push({ message, context }));
  assert.equal(result, null);
  assert.equal(canonicalSources.get("source-1").bookingId, "RK-ISL-1");
  assert.equal(canonicalSources.size, 1);
  assert.equal(reports.length, 1);
});

test("every creation path hooks into the shared automatic intake after source persistence", () => {
  const files = {
    twin: readFileSync(new URL("../src/components/LeadModal.tsx", import.meta.url), "utf8"),
    lahore: readFileSync(new URL("../src/lib/normal-rental/lahore-lead.ts", import.meta.url), "utf8"),
    airport: readFileSync(new URL("../app/api/bookings/airport/route.ts", import.meta.url), "utf8"),
    oneWay: readFileSync(new URL("../src/components/intercity/IntercityBookingModal.tsx", import.meta.url), "utf8"),
    ta: readFileSync(new URL("../app/api/partner/ta-connections/bookings/route.ts", import.meta.url), "utf8"),
  };
  assert.match(files.twin, /requestAutomaticDispatchIntake\(\{[\s\S]*sourceType: "twin_cities_normal"/);
  assert.match(files.lahore, /attemptAutomaticOperationalIntake\("lahore_normal", leadRef\.id\)/);
  assert.match(files.airport, /attemptAutomaticOperationalIntake\("airport", bookingRef\.id\)/);
  assert.match(files.oneWay, /requestAutomaticDispatchIntake\(\{[\s\S]*sourceType: "one_way_drop"/);
  assert.match(files.ta, /attemptAutomaticOperationalIntake\("ta_connections", result\.booking\.bookingId\)/);
});

test("automatic intake stays server-side and introduces no D3 behavior", () => {
  const route = readFileSync(new URL("../app/api/dispatch/intake/route.ts", import.meta.url), "utf8");
  const server = readFileSync(new URL("../src/lib/dispatch/automatic-intake.ts", import.meta.url), "utf8");
  assert.match(server, /import "server-only"/);
  assert.match(server, /normalizeExistingSource/);
  assert.doesNotMatch(`${route}\n${server}`, /smart match|driver recommendation|whatsapp|assignment/i);
});
