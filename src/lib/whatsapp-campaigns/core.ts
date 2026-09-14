import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { CATEGORIES, SOURCES, type Contact, type ContactInput, type AudienceMembership } from "./types.ts";

export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_PHONES = 20000;
export const IMPORT_CHUNK_SIZE = 200;
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIENCE = 5000;

export function normalizeCampaignPhone(value: unknown) {
  if (typeof value !== "string" || value.length > 80 || !/^[+\d\s().-]+$/.test(value)) return null;
  let compact = value.trim().replace(/[\s().-]/g, "");
  if (/^03\d{9}$/.test(compact)) compact = `+92${compact.slice(1)}`;
  else if (/^92\d{10}$/.test(compact)) compact = `+${compact}`;
  else if (compact.startsWith("00")) compact = `+${compact.slice(2)}`;
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) return null;
  const parsed = parsePhoneNumberFromString(compact);
  if (!parsed?.isValid() || parsed.ext) return null;
  return { phoneE164: String(parsed.number), countryCode: `+${parsed.countryCallingCode}` };
}

export function validateContact(input: ContactInput) {
  if (!input || !SOURCES.includes(input.source) || !CATEGORIES.includes(input.category)) throw new Error("Choose a valid source and category.");
  for (const [key, max] of [["displayName", 160], ["phoneOriginal", 80], ["notes", 1000], ["sourceReferenceId", 160]] as const) {
    if (typeof input[key] !== "string" || input[key].length > max) throw new Error(`Invalid ${key}.`);
  }
  const phone = normalizeCampaignPhone(input.phoneOriginal);
  if (!phone) throw new Error("Enter a valid phone: Pakistan mobile or international number with +country code.");
  return { displayName: input.displayName.trim(), phoneOriginal: input.phoneOriginal, source: input.source, category: input.category, notes: input.notes.trim(), sourceReferenceId: input.sourceReferenceId.trim(), ...phone };
}

export function safeMissingMetadata(existing: Contact, incoming: ReturnType<typeof validateContact>) {
  const sources = [...new Set([existing.source, ...(existing.sources ?? []), incoming.source])];
  const refs = [...(existing.sourceReferences ?? []), ...(existing.sourceReferenceId ? [{ source: existing.source, referenceId: existing.sourceReferenceId }] : [])];
  if (incoming.sourceReferenceId && !refs.some(r => r.source === incoming.source && r.referenceId === incoming.sourceReferenceId)) refs.push({ source: incoming.source, referenceId: incoming.sourceReferenceId });
  if (refs.length > 100) throw new Error("Contact has too many source references; review manually.");
  return {
    displayName: existing.displayName || incoming.displayName,
    notes: existing.notes || incoming.notes,
    sources, sourceReferences: refs,
    // Category and all review/suppression/history fields remain authoritative.
  };
}

export { parseCsv, csvPreview, type PreviewRow } from "./csv.ts";

export function audienceSuppression(contact: Contact) {
  if (contact.optOut || contact.marketingStatus === "opted_out") return "opted_out";
  if (contact.marketingStatus !== "eligible") return "not_reviewed_as_eligible";
  if (contact.lastSentAt) return "previously_sent";
  return null;
}

export function dryRunBatch(contacts: Contact[], sentContactIds: Set<string>, stage: number, confirmedCount: number) {
  const limits = [1, 20, 100, 500, 500, 500];
  if (!Number.isInteger(stage) || stage < 0 || stage >= limits.length) throw new Error("Invalid batch stage.");
  if (!contacts.length || contacts.length > limits[stage] || confirmedCount !== contacts.length) throw new Error("Recipient count confirmation or hard batch limit failed.");
  const seen = new Set<string>();
  return contacts.map(contact => {
    const reason = audienceSuppression(contact) || (sentContactIds.has(contact.id) ? "already_sent_campaign" : seen.has(contact.phoneE164) ? "duplicate_phone" : null);
    seen.add(contact.phoneE164); return { contactId: contact.id, suppressed: reason };
  });
}

export function eligibilityAfterImport(contact?: Pick<Contact, "marketingStatus" | "optOut">) {
  if (contact?.optOut || contact?.marketingStatus === "opted_out") return "opted_out" as const;
  return contact?.marketingStatus ?? "eligible";
}
export function fileSuppression(contact: Contact | undefined, phoneE164: string, campaignId?: string, lockedPhones: Set<string> = new Set()) {
  const phone = normalizeCampaignPhone(phoneE164);
  if (!phone || phone.phoneE164 !== phoneE164) return "invalid_phone";
  if (contact?.optOut || contact?.marketingStatus === "opted_out") return "opted_out";
  if (contact?.marketingStatus === "excluded") return "excluded";
  if (lockedPhones.has(phoneE164)) return "same_campaign_send_or_lock";
  if (campaignId && contact?.lastCampaignId === campaignId && contact.lastSentAt) return "already_sent_same_campaign";
  return null;
}
export function contactsForAudience(contacts: Contact[], members: AudienceMembership[]) {
  const ids = new Set(members.map(member => member.contactId));
  return contacts.filter(contact => ids.has(contact.id));
}
export function fileAudience(contacts: Contact[], members: AudienceMembership[], campaignId?: string, lockedPhones: Set<string> = new Set()) {
  const byId = new Map(contacts.map(contact => [contact.id, contact]));
  const seen = new Set<string>(), eligibleIds: string[] = [], suppressed: Array<{ id: string; reason: string }> = [];
  for (const member of [...members].sort((a, b) => a.contactId.localeCompare(b.contactId))) {
    const contact = byId.get(member.contactId);
    const reason = !contact ? "missing_contact" : contact.phoneE164 !== member.phoneE164 ? "phone_changed" : fileSuppression(contact, member.phoneE164, campaignId, lockedPhones) || (!member.eligibilityAtImport ? member.suppressionReason || "suppressed_at_import" : seen.has(member.phoneE164) ? "duplicate_phone" : null);
    if (reason) suppressed.push({ id: member.contactId, reason });
    else { eligibleIds.push(member.contactId); seen.add(member.phoneE164); }
  }
  return { fileContacts: members.length, suppressedCount: suppressed.length, finalEligible: eligibleIds.length, eligibleIds, suppressed };
}