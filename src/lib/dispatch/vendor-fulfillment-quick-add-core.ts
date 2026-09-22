import { createHash } from "node:crypto";
import { normalizeDispatchPhone } from "./validation.ts";
import type { DispatchDriver, DispatchVehicle, FulfillmentQuickAdd } from "./types.ts";

const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
export const normalizeVehicleRegistration = (value: unknown) => clean(value, 40).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
const deterministicId = (kind: "driver" | "vehicle", vendorId: string, identity: string) =>
  `vendor-quick-${kind}-${createHash("sha256").update(`${vendorId}:${identity}`).digest("hex").slice(0, 24)}`;

export function validateVendorQuickAddDriver(input: { name?: unknown; phone?: unknown }) {
  const name = clean(input.name, 160), mobileNumber = clean(input.phone, 40), mobileNumberNormalized = normalizeDispatchPhone(mobileNumber);
  if (!name) throw new Error("Driver name is required.");
  if (!mobileNumber) throw new Error("Mobile / WhatsApp number is required.");
  if (!mobileNumberNormalized) throw new Error("Enter a valid Mobile / WhatsApp number.");
  return { name, mobileNumber, mobileNumberNormalized };
}

export function validateVendorQuickAddVehicle(input: { make?: unknown; model?: unknown; registrationNumber?: unknown; modelYear?: unknown }) {
  const make = clean(input.make, 80), model = clean(input.model, 100), registrationNumber = clean(input.registrationNumber, 40).toUpperCase(), registrationNumberNormalized = normalizeVehicleRegistration(registrationNumber), rawYear = clean(input.modelYear, 4), modelYear = rawYear ? Number(rawYear) : undefined;
  if (!make || !model) throw new Error("Make and model are required.");
  if (!registrationNumber || registrationNumberNormalized.length < 2) throw new Error("Registration number is required.");
  if (modelYear !== undefined && (!Number.isInteger(modelYear) || modelYear < 1950 || modelYear > new Date().getFullYear() + 1)) throw new Error("Enter a valid vehicle year.");
  return { make, model, registrationNumber, registrationNumberNormalized, ...(modelYear === undefined ? {} : { modelYear }) };
}

export const quickAddDriverId = (vendorId: string, normalizedPhone: string) => deterministicId("driver", vendorId, normalizedPhone);
export const quickAddVehicleId = (vendorId: string, normalizedRegistration: string) => deterministicId("vehicle", vendorId, normalizedRegistration);

export function fulfillmentQuickAddBinding(input: { bookingOperationalId: string; offerId: string; vendorId: string; createdAt?: string }): FulfillmentQuickAdd {
  return { bookingOperationalId: input.bookingOperationalId, offerId: input.offerId, vendorId: input.vendorId, source: "vendor_secure_page", createdAt: input.createdAt ?? new Date().toISOString() };
}

export function isCurrentFulfillmentQuickAdd(resource: Pick<DispatchDriver | DispatchVehicle, "vendorId" | "fulfillmentQuickAdd">, input: { bookingOperationalId: string; offerId: string; vendorId: string }) {
  const trace = resource.fulfillmentQuickAdd;
  return resource.vendorId === input.vendorId && trace?.source === "vendor_secure_page" && trace.vendorId === input.vendorId && trace.bookingOperationalId === input.bookingOperationalId && trace.offerId === input.offerId;
}

export const quickAddDocumentSummary = (documents: { kind: string }[] | undefined, kind: "driver" | "vehicle") => {
  const values = new Set((documents ?? []).map((document) => document.kind));
  if (kind === "driver") return values.has("cnic_front") ? "CNIC provided" : values.has("licence_front") ? "Licence provided" : "Not provided";
  const parts = [values.has("vehicle_registration") ? "Registration uploaded" : "", values.has("vehicle_photo") ? "Photo uploaded" : ""].filter(Boolean);
  return parts.join(" · ") || "Not provided";
};
