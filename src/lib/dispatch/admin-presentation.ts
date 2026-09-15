import type { DispatchOfferRecord } from "./offer-types";

export const DISPATCH_CREATION_DEFAULTS = {
  vendor: { active: true, priority: "normal", supplyClassification: "unknown_needs_review" },
  vehicle: { active: true, status: "available", documentationState: "unknown", controlRelationship: "unknown_needs_review" },
  driver: { active: true, status: "available", priority: "normal", supplyRelationship: "unknown_needs_review" },
} as const;

export function operationalStatusPresentation(active: boolean, status: string) {
  return active
    ? { label: status.replaceAll("_", " "), inactive: false }
    : { label: "Inactive", inactive: true };
}

const sentenceCase = (value: string) => {
  const label = value.replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export function supplierResponsePresentation(offer: DispatchOfferRecord) {
  const responseLabel =
    offer.responseStatus === "countered"
      ? "Countered — Awaiting RentKA Review"
      : offer.responseStatus === "accepted"
        ? offer.negotiationStatus === "counter_agreed"
          ? "Counter Agreed — Awaiting Assignment"
          : "Accepted — Awaiting RentKA Confirmation"
        : offer.responseStatus === "available"
          ? "Available"
          : offer.responseStatus === "no_response"
            ? "No Response"
            : sentenceCase(offer.responseStatus);

  return {
    recipientName:
      offer.recipientDisplayName ??
      offer.driverName ??
      offer.vendorName ??
      offer.supplyAccountId ??
      "Historical recipient",
    supplierType:
      offer.recipientType === "vendor"
        ? "Vendor Managed"
        : offer.recipientType === "independent_driver"
          ? "Owner drives"
          : "Driver",
    deliveryLabel: sentenceCase(offer.notificationStatus ?? "not queued"),
    responseLabel,
    originalPayoutMinor: offer.approvedPayoutMinor,
    currentPayoutMinor:
      offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor,
    counterPayoutMinor: offer.requestedPayoutMinor,
    agreedPayoutMinor: offer.agreedPayoutMinor,
  };
}
