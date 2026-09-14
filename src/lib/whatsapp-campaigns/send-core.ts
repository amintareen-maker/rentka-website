import { normalizeCampaignPhone } from "./core.ts";
import type { AudienceMembership, Contact, FileAudience } from "./types.ts";
import { INTRODUCTION_CAMPAIGN_ID, SEND_STATUSES, type SendCounts, type SendMode, type SendRecord, type SendRun, type SendStatus, type SendState } from "./send-types.ts";

export const SEND_CHUNK_SIZE = 5;
export const PREPARE_CHUNK_SIZE = 100;
export const LEASE_MS = 120_000;
export const PROVIDER_SPACING_MS = 1000;
export const MAX_ATTEMPTS = 3;
export const campaignLiveEnabled = (value: string | undefined) => value === "true";
export const emptyCounts = (): SendCounts => ({ ...Object.fromEntries(SEND_STATUSES.map(status => [status, 0])), imported: 0, attempted: 0, acceptedTotal: 0, sentTotal: 0, deliveredTotal: 0, readTotal: 0 }) as SendCounts;
export function recordCounts(record: SendRecord): SendCounts {
  const counts = emptyCounts(); counts.imported = 1; counts[record.status] = 1;
  counts.attempted = record.attemptCount > 0 ? 1 : 0;
  counts.acceptedTotal = record.acceptedAt ? 1 : 0;
  counts.sentTotal = record.sentAt || record.deliveredAt || record.readAt ? 1 : 0;
  counts.deliveredTotal = record.deliveredAt || record.readAt ? 1 : 0;
  counts.readTotal = record.readAt ? 1 : 0;
  return counts;
}
export function changeCounts(counts: SendCounts, previous: SendRecord | undefined, next: SendRecord) {
  const before = previous ? recordCounts(previous) : emptyCounts(), after = recordCounts(next), updated = { ...counts };
  for (const key of Object.keys(updated) as Array<keyof SendCounts>) updated[key] += after[key] - before[key];
  return updated;
}
export function completionState(run: SendRun): SendState {
  if (run.status === "cancelled" || run.status === "paused" || run.phase !== "finished") return run.status;
  const c = run.counts;
  if (c.pending || c.locked || c.sending || c.unknown || c.accepted) return "partially_sent";
  return c.failed && !c.acceptedTotal ? "failed" : "completed";
}
export function recipientSuppression(input: {
  audience?: FileAudience; member?: AudienceMembership; contact?: Contact; ledger?: SendRecord;
  result?: SendRecord; mode: SendMode; audienceId: string; now: number;
}) {
  const { audience, member, contact, ledger, result, mode, audienceId } = input;
  if (!audience || audience.importState !== "completed" || audience.status === "cancelled") return "audience_inactive";
  if (!member || !contact) return "missing_contact";
  const phone = normalizeCampaignPhone(member.phoneE164);
  if (!phone || phone.phoneE164 !== member.phoneE164 || contact.phoneE164 !== member.phoneE164) return "invalid_phone";
  if (contact.optOut || contact.marketingStatus === "opted_out") return "opted_out";
  if (contact.marketingStatus === "excluded") return "excluded";
  if (!member.eligibilityAtImport) return member.suppressionReason || "membership_ineligible";
  if (contact.lastCampaignId === INTRODUCTION_CAMPAIGN_ID && contact.lastSentAt) return "already_sent";
  if (result?.status === "suppressed") return result.errorCode || "previously_suppressed";
  if (ledger) {
    if (["accepted", "sent", "delivered", "read"].includes(ledger.status) || ledger.sentAt || ledger.deliveredAt || ledger.readAt) return "already_sent";
    if (["locked", "sending"].includes(ledger.status)) return "currently_locked";
    if (ledger.status === "unknown") return "unknown_outcome";
    if (ledger.status === "failed") {
      if (mode !== "retry" || ledger.audienceId !== audienceId || !ledger.retryable || ledger.attemptCount >= MAX_ATTEMPTS) return "failed_not_retryable";
    } else return "existing_send_record";
  } else if (mode === "retry") return "not_failed";
  return null;
}
export function deliveryState(current: SendStatus, incoming: string): SendStatus {
  if (!["sent", "delivered", "read", "failed"].includes(incoming)) return current;
  if (current === "read") return "read";
  if (current === "delivered" && incoming !== "read") return "delivered";
  if (incoming === "read" || incoming === "delivered") return incoming;
  if (incoming === "failed") return "failed";
  return "sent";
}
export function safeProviderFailure(error: unknown) {
  const e = error && typeof error === "object" ? error as { status?: number; code?: string } : {};
  if (e.status === 429) return { status: "failed" as const, retryable: true, errorCode: "provider_rate_limited", errorMessage: "Provider explicitly rejected this attempt due to rate limiting." };
  if (e.status && e.status >= 400 && e.status < 500 && e.status !== 408) return { status: "failed" as const, retryable: false, errorCode: `provider_http_${e.status}`, errorMessage: "Provider rejected this attempt. Configuration or recipient review is required." };
  if (e.code === "CONFIGURATION") return { status: "failed" as const, retryable: false, errorCode: "provider_configuration", errorMessage: "Provider configuration is unavailable." };
  return { status: "unknown" as const, retryable: false, errorCode: "provider_outcome_unknown", errorMessage: "Provider acceptance is uncertain. Automatic retry is blocked." };
}
export function confirmationText(name: string, count: number, mode: SendMode) { return `${mode === "retry" ? "RETRY" : mode === "resume" ? "RESUME" : "SEND"} ${name.toUpperCase()} TO ${count} CONTACTS`; }
