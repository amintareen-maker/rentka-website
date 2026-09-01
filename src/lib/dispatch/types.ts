import type { NormalRentalZoneId } from "../normal-rental/zones";

export const DISPATCH_PRIORITIES = ["preferred", "normal", "backup"] as const;
export const VEHICLE_STATUSES = ["available", "assigned", "unavailable", "inactive"] as const;
export const DRIVER_STATUSES = ["available", "on_trip", "offline", "blocked"] as const;
export const DOCUMENTATION_STATES = ["verified", "warning", "expired", "unknown"] as const;
export const CHECK_STATES = ["verified", "warning", "expired", "not_applicable", "unknown"] as const;

export type DispatchPriority = typeof DISPATCH_PRIORITIES[number];
export type VehicleStatus = typeof VEHICLE_STATUSES[number];
export type DriverStatus = typeof DRIVER_STATUSES[number];
export type DocumentationState = typeof DOCUMENTATION_STATES[number];
export type CheckState = typeof CHECK_STATES[number];
export type AuditActor = { type: "shared_admin_session" };
export const DRIVER_VEHICLE_ELIGIBILITY_MODES=["any_vendor_vehicle","specific_vehicles","models_or_categories"] as const;
export type DriverVehicleEligibility={mode:typeof DRIVER_VEHICLE_ELIGIBILITY_MODES[number];vehicleIds?:string[];allowedModelsOrCategories?:string[]};

export type DispatchVendor = {
  id: string; name: string; contactName?: string; primaryPhone: string; primaryPhoneNormalized: string;
  whatsappNumber: string; whatsappNumberNormalized: string; zoneIds: NormalRentalZoneId[];
  priority: DispatchPriority; active: boolean; notes?: string; legacyVendorId?: string;
  normalRentalVendorId?: string; createdAt: string; updatedAt: string; createdBy: AuditActor; updatedBy: AuditActor;
};

export type VehicleDocumentation = {
  overallState: DocumentationState; registrationState: CheckState; tokenChallanState: CheckState;
  permitState: CheckState; fitnessState: CheckState; insuranceState: CheckState;
  warning?: string; verifiedAt?: string; registrationExpiry?: string; permitExpiry?: string;
  fitnessExpiry?: string; insuranceExpiry?: string; notes?: string;
};

export type DispatchVehicle = {
  id: string; vendorId: string; zoneIds: NormalRentalZoneId[]; category: string; make: string; model: string;
  modelYear?: number; registrationNumber: string; publicModelSourceCarId?: string; status: VehicleStatus;
  active: boolean; notes?: string; documentation: VehicleDocumentation;
  createdAt: string; updatedAt: string; createdBy: AuditActor; updatedBy: AuditActor;
};

export type DriverDocumentation = {
  cnicVerificationState: CheckState; licenceState: CheckState; licenceExpiry?: string;
  verifiedAt?: string; notes?: string;
};

export type DispatchDriver = {
  id: string; name: string; mobileNumber: string; mobileNumberNormalized: string; whatsappNumber: string;
  whatsappNumberNormalized: string; vendorId: string; zoneIds: NormalRentalZoneId[]; priority: DispatchPriority;
  status: DriverStatus; active: boolean; notes?: string; documentation: DriverDocumentation;
  vehicleEligibility?: DriverVehicleEligibility;
  createdAt: string; updatedAt: string; createdBy: AuditActor; updatedBy: AuditActor;
};
