import type { OperationalBooking } from "./booking-types";
import type { DispatchOfferRecord } from "./offer-types";
import { createBroadcastSafePreview } from "./broadcast-approval-core.ts";
import { normalizeDispatchPhone } from "./validation.ts";
import { formatVehicleDisplayLabel } from "./vehicle-display.ts";

export const DRIVER_FINAL_TEMPLATE_BODY = `🚗 RentKA — Trip Confirmed

Booking: {{1}}

Pickup:
{{2}}

Destination / Usage:
{{3}}

Date:
{{4}}

Pickup Time:
{{5}}

Vehicle:
{{6}}

Duty / Package:
{{7}}

Customer:
{{8}}

Customer Contact:
{{9}}

Please follow the confirmed booking details and contact RentKA if anything changes.`;

export const CUSTOMER_DRIVER_DETAILS_TEMPLATE_BODY = `🚗 RentKA — Your Driver is Assigned

Booking: {{1}}

Driver:
{{2}}

Driver Contact:
{{3}}

Vehicle:
{{4}}

Registration:
{{5}}

Pickup:
{{6}}

Date:
{{7}}

Pickup Time:
{{8}}

Your booking is confirmed with the above driver and vehicle.

For help, contact RentKA.`;

const required = (
  value: string | undefined,
  label: string,
  missingFields: string[],
) => {
  const clean = value?.trim();
  if (clean) return clean;
  missingFields.push(label);
  return `MISSING ${label.toUpperCase()} — confirm with RentKA`;
};
const dateLabel = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}T00:00:00Z`))
    : value;
const timeLabel = (value: string) => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
};
const vehicleMakeModel = (booking: OperationalBooking) => {
  const vehicle = booking.assignment!.vehicleSnapshot;
  return `${vehicle.make} ${vehicle.model}${vehicle.modelYear ? ` ${vehicle.modelYear}` : ""}`;
};
const dutyPackage = (booking: OperationalBooking) =>
  typeof booking.sourceSnapshot.durationHours === "number"
    ? `${booking.serviceType} · ${booking.sourceSnapshot.durationHours} hours`
    : booking.serviceType;
const whatsappUrl = (phone: string | undefined, message: string) =>
  phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : undefined;

export type CanonicalPostAssignmentMessage = {
  bookingOperationalId: string;
  bookingId: string;
  assignmentId: string;
  driverId: string;
  vehicleId: string;
  recipientReferenceId: string;
  recipientNumber?: string;
  parameters: string[];
  message: string;
  whatsappUrl?: string;
  missingFields: string[];
};

export function createDriverFinalMessage(
  booking: OperationalBooking,
): CanonicalPostAssignmentMessage | null {
  if (booking.lifecycle !== "active" || booking.assignment?.status !== "assigned")
    return null;
  const assignment = booking.assignment,
    missingFields: string[] = [],
    pickup = required(booking.itinerary.pickup, "pickup", missingFields),
    destination = required(
      booking.itinerary.destinationOrUsage,
      "destination / usage",
      missingFields,
    ),
    date = dateLabel(
      required(booking.itinerary.travelDate, "travel date", missingFields),
    ),
    pickupTime = timeLabel(
      required(booking.itinerary.pickupTime, "pickup time", missingFields),
    ),
    customerName = required(booking.customer.name, "customer name", missingFields),
    customerPhone = required(
      booking.customer.phone,
      "customer contact",
      missingFields,
    ),
    vehicle = formatVehicleDisplayLabel(assignment.vehicleSnapshot),
    parameters = [
      booking.bookingId,
      pickup,
      destination,
      date,
      pickupTime,
      vehicle,
      dutyPackage(booking),
      customerName,
      customerPhone,
    ],
    message = `🚗 RentKA — Trip Confirmed

Booking: ${parameters[0]}

Pickup:
${parameters[1]}

Destination / Usage:
${parameters[2]}

Date:
${parameters[3]}

Pickup Time:
${parameters[4]}

Vehicle:
${parameters[5]}

Duty / Package:
${parameters[6]}

Customer:
${parameters[7]}

Customer Contact:
${parameters[8]}

Please follow the confirmed booking details and contact RentKA if anything changes.`,
    recipientNumber = normalizeDispatchPhone(
      assignment.driverSnapshot.whatsappNumber ||
        assignment.driverSnapshot.mobileNumber,
    ),
    url = whatsappUrl(recipientNumber, message);
  if (!recipientNumber) missingFields.push("assigned driver WhatsApp");
  return {
    bookingOperationalId: booking.id,
    bookingId: booking.bookingId,
    assignmentId: assignment.id,
    driverId: assignment.assignedDriverId,
    vehicleId: assignment.assignedVehicleId,
    recipientReferenceId: assignment.assignedDriverId,
    ...(recipientNumber ? { recipientNumber } : {}),
    parameters,
    message,
    ...(url ? { whatsappUrl: url } : {}),
    missingFields,
  };
}

export function createCustomerDriverDetailsMessage(
  booking: OperationalBooking,
): CanonicalPostAssignmentMessage | null {
  if (booking.lifecycle !== "active" || booking.assignment?.status !== "assigned")
    return null;
  const assignment = booking.assignment,
    missingFields: string[] = [],
    driverName = required(
      assignment.driverSnapshot.name,
      "driver name",
      missingFields,
    ),
    driverPhone = required(
      assignment.driverSnapshot.mobileNumber ||
        assignment.driverSnapshot.whatsappNumber,
      "driver phone",
      missingFields,
    ),
    vehicle = vehicleMakeModel(booking),
    registration = required(
      assignment.vehicleSnapshot.registrationNumber,
      "vehicle registration",
      missingFields,
    ),
    pickup = required(booking.itinerary.pickup, "pickup", missingFields),
    date = dateLabel(
      required(booking.itinerary.travelDate, "pickup date", missingFields),
    ),
    pickupTime = timeLabel(
      required(booking.itinerary.pickupTime, "pickup time", missingFields),
    ),
    parameters = [
      booking.bookingId,
      driverName,
      driverPhone,
      vehicle,
      registration,
      pickup,
      date,
      pickupTime,
    ],
    message = `🚗 RentKA — Your Driver is Assigned

Booking: ${parameters[0]}

Driver:
${parameters[1]}

Driver Contact:
${parameters[2]}

Vehicle:
${parameters[3]}

Registration:
${parameters[4]}

Pickup:
${parameters[5]}

Date:
${parameters[6]}

Pickup Time:
${parameters[7]}

Your booking is confirmed with the above driver and vehicle.

For help, contact RentKA.`,
    recipientNumber = normalizeDispatchPhone(booking.customer.phone),
    url = whatsappUrl(recipientNumber, message);
  if (!recipientNumber) missingFields.push("customer WhatsApp");
  return {
    bookingOperationalId: booking.id,
    bookingId: booking.bookingId,
    assignmentId: assignment.id,
    driverId: assignment.assignedDriverId,
    vehicleId: assignment.assignedVehicleId,
    recipientReferenceId: `customer:${booking.id}`,
    ...(recipientNumber ? { recipientNumber } : {}),
    parameters,
    message,
    ...(url ? { whatsappUrl: url } : {}),
    missingFields,
  };
}

const money = (minor: number) =>
  `Rs. ${(minor / 100).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
export function createManualVendorOfferMessage(
  booking: OperationalBooking,
  offer: DispatchOfferRecord,
) {
  const preview = createBroadcastSafePreview(booking);
  return [
    "🚗 RentKA — Trip Available",
    "",
    `Booking: ${preview.bookingId}`,
    `Pickup Area: ${preview.pickupArea}`,
    `Destination / Usage: ${preview.destinationArea}`,
    `Date: ${preview.travelDate}`,
    `Pickup Time: ${preview.pickupTime}`,
    `Vehicle Requirement: ${preview.vehicleRequirement}`,
    `Duty / Package: ${preview.dutySummary}`,
    `Vendor Payout: ${money(offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor)}`,
    `Offer Expiry: ${offer.offerExpiresAt ?? "Confirm with RentKA"}`,
    "",
    "Review and respond using the secure Vendor offer link provided by RentKA.",
  ].join("\n");
}
