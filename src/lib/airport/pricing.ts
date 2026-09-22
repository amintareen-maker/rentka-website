import type { AirportTripType, AirportVehicleRule } from "./types";

export function calculateAirportFare(rule: AirportVehicleRule, distanceKm: number, tripType: AirportTripType, time: string) {
  const additionalCustomerKm = Math.max(0, distanceKm - rule.includedKm);
  const operationalKm = Math.max(0, rule.operationalKm);
  const distanceCharge = (additionalCustomerKm + operationalKm) * rule.additionalKmRate;
  const hour = Number(time.slice(0, 2));
  const late = hour >= 22 || hour < 6;
  const adjustment = tripType === "airportPickup" ? rule.pickupAdjustment : rule.dropoffAdjustment;
  const surcharge = late && rule.lateNightEnabled ? rule.lateNightSurcharge : 0;
  const price = Math.ceil((rule.minimumFare + distanceCharge + adjustment + surcharge + rule.operationalAllowance) / 50) * 50;
  return { price, operationalKm, additionalCustomerKm };
}