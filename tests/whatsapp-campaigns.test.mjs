import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as core from "../src/lib/whatsapp-campaigns/core.ts";
import * as types from "../src/lib/whatsapp-campaigns/types.ts";

const input = (phoneOriginal = "03020589999", extra = {}) => ({ displayName: "Example", phoneOriginal, source: "excel", sourceReferenceId: "", category: "unknown", notes: "", ...extra });
const contact = (extra = {}) => ({ ...input(), id: "a".repeat(64), phoneE164: "+923020589999", countryCode: "+92", sources: ["excel"], sourceReferences: [], marketingStatus: "eligible", optOut: false, optOutAt: null, lastSentAt: null, ...extra });

test("Pakistan variants deduplicate to canonical E.164 while originals survive", () => {
  for (const number of ["03020589999", "923020589999", "+923020589999", "00923020589999", "+92 (302) 058-9999"]) {
    assert.deepEqual(core.normalizeCampaignPhone(number), { phoneE164: "+923020589999", countryCode: "+92" });
    assert.equal(core.validateContact(input(number)).phoneOriginal, number);
  }
});
test("international validation uses country numbering metadata", () => {
  for (const number of ["+447911123456", "+971501234567", "+12025550123"]) assert.equal(core.normalizeCampaignPhone(number)?.phoneE164, number);
  for (const number of ["", "3020589999", "447911123456", "call +923020589999", "+923020589999 ext 1", "+999123456789", "+10000000000", "+0123456789", "+1234567890123456", "+92+3020589999"]) assert.equal(core.normalizeCampaignPhone(number), null, number);
});
test("validation rejects bad enum/length and drops unsolicited properties", () => {
  assert.throws(() => core.validateContact(input(undefined, { source: "scraped" })));
  assert.throws(() => core.validateContact(input(undefined, { notes: "x".repeat(1001) })));
  assert.equal(core.validateContact(input(undefined, { optOut: false, marketingStatus: "eligible" })).marketingStatus, undefined);
});
test("CSV preserves quotes, commas, multiline cells, BOM, CRLF and preview counts", () => {
  assert.deepEqual(core.parseCsv('\uFEFFName,Phone\r\n"Example, ""One""",03020589999\r\n"Two\nLines",+447911123456'), [["Name", "Phone"], ['Example, "One"', "03020589999"], ["Two\nLines", "+447911123456"]]);
  const preview = core.csvPreview("Name,Phone\nA,03020589999\nB,+923020589999\nC,nope\nD,+447911123456", "excel", new Set(["+923020589999"]));
  assert.deepEqual(preview.counts, { totalRows: 4, rowsWithPhoneNumbers: 4, contactsWithMultipleNumbers: 0, rowsWithoutPhoneNumbers: 0, validContacts: 3, invalidPhones: 1, duplicatesWithinFile: 1, duplicatesAlreadyInDatabase: 1, newContacts: 1 });
  assert.equal(preview.rows[0].input.category, "unknown");
});
test("malformed and oversized CSVs fail before database access", () => {
  for (const csv of ['Name,Phone\n"unfinished', 'Name,Phone\n"a"oops,123', 'Name,Phone\na"b,123', 'Other,Number\nA,123', 'Name,Phone']) assert.throws(() => core.csvPreview(csv, "excel"));
  assert.throws(() => core.parseCsv("x".repeat(core.MAX_CSV_BYTES + 1)));
  assert.throws(() => core.csvPreview("Name,Phone\n" + "A,03020589999\n".repeat(core.MAX_IMPORT_ROWS + 1), "excel"));
  assert.match(core.csvPreview("Name,Phone\nA,03020589999,extra", "excel").rows[0].error, /Column count/);
});
test("metadata merging cannot overwrite name, notes, category, source, opt-out or history", () => {
  const current = contact({ notes: "Reviewed", marketingStatus: "opted_out", optOut: true, category: "personal" });
  const patch = core.safeMissingMetadata(current, core.validateContact(input(undefined, { displayName: "Replacement", notes: "Replacement", source: "google_contacts", sourceReferenceId: "ref" })));
  assert.equal(patch.displayName, "Example"); assert.equal(patch.notes, "Reviewed");
  for (const field of ["category", "source", "marketingStatus", "optOut", "lastSentAt"]) assert.equal(patch[field], undefined);
  assert.deepEqual(patch.sources, ["excel", "google_contacts"]); assert.equal(patch.sourceReferences[0].referenceId, "ref");
});
test("dry-run suppresses opt-out, unreviewed, prior sends and duplicate phones", () => {
  const rows = [contact(), contact({ id: "b".repeat(64) }), contact({ id: "c", optOut: true }), contact({ id: "d", marketingStatus: "unreviewed" }), contact({ id: "e", lastSentAt: "today" })];
  assert.deepEqual(core.dryRunBatch(rows, new Set(), 1, 5).map(r => r.suppressed), [null, "duplicate_phone", "opted_out", "not_reviewed_as_eligible", "previously_sent"]);
  assert.equal(core.dryRunBatch([contact()], new Set([contact().id]), 0, 1)[0].suppressed, "already_sent_campaign");
  for (const [stage, limit] of [1, 20, 100, 500, 500, 500].entries()) assert.throws(() => core.dryRunBatch(Array(limit + 1).fill(contact()), new Set(), stage, limit + 1));
  assert.throws(() => core.dryRunBatch([contact()], new Set(), 0, 0));
  assert.throws(() => core.dryRunBatch([contact()], new Set(), 6, 1));
});

// Execute real server modules with explicit in-memory dependencies, never production Firebase.
const require = createRequire(import.meta.url);
function load(relative, mocks) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)(name => name in mocks ? mocks[name] : require(name), loaded, loaded.exports);
  return loaded.exports;
}
function database() {
  const records = new Map(); let sequence = 0, tail = Promise.resolve();
  const metrics = { reads: [], writes: [], active: 0, maxActive: 0, attempts: 0, failAt: 0 };
  const ref = path => ({ id: path.split("/").at(-1), path, collection: name => collection(`${path}/${name}`), get: async () => snapshot(ref(path)) });
  const snapshot = r => ({ ...r, ref: r, exists: records.has(r.path), data: () => records.get(r.path) });
  function collection(path, conditions = []) {
    const query = { path, isQuery: true, conditions, doc: id => ref(`${path}/${id ?? `event-${++sequence}`}`),
      where: (field, operator, value) => collection(path, [...conditions, { field, operator, value }]),
      orderBy: () => query, get: async () => querySnapshot(query) };
    return query;
  }
  function querySnapshot(query) {
    const docs = [...records.entries()].filter(([path, data]) => path.startsWith(query.path + "/") && path.split("/").length === query.path.split("/").length + 1 && query.conditions.every(c => c.operator === "==" ? data[c.field] === c.value : data[c.field]?.includes(c.value))).map(([path]) => snapshot(ref(path)));
    return { docs, empty: !docs.length, size: docs.length };
  }
  const getAll = async (...refs) => { metrics.reads.push(refs.length); return refs.map(snapshot); };
  return { records, collection, metrics, getAll, runTransaction(work) {
    metrics.active++; metrics.maxActive = Math.max(metrics.maxActive, metrics.active);
    const task = tail.then(async () => {
      metrics.attempts++;
      if (metrics.attempts === metrics.failAt) throw Error("Injected interruption");
      const writes = [];
      const result = await work({ get: async r => r.isQuery ? querySnapshot(r) : snapshot(r), getAll,
        create: (r, data) => { if (records.has(r.path)) throw Error("already exists"); writes.push(() => records.set(r.path, data)); },
        update: (r, data) => writes.push(() => records.set(r.path, { ...records.get(r.path), ...data })),
        delete: r => writes.push(() => records.delete(r.path)) });
      assert.ok(writes.length <= 401, "transaction stays within bounded write count");
      metrics.writes.push(writes.length); writes.forEach(write => write()); return result;
    }).finally(() => { metrics.active--; });
    tail = task.catch(() => {}); return task;
  } };
}function repository(db) { return load("../src/lib/whatsapp-campaigns/repository.ts", { "server-only": {}, "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => "2026-09-09T00:00:00Z" } }, "../firebaseAdmin": { getAdminDb: () => db }, "./core": core, "./types": types }); }
test("transaction imports are idempotent, bounded and deduplicate simultaneous requests", async () => {
  const db = database(), repo = repository(db);
  const results = await Promise.all([repo.importContacts([input(), input("+923020589999")], "1".repeat(64)), repo.importContacts([input("923020589999")], "2".repeat(64))]);
  assert.equal(results.reduce((sum, r) => sum + r.created, 0), 1);
  assert.equal((await repo.importContacts([input()], "1".repeat(64))).duplicate, true);
  const saved = db.records.get(`whatsappCampaignContacts/${repo.contactIdForPhone("+923020589999")}`);
  assert.equal(saved.marketingStatus, "eligible"); assert.equal(saved.optOut, false);
  await assert.rejects(repo.importContacts(Array(201).fill(input()), "3".repeat(64)));
  await assert.rejects(repo.importContacts([input(), input("bad")], "4".repeat(64)));
  assert.equal(db.records.has(`whatsappCampaignImports/${"4".repeat(64)}`), false);
});
test("reviews and imports cannot undo opt-out; eligible audiences create only idempotent drafts", async () => {
  const db = database(), repo = repository(db), id = repo.contactIdForPhone("+923020589999"), draft = "12345678-1234-1234-1234-123456789abc";
  await repo.importContacts([input()], "1".repeat(64));
  assert.equal(db.records.get(`whatsappCampaignContacts/${id}`).marketingStatus, "eligible");
  await repo.reviewContact(id, "eligible");
  assert.equal(await repo.createDraft([id], draft), draft);
  assert.equal(await repo.createDraft([id], draft), draft);
  assert.equal(db.records.get(`whatsappCampaigns/${draft}`).status, "draft");
  await repo.reviewContact(id, "opted_out");
  await repo.importContacts([input(undefined, { source: "manual" })], "2".repeat(64));
  assert.equal(db.records.get(`whatsappCampaignContacts/${id}`).optOut, true);
  await assert.rejects(repo.reviewContact(id, "eligible"), /permanent/);
  await assert.rejects(repo.createDraft([id], "22345678-1234-1234-1234-123456789abc"));
  assert.equal([...db.records.keys()].some(key => key.startsWith("whatsappCampaignSends")), false);
});
test("every exposed action rejects unauthenticated access before any data operation", async () => {
  const actions = load("../app/admin/whatsapp-campaigns/actions.ts", { "next/cache": { revalidatePath() { throw Error("unexpected"); } }, "../_lib/session": { hasAdminSession: async () => false }, "@/lib/whatsapp-campaigns/core": core, "@/lib/whatsapp-campaigns/repository": {}, "@/lib/whatsapp-campaigns/import-review": {}, "@/lib/whatsapp-campaigns/file-audiences": {}, "@/lib/whatsapp-campaigns/types": types });
  for (const action of Object.values(actions)) await assert.rejects(action(), /Unauthorized/);
});
test("signed review binds CSV and source; tampering and expiry fail", () => {
  const old = process.env.RENTKA_ADMIN_PASSWORD; process.env.RENTKA_ADMIN_PASSWORD = "unit-test-only";
  try {
    const review = load("../src/lib/whatsapp-campaigns/import-review.ts", { "server-only": {} });
    const token = review.issueReview("Name,Phone\nA,03020589999", "excel");
    assert.match(review.verifyReview("Name,Phone\nA,03020589999", "excel", token), /^[a-f0-9]{64}$/);
    assert.throws(() => review.verifyReview("different", "excel", token));
    assert.throws(() => review.verifyReview("Name,Phone\nA,03020589999", "manual", token));
    assert.throws(() => review.verifyReview("Name,Phone\nA,03020589999", "excel", token.slice(0, -2) + "xx"));
    assert.throws(() => review.verifyReview("Name,Phone\nA,03020589999", "excel", "1." + token.split(".").slice(1).join(".")));
  } finally { if (old === undefined) delete process.env.RENTKA_ADMIN_PASSWORD; else process.env.RENTKA_ADMIN_PASSWORD = old; }
});

test("preparation helper returns IMAGE payload without credentials or network access", () => {
  let calls = 0;
  const helper = load("../src/lib/whatsapp-campaigns/dualhook.ts", {
    "server-only": {},
    "../messaging/dualhook-whatsapp-config": { getDualhookWhatsAppOutboundConfig: () => ({ apiKey: "test-secret", phoneNumberId: "12345" }) },
    "../messaging/dualhook-whatsapp-outbound-core": {
      requireDualhookOutboundConfig: config => config,
      dualhookMessagesUrl: id => `https://api.dualhook.com/v25.0/${id}/messages`,
      dualhookTemplatePayload: message => { calls++; return message; },
    }, "./core": core, "./types": types,
  });
  const request = helper.prepareIntroductionTemplate("03020589999");
  assert.equal(request.sendingEnabled, false);
  assert.equal(request.payload.name, "rentka_introduction_v1");
  assert.equal(request.payload.components[0].parameters[0].image.link, types.INTRODUCTION.headerImageUrl);
  assert.equal(JSON.stringify(request).includes("test-secret"), false);
  assert.equal(calls, 1);
  assert.throws(() => helper.prepareIntroductionTemplate("bad"));
  const source = readFileSync(new URL("../src/lib/whatsapp-campaigns/dualhook.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(|\.sendTemplate\s*\(|\.sendText\s*\(/);
});

const googleFixture = readFileSync(new URL("./fixtures/google-contacts-standard.csv", import.meta.url), "utf8");
test("standard Google export detects names, all phone columns and all required counts", () => {
  const preview = core.csvPreview(googleFixture, "excel", new Set(["+447911123456"]));
  assert.equal(preview.format, "google_contacts"); assert.equal(preview.source, "google_contacts");
  assert.deepEqual(preview.counts, { totalRows: 4, rowsWithPhoneNumbers: 3, validContacts: 4, invalidPhones: 1, duplicatesWithinFile: 1, duplicatesAlreadyInDatabase: 1, newContacts: 2, contactsWithMultipleNumbers: 2, rowsWithoutPhoneNumbers: 1 });
  assert.deepEqual(preview.rows.filter(r => r.row === 2).map(r => [r.input.displayName, r.input.phoneOriginal, r.phoneE164]), [["Sample One", "03020589999", "+923020589999"], ["Sample One", "+447911123456", "+447911123456"]]);
  assert.ok(preview.rows.every(r => r.input.source === "google_contacts"));
  assert.equal(preview.rows.find(r => r.noPhone).error, "No phone number; row skipped.");
});
test("legacy Google names, name fallbacks and arbitrary numbered phone columns work", () => {
  const csv = 'Name,Given Name,Additional Name,Family Name,File As,Nickname,Organization 1 - Name,Phone 12 - Value\nPreferred,Given,Middle,Family,,,,+12025550123\n,Given,Middle,Family,,,,+12025550124\n,,,,Filed,,,03020589999\n,,,,,Nick,,03020589998\n,,,,,,Company,03020589997';
  assert.deepEqual(core.csvPreview(csv, "other").rows.map(r => r.input.displayName), ["Preferred", "Given Middle Family", "Filed", "Nick", "Company"]);
});
test("Google multi-value cells expand every phone and preserve single-cell originals", () => {
  const preview = core.csvPreview('First Name,Phone 1 - Value,Phone 3 - Value\nSample,03020589999 ::: +447911123456," +92 (302) 058-9999 "', "google_contacts");
  assert.equal(preview.rows.length, 3); assert.equal(preview.counts.duplicatesWithinFile, 1);
  assert.equal(preview.rows[2].input.phoneOriginal, " +92 (302) 058-9999 ");
  assert.equal(preview.counts.contactsWithMultipleNumbers, 1);
});
test("email-only exports and invalid phones cannot produce importable contacts", async () => {
  const preview = core.csvPreview('First Name,Last Name,E-mail 1 - Value\nEmail,Only,example@example.invalid', "excel");
  assert.equal(preview.counts.validContacts, 0); assert.equal(preview.counts.rowsWithoutPhoneNumbers, 1);
  const bad = core.csvPreview('First Name,Phone 1 - Value\nA,123\nB,+999123456789', "excel");
  assert.equal(bad.counts.invalidPhones, 2); assert.equal(bad.counts.newContacts, 0);
  const db = database(); await assert.rejects(repository(db).importContactsInChunks([], "a".repeat(64)));
  assert.equal(db.records.size, 0);
});
test("invalid/skipped report includes reasons and neutralizes spreadsheet formulas", async () => {
  const { importErrorCsv, previewResult } = await import("../src/lib/whatsapp-campaigns/csv.ts");
  const preview = core.csvPreview('First Name,Phone 1 - Value\n=FORMULA,invalid\nNoPhone,', "excel");
  const report = importErrorCsv(preview.rows);
  assert.ok(report.includes("'=FORMULA")); assert.ok(report.includes("No phone number; row skipped."));
  assert.deepEqual(preview.rows.map(previewResult), ["Invalid", "Invalid"]);
});
const largeGoogle = count => 'First Name,Last Name,Phone 1 - Label,Phone 1 - Value\n' + Array.from({ length: count }, (_, i) => `Sample,${i},Mobile,0302${1000000 + i}`).join('\n');
test("2,400-row import uses sequential bounded server transactions and retries without new writes", async () => {
  const preview = core.csvPreview(largeGoogle(2400), "excel"), db = database(), repo = repository(db);
  assert.equal(preview.counts.newContacts, 2400);
  const inputs = preview.rows.map(r => r.input), key = "c".repeat(64);
  const result = await repo.importContactsInChunks(inputs, key);
  assert.equal(result.created, 2400); assert.equal(result.chunks, 12); assert.equal(db.metrics.maxActive, 1);
  assert.equal(Math.max(...db.metrics.writes), 401);
  assert.ok([...db.records.entries()].filter(([key]) => /^whatsappCampaignContacts\/[^/]+$/.test(key)).every(([, value]) => value.marketingStatus === "eligible" && value.source === "google_contacts"));
  const size = db.records.size;
  const repeat = await repo.importContactsInChunks(inputs, key);
  assert.equal(repeat.reusedChunks, 12); assert.equal(db.records.size, size);
  const existing = await repo.existingPhones(preview.rows.map(r => r.phoneE164));
  assert.equal(existing.size, 2400); assert.ok(Math.max(...db.metrics.reads) <= 200);
});
test("interrupted multi-chunk import resumes and preserves opt-out", async () => {
  const db = database(), repo = repository(db), preview = core.csvPreview(largeGoogle(450), "excel"), key = "d".repeat(64);
  db.metrics.failAt = 2;
  await assert.rejects(repo.importContactsInChunks(preview.rows.map(r => r.input), key), /interruption/);
  assert.equal([...db.records.keys()].filter(key => /^whatsappCampaignContacts\/[^/]+$/.test(key)).length, 200);
  const id = repo.contactIdForPhone(preview.rows[0].phoneE164);
  await repo.reviewContact(id, "opted_out");
  const resumed = await repo.importContactsInChunks(preview.rows.map(r => r.input), key);
  assert.equal(resumed.created, 450); assert.equal(resumed.reusedChunks, 1);
  assert.equal(db.records.get(`whatsappCampaignContacts/${id}`).optOut, true);
  // A different file importing the same number also cannot undo suppression.
  await repo.importContactsInChunks([preview.rows[0].input], "e".repeat(64));
  assert.equal(db.records.get(`whatsappCampaignContacts/${id}`).marketingStatus, "opted_out");
});
test("bad input anywhere in a chunked import is rejected before any write", async () => {
  const db = database(), repo = repository(db);
  await assert.rejects(repo.importContactsInChunks([...core.csvPreview(largeGoogle(201), "excel").rows.map(r => r.input), input("bad")], "f".repeat(64)));
  assert.equal(db.records.size, 0);
  assert.throws(() => core.csvPreview('Name,Phone,Phone\nA,03020589999,03020589998', "excel"), /Duplicate column/);
});
test("preview actions never write, confirmation requires review, same CSV with fresh preview stays idempotent", async () => {
  const old = process.env.RENTKA_ADMIN_PASSWORD; process.env.RENTKA_ADMIN_PASSWORD = "test-review-key";
  try {
    const db = database(), repo = repository(db), review = load("../src/lib/whatsapp-campaigns/import-review.ts", { "server-only": {} });
    const fileRepo = fileRepository(db, repo);
    const details = { uploadId: "12345678-1234-1234-1234-123456789abc", audienceName: "Google Sample", originalFilename: "google.csv" };
    const actions = load("../app/admin/whatsapp-campaigns/actions.ts", { "@/lib/whatsapp-campaigns/file-audiences": fileRepo, "next/cache": { revalidatePath() {} }, "../_lib/session": { hasAdminSession: async () => true }, "@/lib/whatsapp-campaigns/core": core, "@/lib/whatsapp-campaigns/repository": repo, "@/lib/whatsapp-campaigns/import-review": review });
    const preview = await actions.previewImport(googleFixture, "excel", details);
    assert.equal(db.records.size, 0);
    await assert.rejects(actions.confirmImport(googleFixture, "excel", "bad-token", details));
    assert.equal(db.records.size, 0);
    await actions.confirmImport(googleFixture, "excel", preview.token, details);
    assert.equal([...db.records.keys()].filter(key => /^whatsappCampaignContacts\/[^/]+$/.test(key)).length, 3);
    const size = db.records.size;
    const next = await actions.previewImport(googleFixture, "excel", details);
    assert.notEqual(next.token, preview.token);
    assert.equal(next.counts.newContacts, 0); assert.equal(next.counts.duplicatesAlreadyInDatabase, 3);
    const result = await actions.confirmImport(googleFixture, "excel", next.token, details);
    assert.equal(result.reusedChunks, 1); assert.equal(db.records.size, size);
  } finally { if (old === undefined) delete process.env.RENTKA_ADMIN_PASSWORD; else process.env.RENTKA_ADMIN_PASSWORD = old; }
});

function fileRepository(db, repo = repository(db)) {
  return load("../src/lib/whatsapp-campaigns/file-audiences.ts", { "server-only": {}, "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => "2026-09-09T00:00:00Z" } }, "../firebaseAdmin": { getAdminDb: () => db }, "./core": core, "./csv": { csvPreview: core.csvPreview }, "./repository": repo, "./types": types });
}
const fileDetails = (name, n) => ({ uploadId: `${String(n).padStart(8, "0")}-1234-1234-1234-123456789abc`, audienceName: name, originalFilename: `${name.replaceAll(" ", "_")}.csv` });
const namedCsv = (start, count) => 'First Name,Phone 1 - Value\n' + Array.from({ length: count }, (_, i) => `Example ${i},0302${start + i}`).join('\n');
const contactRecords = db => [...db.records.entries()].filter(([path]) => /^whatsappCampaignContacts\/[^/]+$/.test(path)).map(([, data]) => data);
async function importFile(files, csv, details) { return files.confirmFileImport(core.csvPreview(csv, "google_contacts"), csv, details); }

test("File A/B/C retain independent memberships and correct history counts", async () => {
  const db = database(), files = fileRepository(db);
  const csvA = namedCsv(1000000, 2), csvB = namedCsv(2000000, 50);
  const csvC = namedCsv(3000000, 99) + '\nShared,03021000000\nRepeated,03021000000\nInvalid,bad';
  const a = await importFile(files, csvA, fileDetails("File A", 1));
  const b = await importFile(files, csvB, fileDetails("File B", 2));
  const c = await importFile(files, csvC, fileDetails("File C", 3));
  const history = await files.listFileAudiences();
  assert.deepEqual(history.map(group => [group.audienceName, group.validCount, group.members.length]), [["File A", 2, 2], ["File B", 50, 50], ["File C", 100, 100]]);
  const fileC = history.find(group => group.audienceId === c.audienceId);
  assert.equal(fileC.totalRows, 102); assert.equal(fileC.newContactCount, 99); assert.equal(fileC.existingContactCount, 1); assert.equal(fileC.duplicateCount, 1); assert.equal(fileC.invalidCount, 1);
  assert.equal(fileC.eligibleCount, 100); assert.equal(fileC.suppressedCount, 0); assert.equal(fileC.status, "ready");
  const contacts = contactRecords(db);
  assert.equal(contacts.length, 151); assert.ok(contacts.every(contact => contact.marketingStatus === "eligible" && contact.source === "google_contacts"));
  for (const [id, count] of [[a.audienceId, 2], [b.audienceId, 50], [c.audienceId, 100]]) assert.equal(core.contactsForAudience(contacts, history.find(group => group.audienceId === id).members).length, count);
  const shared = repository(db).contactIdForPhone("+923021000000");
  assert.equal(history.filter(group => group.members.some(member => member.contactId === shared)).length, 2);
  assert.equal(contacts.find(contact => contact.id === shared).displayName, "Example 0");
  // Retry is the same audience; selecting the same CSV again may intentionally create another named audience.
  const size = db.records.size;
  await importFile(files, csvA, fileDetails("File A", 1)); assert.equal(db.records.size, size);
  await importFile(files, csvA, fileDetails("File A again", 4)); assert.equal(contactRecords(db).length, 151);
});
test("contact removal preserves independent audiences and historical sends", async () => {
  const db = database(), repo = repository(db), files = fileRepository(db, repo);
  const csv = 'First Name,Phone 1 - Value\nAsad,03020589999\nAsad duplicate,+923020589999';
  const a = await importFile(files, csv, fileDetails("Corporate Clients", 41));
  const b = await importFile(files, csv, fileDetails("Islamabad Leads", 42));
  const id = repo.contactIdForPhone("+923020589999");
  const before = await files.listFileAudiences();
  assert.equal(before.find(x => x.audienceId === a.audienceId).members.length, 1, "same-file duplicate is prevented");
  assert.equal(before.find(x => x.audienceId === b.audienceId).members.length, 1, "same number across files is allowed");
  assert.equal(core.fileAudience(contactRecords(db), before.find(x => x.audienceId === a.audienceId).members, "campaign-a").finalEligible, 1);
  assert.equal(core.fileAudience(contactRecords(db), before.find(x => x.audienceId === b.audienceId).members, "campaign-b").finalEligible, 1);

  db.records.set("whatsappCampaignSends/history-a", { campaignId: "campaign-a", contactId: id, phoneE164: "+923020589999", status: "delivered" });
  const afterCampaignA = core.fileAudience(contactRecords(db), before.find(x => x.audienceId === b.audienceId).members, "campaign-b", new Set());
  assert.equal(afterCampaignA.finalEligible, 1, "Campaign A send does not block Campaign B");

  await files.removeContactFromAudience(a.audienceId, id);
  assert.equal(db.records.has(`whatsappCampaignAudiences/${a.audienceId}/members/${id}`), false);
  assert.equal(db.records.has(`whatsappCampaignAudiences/${b.audienceId}/members/${id}`), true);
  assert.equal(db.records.has(`whatsappCampaignContacts/${id}`), true);
  assert.equal(db.records.has("whatsappCampaignSends/history-a"), true);

  assert.equal(await files.contactMembershipCount(id), 1);
  const deleteDb = database(), deleteRepo = repository(deleteDb), deleteFiles = fileRepository(deleteDb, deleteRepo);
  const deleteA = await importFile(deleteFiles, 'First Name,Phone 1 - Value\nAsad,03020589999', fileDetails("Corporate Clients", 43));
  const deleteB = await importFile(deleteFiles, 'First Name,Phone 1 - Value\nAsad,03020589999', fileDetails("Islamabad Leads", 44));
  const deleteId = deleteRepo.contactIdForPhone("+923020589999");
  deleteDb.records.set("whatsappCampaignSends/history-a", { campaignId: "campaign-a", contactId: deleteId, phoneE164: "+923020589999", status: "delivered" });
  assert.equal(await deleteFiles.contactMembershipCount(deleteId), 2);
  const result = await deleteFiles.deleteContactAndMemberships(deleteId);
  assert.equal(result.membershipsRemoved, 2);
  assert.equal(deleteDb.records.has(`whatsappCampaignContacts/${deleteId}`), false);
  assert.equal(deleteDb.records.has(`whatsappCampaignAudiences/${deleteA.audienceId}/members/${deleteId}`), false);
  assert.equal(deleteDb.records.has(`whatsappCampaignAudiences/${deleteB.audienceId}/members/${deleteId}`), false);
  assert.equal(deleteDb.records.has("whatsappCampaignSends/history-a"), true, "historical send remains intact");
});
test("file approval is separate from legacy status and never reverses excluded or opted-out contacts", async () => {
  const db = database(), repo = repository(db), files = fileRepository(db, repo), csv = namedCsv(1000000, 3);
  await repo.importContacts(core.csvPreview(csv, "google_contacts").rows.map(row => row.input), "1".repeat(64));
  const ids = core.csvPreview(csv, "google_contacts").rows.map(row => repo.contactIdForPhone(row.phoneE164));
  await repo.reviewContact(ids[0], "opted_out"); await repo.reviewContact(ids[1], "excluded"); await repo.reviewContact(ids[2], "unreviewed");
  const result = await importFile(files, csv, fileDetails("Protected", 5));
  const audience = (await files.listFileAudiences())[0];
  assert.equal(audience.eligibleCount, 1); assert.equal(audience.suppressedCount, 2);
  assert.equal(db.records.get(`whatsappCampaignContacts/${ids[0]}`).optOut, true);
  assert.equal(db.records.get(`whatsappCampaignContacts/${ids[1]}`).marketingStatus, "excluded");
  assert.equal(db.records.get(`whatsappCampaignContacts/${ids[2]}`).marketingStatus, "unreviewed");
  const checked = await files.previewFileAudience(result.audienceId, fileDetails("", 90).uploadId);
  assert.equal(checked.finalEligible, 1); assert.equal(checked.suppressedCount, 2);
});
test("file draft creation preserves its name and rechecks opt-out and same-campaign locks", async () => {
  const db = database(), repo = repository(db), files = fileRepository(db, repo);
  const imported = await importFile(files, namedCsv(1000000, 50), fileDetails("File B", 10));
  const campaignId = fileDetails("", 91).uploadId;
  const first = await files.previewFileAudience(imported.audienceId, campaignId);
  assert.equal(first.fileContacts, 50); assert.equal(first.finalEligible, 50);
  const contact = contactRecords(db)[0]; await repo.reviewContact(contact.id, "opted_out");
  await assert.rejects(files.createDraftFromFile(imported.audienceId, campaignId, first.fingerprint), /changed/);
  const secondContact = contactRecords(db)[1];
  db.records.set(`whatsappCampaignSends/${repo.campaignSendId(campaignId, secondContact.phoneE164)}`, { campaignId, phoneE164: secondContact.phoneE164, status: "outcome_unknown" });
  const second = await files.previewFileAudience(imported.audienceId, campaignId);
  assert.equal(second.suppressedCount, 2); assert.equal(second.finalEligible, 48);
  await files.createDraftFromFile(imported.audienceId, campaignId, second.fingerprint);
  const draft = db.records.get(`whatsappCampaigns/${campaignId}`);
  assert.equal(draft.audienceCount, 48); assert.equal(draft.audienceMode, "file"); assert.equal(draft.sourceAudienceId, imported.audienceId);
  assert.deepEqual(draft.audienceSources, [{ audienceId: imported.audienceId, audienceName: "File B", importedCount: 50, eligibleCount: 48, suppressedCount: 2 }]);
  assert.equal(draft.status, "draft");
  const size = db.records.size; await files.createDraftFromFile(imported.audienceId, campaignId, second.fingerprint); assert.equal(db.records.size, size);
});
test("invalid and duplicate normalized file members are suppressed without touching send history", () => {
  const c = contact({ lastCampaignId: "another-campaign", lastSentAt: "yesterday", marketingStatus: "sent" });
  const duplicate = { ...c, id: "b".repeat(64) };
  const invalid = { ...c, id: "c".repeat(64), phoneE164: "invalid" };
  const members = [c, duplicate, invalid].map(contact => ({ audienceId: "file", contactId: contact.id, phoneE164: contact.phoneE164, eligibilityAtImport: true, suppressionReason: null, sendStatus: "not_sent" }));
  const result = core.fileAudience([c, duplicate, invalid], members, "new-campaign");
  assert.equal(result.finalEligible, 1); assert.deepEqual(result.suppressed.map(item => item.reason), ["duplicate_phone", "invalid_phone"]);
  assert.equal(core.fileAudience([c], [members[0]], "another-campaign").finalEligible, 0);
  assert.equal(c.lastSentAt, "yesterday");
});
test("file name is required and signed preview binds name and original filename", () => {
  const files = fileRepository(database()), details = fileDetails("File A", 20);
  assert.throws(() => files.validateImportDetails({ ...details, audienceName: " " }), /required/);
  const old = process.env.RENTKA_ADMIN_PASSWORD; process.env.RENTKA_ADMIN_PASSWORD = "test-key";
  try {
    const review = load("../src/lib/whatsapp-campaigns/import-review.ts", { "server-only": {} });
    const context = files.importReviewContext(details), token = review.issueReview("csv", "excel", context);
    assert.throws(() => review.verifyReview("csv", "excel", token, files.importReviewContext({ ...details, audienceName: "File C" })));
    assert.throws(() => review.verifyReview("csv", "excel", token, files.importReviewContext({ ...details, originalFilename: "other.csv" })));
  } finally { if (old === undefined) delete process.env.RENTKA_ADMIN_PASSWORD; else process.env.RENTKA_ADMIN_PASSWORD = old; }
});
test("file import interruption resumes memberships and counters without double counting", async () => {
  const db = database(), files = fileRepository(db), csv = namedCsv(1000000, 2400), details = fileDetails("Large File", 30);
  // First transaction creates the file, second commits the first 100 memberships, third fails.
  db.metrics.failAt = 3;
  await assert.rejects(importFile(files, csv, details), /interruption/);
  let audience = (await files.listFileAudiences())[0];
  assert.equal(audience.members.length, 100); assert.equal(audience.processedCount, 100); assert.equal(audience.importState, "interrupted");
  await importFile(files, csv, details);
  audience = (await files.listFileAudiences())[0];
  assert.equal(audience.validCount, 2400); assert.equal(audience.newContactCount, 2400); assert.equal(audience.eligibleCount, 2400); assert.equal(audience.members.length, 2400);
  assert.equal(audience.status, "ready"); assert.equal(db.metrics.maxActive, 1); assert.ok(Math.max(...db.metrics.writes) <= 302);
});
