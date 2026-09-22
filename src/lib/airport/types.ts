export type AirportTripType = "airportPickup" | "airportDropoff";
export type AirportId = "islamabad" | "lahore";
export type AirportPlace = { placeId: string; displayName: string; formattedAddress: string; lat: number; lng: number };
export type LuggageLevel = "light" | "standard" | "heavy";
export type AirportDefinition = {
  airportId: AirportId; city: string; airportName: string; airportCode: string; bookingCode: string;
  slug: string; pagePath: string; serviceArea: string; fleetZoneId: "twin_cities" | "lahore";
  active: boolean; bookingEnabled: boolean; place: AirportPlace;
};
export type AirportVehicleRule = {
  id: string; modelKey?: string; name: string; active: boolean; pricingConfigured?: boolean; passengers: number; luggage: LuggageLevel;
  minimumFare: number; includedKm: number; additionalKmRate: number; operationalKm: number;
  pickupAdjustment: number; dropoffAdjustment: number; lateNightSurcharge: number;
  lateNightEnabled: boolean; waitingAllowanceMinutes: number; additionalWaitingRate: number;
  operationalAllowance: number; fuelIncluded: boolean; tollIncluded: boolean; parkingIncluded: boolean;
};
export type AirportPricingConfig = { airportId?: AirportId; enabled?: boolean; version: number; quoteValidityMinutes: number; advancePercentage: number; vehicles: AirportVehicleRule[] };