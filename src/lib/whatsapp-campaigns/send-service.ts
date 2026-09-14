import { getTemplatePreview, requireTemplatePreview } from "./template-preview";
import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { WhatsAppTemplateMessage } from "../messaging/whatsapp-outbound-provider";
import { normalizeCampaignPhone } from "./core";
import { COLLECTIONS, campaignSendId } from "./repository";
import { INTRODUCTION, type AudienceMembership, type Contact, type FileAudience } from "./types";
import { changeCounts, completionState, confirmationText, deliveryState, emptyCounts, LEASE_MS, PREPARE_CHUNK_SIZE, PROVIDER_SPACING_MS, recipientSuppression, safeProviderFailure, SEND_CHUNK_SIZE } from "./send-core";
import { INTRODUCTION_CAMPAIGN_ID, type ManifestEntry, type SendMode, type SendRecord, type SendRun, type SendSummary } from "./send-types";

type Dependencies = {
  db: Firestore; requireGate(): Promise<unknown>; signingSecret(): string;
  sendTemplate(message: WhatsAppTemplateMessage): Promise<{ messageId: string }>;
  now?: () => number; sleep?: (ms: number) => Promise<void>;
};
type Approval = { audienceId: string; approvalId: string; mode: SendMode; fingerprint: string; count: number; name: string; expires: number };
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const actor = { type: "shared_admin_session" };
const positive = (status: string) => ["accepted", "sent", "delivered", "read"].includes(status);
const pageId = (index: number) => String(index).padStart(6, "0");
const validAudienceId = (id: string) => { if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("Invalid audience."); };
export function introductionMessage(phone: string): WhatsAppTemplateMessage {
  const normalized = normalizeCampaignPhone(phone);
  if (!normalized) throw new Error("Invalid campaign recipient.");
  const preview = requireTemplatePreview(INTRODUCTION);
  return { to: normalized.phoneE164.slice(1), name: preview.templateName, languageCode: preview.language, components: [{ type: "header", parameters: [{ type: "image", image: { link: preview.headerImageUrl } }] }] };
}

/** No network is reachable except through the injected provider after the live gate. */
export function createCampaignSender(deps: Dependencies) {
  const db = deps.db, now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? (ms => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const iso = () => new Date(now()).toISOString();
  const audienceRef = (id: string) => db.collection(COLLECTIONS.audiences).doc(id);
  const runRef = (id: string) => audienceRef(id).collection("sendControl").doc("current");
  const resultRef = (id: string, memberId: string) => audienceRef(id).collection("sendResults").doc(memberId);
  const ledgerRef = (phone: string) => db.collection(COLLECTIONS.sends).doc(campaignSendId(INTRODUCTION_CAMPAIGN_ID, phone));
  const slotRef = db.collection("whatsappCampaignSenderControl").doc("provider");
  const summary = (run: SendRun): SendSummary => ({ campaignId: run.campaignId, status: run.status, counts: run.counts, targetCount: run.targetCount, lastSendAt: run.lastSendAt, phase: run.phase, approvalId: run.approvalId });
  function saveRun(tx: Transaction, run: SendRun, previousStatus?: string) {
    run.status = completionState(run);
    tx.set(runRef(run.audienceId), run);
    tx.update(audienceRef(run.audienceId), { sendState: summary(run) });
    if (run.status === "completed" && previousStatus !== "completed") audit(tx, run.audienceId, "campaign_completed", { campaignId: run.campaignId, counts: run.counts }, `completed-${run.approvalId}`);
  }
  function audit(tx: Transaction, id: string, type: string, metadata: Record<string, unknown>, eventId?: string) {
    tx.set(audienceRef(id).collection("events").doc(eventId ?? randomUUID()), { type, timestamp: iso(), actor, metadata: { audienceId: id, ...metadata } });
  }
  function saveResult(tx: Transaction, run: SendRun, previous: SendRecord | undefined, record: SendRecord) {
    run.counts = changeCounts(run.counts, previous, record);
    tx.set(resultRef(record.audienceId, record.membershipId), record);

  }
  const sign = (value: string) => {
    const key = deps.signingSecret(); if (!key) throw new Error("Admin authentication is not configured.");
    return createHmac("sha256", key).update(`campaign-send:${value}`).digest("hex");
  };
  function decode(token: string): Approval {
    if (typeof token !== "string" || token.length > 3000) throw new Error("Invalid send review.");
    const [body, supplied, extra] = token.split(".");
    if (extra || !body || !/^[a-f0-9]{64}$/.test(supplied ?? "") || !timingSafeEqual(Buffer.from(sign(body)), Buffer.from(supplied))) throw new Error("Invalid send review.");
    const approval = JSON.parse(Buffer.from(body, "base64url").toString()) as Approval;
    validAudienceId(approval.audienceId);
    if (!Number.isFinite(approval.expires) || approval.expires < now() || !["send", "resume", "retry"].includes(approval.mode)) throw new Error("Send review expired. Review again.");
    return approval;
  }

  async function plan(id: string, mode: SendMode, tx?: Transaction) {
    validAudienceId(id);
    const ref = audienceRef(id), a = tx ? await tx.get(ref) : await ref.get();
    const audience = a.data() as FileAudience | undefined;
    if (!audience || audience.importState !== "completed" || audience.status === "cancelled") throw new Error("Audience is not ready.");
    const query = ref.collection("members").orderBy("__name__");
    const members = tx ? await tx.get(query) : await query.get();
    const resultsQuery = ref.collection("sendResults"), resultDocs = tx ? await tx.get(resultsQuery) : await resultsQuery.get();
    const results = new Map(resultDocs.docs.map(doc => [doc.id, doc.data() as SendRecord]));
    const contacts = new Map<string, Contact>(), ledgers = new Map<string, SendRecord>();
    const entries = members.docs.map(doc => ({ id: doc.id, member: doc.data() as AudienceMembership }));
    const contactIds = [...new Set(entries.map(e => e.member.contactId).filter(id => typeof id === "string" && /^[a-f0-9]{64}$/.test(id)))];
    const phones = [...new Set(entries.map(e => e.member.phoneE164).filter(phone => typeof phone === "string"))];
    for (let offset = 0; offset < contactIds.length; offset += 200) {
      const refs = contactIds.slice(offset, offset + 200).map(contactId => db.collection(COLLECTIONS.contacts).doc(contactId));
      const docs = tx ? await tx.getAll(...refs) : await db.getAll(...refs);
      docs.filter(doc => doc.exists).forEach(doc => contacts.set(doc.id, { ...doc.data(), id: doc.id } as Contact));
    }
    for (let offset = 0; offset < phones.length; offset += 200) {
      const refs = phones.slice(offset, offset + 200).map(ledgerRef), docs = tx ? await tx.getAll(...refs) : await db.getAll(...refs);
      docs.filter(doc => doc.exists).forEach(doc => ledgers.set(doc.data()!.phoneE164, doc.data() as SendRecord));
    }
    // A callback may precede reconciliation. Positive provider storage blocks a retry too.
    if (mode === "retry") for (const ledger of ledgers.values()) if (ledger.providerMessageId) {
      const ref = db.collection("metaWhatsAppMessages").doc(ledger.providerMessageId), doc = tx ? await tx.get(ref) : await ref.get();
      if (positive(doc.data()?.status)) ledger.sentAt ||= iso();
    }
    const counts = { imported: entries.length, valid: 0, eligibleNow: 0, optedOut: 0, excluded: 0, invalid: 0, duplicates: 0, alreadySent: 0, currentlyLocked: 0, otherSuppressed: 0, willSend: 0, suppressed: 0 };
    const seen = new Set<string>(), manifest: ManifestEntry[] = [];
    for (const entry of entries) {
      const member = entry.member, contact = contacts.get(member.contactId), phone = String(member.phoneE164 ?? "");
      if (normalizeCampaignPhone(phone)?.phoneE164 === phone && contact?.phoneE164 === phone) counts.valid++;
      const reason = seen.has(phone) ? "duplicate_phone" : recipientSuppression({ audience, member, contact, ledger: ledgers.get(phone), result: results.get(entry.id), mode, audienceId: id, now: now() });
      seen.add(phone);
      if (!reason) counts.willSend++;
      else if (reason === "opted_out") counts.optedOut++;
      else if (reason === "excluded") counts.excluded++;
      else if (["invalid_phone", "missing_contact"].includes(reason)) counts.invalid++;
      else if (reason === "duplicate_phone") counts.duplicates++;
      else if (reason === "already_sent") counts.alreadySent++;
      else if (["currently_locked", "unknown_outcome"].includes(reason)) counts.currentlyLocked++;
      else counts.otherSuppressed++;
      manifest.push({ membershipId: entry.id, contactId: String(member.contactId ?? ""), phoneE164: phone, displayName: String(contact?.displayName ?? "").slice(0, 160), approved: !reason, reason });
    }
    counts.eligibleNow = counts.willSend; counts.suppressed = counts.imported - counts.willSend;
    return { audience, counts, manifest, fingerprint: digest({ name: audience.audienceName, filename: audience.originalFilename, manifest, mode, templatePreview: getTemplatePreview(INTRODUCTION) }) };
  }

  async function review(id: string, mode: SendMode) {
    if (!["send", "resume", "retry"].includes(mode)) throw new Error("Invalid send mode.");
    await recoverStale(id);
    const result = await plan(id, mode);
    const approval: Approval = { audienceId: id, approvalId: randomUUID(), mode, fingerprint: result.fingerprint, count: result.counts.willSend, name: result.audience.audienceName, expires: now() + 15 * 60_000 };
    const body = Buffer.from(JSON.stringify(approval)).toString("base64url");
    return { templatePreview: getTemplatePreview(INTRODUCTION), audienceName: result.audience.audienceName, originalFilename: result.audience.originalFilename, campaignId: INTRODUCTION_CAMPAIGN_ID, campaignName: INTRODUCTION.name, templateName: INTRODUCTION.templateName, templateLanguage: INTRODUCTION.templateLanguage, headerUrl: INTRODUCTION.headerImageUrl, counts: result.counts, token: `${body}.${sign(body)}`, confirmation: confirmationText(approval.name, approval.count, mode), mode };
  }

  async function start(token: string, confirmation: string) {
    await deps.requireGate();
    requireTemplatePreview(INTRODUCTION);
    const approval = decode(token);
    if (confirmation.trim() !== confirmationText(approval.name, approval.count, approval.mode)) throw new Error("Type the exact confirmation phrase.");
    return db.runTransaction(async tx => {
      const previousDoc = await tx.get(runRef(approval.audienceId)), previous = previousDoc.data() as SendRun | undefined;
      if (previous?.approvalId === approval.approvalId) return summary(previous);
      if (previous?.leaseUntil && previous.leaseUntil > now()) throw new Error("This audience has an in-flight worker. Wait or pause it.");
      if (previous?.status === "cancelled") throw new Error("This audience send was cancelled.");
      const current = await plan(approval.audienceId, approval.mode, tx);
      if (current.fingerprint !== approval.fingerprint || current.counts.willSend !== approval.count) throw new Error("Audience or template changed. Review again.");
      if (!approval.count) throw new Error("No eligible recipients for this action.");
      const run: SendRun = { audienceId: approval.audienceId, audienceName: approval.name, campaignId: INTRODUCTION_CAMPAIGN_ID, approvalId: approval.approvalId, mode: approval.mode, status: "sending", phase: "preparing", cursor: 0, totalMembers: current.manifest.length, targetCount: approval.count, counts: previous?.counts ?? emptyCounts(), lastSendAt: previous?.lastSendAt ?? null, leaseOwner: null, leaseUntil: 0 };
      const ref = audienceRef(run.audienceId).collection("sendApprovals").doc(run.approvalId);
      tx.create(ref, { campaignId: run.campaignId, audienceId: run.audienceId, audienceName: run.audienceName, mode: run.mode, count: run.targetCount, confirmedAt: iso(), actor });
      for (let offset = 0; offset < current.manifest.length; offset += 200) tx.create(ref.collection("pages").doc(pageId(offset / 200)), { entries: current.manifest.slice(offset, offset + 200) });
      saveRun(tx, run, previous?.status);
      audit(tx, run.audienceId, run.mode === "retry" ? "retry_failed_started" : run.mode === "resume" ? "audience_resumed" : "audience_send_started", { campaignId: run.campaignId, counts: current.counts }, `started-${run.approvalId}`);
      return summary(run);
    });
  }
  function freshRecord(run: SendRun, entry: ManifestEntry): SendRecord {
    return { sendId: campaignSendId(run.campaignId, entry.phoneE164), campaignId: run.campaignId, audienceId: run.audienceId, audienceName: run.audienceName, membershipId: entry.membershipId, contactId: entry.contactId, phoneE164: entry.phoneE164, displayName: entry.displayName, templateName: INTRODUCTION.templateName, templateLanguage: INTRODUCTION.templateLanguage, provider: "dualhook", providerMessageId: null, status: entry.approved ? "pending" : "suppressed", attemptCount: 0, attemptedAt: null, acceptedAt: null, sentAt: null, deliveredAt: null, readAt: null, failedAt: null, errorCode: entry.reason, errorMessage: entry.reason ? "Suppressed by campaign safety checks." : null, retryable: false, batchId: run.approvalId, createdAt: iso(), updatedAt: iso(), leaseUntil: 0 };
  }
  async function entriesFor(run: SendRun, size: number, tx?: Transaction) {
    const entries: ManifestEntry[] = [];
    const firstPage = Math.floor(run.cursor / 200), lastPage = Math.floor(Math.min(run.totalMembers - 1, run.cursor + size - 1) / 200);
    for (let page = firstPage; page <= lastPage; page++) {
      const ref = audienceRef(run.audienceId).collection("sendApprovals").doc(run.approvalId).collection("pages").doc(pageId(page));
      const doc = tx ? await tx.get(ref) : await ref.get();
      if (!doc.exists) throw new Error("Approved recipient manifest is incomplete.");
      const values = doc.data()!.entries as ManifestEntry[];
      entries.push(...values.slice(Math.max(0, run.cursor - page * 200), Math.min(200, run.cursor + size - page * 200)));
    }
    return entries;
  }
  async function initialize(id: string, owner: string) {
    await db.runTransaction(async tx => {
      const doc = await tx.get(runRef(id)), run = doc.data() as SendRun;
      if (run.leaseOwner !== owner || run.status !== "sending") return;
      const entries = await entriesFor(run, PREPARE_CHUNK_SIZE, tx);
      const docs = entries.length ? await tx.getAll(...entries.map(entry => resultRef(id, entry.membershipId))) : [];
      docs.forEach((doc, index) => { if (!doc.exists) saveResult(tx, run, undefined, freshRecord(run, entries[index])); });
      run.cursor += entries.length;
      if (run.cursor >= run.totalMembers) { run.cursor = 0; run.phase = "sending"; }
      run.leaseOwner = null; run.leaseUntil = 0; saveRun(tx, run);
    });
  }

  async function claim(id: string, owner: string, entry: ManifestEntry) {
    return db.runTransaction(async tx => {
      const runDoc = await tx.get(runRef(id)), run = runDoc.data() as SendRun;
      if (run.leaseOwner !== owner || run.status !== "sending" || run.leaseUntil <= now()) return { kind: "stop" as const };
      const ref = resultRef(id, entry.membershipId), resultDoc = await tx.get(ref), result = resultDoc.data() as SendRecord;
      if (!result) throw new Error("Recipient record is not initialized.");
      if (positive(result.status) || result.status === "suppressed" || result.status === "unknown" || (result.attemptCount > 0 && result.batchId === run.approvalId)) return { kind: "skip" as const };
      const a = await tx.get(audienceRef(id)), m = await tx.get(audienceRef(id).collection("members").doc(entry.membershipId));
      const c = /^[a-f0-9]{64}$/.test(entry.contactId) ? await tx.get(db.collection(COLLECTIONS.contacts).doc(entry.contactId)) : null;
      const globalRef = ledgerRef(entry.phoneE164), globalDoc = await tx.get(globalRef), ledger = globalDoc.data() as SendRecord | undefined;
      const slot = await tx.get(slotRef);
      let storedStatus: string | undefined;
      if (ledger?.providerMessageId) storedStatus = (await tx.get(db.collection("metaWhatsAppMessages").doc(ledger.providerMessageId))).data()?.status;
      const reason = !entry.approved ? entry.reason || "not_approved" : positive(storedStatus ?? "") ? "already_sent" : recipientSuppression({ audience: a.data() as FileAudience, member: m.data() as AudienceMembership, contact: c?.data() as Contact | undefined, ledger, result, mode: run.mode, audienceId: id, now: now() });
      if (reason) {
        // Preserve actual failure/uncertain results rather than replacing them with suppression.
        if (!["failed", "unknown", "sending", "locked"].includes(result.status)) { saveResult(tx, run, result, { ...result, status: "suppressed", errorCode: reason, errorMessage: "Suppressed by current campaign safety checks.", updatedAt: iso() }); saveRun(tx, run); }
        return { kind: "skip" as const };
      }
      if ((slot.data()?.leaseUntil ?? 0) > now() || (slot.data()?.nextAllowedAt ?? 0) > now()) return { kind: "wait" as const };
      const record: SendRecord = { ...result, status: "sending", attemptCount: (ledger?.attemptCount ?? 0) + 1, batchId: run.approvalId, attemptedAt: iso(), updatedAt: iso(), providerMessageId: null, retryable: false, errorCode: null, errorMessage: null, failedAt: null, leaseUntil: now() + LEASE_MS };
      tx.set(globalRef, record);
      saveResult(tx, run, result, record);
      run.lastSendAt = record.attemptedAt;
      tx.set(slotRef, { owner: record.sendId, batchId: record.batchId, leaseUntil: now() + LEASE_MS, nextAllowedAt: now() + PROVIDER_SPACING_MS });
      saveRun(tx, run);
      return { kind: "send" as const, record };
    });
  }

  async function finish(record: SendRecord, outcome: { messageId: string } | ReturnType<typeof safeProviderFailure>) {
    await db.runTransaction(async tx => {
      const globalRef = ledgerRef(record.phoneE164), globalDoc = await tx.get(globalRef);
      const current = globalDoc.data() as SendRecord | undefined;
      if (!current || current.batchId !== record.batchId || current.attemptCount !== record.attemptCount) return;
      const runDoc = await tx.get(runRef(record.audienceId)), run = runDoc.data() as SendRun;
      const oldDoc = await tx.get(resultRef(record.audienceId, record.membershipId)), previous = oldDoc.data() as SendRecord;
      const contactRef = db.collection(COLLECTIONS.contacts).doc(record.contactId), contact = await tx.get(contactRef);
      const slot = await tx.get(slotRef);
      const membership = await tx.get(audienceRef(record.audienceId).collection("members").doc(record.membershipId));
      let next: SendRecord;
      if ("messageId" in outcome) {
        const early = await tx.get(db.collection("metaWhatsAppMessages").doc(outcome.messageId));
        const state = deliveryState("accepted", early.data()?.status ?? "accepted");
        next = { ...current, status: state, providerMessageId: outcome.messageId, acceptedAt: iso(), updatedAt: iso(), leaseUntil: 0, retryable: false, errorCode: null, errorMessage: null };
        if (["sent", "delivered", "read"].includes(state)) next.sentAt ||= iso();
        if (["delivered", "read"].includes(state)) next.deliveredAt ||= iso();
        if (state === "read") next.readAt ||= iso();
        if (state === "failed") { next.failedAt = iso(); next.errorCode = "provider_delivery_failed"; next.errorMessage = "Provider reported delivery failure."; }
      } else next = { ...current, ...outcome, failedAt: outcome.status === "failed" ? iso() : null, updatedAt: iso(), leaseUntil: 0 };
      tx.set(globalRef, next);
      tx.set(globalRef.collection("attempts").doc(String(next.attemptCount)), { ...next });
      saveResult(tx, run, previous, next);
      if (membership.exists) tx.update(membership.ref, { sendStatus: next.status });
      if (contact.exists) tx.update(contactRef, { lastCampaignId: next.campaignId, lastDeliveryStatus: next.status, ...(next.sentAt ? { lastSentAt: next.sentAt } : {}) });
      if (slot.data()?.owner === record.sendId && slot.data()?.batchId === record.batchId) tx.set(slotRef, { owner: null, leaseUntil: 0, nextAllowedAt: now() + (next.errorCode === "provider_rate_limited" ? 30_000 : PROVIDER_SPACING_MS) });
      saveRun(tx, run, runDoc.data()?.status);
    });
  }

  async function processChunk(id: string, approvalId: string) {
    validAudienceId(id); await deps.requireGate();
    const owner = randomUUID();
    const acquired = await db.runTransaction(async tx => {
      const doc = await tx.get(runRef(id)), run = doc.data() as SendRun | undefined;
      if (!run || run.approvalId !== approvalId) throw new Error("This send authorization is no longer current.");
      if (run.status !== "sending" || run.phase === "finished") return false;
      if (run.leaseUntil > now()) return false;
      run.leaseOwner = owner; run.leaseUntil = now() + LEASE_MS; saveRun(tx, run); return true;
    });
    if (!acquired) return { hasMore: false, state: await state(id), busy: true };
    try {
      const run = (await runRef(id).get()).data() as SendRun;
      if (run.phase === "preparing") await initialize(id, owner);
      else {
        const entries = await entriesFor(run, SEND_CHUNK_SIZE);
        for (const entry of entries) {
          await deps.requireGate();
          const claimed = await claim(id, owner, entry);
          if (claimed.kind === "stop" || claimed.kind === "wait") break;
          if (claimed.kind === "send") {
            let outcome: { messageId: string } | ReturnType<typeof safeProviderFailure>;
            try { await deps.requireGate(); outcome = await deps.sendTemplate(introductionMessage(entry.phoneE164)); }
            catch (error) { outcome = safeProviderFailure(error); }
            await finish(claimed.record, outcome);
            await sleep(PROVIDER_SPACING_MS);
          }
          await db.runTransaction(async tx => { const doc = await tx.get(runRef(id)), current = doc.data() as SendRun; if (current.leaseOwner === owner) { current.cursor++; if (current.cursor >= current.totalMembers) current.phase = "finished"; saveRun(tx, current, doc.data()?.status); } });
        }
      }
    } finally {
      await db.runTransaction(async tx => { const doc = await tx.get(runRef(id)), run = doc.data() as SendRun; if (run.leaseOwner === owner) { run.leaseOwner = null; run.leaseUntil = 0; saveRun(tx, run, doc.data()?.status); } });
    }
    const current = await state(id);
    return { hasMore: current?.status === "sending" && current.phase !== "finished", state: current, busy: false };
  }

  async function control(id: string, action: "pause" | "cancel") {
    validAudienceId(id);
    return db.runTransaction(async tx => {
      const doc = await tx.get(runRef(id)), run = doc.data() as SendRun | undefined;
      if (!run) throw new Error("No send has been started for this audience.");
      if (["completed", "cancelled"].includes(run.status)) return summary(run);
      run.status = action === "pause" ? "paused" : "cancelled";
      saveRun(tx, run, doc.data()?.status);
      audit(tx, id, action === "pause" ? "audience_paused" : "campaign_cancelled", { campaignId: run.campaignId, counts: run.counts });
      return summary(run);
    });
  }
  async function state(id: string) { const doc = await runRef(id).get(); return doc.exists ? summary(doc.data() as SendRun) : null; }

  async function recoverStale(id: string) {
    validAudienceId(id);
    const docs = await audienceRef(id).collection("sendResults").get();
    for (const doc of docs.docs) {
      const record = doc.data() as SendRecord;
      if (!["sending", "locked"].includes(record.status) || record.leaseUntil > now()) continue;
      await db.runTransaction(async tx => {
        const resultDoc = await tx.get(doc.ref), current = resultDoc.data() as SendRecord;
        const globalRef = ledgerRef(current.phoneE164), globalDoc = await tx.get(globalRef);
        const runDoc = await tx.get(runRef(id)), run = runDoc.data() as SendRun | undefined;
        if (!run || !["sending", "locked"].includes(current.status) || current.leaseUntil > now()) return;
        const unknown: SendRecord = { ...current, status: "unknown", retryable: false, leaseUntil: 0, errorCode: "interrupted_outcome_unknown", errorMessage: "Worker stopped without a confirmed result. Automatic retry is blocked.", updatedAt: iso() };
        saveResult(tx, run, current, unknown);
        if (globalDoc.data()?.batchId === current.batchId && globalDoc.data()?.attemptCount === current.attemptCount) tx.set(globalRef, unknown);
        if (run.leaseUntil <= now() && run.status === "sending") run.status = "paused";
        saveRun(tx, run, runDoc.data()?.status);
      });
    }
  }
  async function results(id: string) {
    validAudienceId(id); await recoverStale(id);
    const docs = await audienceRef(id).collection("sendResults").get();
    return { records: docs.docs.map(doc => doc.data() as SendRecord), state: await state(id) };
  }

  async function reconcile(event: { messageId: string; status: string; errorCode?: string }) {
    if (!event.messageId || !["sent", "delivered", "read", "failed"].includes(event.status)) return { matched: false };
    const matches = await db.collection(COLLECTIONS.sends).where("providerMessageId", "==", event.messageId).get();
    for (const match of matches.docs) await db.runTransaction(async tx => {
      const doc = await tx.get(match.ref), record = doc.data() as SendRecord;
      if (record.campaignId !== INTRODUCTION_CAMPAIGN_ID || record.providerMessageId !== event.messageId) return;
      const runDoc = await tx.get(runRef(record.audienceId)), run = runDoc.data() as SendRun | undefined;
      const old = await tx.get(resultRef(record.audienceId, record.membershipId));
      const contactRef = db.collection(COLLECTIONS.contacts).doc(record.contactId), contact = await tx.get(contactRef);
      const membership = await tx.get(audienceRef(record.audienceId).collection("members").doc(record.membershipId));
      if (!run || !old.exists) return;
      const status = deliveryState(record.status, event.status);
      if (status === record.status) return;
      const next: SendRecord = { ...record, status, retryable: false, updatedAt: iso(), leaseUntil: 0 };
      if (["sent", "delivered", "read"].includes(status)) next.sentAt ||= iso();
      if (["delivered", "read"].includes(status)) next.deliveredAt ||= iso();
      if (status === "read") next.readAt ||= iso();
      if (status === "failed") { next.failedAt = iso(); next.errorCode = `provider_${String(event.errorCode ?? "delivery_failed").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50)}`; next.errorMessage = "Provider reported delivery failure; automatic retry is disabled."; }
      else { next.errorCode = null; next.errorMessage = null; }
      tx.set(match.ref, next);
      tx.set(match.ref.collection("attempts").doc(String(next.attemptCount)), next);
      saveResult(tx, run, old.data() as SendRecord, next);
      if (membership.exists) tx.update(membership.ref, { sendStatus: next.status });
      if (contact.exists) tx.update(contactRef, { lastCampaignId: next.campaignId, lastDeliveryStatus: status, ...(next.sentAt ? { lastSentAt: next.sentAt } : {}) });
      saveRun(tx, run, runDoc.data()?.status);
    });
    return { matched: matches.size > 0 };
  }
  return { review, start, processChunk, control, state, results, reconcile };
}
