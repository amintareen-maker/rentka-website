"use server";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { hasAdminSession } from "../_lib/session";
import { csvPreview, validateContact } from "@/lib/whatsapp-campaigns/core";
import { createDraft, existingPhones, importContacts, reviewContact } from "@/lib/whatsapp-campaigns/repository";
import { issueReview, verifyReview } from "@/lib/whatsapp-campaigns/import-review";
import type { ContactInput, Source, ImportDetails } from "@/lib/whatsapp-campaigns/types";

import { confirmFileImport, importReviewContext, previewEligibility, previewFileAudience, createDraftFromFile, contactMembershipCount, removeContactFromAudience, deleteContactAndMemberships } from "@/lib/whatsapp-campaigns/file-audiences";

async function authorize() { if (!(await hasAdminSession())) throw new Error("Unauthorized"); }
function refresh() { revalidatePath("/admin/whatsapp-campaigns"); revalidatePath("/admin/whatsapp-campaigns/contacts"); }
export async function previewImport(csv: string, source: Source, details: ImportDetails) {
  await authorize();
  const context = importReviewContext(details);
  const initial = csvPreview(csv, source);
  const existing = await existingPhones(initial.rows.flatMap(row => row.phoneE164 ? [row.phoneE164] : []));
  return { ...csvPreview(csv, source, existing), ...await previewEligibility(initial), details, token: issueReview(csv, source, context) };
}
export async function confirmImport(csv: string, source: Source, token: string, details: ImportDetails) {
  await authorize();
  verifyReview(csv, source, token, importReviewContext(details));
  const preview = csvPreview(csv, source);
  const result = await confirmFileImport(preview, csv, details);
  refresh(); return result;
}
export async function addContact(input: ContactInput) {
  await authorize(); validateContact(input);
  const receiptId = createHash("sha256").update(JSON.stringify(["manual", input])).digest("hex");
  const result = await importContacts([input], receiptId);
  refresh(); return result;
}
export async function setContactReview(id: string, status: "unreviewed" | "eligible" | "excluded" | "opted_out") {
  await authorize(); await reviewContact(id, status); refresh();
}
export async function saveAudience(ids: string[], requestId: string) {
  await authorize(); const id = await createDraft(ids, requestId); refresh(); return id;
}

export async function checkFileAudience(audienceId: string, campaignId: string) {
  await authorize(); return previewFileAudience(audienceId, campaignId);
}
export async function saveFileAudience(audienceId: string, campaignId: string, fingerprint: string) {
  await authorize(); const id = await createDraftFromFile(audienceId, campaignId, fingerprint); refresh(); return id;
}
export async function getContactMembershipCount(contactId: string) {
  await authorize(); return contactMembershipCount(contactId);
}
export async function removeFromAudience(audienceId: string, contactId: string) {
  await authorize(); await removeContactFromAudience(audienceId, contactId); refresh();
}
export async function deleteContactCompletely(contactId: string) {
  await authorize(); const result = await deleteContactAndMemberships(contactId); refresh(); return result;
}
