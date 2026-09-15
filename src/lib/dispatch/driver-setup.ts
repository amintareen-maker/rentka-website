import type { SupplyClassification } from "./supply-classification";

export const DRIVER_SETUP_CHOICES = ["self", "vendor_driver"] as const;
export type DriverSetupChoice = (typeof DRIVER_SETUP_CHOICES)[number];

export const DRIVER_SETUP_LABELS: Readonly<Record<DriverSetupChoice, string>> = {
  self: "I will drive myself",
  vendor_driver: "One of my drivers will drive",
};

export function parseDriverSetupChoice(value: unknown): DriverSetupChoice {
  if (value === "self" || value === "vendor_driver") return value;
  throw new Error("Choose who will drive this vehicle.");
}

export function driverSetupClassification(choice: DriverSetupChoice): SupplyClassification {
  return choice === "self" ? "independent_owner_driver" : "vendor_managed";
}

export function driverSetupChoiceForClassification(classification: SupplyClassification): DriverSetupChoice | undefined {
  if (classification === "independent_owner_driver") return "self";
  if (classification === "vendor_managed") return "vendor_driver";
  return undefined;
}

export function requireVendorDriverChoice(
  choice: DriverSetupChoice,
  vendorId: string,
  driverId: string | undefined,
  drivers: readonly { id: string; vendorId: string; active: boolean; status: string }[],
) {
  if (choice === "self") return undefined;
  const driver = drivers.find((item) => item.id === driverId);
  if (!driver || driver.vendorId !== vendorId)
    throw new Error("Choose one of this vendor's drivers.");
  if (!driver.active || driver.status !== "available")
    throw new Error("Choose an active, available vendor driver.");
  return driver.id;
}

export const DRIVER_SETUP_INCOMPLETE_MESSAGE =
  "Driver setup incomplete — choose whether this owner will drive himself or use one of his drivers.";
