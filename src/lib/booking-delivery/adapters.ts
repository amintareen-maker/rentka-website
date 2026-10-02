import type { BookingDeliveryPayload } from "./types.ts";
import type { OperationalSourceType } from "../dispatch/booking-types.ts";

type Data = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const object = (value: unknown): Data => value && typeof value === "object" ? value as Data : {};

export function adaptBookingDelivery(source: Exclude<OperationalSourceType, "manual">, sourceDocumentId: string, data: Data): BookingDeliveryPayload {
  const airport = source === "airport", ta = source === "ta_connections", oneWay = source === "one_way_drop";
  const customer = object(data.customer), pricing = object(data.pricing);
  const pickup = airport ? object(data.pickup) : ta ? object(data.pickupLocation) : {};
  const destination = airport ? object(data.destination) : ta ? object(data.dropoffLocation) : {};
  const vehicle = object(data.vehicle);
  const customerAmount = airport ? number(data.quotedTotal) : ta ? (number(pricing.grossContractRateMinor) ?? 0) / 100 : oneWay ? number(data.quotedPrice) : number(data.estimatedRentalAmount) ?? number(data.price);
  return {
    bookingId: text(data.bookingId) || text(data.leadId) || sourceDocumentId,
    source, sourceDocumentId,
    createdAt: text(data.createdAt) || new Date().toISOString(),
    customer: {
      name: airport ? text(customer.name) : ta ? text(data.passengerOrGroupName) : text(data.name),
      phone: airport ? text(customer.phone) : ta ? text(data.passengerContact) : text(data.phone),
      ...((airport ? text(customer.email) : ta ? text(data.requesterEmail) : text(data.email)) ? { email: airport ? text(customer.email) : ta ? text(data.requesterEmail) : text(data.email) } : {}),
    },
    trip: {
      city: text(data.city) || text(data.pickupCity) || (text(data.airportCode).includes("LHE") ? "Lahore" : "Islamabad"),
      service: airport ? "Airport Transfer" : ta ? "TA Connections" : oneWay ? "One-Way Drop" : text(data.service) || "With Driver",
      tripType: airport ? text(data.tripType) : oneWay ? text(data.tripType) : ta ? text(data.serviceType) : text(data.pricingType),
      pickup: text(pickup.formattedAddress) || text(pickup.address) || text(data.pickupAddress),
      destination: text(destination.formattedAddress) || text(destination.address) || text(data.dropAddress) || text(data.destinationAddress) || text(data.destinationCity),
      date: text(data.date) || text(data.travelDate) || text(data.pickupDate),
      time: text(data.time) || text(data.pickupTime) || text(data.travelTime) || text(data.preferredTime),
    },
    vehicle: { vehicleName: text(vehicle.name) || text(data.vehicleCategory) || text(data.publicVehicleLabel) || text(data.carName) || text(data.vehicle) },
    pricing: { ...(customerAmount !== undefined ? { customerAmount } : {}), ...(ta && number(pricing.netRentkaAmountMinor) !== undefined ? { vendorAmount: number(pricing.netRentkaAmountMinor)! / 100 } : {}) },
    raw: data,
  };
}

export function googleSheetPayload(payload: BookingDeliveryPayload) {
  const normal = payload.source === "twin_cities_normal" || payload.source === "lahore_normal";
  const d = payload.raw;
  return {
    leadId: payload.bookingId, name: payload.customer.name, phone: payload.customer.phone, email: payload.customer.email ?? "",
    carName: payload.vehicle.vehicleName ?? "Not specified", city: payload.trip.city ?? "Not specified", service: payload.trip.service ?? "",
    serviceType: payload.trip.tripType ?? "", packageName: payload.trip.tripType ?? "", packageDuration: "",
    packagePrice: payload.pricing.customerAmount === undefined ? "" : String(payload.pricing.customerAmount), pickupDate: payload.trip.date ?? "",
    preferredTime: payload.trip.time ?? "", source: payload.source, status: "new", pickupAddress: payload.trip.pickup ?? "",
    destinationAddress: payload.trip.destination ?? "",
    ...(normal ? { vendorId: text(d.vendorId), vendorName: text(d.vendorName), modelYear: String(d.modelYear ?? ""), publicVehicleLabel: text(d.publicVehicleLabel),
      packageDuration: text(d.duration), packagePrice: String(number(d.dailyRentalRate) ?? number(d.price) ?? payload.pricing.customerAmount ?? ""),
      numberOfDays: number(d.numberOfDays) ?? 1, dailyRentalRate: number(d.dailyRentalRate) ?? number(d.price) ?? 0, estimatedRentalAmount: number(d.estimatedRentalAmount) ?? payload.pricing.customerAmount ?? 0 } : {}),
    submittedAt: payload.createdAt, firestoreDocumentId: payload.sourceDocumentId,
  };
}
