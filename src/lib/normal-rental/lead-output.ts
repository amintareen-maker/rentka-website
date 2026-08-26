export type LahoreVehicleOutput = {
  carName: string;
  modelYear?: string | number | null;
  publicVehicleLabel?: string | null;
};

const text = (value: unknown) => String(value ?? "").trim();

export function resolveCustomerVehicleName(vehicle: LahoreVehicleOutput) {
  return text(vehicle.publicVehicleLabel) || text(vehicle.carName);
}

export function adminVehicleDetails(vehicle: LahoreVehicleOutput) {
  const publicVehicleLabel = text(vehicle.publicVehicleLabel);
  return {
    vehicle: publicVehicleLabel || text(vehicle.carName),
    baseModel: publicVehicleLabel ? text(vehicle.carName) : undefined,
    modelYear: text(vehicle.modelYear) || undefined,
  };
}

export function formatLahoreWhatsAppVehicleLines(input: LahoreVehicleOutput & {
  pricingType: "withinCity" | "outsideCity";
  duration: "daily" | "weekly" | "monthly";
  rate: number;
}) {
  const durationUnit = { daily: "day", weekly: "week", monthly: "month" }[input.duration];
  return [
    `Vehicle: ${resolveCustomerVehicleName(input)}`,
    ...(text(input.modelYear) ? [`Model Year: ${text(input.modelYear)}`] : []),
    `Service: ${input.pricingType === "withinCity" ? "Within Lahore" : "Outstation"}`,
    "Driver: Included",
    `Rate: PKR ${input.rate.toLocaleString("en-PK")}/${durationUnit}`,
  ];
}
