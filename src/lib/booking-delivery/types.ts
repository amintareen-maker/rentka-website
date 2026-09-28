import type { OperationalSourceType } from "../dispatch/booking-types";

export const DELIVERY_DESTINATIONS = ["email", "whatsapp", "googleSheet", "dispatch"] as const;
export type DeliveryDestination = typeof DELIVERY_DESTINATIONS[number];
export type DeliveryStatus = "pending" | "processing" | "delivered" | "failed" | "not_applicable" | "customer_handoff";

export type BookingDeliveryPayload = {
  bookingId: string;
  source: Exclude<OperationalSourceType, "manual">;
  sourceDocumentId: string;
  createdAt: string;
  customer: { name: string; phone: string; email?: string };
  trip: { city?: string; service?: string; tripType?: string; pickup?: string; destination?: string; date?: string; time?: string };
  vehicle: { vehicleName?: string };
  pricing: { customerAmount?: number; vendorAmount?: number };
  raw: Record<string, unknown>;
};

export type DestinationOutcome = {
  status: Exclude<DeliveryStatus, "pending" | "processing">;
  providerMessageId?: string;
  operationalBookingId?: string;
  sheetStatus?: "inserted" | "duplicate";
  error?: string;
};

export type DeliveryRunResult = Partial<Record<DeliveryDestination, DestinationOutcome>>;
