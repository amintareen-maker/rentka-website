import "server-only";
import { randomUUID } from "node:crypto";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { ISLAMABAD_AIRPORT } from "./constants";
import { getAirportPricingConfigWithMeta } from "./config";
import type { AirportPlace, AirportTripType, LuggageLevel } from "./types";

const validCoordinate = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const validPlace = (place: unknown): place is AirportPlace => {
  if (!place || typeof place !== "object") return false;
  const value = place as Partial<AirportPlace>;
  return typeof value.placeId === "string"
    && value.placeId.length > 0
    && value.placeId.length <= 256
    && typeof value.formattedAddress === "string"
    && validCoordinate(value.lat, -90, 90)
    && validCoordinate(value.lng, -180, 180);
};

type QuoteInput = {
  tripType: AirportTripType;
  place: AirportPlace;
  date: string;
  time: string;
  passengers: number;
  luggage: LuggageLevel;
};

type GooglePlaceDetails = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  error?: { status?: string };
};

export function validateQuoteInput(value: unknown): value is QuoteInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return ["airportPickup", "airportDropoff"].includes(String(input.tripType))
    && validPlace(input.place)
    && /^\d{4}-\d{2}-\d{2}$/.test(String(input.date))
    && /^\d{2}:\d{2}$/.test(String(input.time))
    && Number.isInteger(input.passengers)
    && Number(input.passengers) >= 1
    && Number(input.passengers) <= 12
    && ["light", "standard", "heavy"].includes(String(input.luggage));
}

async function verifyGooglePlace(placeId: string, attemptId: string): Promise<AirportPlace> {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) {
    console.error("Airport quote diagnostic", { attemptId, stage: "place_verification", result: "missing_server_key" });
    throw new Error("PLACE_VERIFICATION_UNAVAILABLE");
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as GooglePlaceDetails;
  if (!response.ok) {
    console.error("Airport quote diagnostic", {
      attemptId,
      stage: "place_verification",
      result: "google_error",
      googleHttpStatus: response.status,
      googleErrorCategory: data.error?.status ?? "UNKNOWN",
    });
    throw new Error("PLACE_VERIFICATION_FAILED");
  }

  const latitude = Number(data.location?.latitude);
  const longitude = Number(data.location?.longitude);
  if (data.id !== placeId || !validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) {
    console.error("Airport quote diagnostic", { attemptId, stage: "place_verification", result: "invalid_google_place" });
    throw new Error("PLACE_VERIFICATION_FAILED");
  }

  const formattedAddress = data.formattedAddress?.trim();
  const displayName = data.displayName?.text?.trim();
  if (!formattedAddress) {
    console.error("Airport quote diagnostic", { attemptId, stage: "place_verification", result: "missing_formatted_address" });
    throw new Error("PLACE_VERIFICATION_FAILED");
  }

  console.info("Airport quote diagnostic", { attemptId, stage: "place_verification", result: "success" });
  return {
    placeId: data.id,
    displayName: displayName || formattedAddress,
    formattedAddress,
    lat: latitude,
    lng: longitude,
  };
}

async function calculateRoute(origin: AirportPlace, destination: AirportPlace, attemptId: string) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) throw new Error("ROUTES_UNAVAILABLE");
  const location = (place: AirportPlace) => ({ location: { latLng: { latitude: place.lat, longitude: place.lng } } });
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: location(origin),
      destination: location(destination),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: { status?: string } };
    console.error("Airport quote diagnostic", {
      attemptId,
      stage: "routes",
      result: "google_error",
      googleHttpStatus: response.status,
      googleErrorCategory: data.error?.status ?? "UNKNOWN",
    });
    throw new Error("ROUTES_UNAVAILABLE");
  }
  const data = await response.json() as { routes?: { distanceMeters?: number; duration?: string }[] };
  const first = data.routes?.[0];
  if (!first?.distanceMeters || !first.duration) throw new Error("NO_ROUTE");
  const route = {
    distanceKm: Math.round(first.distanceMeters / 100) / 10,
    durationMinutes: Math.max(1, Math.round(Number(first.duration.replace("s", "")) / 60)),
  };
  console.info("Airport quote diagnostic", { attemptId, stage: "routes", result: "success" });
  return route;
}

export async function createAirportQuotes(input: QuoteInput) {
  const attemptId = randomUUID();
  const pricingPromise = getAirportPricingConfigWithMeta()
    .then((result) => {
      console.info("Airport quote diagnostic", { attemptId, stage: "pricing_configuration", result: "success", pricingSource: result.source });
      return result;
    })
    .catch((error) => {
      const detail = error as Error & { code?: string | number };
      console.error("Airport quote diagnostic", {
        attemptId,
        stage: "pricing_configuration",
        result: "failure",
        errorName: detail?.name ?? "UnknownError",
        errorCode: detail?.code ?? "UNKNOWN",
        errorMessage: detail?.message ?? "Unknown pricing configuration error",
      });
      throw error;
    });
  const verifiedPlace = await verifyGooglePlace(input.place.placeId, attemptId);
  const pickup = input.tripType === "airportPickup" ? ISLAMABAD_AIRPORT : verifiedPlace;
  const destination = input.tripType === "airportPickup" ? verifiedPlace : ISLAMABAD_AIRPORT;
  const [{ config, source: pricingSource }, routeInfo] = await Promise.all([
    pricingPromise,
    calculateRoute(pickup, destination, attemptId),
  ]);
  const hour = Number(input.time.slice(0, 2));
  const late = hour >= 22 || hour < 6;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.quoteValidityMinutes * 60000);
  const vehicleOptions = config.vehicles.filter((item) => item.active && item.passengers >= input.passengers).map((vehicle) => {
    const additionalCustomerKm = Math.max(0, routeInfo.distanceKm - vehicle.includedKm);
    const operationalKm = Math.max(0, vehicle.operationalKm);
    const distanceCharge = (additionalCustomerKm + operationalKm) * vehicle.additionalKmRate;
    const total = Math.ceil((vehicle.minimumFare + distanceCharge + (input.tripType === "airportPickup" ? vehicle.pickupAdjustment : vehicle.dropoffAdjustment) + (late && vehicle.lateNightEnabled ? vehicle.lateNightSurcharge : 0) + vehicle.operationalAllowance) / 50) * 50;
    return {
      vehicle: { id: vehicle.id, name: vehicle.name, passengers: vehicle.passengers, luggage: vehicle.luggage },
      price: total,
      operationalKm,
      additionalCustomerKm,
      includedItems: [...(vehicle.fuelIncluded ? ["Fuel Included"] : []), "Professional Driver Included"],
      excludedItems: [...(!vehicle.tollIncluded ? ["Tolls"] : []), ...(!vehicle.parkingIncluded ? ["Parking"] : [])],
    };
  });
  const quoteId = randomUUID();
  const quote = {
    quoteId,
    ...input,
    place: verifiedPlace,
    pickup,
    destination,
    ...routeInfo,
    vehicleOptions,
    pricingVersion: config.version,
    advancePercentage: config.advancePercentage,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  await getAdminDb().collection("airportQuotes").doc(quoteId).set(quote).catch((error) => {
    const detail = error as Error & { code?: string | number };
    console.error("Airport quote diagnostic", { attemptId, stage: "quote_persistence", result: "failure", errorName: detail?.name, errorCode: detail?.code, errorMessage: detail?.message });
    throw error;
  });
  console.info("Airport quote diagnostic", { attemptId, stage: "quote_persistence", result: "success", quoteDocumentCount: 1, optionCount: vehicleOptions.length, pricingSource });
  return quote;
}
