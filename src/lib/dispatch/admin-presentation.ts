export const DISPATCH_CREATION_DEFAULTS = {
  vendor: { active: true, priority: "normal" },
  vehicle: { active: true, status: "available", documentationState: "unknown" },
  driver: { active: true, status: "available", priority: "normal" },
} as const;

export function operationalStatusPresentation(active: boolean, status: string) {
  return active
    ? { label: status.replaceAll("_", " "), inactive: false }
    : { label: "Inactive", inactive: true };
}
