export const SOURCES = ["google_contacts", "rentka_lead", "rentka_customer", "excel", "manual", "other"] as const;
export const CATEGORIES = ["customer", "lead", "personal", "corporate", "vendor", "driver", "unknown"] as const;
export const MARKETING_STATUSES = ["unreviewed", "eligible", "excluded", "sent", "failed", "opted_out"] as const;
export const CAMPAIGN_STATUSES = ["draft", "ready_for_test", "test_sent", "approved_for_batch", "sending", "paused", "completed", "cancelled"] as const;
export type Source = typeof SOURCES[number];
export type Category = typeof CATEGORIES[number];
export type MarketingStatus = typeof MARKETING_STATUSES[number];
export type ContactInput = { displayName: string; phoneOriginal: string; source: Source; sourceReferenceId: string; category: Category; notes: string };
export type Contact = ContactInput & {
  id: string; phoneE164: string; countryCode: string; sources: Source[];
  sourceReferences: Array<{ source: Source; referenceId: string }>;
  marketingStatus: MarketingStatus; optOut: boolean; optOutAt: string | null;
  createdAt: string; updatedAt: string; importedAt: string | null;
  lastCampaignId: string | null; lastSentAt: string | null; lastDeliveryStatus: string | null;
};
export const INTRODUCTION = {
  name: "RentKA Introduction", templateName: "rentka_introduction_v1", templateLanguage: "en",
  templateCategory: "marketing", headerImageUrl: "https://www.rentka.co/whatsapp/rentka-introduction-header.jpg",
} as const;
export type Campaign = typeof INTRODUCTION & { campaignId: string; status: typeof CAMPAIGN_STATUSES[number]; createdAt: string; createdBy: { type: "shared_admin_session" }; audienceCount: number; audienceIds?: string[]; audienceMode?: "file"; sourceAudienceId?: string; audienceSources?: AudienceSource[] };

// Legacy draft contracts retained for compatibility. Active sender contracts live in send-types.ts.
export type CampaignSend = {
  id: string; campaignId: string; contactId: string; phoneE164: string;
  status: "reserved" | "provider_accepted" | "sent" | "delivered" | "read" | "failed" | "outcome_unknown";
  providerMessageId: string | null; attemptCount: number; claimedAt: string;
  sentAt: string | null; deliveredAt: string | null; readAt: string | null;
  failedAt: string | null; failureCode: string | null;
};
export type CampaignBatch = {
  id: string; campaignId: string; audienceSources?: AudienceSource[]; stage: 0 | 1 | 2 | 3 | 4 | 5;
  status: "draft" | "dry_run" | "approved" | "sending" | "paused" | "completed";
  confirmedRecipientCount: number; recipientIds: string[]; approvedBy: { type: "shared_admin_session" } | null;
  approvedAt: string | null; processedCount: number; failedCount: number;
};

export type ImportDetails = { uploadId: string; audienceName: string; originalFilename: string };
export type AudienceMembership = {
  audienceId: string; contactId: string; phoneE164: string;
  eligibilityAtImport: boolean; suppressionReason: string | null;
  sendStatus: "not_sent" | import("./send-types").SendStatus;
};
export type FileAudience = {
  sendState?: import("./send-types").SendSummary;
  audienceId: string; audienceName: string; originalFilename: string; source: Source;
  campaignId: string | null; totalRows: number; validCount: number; invalidCount: number;
  duplicateCount: number; existingContactCount: number; newContactCount: number;
  eligibleCount: number; suppressedCount: number; processedCount: number;
  status: "confirmed" | "ready" | "partially_sent" | "completed" | "cancelled";
  importState: "importing" | "interrupted" | "completed";
  createdAt: string; createdBy: { type: "shared_admin_session" };
};
export type FileAudienceView = FileAudience & { members: AudienceMembership[] };
export type AudienceSource = { audienceId: string; audienceName: string; importedCount: number; eligibleCount: number; suppressedCount: number };