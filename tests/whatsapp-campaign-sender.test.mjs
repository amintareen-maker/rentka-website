import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import ts from "typescript";
import * as core from "../src/lib/whatsapp-campaigns/core.ts";
import * as types from "../src/lib/whatsapp-campaigns/types.ts";
import * as safety from "../src/lib/whatsapp-campaigns/send-core.ts";
import * as sendTypes from "../src/lib/whatsapp-campaigns/send-types.ts";
import * as templatePreview from "../src/lib/whatsapp-campaigns/template-preview.ts";

const require = createRequire(import.meta.url);
const hash = value => createHash("sha256").update(value).digest("hex");
const collections = { audiences: "whatsappCampaignAudiences", contacts: "whatsappCampaignContacts", sends: "whatsappCampaignSends" };
function load(path, mocks) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} }; new Function("require", "module", "exports", code)(name => name in mocks ? mocks[name] : require(name), mod, mod.exports); return mod.exports;
}
const service = load("../src/lib/whatsapp-campaigns/send-service.ts", { "server-only": {}, "./core": core, "./types": types, "./send-core": safety, "./template-preview": templatePreview, "./send-types": sendTypes, "./repository": { COLLECTIONS: collections, campaignSendId: (id, phone) => hash(`${id}:${phone}`) } });
function database() {
  const records = new Map(); let tail = Promise.resolve(); const writes = [];
  const snap = ref => ({ ref, id: ref.id, exists: records.has(ref.path), data: () => structuredClone(records.get(ref.path)) });
  const doc = path => ({ path, id: path.split("/").at(-1), collection: name => collection(`${path}/${name}`), get: async () => snap(doc(path)) });
  function collection(path, filters = []) {
    const query = { path, query: true, doc: id => doc(`${path}/${id}`), where: (field, op, value) => collection(path, [...filters, [field, value]]), orderBy: () => query, get: async () => {
      const docs = [...records.keys()].sort().filter(key => key.startsWith(`${path}/`) && key.split("/").length === path.split("/").length + 1 && filters.every(([field, value]) => records.get(key)[field] === value)).map(key => snap(doc(key)));
      return { docs, size: docs.length };
    } }; return query;
  }
  const getAll = async (...refs) => refs.map(snap);
  return { records, writes, collection, getAll, runTransaction(work) {
    const result = tail.then(async () => {
      const pending = [];
      const read = () => assert.equal(pending.length, 0, "Firestore reads must precede writes");
      const value = await work({ get: async ref => { read(); return ref.query ? ref.get() : snap(ref); }, getAll: async (...refs) => { read(); return getAll(...refs); },
        create: (ref, value) => { assert.ok(!records.has(ref.path)); pending.push([ref, structuredClone(value), false]); },
        set: (ref, value, options) => pending.push([ref, structuredClone(value), !!options?.merge]),
        update: (ref, value) => { assert.ok(records.has(ref.path), `update missing ${ref.path}`); pending.push([ref, structuredClone(value), true]); },
      });
      assert.ok(pending.length <= 500); writes.push(pending.length);
      for (const [ref, data, merge] of pending) records.set(ref.path, merge ? { ...records.get(ref.path), ...data } : data);
      return value;
    }); tail = result.catch(() => {}); return result;
  } };
}
function fixture(count = 2) {
  const db = database(), id = hash("File A"), calls = []; let time = 1_800_000_000_000, provider = async () => ({ messageId: `mock-${calls.length}` });
  const audiencePath = audience => `${collections.audiences}/${audience}`;
  function audience(name, total, offset = 0) {
    const audienceId = hash(name), base = audiencePath(audienceId);
    db.records.set(base, { audienceId, audienceName: name, originalFilename: `${name}.csv`, importState: "completed", status: "ready" });
    for (let i = 0; i < total; i++) {
      const phone = `+92302${String(1000000 + offset + i)}`, contactId = hash(phone);
      if (!db.records.has(`${collections.contacts}/${contactId}`)) db.records.set(`${collections.contacts}/${contactId}`, { id: contactId, displayName: `Person ${offset + i}`, phoneE164: phone, marketingStatus: "eligible", optOut: false });
      db.records.set(`${base}/members/${contactId}`, { contactId, audienceId, phoneE164: phone, eligibilityAtImport: true, sendStatus: "not_sent" });
    }
    return audienceId;
  }
  audience("File A", count);
  const sender = service.createCampaignSender({ db, requireGate: async () => {}, signingSecret: () => "unit-test-only", now: () => time, sleep: async ms => { time += ms; }, sendTemplate: async message => { calls.push(message); return provider(message); } });
  async function start(a = id, mode = "send") { const review = await sender.review(a, mode); return sender.start(review.token, review.confirmation); }
  async function drain(a = id, approval) { for (let i = 0; i < 2000; i++) { time += 1000; const result = await sender.processChunk(a, approval); if (!result.hasMore) return result; } throw Error("worker failed to finish"); }
  return { db, id, calls, sender, audience, start, drain, advance: ms => { time += ms; }, provider: fn => { provider = fn; }, member: () => [...db.records.entries()].find(([key]) => key.includes("/members/")), contact: () => [...db.records.entries()].find(([key]) => key.startsWith(`${collections.contacts}/`)) };
}

for (const count of [2, 50, 100, 1001]) test(`whole selected file with ${count} members uses bounded mocked execution`, async () => {
  const f = fixture(count), run = await f.start(); await f.drain(f.id, run.approvalId);
  assert.equal(f.calls.length, count); const results = await f.sender.results(f.id);
  assert.equal(results.records.length, count); assert.equal(results.state.counts.accepted, count); assert.equal(results.state.status, "partially_sent");
  assert.ok(Math.max(...f.db.writes) <= 103);
});
for (const [field, value, expected] of [["optOut", true, "optedOut"], ["marketingStatus", "excluded", "excluded"], ["phoneE164", "invalid", "invalid"]]) test(`${expected} suppressed at review and immediately before execution`, async () => {
  const f = fixture(); const [key, contact] = f.contact(); f.db.records.set(key, { ...contact, [field]: value });
  assert.equal((await f.sender.review(f.id, "send")).counts[expected], 1);
  const run = await f.start(); await f.drain(f.id, run.approvalId); assert.equal(f.calls.length, 1);
  const g = fixture(), approved = await g.start(), [k, c] = g.contact(); g.db.records.set(k, { ...c, [field]: value }); await g.drain(g.id, approved.approvalId); assert.equal(g.calls.length, 1);
});
test("same audience duplicate and cross-file campaign duplicate never send twice", async () => {
  const f = fixture(), [key, member] = f.member(); f.db.records.set(`${key}-copy`, member);
  assert.equal((await f.sender.review(f.id, "send")).counts.duplicates, 1);
  const run = await f.start(); await f.drain(f.id, run.approvalId); assert.equal(f.calls.length, 2);
  const other = f.audience("File C", 3); const review = await f.sender.review(other, "send"); assert.equal(review.counts.alreadySent, 2); assert.equal(review.counts.willSend, 1);
  const next = await f.start(other); await f.drain(other, next.approvalId); assert.equal(f.calls.length, 3);
  assert.equal((await f.sender.review(f.id, "send")).counts.willSend, 0);
});
test("double confirmation and concurrent workers are idempotent", async () => {
  const f = fixture(), review = await f.sender.review(f.id, "send");
  const [a, b] = await Promise.all([f.sender.start(review.token, review.confirmation), f.sender.start(review.token, review.confirmation)]); assert.equal(a.approvalId, b.approvalId);
  await Promise.all([f.sender.processChunk(f.id, a.approvalId), f.sender.processChunk(f.id, a.approvalId)]);
  await f.drain(f.id, a.approvalId); await f.drain(f.id, a.approvalId); assert.equal(f.calls.length, 2);
});
test("refresh/restart resumes only remaining recipients after new confirmation", async () => {
  const f = fixture(9), run = await f.start(); await f.sender.processChunk(f.id, run.approvalId); await f.sender.processChunk(f.id, run.approvalId); assert.equal(f.calls.length, 5);
  const resumed = await f.start(f.id, "resume"); await f.drain(f.id, resumed.approvalId); assert.equal(f.calls.length, 9);
});
test("pause finishes in-flight send and stops the next; resume is explicit", async () => {
  const f = fixture(9); f.provider(async () => { if (f.calls.length === 1) await f.sender.control(f.id, "pause"); return { messageId: `pause-${f.calls.length}` }; });
  const run = await f.start(); await f.drain(f.id, run.approvalId); assert.equal(f.calls.length, 1); assert.equal((await f.sender.state(f.id)).status, "paused");
  const resumed = await f.start(f.id, "resume"); await f.drain(f.id, resumed.approvalId); assert.equal(f.calls.length, 9);
});
test("partial failures continue; only explicit 429 rejection can be retried", async () => {
  const f = fixture(4); f.provider(async () => { if (f.calls.length === 1) throw { status: 429, message: "SECRET" }; if (f.calls.length === 2) throw { status: 400 }; if (f.calls.length === 3) throw Error("SECRET"); return { messageId: "ok" }; });
  const run = await f.start(); await f.drain(f.id, run.approvalId); const results = await f.sender.results(f.id);
  assert.equal(results.state.counts.failed, 2); assert.equal(results.state.counts.unknown, 1); assert.ok(!JSON.stringify([...f.db.records]).includes("SECRET"));
  assert.equal((await f.sender.review(f.id, "retry")).counts.willSend, 1);
  f.provider(async () => ({ messageId: "retry-ok" })); const retry = await f.start(f.id, "retry"); await f.drain(f.id, retry.approvalId); assert.equal(f.calls.length, 5);
  assert.equal((await f.sender.review(f.id, "retry")).counts.willSend, 0);
});
test("expired in-flight result becomes unknown and blocks resume", async () => {
  const f = fixture(), run = await f.start(); await f.sender.processChunk(f.id, run.approvalId);
  const [key, value] = [...f.db.records.entries()].find(([key]) => key.includes("/sendResults/"));
  const record = { ...value, status: "sending", attemptCount: 1, leaseUntil: 1, batchId: run.approvalId };
  f.db.records.set(key, record); f.db.records.set(`${collections.sends}/${record.sendId}`, record);
  const review = await f.sender.review(f.id, "resume"); assert.equal(review.counts.currentlyLocked, 1); assert.equal(review.counts.willSend, 1);
  const resumed = await f.start(f.id, "resume"); await f.drain(f.id, resumed.approvalId); assert.equal(f.calls.length, 1); assert.equal((await f.sender.results(f.id)).state.counts.unknown, 1);
});
test("webhook sent/delivered/read/failed updates and duplicate callbacks preserve counters", async () => {
  const f = fixture(), run = await f.start(); await f.drain(f.id, run.approvalId);
  for (const status of ["sent", "delivered", "read", "delivered", "failed"]) await f.sender.reconcile({ messageId: "mock-1", status });
  await f.sender.reconcile({ messageId: "mock-2", status: "failed", errorCode: "123" });
  let state = await f.sender.state(f.id); assert.equal(state.counts.read, 1); assert.equal(state.counts.failed, 1); assert.equal(state.status, "completed");
  await f.sender.reconcile({ messageId: "mock-2", status: "delivered" }); await f.sender.reconcile({ messageId: "mock-2", status: "delivered" });
  state = await f.sender.state(f.id); assert.equal(state.counts.deliveredTotal, 2); assert.equal(state.counts.failed, 0);
});
test("late provider delivery blocks retry; opt-out and exclusion stay unchanged", async () => {
  const f = fixture(1); f.provider(async () => { throw { status: 429 }; }); const run = await f.start(); await f.drain(f.id, run.approvalId);
  const [key, record] = [...f.db.records.entries()].find(([key]) => key.startsWith(`${collections.sends}/`)); f.db.records.set(key, { ...record, providerMessageId: "late" }); f.db.records.set("metaWhatsAppMessages/late", { status: "delivered" });
  assert.equal((await f.sender.review(f.id, "retry")).counts.willSend, 0);
  const [cKey, contact] = f.contact(); f.db.records.set(cKey, { ...contact, optOut: true, marketingStatus: "opted_out" }); assert.equal((await f.sender.review(f.id, "retry")).counts.optedOut, 1); assert.equal(f.db.records.get(cKey).optOut, true);
});
test("missing header or disabled gate blocks start and all provider execution", async () => {
  const f = fixture(); const gated = service.createCampaignSender({ db: f.db, signingSecret: () => "test", requireGate: async () => { throw Error("Campaign header image is missing."); }, sendTemplate: async () => { assert.fail("no provider call permitted"); } });
  const review = await gated.review(f.id, "send"); await assert.rejects(gated.start(review.token, review.confirmation), /header image is missing/); await assert.rejects(gated.processChunk(f.id, "invalid"), /header image is missing/);
  assert.equal(f.db.writes.length, 0); assert.equal(safety.campaignLiveEnabled(undefined), false); assert.equal(safety.campaignLiveEnabled("false"), false);
});
test("exact image template payload and no client-side provider credentials", () => {
  const payload = service.introductionMessage("+923020589999"); assert.equal(payload.name, "rentka_introduction_v1"); assert.equal(payload.languageCode, "en"); assert.deepEqual(payload.components, [{ type: "header", parameters: [{ type: "image", image: { link: "https://www.rentka.co/whatsapp/rentka-introduction-header.jpg" } }] }]);
  const client = readFileSync(new URL("../app/admin/whatsapp-campaigns/AudienceSender.tsx", import.meta.url), "utf8"); assert.doesNotMatch(client, /API_KEY|Authorization|process\.env|dualhook-whatsapp-config/);
});
test("cancel never resumes and confirmation is mandatory", async () => {
  const f = fixture(), review = await f.sender.review(f.id, "send"); await assert.rejects(f.sender.start(review.token, "SEND"), /exact confirmation/);
  const run = await f.start(); await f.sender.control(f.id, "cancel"); await f.drain(f.id, run.approvalId); assert.equal(f.calls.length, 0); await assert.rejects(f.start(f.id, "resume"), /cancelled/);
});

test("sender actions reject unauthenticated callers before storage", async () => {
  const actions = load("../app/admin/whatsapp-campaigns/send-actions.ts", { "../_lib/session": { hasAdminSession: async () => false }, "@/lib/whatsapp-campaigns/sender": { campaignSender: () => assert.fail("storage reached") }, "@/lib/whatsapp-campaigns/send-gate": {} });
  for (const action of Object.values(actions)) await assert.rejects(action("a", "send"), /Unauthorized/);
});
test("production gate verifies missing asset without enabling live sends", async () => {
  const gate = load("../src/lib/whatsapp-campaigns/send-gate.ts", { "server-only": {}, "node:fs/promises": { readFile: async () => { throw Error("ENOENT"); } }, "../messaging/dualhook-whatsapp-config": { getDualhookWhatsAppOutboundConfig: () => ({}) }, "./send-core": safety, "./template-preview": templatePreview, "./types": types });
  assert.ok((await gate.campaignSendGate()).blockers.includes("Campaign header image is missing."));
  await assert.rejects(gate.requireCampaignSendGate(), /Campaign header image is missing/);
});
test("callback before acceptance persistence is reconciled", async () => {
  const f = fixture(1); f.provider(async () => { f.db.records.set("metaWhatsAppMessages/early", { status: "read" }); return { messageId: "early" }; });
  const run = await f.start(); await f.drain(f.id, run.approvalId); const state = await f.sender.state(f.id);
  assert.equal(state.counts.read, 1); assert.equal(state.counts.acceptedTotal, 1); assert.equal(state.status, "completed");
});
test("removed membership never sends and is never recreated", async () => {
  const f = fixture(), run = await f.start(), [key] = f.member(); f.db.records.delete(key); await f.drain(f.id, run.approvalId);
  assert.equal(f.calls.length, 1); assert.equal(f.db.records.has(key), false);
});
test("existing webhook repositories reconcile campaign and dispatch on redelivery", async () => {
  for (const [file, method, event] of [
    ["meta-whatsapp-webhook-repository.ts", "persistMetaWhatsAppStatusEvents", { eventId: "e1", messageId: "m1", status: "read", timestamp: "1800000000" }],
    ["dualhook-whatsapp-webhook-repository.ts", "persistDualhookWebhookEvents", { eventId: "e2", messageId: "m2", status: "delivered", timestamp: "1800000000", eventType: "status", field: "messages", wabaId: "mock", phoneNumberId: "mock" }],
  ]) {
    const db = database(), campaigns = [], dispatch = [];
    db.records.set(`${file.startsWith("meta") ? "metaWhatsAppWebhookEvents" : "dualhookWhatsAppWebhookEvents"}/${event.eventId}`, { exists: true });
    const repo = load(`../src/lib/messaging/${file}`, { "server-only": {}, "firebase-admin/firestore": { FieldValue: {}, Timestamp: {} }, "../firebaseAdmin": { getAdminDb: () => db }, "./whatsapp-delivery-reconciliation": { reconcileWhatsAppDeliveryStatus: async event => { dispatch.push(event); } }, "../whatsapp-campaigns/sender": { reconcileCampaignDelivery: async event => { campaigns.push(event); } } });
    await repo[method]([event]); assert.equal(campaigns.length, 1); assert.equal(dispatch.length, 1); assert.equal(campaigns[0].status, event.status);
  }
});

test("lost persistence after provider acceptance becomes unknown and is not resent", async () => {
  const f = fixture(2), original = f.db.runTransaction.bind(f.db); let loseNextWrite = false;
  f.db.runTransaction = async work => { if (loseNextWrite) { loseNextWrite = false; throw Error("simulated worker interruption"); } return original(work); };
  f.provider(async () => { loseNextWrite = true; return { messageId: "accepted-but-not-persisted" }; });
  const run = await f.start(); await f.sender.processChunk(f.id, run.approvalId);
  await assert.rejects(f.sender.processChunk(f.id, run.approvalId), /simulated worker interruption/); assert.equal(f.calls.length, 1);
  f.advance(121000); const review = await f.sender.review(f.id, "resume"); assert.equal(review.counts.currentlyLocked, 1); assert.equal(review.counts.willSend, 1);
  f.provider(async () => ({ messageId: "remaining" })); const resumed = await f.start(f.id, "resume"); await f.drain(f.id, resumed.approvalId);
  const result = await f.sender.results(f.id); assert.equal(f.calls.length, 2); assert.equal(result.state.counts.unknown, 1); assert.equal(result.state.counts.accepted, 1); assert.equal(result.state.counts.pending, 0);
});
test("provider rate rejection backs off shared slot and attempts remain capped", async () => {
  const f = fixture(1); f.provider(async () => { throw { status: 429 }; });
  for (const mode of ["send", "retry", "retry"]) { const run = await f.start(f.id, mode); await f.drain(f.id, run.approvalId); f.advance(30000); }
  assert.equal(f.calls.length, 3); assert.equal((await f.sender.review(f.id, "retry")).counts.willSend, 0);
  assert.ok(f.db.records.get("whatsappCampaignSenderControl/provider").nextAllowedAt > 0);
});

test("review carries approved content and template changes invalidate confirmation", async () => {
  const f = fixture(), review = await f.sender.review(f.id, "send");
  assert.deepEqual(review.templatePreview, templatePreview.getTemplatePreview(types.INTRODUCTION));
  const preview = templatePreview.TEMPLATE_PREVIEWS["rentka_introduction_v1:en"], before = preview.bodyText;
  try { preview.bodyText = before + "\nChanged"; await assert.rejects(f.sender.start(review.token, review.confirmation), /template changed/); assert.equal(f.calls.length, 0); }
  finally { preview.bodyText = before; }
});
test("missing preview metadata blocks the server even with a correct typed confirmation", async () => {
  const f = fixture(), review = await f.sender.review(f.id, "send");
  const preview = templatePreview.TEMPLATE_PREVIEWS["rentka_introduction_v1:en"], before = preview.footerText;
  try { preview.footerText = ""; await assert.rejects(f.sender.start(review.token, review.confirmation), /preview metadata/); assert.throws(() => service.introductionMessage("+923020589999"), /preview metadata/); assert.equal(f.calls.length, 0); assert.equal(f.db.writes.length, 0); }
  finally { preview.footerText = before; }
});
