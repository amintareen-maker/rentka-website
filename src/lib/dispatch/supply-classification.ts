export const SUPPLY_CLASSIFICATIONS = [
  "vendor_managed",
  "independent_owner_driver",
  "rentka_internal",
  "unknown_needs_review",
] as const;

export const DRIVER_SUPPLY_RELATIONSHIPS = SUPPLY_CLASSIFICATIONS;

export const VEHICLE_CONTROL_RELATIONSHIPS = [
  "vendor_owned",
  "vendor_managed",
  "independent_controlled",
  "rentka_internal",
  "unknown_needs_review",
] as const;

export type SupplyClassification = typeof SUPPLY_CLASSIFICATIONS[number];
export type DriverSupplyRelationship = typeof DRIVER_SUPPLY_RELATIONSHIPS[number];
export type VehicleControlRelationship = typeof VEHICLE_CONTROL_RELATIONSHIPS[number];
export type OfferRecipientType = "vendor" | "independent_driver" | "rentka_internal" | "blocked_needs_review";

export const SUPPLY_CLASSIFICATION_LABELS: Readonly<Record<SupplyClassification, string>> = {
  vendor_managed: "One of my drivers will drive",
  independent_owner_driver: "I will drive myself",
  rentka_internal: "RentKA team will drive",
  unknown_needs_review: "Driver setup incomplete",
};

export const DRIVER_SUPPLY_RELATIONSHIP_LABELS: Readonly<Record<DriverSupplyRelationship, string>> = {
  vendor_managed: "Vendor driver",
  independent_owner_driver: "Owner drives",
  rentka_internal: "RentKA driver",
  unknown_needs_review: "Driver setup incomplete",
};

export const VEHICLE_CONTROL_RELATIONSHIP_LABELS: Readonly<Record<VehicleControlRelationship, string>> = {
  vendor_owned: "Vendor vehicle",
  vendor_managed: "Managed vendor vehicle",
  independent_controlled: "Owner's vehicle",
  rentka_internal: "RentKA vehicle",
  unknown_needs_review: "Setup incomplete",
};

export const supplyClassificationLabel = (value: SupplyClassification) => SUPPLY_CLASSIFICATION_LABELS[value];
export const driverSupplyRelationshipLabel = (value: DriverSupplyRelationship) => DRIVER_SUPPLY_RELATIONSHIP_LABELS[value];
export const vehicleControlRelationshipLabel = (value: VehicleControlRelationship) => VEHICLE_CONTROL_RELATIONSHIP_LABELS[value];

export const LEGACY_SUPPLY_CLASSIFICATION: SupplyClassification = "unknown_needs_review";
export const LEGACY_DRIVER_RELATIONSHIP: DriverSupplyRelationship = "unknown_needs_review";
export const LEGACY_VEHICLE_CONTROL: VehicleControlRelationship = "unknown_needs_review";

export function offerRecipientType(classification: SupplyClassification): OfferRecipientType {
  if (classification === "vendor_managed") return "vendor";
  if (classification === "independent_owner_driver") return "independent_driver";
  if (classification === "rentka_internal") return "rentka_internal";
  return "blocked_needs_review";
}

export function automatedOfferRoutingEligible(classification: SupplyClassification, independentOwnerDriverId?: string) {
  if (classification === "unknown_needs_review" || classification === "rentka_internal") return false;
  return classification === "vendor_managed" || Boolean(independentOwnerDriverId);
}

export function assertDriverSupplyRelationship(classification: SupplyClassification, relationship: DriverSupplyRelationship) {
  if (relationship === "unknown_needs_review" && classification !== "unknown_needs_review") return;
  if (classification !== relationship) throw new Error(`Driver supply relationship ${relationship} conflicts with supply account classification ${classification}.`);
}

export function assertVehicleControlRelationship(classification: SupplyClassification, control: VehicleControlRelationship) {
  if (control === "unknown_needs_review" && classification !== "unknown_needs_review") return;
  const valid = classification === "vendor_managed"
    ? control === "vendor_owned" || control === "vendor_managed"
    : classification === "independent_owner_driver"
      ? control === "independent_controlled"
      : classification === "rentka_internal"
        ? control === "rentka_internal"
        : control === "unknown_needs_review";
  if (!valid) throw new Error(`Vehicle control relationship ${control} conflicts with supply account classification ${classification}.`);
}

export function assertIndependentOwnerDriverDesignation(
  classification: SupplyClassification,
  supplyAccountId: string,
  independentOwnerDriverId: string | undefined,
  driver: { id: string; vendorId: string; supplyRelationship: DriverSupplyRelationship } | null,
) {
  if (!independentOwnerDriverId) return;
  if (classification !== "independent_owner_driver") throw new Error("Choose 'I will drive myself' before selecting the owner profile.");
  if (!driver || driver.id !== independentOwnerDriverId || driver.vendorId !== supplyAccountId || driver.supplyRelationship !== "independent_owner_driver") {
    throw new Error("Choose the owner profile that belongs to this supply account.");
  }
}

export function supplyRelationshipReview(
  classification: SupplyClassification,
  drivers: readonly { supplyRelationship: DriverSupplyRelationship }[],
  vehicles: readonly { controlRelationship: VehicleControlRelationship }[],
) {
  let needsReview = classification === "unknown_needs_review";
  let contradictions = 0;
  for (const driver of drivers) {
    if (driver.supplyRelationship === "unknown_needs_review") needsReview = true;
    try { assertDriverSupplyRelationship(classification, driver.supplyRelationship); } catch { contradictions += 1; }
  }
  for (const vehicle of vehicles) {
    if (vehicle.controlRelationship === "unknown_needs_review") needsReview = true;
    try { assertVehicleControlRelationship(classification, vehicle.controlRelationship); } catch { contradictions += 1; }
  }
  return { valid: contradictions === 0, needsReview: needsReview || contradictions > 0, contradictions };
}

export function supplyClassificationPresentation(classification: SupplyClassification) {
  if (classification === "vendor_managed") return "One of this vendor's drivers will drive. Booking offers go to the vendor first.";
  if (classification === "independent_owner_driver") return "The owner will drive. Booking offers go directly to the owner.";
  if (classification === "rentka_internal") return "A RentKA team driver will handle this vehicle; automated supplier offers stay off.";
  return "Driver setup incomplete — automated booking offers remain blocked.";
}

export function supplyRosterCounts(vendorId: string, drivers: readonly { vendorId: string }[], vehicles: readonly { vendorId: string }[]) {
  return { drivers: drivers.filter((driver) => driver.vendorId === vendorId).length, vehicles: vehicles.filter((vehicle) => vehicle.vendorId === vendorId).length };
}
