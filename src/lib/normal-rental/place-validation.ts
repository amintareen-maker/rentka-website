export type StructuredPlace = {
  address: string;
  placeId: string;
  latitude: number;
  longitude: number;
};

export function isValidPakistanPlace(place: StructuredPlace) {
  return Boolean(place.address && place.address.length <= 1000 && place.placeId && place.placeId.length <= 256
    && Number.isFinite(place.latitude) && place.latitude >= 23 && place.latitude <= 38.5
    && Number.isFinite(place.longitude) && place.longitude >= 60 && place.longitude <= 78.5);
}
