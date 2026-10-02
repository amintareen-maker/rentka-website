import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { adaptBookingDelivery, googleSheetPayload } from "../src/lib/booking-delivery/adapters.ts";
import { runBookingDelivery } from "../src/lib/booking-delivery/core.ts";

const airportSource = {
  bookingId: "RK-ISB-ARPT-1010", createdAt: "2026-09-18T07:15:53.609Z", city: "Islamabad", service: "airportTransfer", tripType: "airportDropoff",
  customer: { name: "Airport Customer", phone: "03001234567", email: "customer@example.com" }, pickup: { formattedAddress: "F-7 Islamabad" },
  destination: { formattedAddress: "Islamabad International Airport" }, date: "2026-09-20", time: "11:30", vehicle: { name: "Toyota Corolla" }, quotedTotal: 11000,
};

function memoryRecorder() {
  const state = new Map(), attempts = [];
  return { state, attempts,
    async start(destination, payload) { const key = `${payload.source}:${payload.sourceDocumentId}:${destination}`, current = state.get(key); if (["delivered", "not_applicable", "customer_handoff"].includes(current?.status)) return false; attempts.push(destination); state.set(key, { status: "processing", attempts: (current?.attempts ?? 0) + 1 }); return true; },
    async finish(destination, payload, outcome) { const key = `${payload.source}:${payload.sourceDocumentId}:${destination}`, current = state.get(key); state.set(key, { ...current, ...outcome }); },
  };
}

test("Airport adapts to the normalized payload and existing RentKA Leads schema", () => {
  const payload = adaptBookingDelivery("airport", "airport-doc", airportSource);
  assert.equal(payload.bookingId, "RK-ISB-ARPT-1010");
  assert.equal(payload.trip.service, "Airport Transfer");
  assert.equal(payload.trip.tripType, "airportDropoff");
  assert.equal(payload.vehicle.vehicleName, "Toyota Corolla");
  const sheet = googleSheetPayload(payload);
  assert.equal(sheet.leadId, payload.bookingId);
  assert.equal(sheet.source, "airport");
  assert.equal(sheet.pickupAddress, "F-7 Islamabad");
  assert.equal(sheet.destinationAddress, "Islamabad International Airport");
  assert.equal(sheet.packagePrice, "11000");
});

test("all destinations settle independently and persist useful failure state", async () => {
  const payload = adaptBookingDelivery("airport", "airport-doc", airportSource), recorder = memoryRecorder(), invoked = [];
  const result = await runBookingDelivery(payload, async destination => { invoked.push(destination); if (destination === "googleSheet") throw new Error("webhook unavailable"); return destination === "whatsapp" ? { status: "customer_handoff" } : { status: "delivered" }; }, recorder);
  assert.deepEqual(invoked.sort(), ["dispatch", "email", "googleSheet", "whatsapp"]);
  assert.equal(result.email.status, "delivered");
  assert.equal(result.dispatch.status, "delivered");
  assert.equal(result.whatsapp.status, "customer_handoff");
  assert.equal(result.googleSheet.status, "failed");
  assert.match(recorder.state.get("airport:airport-doc:googleSheet").error, /webhook unavailable/);
});

test("successful retries become terminal and do not duplicate Sheet or Dispatch", async () => {
  const payload = adaptBookingDelivery("airport", "airport-doc", airportSource), recorder = memoryRecorder(); let sheetCalls = 0, dispatchCalls = 0;
  const executor = async destination => { if (destination === "googleSheet") sheetCalls++; if (destination === "dispatch") dispatchCalls++; return { status: "delivered" }; };
  await runBookingDelivery(payload, async destination => destination === "googleSheet" ? { status: "failed", error: "temporary" } : executor(destination), recorder, ["googleSheet", "dispatch"]);
  await runBookingDelivery(payload, executor, recorder, ["googleSheet", "dispatch"]);
  await runBookingDelivery(payload, executor, recorder, ["googleSheet", "dispatch"]);
  assert.equal(sheetCalls, 1);
  assert.equal(dispatchCalls, 1);
  assert.equal(recorder.state.get("airport:airport-doc:googleSheet").status, "delivered");
});

test("destination-only Sheet replay invokes no email, WhatsApp, or Dispatch", async () => {
  const payload = adaptBookingDelivery("airport", "airport-doc", airportSource), recorder = memoryRecorder(), invoked = [];
  await runBookingDelivery(payload, async destination => { invoked.push(destination); return { status: "delivered", sheetStatus: "inserted" }; }, recorder, ["googleSheet"]);
  assert.deepEqual(invoked, ["googleSheet"]);
});

test("source creation paths use shared server orchestration and remove browser-critical fan-out", () => {
  const airport = readFileSync(new URL("../app/api/bookings/airport/route.ts", import.meta.url), "utf8");
  const lahore = readFileSync(new URL("../src/lib/normal-rental/lahore-lead.ts", import.meta.url), "utf8");
  const twin = readFileSync(new URL("../src/components/LeadModal.tsx", import.meta.url), "utf8");
  const oneWay = readFileSync(new URL("../src/components/intercity/IntercityBookingModal.tsx", import.meta.url), "utf8");
  const ta = readFileSync(new URL("../app/api/partner/ta-connections/bookings/route.ts", import.meta.url), "utf8");
  assert.match(airport, /orchestrateBookingDelivery\("airport"/);
  assert.match(lahore, /orchestrateBookingDelivery\(deliverySource/);
  assert.match(ta, /orchestrateBookingDelivery\("ta_connections"/);
  assert.match(twin, /fetch\("\/api\/booking-delivery"/);
  assert.match(oneWay, /fetch\("\/api\/booking-delivery"/);
  assert.doesNotMatch(twin, /fetch\("\/api\/(lead-booking|lead-sheet|dispatch\/intake)"/);
  assert.doesNotMatch(oneWay, /script\.google\.com|fetch\("\/api\/(intercity-booking|dispatch\/intake)"/);
});

test("WhatsApp remains an explicit customer handoff and TA Sheet is explicitly not applicable", () => {
  const service = readFileSync(new URL("../src/lib/booking-delivery/service.ts", import.meta.url), "utf8");
  assert.match(service, /destination === "whatsapp"\) return \{ status: "customer_handoff" \}/);
  assert.match(service, /payload\.source === "ta_connections"\) return \{ status: "not_applicable" \}/);
  assert.doesNotMatch(service, /whatsappOutboundMessages|sendText\(|sendTemplate\(/);
});
