import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { audienceSuppression, eligibilityAfterImport, fileSuppression, MAX_AUDIENCE, IMPORT_CHUNK_SIZE, MAX_IMPORT_PHONES, safeMissingMetadata, validateContact } from "./core";
import { INTRODUCTION, type Campaign, type Contact, type ContactInput, type FileAudience } from "./types";

export const COLLECTIONS = { contacts: "whatsappCampaignContacts", campaigns: "whatsappCampaigns", imports: "whatsappCampaignImports", sends: "whatsappCampaignSends", audiences: "whatsappCampaignAudiences" } as const;
const actor = { type: "shared_admin_session" } as const;
export const contactIdForPhone = (phone: string) => createHash("sha256").update(phone).digest("hex");
// This permanent key is also the future unique send lock. Never delete/re-key on retries.
export const campaignSendId = (campaignId: string, phone: string) => createHash("sha256").update(`${campaignId}:${phone}`).digest("hex");
const event = (type: string, metadata: Record<string, unknown> = {}) => ({ type, metadata, actor, timestamp: FieldValue.serverTimestamp() });
const iso = (value: unknown): string | null => typeof value === "string" ? value : value && typeof value === "object" && "toDate" in value ? (value as { toDate(): Date }).toDate().toISOString() : null;
function contactRecord(id: string, data: Record<string, unknown>): Contact {
  return { ...data, id, ...Object.fromEntries(["createdAt", "updatedAt", "importedAt", "optOutAt", "lastSentAt"].map(key => [key, iso(data[key])])) } as Contact;
}
export async function listContacts() {
  const snapshot = await getAdminDb().collection(COLLECTIONS.contacts).orderBy("createdAt", "desc").get();
  return snapshot.docs.map(doc => contactRecord(doc.id, doc.data()));
}
export async function existingPhones(phones: string[]) {
  const unique = [...new Set(phones)];
  if (!unique.length) return new Set<string>();
  const db = getAdminDb();
  if (unique.length > MAX_IMPORT_PHONES) throw new Error("Too many phone numbers.");
  const existing = new Set<string>();
  for (let offset = 0; offset < unique.length; offset += IMPORT_CHUNK_SIZE) {
    const snapshots = await db.getAll(...unique.slice(offset, offset + IMPORT_CHUNK_SIZE).map(phone => db.collection(COLLECTIONS.contacts).doc(contactIdForPhone(phone))));
    snapshots.filter(doc => doc.exists).forEach(doc => existing.add(String(doc.data()!.phoneE164)));
  }
  return existing;
}

/** One atomic chunk: contacts, membership, audit and receipt commit together. */
export async function importContacts(inputs: ContactInput[], receiptId: string, audienceId?: string) {
  if (!inputs.length || inputs.length > (audienceId ? 100 : IMPORT_CHUNK_SIZE) || !/^[a-f0-9]{64}$/.test(receiptId)) throw new Error("Invalid import size or receipt.");
  const validated = inputs.map(validateContact), db = getAdminDb();
  const grouped = new Map<string, typeof validated>();
  for (const input of validated) grouped.set(input.phoneE164, [...(grouped.get(input.phoneE164) ?? []), input]);
  const groups = [...grouped.values()];
  const refs = [...grouped.keys()].map(phone => db.collection(COLLECTIONS.contacts).doc(contactIdForPhone(phone)));
  const receipt = db.collection(COLLECTIONS.imports).doc(receiptId);
  return db.runTransaction(async tx => {
    const previous = await tx.get(receipt);
    if (previous.exists) return { created: Number(previous.data()!.created), merged: Number(previous.data()!.merged), eligible: Number(previous.data()!.eligible ?? 0), duplicate: true };
    const snapshots = await tx.getAll(...refs);
    const audienceRef = audienceId ? db.collection(COLLECTIONS.audiences).doc(audienceId) : null;
    const audienceSnap = audienceRef ? await tx.get(audienceRef) : null;
    if (audienceRef && !audienceSnap?.exists) throw new Error("File audience not found.");
    const audience = audienceSnap?.data() as FileAudience | undefined;
    if (audience?.status === "cancelled") throw new Error("Audience was cancelled.");
    let created = 0, merged = 0, eligible = 0;
    const now = FieldValue.serverTimestamp();
    snapshots.forEach((snapshot, index) => {
      const group = groups[index], input = group[0];
      let record = snapshot.exists ? snapshot.data()! : {
        ...input, id: snapshot.id, sources: [input.source], sourceReferences: [],
        marketingStatus: "eligible", optOut: false, optOutAt: null,
        createdAt: now, updatedAt: now, importedAt: audienceId || input.source !== "manual" ? now : null,
        lastCampaignId: null, lastSentAt: null, lastDeliveryStatus: null,
      };
      for (const item of group) record = { ...record, ...safeMissingMetadata(record as Contact, item) };
      const marketingStatus = eligibilityAfterImport(record as Contact);
      if (snapshot.exists) {
        merged++;
        tx.update(snapshot.ref, { ...safeMissingMetadata(snapshot.data() as Contact, record as ReturnType<typeof validateContact>), sources: record.sources, sourceReferences: record.sourceReferences, marketingStatus, updatedAt: now });
      } else { created++; tx.create(snapshot.ref, record); }
      const reason = fileSuppression(record as Contact, input.phoneE164);
      if (!reason) eligible++;
      if (audienceRef) tx.create(audienceRef.collection("members").doc(snapshot.id), {
        audienceId, contactId: snapshot.id, phoneE164: input.phoneE164,
        eligibilityAtImport: !reason, suppressionReason: reason, sendStatus: "not_sent",
      });
      tx.create(snapshot.ref.collection("events").doc(), event(snapshot.exists ? "contact_metadata_merged" : "contact_created", { receiptId, ...(audienceId ? { audienceId } : {}) }));
    });
    if (audienceRef && audience) tx.update(audienceRef, {
      newContactCount: audience.newContactCount + created, existingContactCount: audience.existingContactCount + merged,
      eligibleCount: audience.eligibleCount + eligible, suppressedCount: audience.suppressedCount + snapshots.length - eligible,
      processedCount: audience.processedCount + snapshots.length,
    });
    tx.create(receipt, { ...event("contacts_imported", { rowCount: inputs.length, ...(audienceId ? { audienceId } : {}) }), created, merged, eligible });
    return { created, merged, eligible, duplicate: false };
  });
}

/** Sequential server-only chunks. File members are unique across the entire upload. */
export async function importContactsInChunks(inputs: ContactInput[], importId: string, audienceId?: string) {
  if (!inputs.length || inputs.length > MAX_IMPORT_PHONES || !/^[a-f0-9]{64}$/.test(importId)) throw new Error("Invalid import size or receipt.");
  const all = inputs.map(validateContact);
  const unique = new Map<string, typeof all[number]>();
  for (const input of all) {
    const previous = unique.get(input.phoneE164);
    unique.set(input.phoneE164, previous ? { ...previous, displayName: previous.displayName || input.displayName, notes: previous.notes || input.notes } : input);
  }
  const validated = [...unique.values()], size = audienceId ? 100 : IMPORT_CHUNK_SIZE;
  let created = 0, merged = 0, reusedChunks = 0;
  for (let offset = 0; offset < validated.length; offset += size) {
    const chunkId = createHash("sha256").update(`file-v3:${importId}:${offset / size}`).digest("hex");
    const result = await importContacts(validated.slice(offset, offset + size), chunkId, audienceId);
    created += result.created; merged += result.merged;
    if (result.duplicate) reusedChunks++;
  }
  return { created, merged, reusedChunks, chunks: Math.ceil(validated.length / size), processedPhoneValues: validated.length };
}
export async function reviewContact(id: string, status: "unreviewed" | "eligible" | "excluded" | "opted_out") {
  if (!/^[a-f0-9]{64}$/.test(id) || !["unreviewed", "eligible", "excluded", "opted_out"].includes(status)) throw new Error("Invalid review.");
  const ref = getAdminDb().collection(COLLECTIONS.contacts).doc(id);
  await getAdminDb().runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw new Error("Contact not found.");
    const current = snapshot.data()!;
    if ((current.optOut || current.marketingStatus === "opted_out") && status !== "opted_out") throw new Error("Opt-out is permanent in this stage; a future verified re-consent workflow is required.");
    tx.update(ref, { marketingStatus: status, updatedAt: FieldValue.serverTimestamp(), ...(status === "opted_out" ? { optOut: true, optOutAt: current.optOutAt ?? FieldValue.serverTimestamp() } : {}) });
    tx.create(ref.collection("events").doc(), event("contact_reviewed", { from: current.marketingStatus, to: status }));
  });
}

export async function createDraft(ids: string[], requestId: string) {
  const unique = [...new Set(ids)];
  if (unique.length > MAX_AUDIENCE || unique.some(id => !/^[a-f0-9]{64}$/.test(id)) || !/^[a-f0-9-]{36}$/.test(requestId)) throw new Error("Invalid audience.");
  const db = getAdminDb(), ref = db.collection(COLLECTIONS.campaigns).doc(requestId);
  return db.runTransaction(async tx => {
    const previous = await tx.get(ref);
    if (previous.exists) return ref.id;
    const contacts = unique.length ? await tx.getAll(...unique.map(id => db.collection(COLLECTIONS.contacts).doc(id))) : [];
    const phones = new Set<string>();
    for (const snapshot of contacts) {
      if (!snapshot.exists) throw new Error("Audience contact no longer exists.");
      const contact = snapshot.data() as Contact;
      const reason = audienceSuppression(contact);
      if (reason) throw new Error("Audience contains unreviewed, excluded, opted-out or previously sent contacts. Review selection first.");
      if (phones.has(contact.phoneE164)) throw new Error("Duplicate phone in audience.");
      phones.add(contact.phoneE164);
    }
    tx.create(ref, { ...INTRODUCTION, campaignId: ref.id, status: "draft", createdAt: FieldValue.serverTimestamp(), createdBy: actor, audienceCount: unique.length, audienceIds: unique });
    tx.create(ref.collection("events").doc(), event("campaign_draft_created", { audienceCount: unique.length }));
    return ref.id;
  });
}
export async function listCampaigns(): Promise<Campaign[]> {
  const snapshots = await getAdminDb().collection(COLLECTIONS.campaigns).orderBy("createdAt", "desc").get();
  return snapshots.docs.map(doc => ({ ...doc.data(), campaignId: doc.id, createdAt: iso(doc.data().createdAt) ?? "" } as Campaign));
}
