/**
 * TA Connections domain contracts.
 *
 * Monetary values are stored in minor currency units (for example paisa), never
 * as formatted strings or floating-point major units. Booking pricing and policy
 * fields are immutable snapshots of the effective rate set at submission time.
 */

export const TA_VEHICLE_CATEGORIES = [
  "ECONOMY_SEDAN",
  "MPV",
  "SUV",
  "HIACE",
] as const;
export type TaVehicleCategory = (typeof TA_VEHICLE_CATEGORIES)[number];

export const TA_PASSENGER_CAPACITY: Record<TaVehicleCategory, number> = {
  ECONOMY_SEDAN: 4,
  MPV: 6,
  SUV: 6,
  HIACE: 12,
};

export const TA_CONTRACT_DISTANCE_BANDS = [5, 10, 20, 30, 40, 50] as const;
export type TaContractDistanceBandKm = (typeof TA_CONTRACT_DISTANCE_BANDS)[number];
export type TaAppliedDistanceBand = TaContractDistanceBandKm | "50_PLUS";

export const TA_BOOKING_STATUSES = [
  "NEW_REQUEST",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "EN_ROUTE",
  "ARRIVED_AT_PICKUP",
  "PASSENGER_ONBOARD",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "REJECTED",
] as const;
export type TaBookingStatus = (typeof TA_BOOKING_STATUSES)[number];

export const TA_INVOICE_STATUSES = [
  "NOT_GENERATED",
  "GENERATED",
  "SUBMITTED",
  "APPROVED",
  "DISPUTED",
] as const;
export type TaInvoiceStatus = (typeof TA_INVOICE_STATUSES)[number];

export const TA_PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"] as const;
export type TaPaymentStatus = (typeof TA_PAYMENT_STATUSES)[number];

export type TaServiceType = "airport_pickup" | "airport_drop";

export interface TaCoordinates {
  latitude: number;
  longitude: number;
}

export interface TaActor {
  id?: string;
  displayName?: string;
  email?: string;
  role: "TA_REQUESTER" | "RENTKA_ADMIN" | "SYSTEM";
}

export interface TaAirport {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  googlePlaceId: string;
  formattedAddress?: string;
  location?: TaCoordinates;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaPolicySet {
  waitingPolicy: string;
  cancellationPolicy: string;
  noShowPolicy: string;
}

export type TaBandRatesMinor = Record<TaContractDistanceBandKm, number>;

export interface TaVehicleRateTable {
  vehicleCategory: TaVehicleCategory;
  bandRatesMinor: TaBandRatesMinor;
  additionalPerKmMinor: number;
}

export interface TaContractRateSet {
  id: string;
  airportId: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  currency: string;
  commissionPercent: number;
  policies: TaPolicySet;
  vehicleRates: TaVehicleRateTable[];
  active: boolean;
  createdAt: string;
  createdBy: TaActor;
  updatedAt: string;
  updatedBy: TaActor;
  over50KmBillingMode: "EXACT_DISTANCE_ROUND_MINOR";
}

export interface TaLocationSnapshot {
  address: string;
  placeId: string;
  coordinates?: TaCoordinates;
}

export interface TaPricingSnapshot extends TaPolicySet {
  rateSetId: string;
  rateVersion: string;
  rateEffectiveFrom: string;
  routeDistanceKm: number;
  routeDurationMinutes: number;
  contractDistanceBand: TaAppliedDistanceBand;
  grossContractRateMinor: number;
  commissionPercent: number;
  commissionAmountMinor: number;
  netRentkaAmountMinor: number;
  currency: string;
  over50KmBillingMode: "EXACT_DISTANCE_ROUND_MINOR";
  fixed50KmBaseRateMinor?: number;
  additionalDistanceKm?: number;
  additionalPerKmRateMinor?: number;
  additionalDistanceChargeMinor?: number;
}

export interface TaStatusHistoryEntry {
  status: TaBookingStatus;
  timestamp: string;
  actor?: TaActor;
  note?: string;
}

export interface TaInvoiceMetadata {
  invoiceNumber?: string;
  invoiceStatus: TaInvoiceStatus;
  invoiceDate?: string;
  generatedAt?: string;
  templateVersion?: string;
}

export interface TaPaymentMetadata {
  paymentStatus: TaPaymentStatus;
  paymentDate?: string;
  paymentAmountMinor?: number;
  currency: string;
  reference?: string;
}

export interface TaOperationalEvent {
  occurredAt: string;
  actor?: TaActor;
  reason?: string;
  notes?: string;
}

export interface TaBooking {
  bookingId: string;
  createdAt: string;
  createdBy?: TaActor;
  serviceType: TaServiceType;
  airportId: string;
  airportCode: string;
  airportName: string;
  pickupLocation: TaLocationSnapshot;
  dropoffLocation: TaLocationSnapshot;
  pricing: TaPricingSnapshot;
  vehicleCategory: TaVehicleCategory;
  passengerCapacity: number;
  travelDate: string;
  pickupTime: string;
  airline: string;
  flightNumber: string;
  taReferenceNumber: string;
  passengerOrGroupName: string;
  passengerCount: number;
  passengerContact: string;
  requesterEmail?: string;
  specialInstructions?: string;
  bookingStatus: TaBookingStatus;
  driverName?: string;
  driverPhone?: string;
  vehicleModel?: string;
  vehicleRegistration?: string;
  invoice: TaInvoiceMetadata;
  payment: TaPaymentMetadata;
  cancellationData?: TaOperationalEvent;
  noShowData?: TaOperationalEvent;
  statusHistory: TaStatusHistoryEntry[];
  notificationStatus: {
    rentkaEmail: "PENDING" | "SENT" | "FAILED";
    requesterEmail: "PENDING" | "SENT" | "FAILED";
    updatedAt?: string;
  };
}
