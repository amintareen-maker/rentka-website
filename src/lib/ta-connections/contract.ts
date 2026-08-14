import {
  TA_CONTRACT_DISTANCE_BANDS,
  type TaAppliedDistanceBand,
  type TaContractDistanceBandKm,
  type TaVehicleRateTable,
} from "./types";

export const TA_MINIMUM_ADVANCE_NOTICE_HOURS = 4;

export function contractDistanceBand(distanceKm: number): TaAppliedDistanceBand {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new RangeError("Route distance must be a non-negative finite number.");
  }

  return TA_CONTRACT_DISTANCE_BANDS.find((band) => distanceKm <= band) ?? "50_PLUS";
}

export function grossContractRateMinor(
  distanceKm: number,
  rates: TaVehicleRateTable,
): number {
  return calculateContractRateMinor(distanceKm, rates).grossRateMinor;
}

export interface TaContractRateCalculation {
  contractDistanceBand: TaAppliedDistanceBand;
  grossRateMinor: number;
  fixed50KmBaseRateMinor?: number;
  additionalDistanceKm?: number;
  additionalPerKmRateMinor?: number;
  additionalDistanceChargeMinor?: number;
}

export function calculateContractRateMinor(
  distanceKm: number,
  rates: TaVehicleRateTable,
): TaContractRateCalculation {
  const band = contractDistanceBand(distanceKm);
  if (band !== "50_PLUS") {
    return { contractDistanceBand: band, grossRateMinor: rates.bandRatesMinor[band] };
  }

  const additionalKm = Math.max(0, distanceKm - 50);
  const additionalChargeMinor = Math.round(additionalKm * rates.additionalPerKmMinor);
  const grossRateMinor = rates.bandRatesMinor[50] + additionalChargeMinor;
  if (![additionalChargeMinor, grossRateMinor].every(Number.isSafeInteger)) {
    throw new RangeError("Calculated contract fare exceeds safe integer accounting limits.");
  }
  return {
    contractDistanceBand: band,
    grossRateMinor,
    fixed50KmBaseRateMinor: rates.bandRatesMinor[50],
    additionalDistanceKm: additionalKm,
    additionalPerKmRateMinor: rates.additionalPerKmMinor,
    additionalDistanceChargeMinor: additionalChargeMinor,
  };
}

export function bookingMeetsAdvanceNotice(
  pickupAt: Date,
  submittedAt: Date = new Date(),
): boolean {
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(submittedAt.getTime())) return false;
  return pickupAt.getTime() - submittedAt.getTime() >= TA_MINIMUM_ADVANCE_NOTICE_HOURS * 60 * 60 * 1000;
}

export function isContractDistanceBand(value: number): value is TaContractDistanceBandKm {
  return TA_CONTRACT_DISTANCE_BANDS.some((band) => band === value);
}
