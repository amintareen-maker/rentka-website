export const NORMAL_RENTAL_ZONES = {
  twin_cities: {
    id: "twin_cities",
    label: "Islamabad / Rawalpindi",
    cityIds: ["islamabad", "rawalpindi"],
    defaultCityId: "islamabad",
    bookingCode: "ISL",
    publicEnabled: true,
    inventorySource: "legacy",
  },
  lahore: {
    id: "lahore",
    label: "Lahore",
    cityIds: ["lahore"],
    defaultCityId: "lahore",
    bookingCode: "LHR",
    publicEnabled: true,
    inventorySource: "operations",
  },
} as const;

export type NormalRentalZoneId = keyof typeof NORMAL_RENTAL_ZONES;
export type NormalRentalCityId = (typeof NORMAL_RENTAL_ZONES)[NormalRentalZoneId]["cityIds"][number];

export function isNormalRentalZoneId(value: string): value is NormalRentalZoneId {
  return value in NORMAL_RENTAL_ZONES;
}

export function cityBelongsToNormalRentalZone(zoneId: NormalRentalZoneId, cityId: string) {
  return (NORMAL_RENTAL_ZONES[zoneId].cityIds as readonly string[]).includes(cityId.toLowerCase());
}

export type NormalRentalBookingContext = {
  zoneId: NormalRentalZoneId;
  cityId: NormalRentalCityId;
  cityLabel: string;
  bookingCode: string;
};

export function getNormalRentalBookingContext(zoneId: NormalRentalZoneId, requestedCityId?: string): NormalRentalBookingContext {
  const zone = NORMAL_RENTAL_ZONES[zoneId];
  const cityId = (requestedCityId?.toLowerCase() || zone.defaultCityId) as NormalRentalCityId;
  if (!cityBelongsToNormalRentalZone(zoneId, cityId)) throw new Error("City does not belong to the selected normal-rental zone.");
  const cityLabel = cityId === "rawalpindi" ? "Rawalpindi" : cityId === "islamabad" ? "Islamabad" : zone.label;
  return { zoneId, cityId, cityLabel, bookingCode: zone.bookingCode };
}

export function resolveNormalRentalLeadCode(context: Pick<NormalRentalBookingContext, "zoneId" | "cityId" | "bookingCode">) {
  if (context.zoneId === "twin_cities") {
    // Preserve the current forward behavior for existing Islamabad/Rawalpindi leads.
    return context.cityId.substring(0, 3).toUpperCase();
  }
  return context.bookingCode;
}
