import { isNormalRentalZoneId, type NormalRentalZoneId } from "../normal-rental/zones.ts";
import { CHECK_STATES, DISPATCH_PRIORITIES, DOCUMENTATION_STATES, DRIVER_STATUSES, DRIVER_VEHICLE_ELIGIBILITY_MODES, VEHICLE_STATUSES, type CheckState, type DispatchPriority, type DocumentationState, type DriverStatus, type VehicleStatus } from "./types.ts";

export class DispatchValidationError extends Error {
  field: string;
  constructor(field: string, message: string) { super(message); this.field = field; }
}
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const required = (form: FormData, key: string, label: string, max = 160) => { const value = clean(form.get(key)); if (!value) throw new DispatchValidationError(key, `${label} is required.`); if (value.length > max) throw new DispatchValidationError(key, `${label} is too long.`); return value; };
const optional = (form: FormData, key: string, max = 2000) => { const value = clean(form.get(key)); if (value.length > max) throw new DispatchValidationError(key, "This value is too long."); return value || undefined; };
const selected = <T extends string>(form: FormData, key: string, allowed: readonly T[], label: string): T => { const value = clean(form.get(key)) as T; if (!allowed.includes(value)) throw new DispatchValidationError(key, `Select a valid ${label}.`); return value; };
export function parseDispatchAdminDate(value: unknown) {
  const entered = clean(value);
  if (!entered) return undefined;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(entered);
  if (!match) throw new DispatchValidationError("date", "Enter the date as DD/MM/YYYY, for example 25/08/2027.");
  const day = Number(match[1]); const month = Number(match[2]); const year = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || year > 9999 || candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    throw new DispatchValidationError("date", "Enter a real calendar date in DD/MM/YYYY format.");
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}
export function formatDispatchAdminDate(value: string | undefined) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}
const date = (form: FormData, key: string) => {
  try { return parseDispatchAdminDate(form.get(key)); }
  catch (error) { if (error instanceof DispatchValidationError) error.field = key; throw error; }
};

export function normalizeDispatchPhone(value: unknown) {
  const original = clean(value); if (!original) return "";
  let compact = original.replace(/[^\d+]/g, "");
  if (compact.startsWith("00")) compact = `+${compact.slice(2)}`;
  if (/^03\d{9}$/.test(compact)) return `92${compact.slice(1)}`;
  if (/^\+92\d{10}$/.test(compact)) return compact.slice(1);
  if (/^92\d{10}$/.test(compact)) return compact;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact.slice(1);
  if (/^[1-9]\d{7,14}$/.test(compact)) return compact;
  return "";
}
const phone = (form: FormData, key: string, label: string) => { const original = required(form, key, label, 40); const normalized = normalizeDispatchPhone(original); if (!normalized) throw new DispatchValidationError(key, `Enter a valid ${label.toLowerCase()}.`); return { original, normalized }; };
export function parseZoneIds(values: unknown[]): NormalRentalZoneId[] { const zones = [...new Set(values.map(clean).filter(Boolean))]; if (!zones.length || !zones.every(isNormalRentalZoneId)) throw new DispatchValidationError("zoneIds", "Select at least one valid operating zone."); return zones as NormalRentalZoneId[]; }
const zones = (form: FormData) => parseZoneIds(form.getAll("zoneIds"));
const check = (form: FormData, key: string): CheckState => selected(form, key, CHECK_STATES, "documentation status");

export function parseVendorForm(form: FormData) {
  const primary = phone(form, "primaryPhone", "Primary phone"); const whatsapp = phone(form, "whatsappNumber", "WhatsApp number");
  return { name: required(form, "name", "Vendor/company name"), contactName: optional(form, "contactName", 120), primaryPhone: primary.original, primaryPhoneNormalized: primary.normalized, whatsappNumber: whatsapp.original, whatsappNumberNormalized: whatsapp.normalized, zoneIds: zones(form), priority: selected<DispatchPriority>(form, "priority", DISPATCH_PRIORITIES, "priority"), active: form.get("active") === "on", notes: optional(form, "notes"), legacyVendorId: optional(form, "legacyVendorId", 160), normalRentalVendorId: optional(form, "normalRentalVendorId", 160) };
}

export function parseVehicleForm(form: FormData) {
  const rawYear = clean(form.get("modelYear")); const modelYear = rawYear ? Number(rawYear) : undefined;
  if (modelYear !== undefined && (!Number.isInteger(modelYear) || modelYear < 1950 || modelYear > new Date().getFullYear() + 1)) throw new DispatchValidationError("modelYear", "Enter a valid model year.");
  const registrationNumber = required(form, "registrationNumber", "Registration number", 40).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9 .\/-]{1,38}[A-Z0-9]$/.test(registrationNumber)) throw new DispatchValidationError("registrationNumber", "Enter a valid registration number.");
  return { vendorId: required(form, "vendorId", "Vendor"), zoneIds: zones(form), category: required(form, "category", "Vehicle category", 80), make: required(form, "make", "Make", 80), model: required(form, "model", "Model", 100), modelYear, registrationNumber, publicModelSourceCarId: optional(form, "publicModelSourceCarId", 160), status: selected<VehicleStatus>(form, "status", VEHICLE_STATUSES, "vehicle status"), active: form.get("active") === "on", notes: optional(form, "notes"), documentation: { overallState: selected<DocumentationState>(form, "documentationOverallState", DOCUMENTATION_STATES, "documentation state"), registrationState: check(form, "registrationState"), tokenChallanState: check(form, "tokenChallanState"), permitState: check(form, "permitState"), fitnessState: check(form, "fitnessState"), insuranceState: check(form, "insuranceState"), warning: optional(form, "documentationWarning", 500), verifiedAt: date(form, "documentationVerifiedAt"), registrationExpiry: date(form, "registrationExpiry"), permitExpiry: date(form, "permitExpiry"), fitnessExpiry: date(form, "fitnessExpiry"), insuranceExpiry: date(form, "insuranceExpiry"), notes: optional(form, "documentationNotes") } };
}

export function parseDriverForm(form: FormData) {
  const mobile = phone(form, "mobileNumber", "Mobile number"); const whatsapp = phone(form, "whatsappNumber", "WhatsApp number");
  const rawMode=clean(form.get("vehicleEligibilityMode"));const mode=rawMode?selected(form,"vehicleEligibilityMode",DRIVER_VEHICLE_ELIGIBILITY_MODES,"vehicle eligibility"):"any_vendor_vehicle";const vehicleIds=[...new Set(form.getAll("eligibleVehicleIds").map(clean).filter(Boolean))];const allowedModelsOrCategories=[...new Set(form.getAll("allowedModelsOrCategories").map(clean).filter(Boolean))];if(mode==="specific_vehicles"&&!vehicleIds.length)throw new DispatchValidationError("eligibleVehicleIds","Select at least one permitted physical vehicle.");if(mode==="models_or_categories"&&!allowedModelsOrCategories.length)throw new DispatchValidationError("allowedModelsOrCategories","Select at least one permitted model or category.");
  return { name: required(form, "name", "Driver name"), mobileNumber: mobile.original, mobileNumberNormalized: mobile.normalized, whatsappNumber: whatsapp.original, whatsappNumberNormalized: whatsapp.normalized, vendorId: required(form, "vendorId", "Vendor"), zoneIds: zones(form), priority: selected<DispatchPriority>(form, "priority", DISPATCH_PRIORITIES, "priority"), status: selected<DriverStatus>(form, "status", DRIVER_STATUSES, "driver status"), active: form.get("active") === "on", notes: optional(form, "notes"), ...(mode==="any_vendor_vehicle"?{}:{vehicleEligibility:{mode,...(mode==="specific_vehicles"?{vehicleIds}:{allowedModelsOrCategories})}}), documentation: { cnicVerificationState: check(form, "cnicVerificationState"), licenceState: check(form, "licenceState"), licenceExpiry: date(form, "licenceExpiry"), verifiedAt: date(form, "documentationVerifiedAt"), notes: optional(form, "documentationNotes") } };
}
