export type VehicleDisplayInput = {
  make?: string | null;
  model?: string | null;
  modelYear?: number | null;
  registrationNumber?: string | null;
};

const clean = (value: string | null | undefined) => value?.trim() ?? "";

export function formatVehicleDisplayLabel(vehicle: VehicleDisplayInput) {
  const description = [
    clean(vehicle.make),
    clean(vehicle.model),
    vehicle.modelYear ? String(vehicle.modelYear) : "",
  ]
    .filter(Boolean)
    .join(" ") || "Vehicle";
  const registration =
    clean(vehicle.registrationNumber) || "Registration not added";
  return `${description} — ${registration}`;
}
