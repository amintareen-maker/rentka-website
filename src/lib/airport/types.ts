export type AirportTripType = "airportPickup" | "airportDropoff";
export type AirportPlace = { placeId: string; displayName: string; formattedAddress: string; lat: number; lng: number };
export type LuggageLevel = "light" | "standard" | "heavy";
export type AirportVehicleRule = {
  id: string; name: string; active: boolean; passengers: number; luggage: LuggageLevel;
  minimumFare: number; includedKm: number; additionalKmRate: number; operationalKm: number;
  pickupAdjustment: number; dropoffAdjustment: number; lateNightSurcharge: number;
  lateNightEnabled: boolean; waitingAllowanceMinutes: number; additionalWaitingRate: number;
  operationalAllowance: number; fuelIncluded: boolean; tollIncluded: boolean; parkingIncluded: boolean;
};
export type AirportPricingConfig = { version: number; quoteValidityMinutes: number; advancePercentage: number; vehicles: AirportVehicleRule[] };
