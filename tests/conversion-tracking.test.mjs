import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const eventPosition = (source, event) => source.indexOf(`trackDataLayer("${event}"`);

test("Twin Cities and One-Way generate leads only after persisted source records", async () => {
  const [normal, oneWay] = await Promise.all([read("src/components/LeadModal.tsx"), read("src/components/intercity/IntercityBookingModal.tsx")]);
  assert.ok(eventPosition(normal, "generate_lead") > normal.indexOf('await addDoc(collection(db, "leads")'));
  assert.ok(eventPosition(oneWay, "generate_lead") > oneWay.indexOf('await addDoc(collection(db, "leads")'));
  assert.match(normal, /if \(submissionInProgress\.current\) return/);
  assert.match(oneWay, /if \(submissionInProgress\.current\) return/);
});

test("Lahore emits generate_lead only after a successful response with a lead ID", async () => {
  const source = await read("src/components/lahore/LahoreBookingClient.tsx");
  const event = eventPosition(source, "generate_lead");
  assert.ok(event > source.indexOf("parseTestLeadResponse(responseBody"));
  assert.ok(event > source.indexOf("if (!lead.leadId)"));
  assert.match(source, /if \(prelaunch\) \{\s*trackDataLayer\("generate_lead"/);
  assert.match(source, /submissionInProgress\.current/);
  assert.ok(event < source.indexOf("whatsappWindow.location.href = whatsappUrl"));
});

test("Airport preserves its compatibility event and adds generate_lead after API success", async () => {
  const source = await read("src/components/airport/AirportBookingEngine.tsx");
  const compatibility = eventPosition(source, "airport_booking_submitted");
  const canonical = eventPosition(source, "generate_lead");
  assert.ok(compatibility > source.indexOf("if(!r.ok)throw"));
  assert.ok(canonical > compatibility);
  assert.ok(canonical > source.indexOf("if(!booking.bookingId)"));
  assert.ok(canonical < source.indexOf("whatsappWindow.location.href=whatsappUrl"));
  assert.match(source, /bookingInProgress\.current/);
});

test("generate_lead payloads use non-PII booking and commercial fields", async () => {
  const files = await Promise.all([read("src/components/LeadModal.tsx"), read("src/components/intercity/IntercityBookingModal.tsx"), read("src/components/lahore/LahoreBookingClient.tsx"), read("src/components/airport/AirportBookingEngine.tsx")]);
  for (const source of files) {
    const start = eventPosition(source, "generate_lead");
    assert.notEqual(start, -1);
    const namedPayloadStart = source.lastIndexOf("const trackingPayload = {", start);
    const payload = source.slice(start, source.indexOf("});", start) + 3).includes("trackingPayload")
      ? source.slice(namedPayloadStart, source.indexOf("};", namedPayloadStart) + 2)
      : source.slice(start, source.indexOf("});", start) + 3);
    assert.match(payload, /(?:lead_id|booking_id)/);
    assert.match(payload, /currency:\s*"PKR"/);
    assert.doesNotMatch(payload, /(?:customerName|customer_name|phone|email|pickupAddress|pickup_address|cnic)\s*:/i);
  }
});