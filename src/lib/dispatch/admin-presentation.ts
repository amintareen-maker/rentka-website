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
