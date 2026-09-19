import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { fileAudience, fileSuppression } from "./core";
import { csvPreview } from "./csv";
import { COLLECTIONS, contactIdForPhone, importContactsInChunks } from "./repository";
import { INTRODUCTION, type AudienceMembership, type Contact, type FileAudience, type FileAudienceView, type ImportDetails } from "./types";

const actor = { type: "shared_admin_session" } as const;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function validateImportDetails(details: ImportDetails) {
  if (!details || typeof details.uploadId !== "string" || !/^[0-9a-f-]{36}$/.test(details.uploadId)) throw new Error("Select the CSV again.");
  if (typeof details.audienceName !== "string" || !details.audienceName.trim() || details.audienceName.length > 120) throw new Error("Audience / File Name is required (up to 120 characters).");
  if (typeof details.originalFilename !== "string" || !details.originalFilename.trim() || details.originalFilename.length > 255) throw new Error("Original filename is required.");
  return { uploadId: details.uploadId, audienceName: details.audienceName.trim(), originalFilename: details.originalFilename };
}
export function importReviewContext(details: ImportDetails) { return JSON.stringify(validateImportDetails(details)); }

export async function previewEligibility(preview: ReturnType<typeof csvPreview>) {
  const phones = [...new Set(preview.rows.flatMap(row => row.phoneE164 ? [row.phoneE164] : []))];
  const db = getAdminDb(); let eligible = 0;
  for (let offset = 0; offset < phones.length; offset += 200) {
    const chunk = phones.slice(offset, offset + 200);
    const docs = await db.getAll(...chunk.map(phone => db.collection(COLLECTIONS.contacts).doc(contactIdForPhone(phone))));
    docs.forEach((doc, index) => { if (!fileSuppression(doc.exists ? doc.data() as Contact : undefined, chunk[index])) eligible++; });
  }
  return { eligibleForAudience: eligible, suppressedForAudience: phones.length - eligible };
}

/** Called only after authenticated, signed Confirm Import. Preview never calls this. */
export async function confirmFileImport(preview: ReturnType<typeof csvPreview>, csv: string, rawDetails: ImportDetails) {
  const details = validateImportDetails(rawDetails), db = getAdminDb();
  const audienceId = hash(`file-audience:${details.uploadId}`);
  const fingerprint = hash(JSON.stringify([details, preview.source, csv]));
  const ref = db.collection(COLLECTIONS.audiences).doc(audienceId);
  const uniqueCount = new Set(preview.rows.flatMap(row => row.phoneE164 ? [row.phoneE164] : [])).size;
  await db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      if (existing.data()?.fingerprint !== fingerprint) throw new Error("This upload has already started with different details. Select it again for a separate audience.");
      if (existing.data()?.status === "cancelled") throw new Error("Audience was cancelled.");
      return;
    }
    tx.create(ref, {
      audienceId, audienceName: details.audienceName, originalFilename: details.originalFilename,
      source: preview.source, campaignId: null, fingerprint,
      totalRows: preview.counts.totalRows, validCount: uniqueCount,
      invalidCount: preview.counts.invalidPhones, skippedRows: preview.counts.rowsWithoutPhoneNumbers,
      duplicateCount: preview.counts.duplicatesWithinFile, existingContactCount: 0, newContactCount: 0,
      eligibleCount: 0, suppressedCount: 0, processedCount: 0,
      status: "confirmed", importState: "importing", createdAt: FieldValue.serverTimestamp(), createdBy: actor,
    });
  });
  try {
    const inputs = preview.rows.filter(row => !row.error).map(row => row.input);
    const result = inputs.length ? await importContactsInChunks(inputs, audienceId, audienceId) : { created: 0, merged: 0, reusedChunks: 0, chunks: 0, processedPhoneValues: 0 };
    await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      if (current.data()?.processedCount !== uniqueCount) throw new Error("Import is incomplete.");
      if (current.data()?.importState !== "completed") tx.update(ref, { status: "ready", importState: "completed" });
    });
    return { ...result, audienceId, audienceName: details.audienceName };
  } catch (error) {
    await db.runTransaction(async tx => { const current = await tx.get(ref); if (current.data()?.importState !== "completed") tx.update(ref, { importState: "interrupted" }); });
    throw error;
  }
}

export async function listFileAudiences(): Promise<FileAudienceView[]> {
  const docs = await getAdminDb().collection(COLLECTIONS.audiences).orderBy("createdAt", "desc").get();
  const audiences: FileAudienceView[] = [];
  for (const doc of docs.docs) {
    const data = doc.data();
    const members = await doc.ref.collection("members").get();
    // Do not serialize the internal fingerprint or any database timestamp object.
    const { fingerprint: _fingerprint, ...fields } = data;
    void _fingerprint;
    audiences.push({ ...fields, createdAt: typeof data.createdAt === "string" ? data.createdAt : data.createdAt?.toDate().toISOString() ?? "", members: members.docs.map(member => member.data() as AudienceMembership) } as FileAudienceView);
  }
  return audiences;
}

function validateContactId(contactId: string) {
  if (!/^[a-f0-9]{64}$/.test(contactId)) throw new Error("Invalid contact.");
}
export async function contactMembershipCount(contactId: string) {
  validateContactId(contactId);
  const audiences = await getAdminDb().collection(COLLECTIONS.audiences).get();
  const memberships = await Promise.all(audiences.docs.map(audience => audience.ref.collection("members").doc(contactId).get()));
  return memberships.filter(member => member.exists).length;
}
export async function removeContactFromAudience(audienceId: string, contactId: string) {
  if (!/^[a-f0-9]{64}$/.test(audienceId)) throw new Error("Invalid audience.");
  validateContactId(contactId);
  const db = getAdminDb(), audienceRef = db.collection(COLLECTIONS.audiences).doc(audienceId);
  await db.runTransaction(async tx => {
    const audience = await tx.get(audienceRef);
    if (!audience.exists) throw new Error("Audience not found.");
    const memberRef = audienceRef.collection("members").doc(contactId), member = await tx.get(memberRef);
    if (!member.exists) throw new Error("Contact is not in this audience.");
    tx.delete(memberRef);
  });
}
export async function deleteContactAndMemberships(contactId: string) {
  validateContactId(contactId);
  const db = getAdminDb(), contactRef = db.collection(COLLECTIONS.contacts).doc(contactId);
  const audiences = await db.collection(COLLECTIONS.audiences).get();
  let membershipsRemoved = 0;
  await db.runTransaction(async tx => {
    const contact = await tx.get(contactRef);
    if (!contact.exists) throw new Error("Contact not found.");
    const refs = audiences.docs.map(audience => audience.ref.collection("members").doc(contactId));
    const memberships = await tx.getAll(...refs);
    memberships.filter(member => member.exists).forEach(member => { membershipsRemoved++; tx.delete(member.ref); });
    tx.delete(contactRef);
  });
  return { membershipsRemoved };
}
function validateAudienceRequest(audienceId: string, campaignId: string) {
  if (!/^[a-f0-9]{64}$/.test(audienceId) || !/^[0-9a-f-]{36}$/.test(campaignId)) throw new Error("Invalid audience request.");
}
function describe(contacts: Contact[], members: AudienceMembership[], campaignId: string, locks: Set<string>) {
  const result = fileAudience(contacts, members, campaignId, locks);
  return { ...result, fingerprint: hash(JSON.stringify(result)) };
}
export async function previewFileAudience(audienceId: string, campaignId: string) {
  validateAudienceRequest(audienceId, campaignId);
  const db = getAdminDb(), ref = db.collection(COLLECTIONS.audiences).doc(audienceId), doc = await ref.get();
  if (!doc.exists || doc.data()?.importState !== "completed" || doc.data()?.status === "cancelled") throw new Error("Audience import is not ready.");
  const members = (await ref.collection("members").get()).docs.map(doc => doc.data() as AudienceMembership);
  const contacts: Contact[] = [];
  for (let offset = 0; offset < members.length; offset += 200) {
    const docs = await db.getAll(...members.slice(offset, offset + 200).map(member => db.collection(COLLECTIONS.contacts).doc(member.contactId)));
    docs.filter(doc => doc.exists).forEach(doc => contacts.push({ ...doc.data(), id: doc.id } as Contact));
  }
  const locks = await db.collection(COLLECTIONS.sends).where("campaignId", "==", campaignId).get();
  const result = describe(contacts, members, campaignId, new Set(locks.docs.map(doc => String(doc.data().phoneE164))));
  return { ...result, audienceName: String(doc.data()!.audienceName) };
}

/** Recheck membership, contact suppressions and permanent same-campaign locks atomically. */
export async function createDraftFromFile(audienceId: string, campaignId: string, expectedFingerprint: string) {
  validateAudienceRequest(audienceId, campaignId);
  const db = getAdminDb(), audienceRef = db.collection(COLLECTIONS.audiences).doc(audienceId), campaignRef = db.collection(COLLECTIONS.campaigns).doc(campaignId);
  return db.runTransaction(async tx => {
    const previous = await tx.get(campaignRef);
    if (previous.exists) {
      if (!previous.data()?.audienceSources?.some((source: { audienceId: string }) => source.audienceId === audienceId)) throw new Error("Campaign belongs to a different file.");
      return campaignId;
    }
    const audienceDoc = await tx.get(audienceRef);
    const audience = audienceDoc.data() as FileAudience | undefined;
    if (!audience || audience.importState !== "completed" || audience.status === "cancelled") throw new Error("Audience is not ready.");
    const memberDocs = await tx.get(audienceRef.collection("members"));
    const members = memberDocs.docs.map(doc => doc.data() as AudienceMembership);
    const contacts: Contact[] = [];
    for (let offset = 0; offset < members.length; offset += 200) {
      const docs = await tx.getAll(...members.slice(offset, offset + 200).map(member => db.collection(COLLECTIONS.contacts).doc(member.contactId)));
      docs.filter(doc => doc.exists).forEach(doc => contacts.push({ ...doc.data(), id: doc.id } as Contact));
    }
    const locks = await tx.get(db.collection(COLLECTIONS.sends).where("campaignId", "==", campaignId));
    const result = describe(contacts, members, campaignId, new Set(locks.docs.map(doc => String(doc.data().phoneE164))));
    if (result.fingerprint !== expectedFingerprint) throw new Error("Audience changed. Preview the suppression checks again.");
    if (!result.finalEligible) throw new Error("This audience has no eligible contacts.");
    const source = { audienceId, audienceName: audience.audienceName, importedCount: result.fileContacts, eligibleCount: result.finalEligible, suppressedCount: result.suppressedCount };
    tx.create(campaignRef, { ...INTRODUCTION, campaignId, status: "draft", createdAt: FieldValue.serverTimestamp(), createdBy: actor, audienceCount: result.finalEligible, audienceMode: "file", sourceAudienceId: audienceId, audienceSources: [source] });
    if (!audience.campaignId) tx.update(audienceRef, { campaignId });
    tx.create(campaignRef.collection("events").doc(), { type: "file_audience_draft_created", timestamp: FieldValue.serverTimestamp(), actor, metadata: source });
    return campaignId;
  });
}
