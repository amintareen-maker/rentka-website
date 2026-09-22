"use server";
import { majorToMinor } from "@/lib/dispatch/booking-validation";
import { quickAddVendorDriver, quickAddVendorVehicle, submitSecureVendorOfferResponse, submitVendorFulfillmentProposal } from "@/lib/dispatch/vendor-offer-portal-repository";
import { VENDOR_DECLINE_REASONS, type VendorQuickAddResult } from "@/lib/dispatch/vendor-offer-portal-types";
import { stageDocument } from "@/lib/partner-applications/documents";
import { publicUploadFailure } from "@/lib/partner-applications/documents-core";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
type ActionResult = { ok: boolean; message: string; option?: VendorQuickAddResult };

async function optionalUpload(form: FormData, field: string, kind: string) {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return undefined;
  try {
    const staged = await stageDocument(file, kind);
    return `${staged.id}.${staged.token}`;
  } catch (error) {
    throw new Error(publicUploadFailure(error).message);
  }
}

export async function respondToVendorOffer(token: string, form: FormData): Promise<ActionResult> {
  try {
    const kind = value(form, "kind");
    if (kind === "accepted") await submitSecureVendorOfferResponse(token, { kind });
    else if (kind === "declined") {
      const declineReason = value(form, "declineReason"), note = value(form, "note");
      if (!VENDOR_DECLINE_REASONS.includes(declineReason as never)) throw new Error("Select a decline reason.");
      if (declineReason === "other" && note.length < 3) throw new Error("Add a short reason.");
      await submitSecureVendorOfferResponse(token, { kind, declineReason: declineReason as never, ...(note ? { note } : {}) });
    } else if (kind === "countered") {
      const requestedPayoutMinor = majorToMinor(value(form, "requestedPayout"), "Requested payout"), note = value(form, "note");
      await submitSecureVendorOfferResponse(token, { kind, requestedPayoutMinor, ...(note ? { note } : {}) });
    } else throw new Error("Select a valid response.");
    return { ok: true, message: kind === "accepted" ? "Accepted — now propose a Driver and Vehicle for RentKA review." : kind === "declined" ? "Declined. RentKA will review your response." : "Counter submitted — awaiting RentKA review." };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Unable to submit vendor response." }; }
}

export async function addVendorDriverForOffer(token: string, form: FormData): Promise<ActionResult> {
  try {
    const documentKind = value(form, "driverDocumentKind"), file = form.get("driverDocument");
    if (file instanceof File && file.size > 0 && !["cnic_front", "licence_front"].includes(documentKind)) throw new Error("Choose CNIC or Driving licence for the uploaded document.");
    const uploadToken = file instanceof File && file.size > 0 ? await optionalUpload(form, "driverDocument", documentKind) : undefined;
    const option = await quickAddVendorDriver(token, { name: value(form, "driverName"), phone: value(form, "driverPhone"), uploadToken });
    return { ok: true, message: option.duplicate ? "Existing driver selected. No duplicate was created." : "New driver saved and selected. RentKA review is required before assignment.", option };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Unable to save the driver." }; }
}

export async function addVendorVehicleForOffer(token: string, form: FormData): Promise<ActionResult> {
  try {
    const tokens = (await Promise.all([
      optionalUpload(form, "registrationDocument", "vehicle_registration"),
      optionalUpload(form, "vehiclePhoto", "vehicle_photo"),
    ])).filter((item): item is string => Boolean(item));
    const option = await quickAddVendorVehicle(token, { make: value(form, "vehicleMake"), model: value(form, "vehicleModel"), registrationNumber: value(form, "registrationNumber"), modelYear: value(form, "modelYear"), uploadTokens: tokens });
    return { ok: true, message: option.duplicate ? "Existing vehicle selected. No duplicate was created." : "New vehicle saved and selected. RentKA review is required before assignment.", option };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Unable to save the vehicle." }; }
}

export async function proposeVendorResources(token: string, form: FormData): Promise<ActionResult> {
  try {
    const driverId = value(form, "driverId"), vehicleId = value(form, "vehicleId");
    if (!driverId || !vehicleId) throw new Error("Select a Driver and Vehicle.");
    const result = await submitVendorFulfillmentProposal(token, { driverId, vehicleId });
    return { ok: true, message: result.duplicate ? "This fulfillment proposal is already current." : "Fulfillment proposal saved for RentKA review. The booking is not assigned." };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Unable to save fulfillment proposal." }; }
}
