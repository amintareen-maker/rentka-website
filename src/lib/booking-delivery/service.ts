import "server-only";
import { getAdminDb } from "../firebaseAdmin";
import { sourceCollection } from "../dispatch/booking-adapters";
import { normalizeExistingSource } from "../dispatch/booking-repository";
import { sendAirportBookingNotification, type AirportBookingNotification } from "../airport/notification";
import { sendBookingEmails } from "../ta-connections/booking";
import type { TaBooking } from "../ta-connections/types";
import type { OperationalSourceType } from "../dispatch/booking-types";
import { adaptBookingDelivery, googleSheetPayload } from "./adapters";
import type { DeliveryExecutor } from "./core";
import type { BookingDeliveryPayload, DestinationOutcome } from "./types";

type Source = Exclude<OperationalSourceType, "manual">;
const failure = (message: string): DestinationOutcome => ({ status: "failed", error: message.slice(0, 500) });

function standardEmailPayload(payload: BookingDeliveryPayload) {
  const d = payload.raw;
  return { leadId: payload.bookingId, carName: payload.vehicle.vehicleName ?? "Not specified", carId: typeof d.inventoryId === "string" ? d.inventoryId : null,
    vendorName: typeof d.vendorName === "string" ? d.vendorName : null, vendorId: typeof d.vendorId === "string" ? d.vendorId : null,
    modelYear: typeof d.modelYear === "string" || typeof d.modelYear === "number" ? d.modelYear : null, publicVehicleLabel: typeof d.publicVehicleLabel === "string" ? d.publicVehicleLabel : null,
    country: typeof d.country === "string" ? d.country : "PK", city: payload.trip.city ?? "Not specified", service: payload.trip.service ?? "With Driver",
    pricingType: payload.trip.tripType ?? null, duration: typeof d.duration === "string" ? d.duration : null, originalPrice: payload.pricing.customerAmount ?? null,
    dailyRentalRate: Number(d.dailyRentalRate ?? d.price ?? payload.pricing.customerAmount ?? 0), numberOfDays: Number(d.numberOfDays ?? 1), estimatedRentalAmount: Number(d.estimatedRentalAmount ?? payload.pricing.customerAmount ?? 0),
    pickupDate: payload.trip.date ?? "", preferredTime: payload.trip.time ?? "", pickupAddress: payload.trip.pickup ?? "",
    pickupLatitude: typeof d.pickupLatitude === "number" ? d.pickupLatitude : null, pickupLongitude: typeof d.pickupLongitude === "number" ? d.pickupLongitude : null,
    pickupPlaceId: typeof d.pickupPlaceId === "string" ? d.pickupPlaceId : "", pickupMapLink: typeof d.pickupMapLink === "string" ? d.pickupMapLink : "",
    isOutstation: Boolean(payload.trip.destination), destinationAddress: payload.trip.destination ?? "",
    destinationLatitude: typeof d.destinationLatitude === "number" ? d.destinationLatitude : null, destinationLongitude: typeof d.destinationLongitude === "number" ? d.destinationLongitude : null,
    destinationPlaceId: typeof d.destinationPlaceId === "string" ? d.destinationPlaceId : "", destinationMapLink: typeof d.destinationMapLink === "string" ? d.destinationMapLink : "",
    customerName: payload.customer.name, phone: payload.customer.phone, email: payload.customer.email ?? "", source: String(d.source ?? payload.source), reviewLink: typeof d.reviewLink === "string" ? d.reviewLink : "" };
}

function intercityEmailPayload(payload: BookingDeliveryPayload) {
  const d = payload.raw;
  return { tripType: d.tripType === "round-trip" ? "round-trip" : "one-way", route: { from: String(d.pickupCity ?? ""), to: String(d.destinationCity ?? ""), slug: String(d.routeSlug ?? "") },
    vehicle: payload.vehicle.vehicleName ?? "Not specified", price: payload.pricing.customerAmount ?? null, name: payload.customer.name, phone: payload.customer.phone,
    passengers: String(d.passengers ?? ""), travelDate: payload.trip.date ?? "", pickupTime: payload.trip.time ?? "", pickupAddress: payload.trip.pickup ?? "",
    pickupLat: typeof d.pickupLat === "number" ? d.pickupLat : null, pickupLng: typeof d.pickupLng === "number" ? d.pickupLng : null, pickupPlaceId: String(d.pickupPlaceId ?? ""), pickupMapLink: "",
    dropAddress: payload.trip.destination ?? "", dropLat: typeof d.dropLat === "number" ? d.dropLat : null, dropLng: typeof d.dropLng === "number" ? d.dropLng : null,
    dropPlaceId: String(d.dropPlaceId ?? ""), dropMapLink: "", notes: String(d.notes ?? "") };
}

async function postJson(url: URL, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  if (!response.ok) throw new Error(`Destination returned HTTP ${response.status}`);
  return response;
}

export function bookingDeliveryExecutor(baseUrl: string): DeliveryExecutor {
  return async (destination, payload) => {
    if (destination === "whatsapp") return { status: "customer_handoff" };
    if (destination === "dispatch") { const result = await normalizeExistingSource(payload.source, payload.sourceDocumentId); return { status: "delivered", operationalBookingId: result.id }; }
    if (destination === "googleSheet") {
      if (payload.source === "ta_connections") return { status: "not_applicable" };
      const response = await postJson(new URL("/api/lead-sheet", baseUrl), googleSheetPayload(payload));
      const body = await response.json() as { success?: boolean; sheetStatus?: "inserted" | "duplicate" };
      if (!body.success || !["inserted", "duplicate"].includes(body.sheetStatus ?? "")) return failure("Google Sheet did not confirm insertion or duplicate.");
      return { status: "delivered", sheetStatus: body.sheetStatus };
    }
    if (payload.source === "airport") return await sendAirportBookingNotification(payload.raw as unknown as AirportBookingNotification) ? { status: "delivered" } : failure("Airport email provider did not accept the message.");
    if (payload.source === "ta_connections") {
      const status = await sendBookingEmails(payload.raw as unknown as TaBooking);
      return status?.rentkaEmail === "SENT" && status.requesterEmail === "SENT" ? { status: "delivered" } : failure("One or more TA booking emails were not accepted.");
    }
    await postJson(new URL(payload.source === "one_way_drop" ? "/api/intercity-booking" : "/api/lead-booking", baseUrl), payload.source === "one_way_drop" ? intercityEmailPayload(payload) : standardEmailPayload(payload));
    return { status: "delivered" };
  };
}

export async function loadBookingDelivery(source: Source, sourceDocumentId: string) {
  const snapshot = await getAdminDb().collection(sourceCollection(source)).doc(sourceDocumentId).get();
  if (!snapshot.exists) throw new Error("Source booking was not found.");
  return adaptBookingDelivery(source, sourceDocumentId, snapshot.data()!);
}
