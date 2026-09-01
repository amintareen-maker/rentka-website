import type { OperationalBooking } from "./booking-types";
import type { DispatchDriver, DispatchVehicle, DispatchVendor } from "./types";

export type MatchResourceKind = "vendor" | "vehicle" | "driver" | "candidate";
export type MatchExclusion = { kind: MatchResourceKind; id: string; label: string; reason: string; critical: boolean };
export type MatchCandidate = {
  id: string;
  vendor: { id: string; name: string };
  vehicle: { id: string; label: string; registrationNumber: string };
  driver: { id: string; name: string };
  score: number;
  compatibility: "exact_model" | "exact_category" | "compatible_category" | "manual_review";
  reasons: string[];
  manuallyIncluded: boolean;
};
export type MatchProjection = {
  bookingId: string;
  ready: boolean;
  unavailableReason?: string;
  window: { start: string; end: string; basis: string };
  top: MatchCandidate[];
  eligible: MatchCandidate[];
  excluded: MatchExclusion[];
};
export type ResourceReservation = { id: string; bookingId: string; vehicleId?: string; driverId?: string; startsAt: string; endsAt: string; active: boolean };
export type MatchOverride = { candidateId: string; mode: "include" | "exclude" };
export type MatchInput = { booking: OperationalBooking; vendors: DispatchVendor[]; vehicles: DispatchVehicle[]; drivers: DispatchDriver[]; reservations?: ResourceReservation[]; overrides?: MatchOverride[]; now?: Date };
