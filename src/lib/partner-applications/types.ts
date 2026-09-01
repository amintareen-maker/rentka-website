import type { NormalRentalZoneId } from "../normal-rental/zones";
import type { AuditActor } from "../dispatch/types";

export const APPLICATION_TYPES = ["driver", "ownerDriver", "vendor"] as const;
export const APPLICATION_STATUSES = ["new", "under_review", "need_more_information", "approved", "rejected"] as const;
export const DOCUMENT_REVIEW_STATES = ["pending", "verified", "rejected", "needs_replacement"] as const;
export const PARTNER_VEHICLE_CATEGORIES = ["Sedan", "Hatchback", "SUV", "Mid SUV", "Luxury", "Van", "Coaster", "Other"] as const;
export type ApplicationType = typeof APPLICATION_TYPES[number];
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export type DocumentReviewState = typeof DOCUMENT_REVIEW_STATES[number];
export type ExtractionField = { value: string; confidence: number; source: "embedded_text"; accepted?: boolean };
export type ExtractionResult = { status: "extracted" | "low_confidence" | "unavailable" | "failed"; fields: Record<string, ExtractionField>; attemptedAt: string; engine: "rentka_local_embedded_text_v1"; error?: string };
export type PartnerDocument = { id: string; kind: string; storagePath: string; originalName: string; contentType: string; size: number; reviewState: DocumentReviewState; uploadedAt: string; extraction?: ExtractionResult };
export type ApplicantVehicle = { make: string; model: string; modelYear?: number; registrationNumber: string; registrationNormalized: string; category: string; ownershipRelationship?: string; documents: PartnerDocument[] };
export type PartnerApplication = {
  id: string; applicationId: string; applicationType: ApplicationType; status: ApplicationStatus;
  name: string; businessName?: string; contactName?: string; mobile: string; mobileNormalized: string; whatsapp: string; whatsappNormalized: string;
  zoneIds: NormalRentalZoneId[]; address?: string; cnicNumber?: string; cnicNormalized?: string; licenceNumber?: string; licenceNormalized?: string;
  licenceIssueDate?: string; licenceExpiryDate?: string; numberOfVehicles?: number; approximateDrivers?: number; businessInfo?: string; notes?: string;
  vehicles: ApplicantVehicle[]; documents: PartnerDocument[];
  consent: { accepted: true; textVersion: "2026-08-26"; acceptedAt: string };
  createdAt: string; updatedAt: string; createdBy: { type: "public_applicant" }; updatedBy: { type: "public_applicant" } | AuditActor;
  duplicateCandidates?: { vendors: string[]; drivers: string[]; vehicles: string[] };
  onboarding?: { vendorId?: string; driverIds: string[]; vehicleIds: string[]; onboardedAt: string; onboardedBy: AuditActor };
};

export type StagedUpload = { tokenHash: string; storagePath: string; originalName: string; contentType: string; size: number; kind: string; createdAt: string; expiresAt: string; attachedApplicationId?: string; extraction?: ExtractionResult };
export type ApplicationEvent = { type: string; timestamp: unknown; actor: AuditActor | { type: "public_applicant" }; metadata?: Record<string, unknown> };
