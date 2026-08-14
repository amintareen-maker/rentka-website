import "server-only";
import { randomUUID } from "node:crypto";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { ISLAMABAD_AIRPORT } from "./constants";
import { getAirportPricingConfigWithMeta } from "./config";
import type { AirportPlace, AirportTripType, LuggageLevel } from "./types";

const QUOTE_BUDGET_MS = 6_000;
const PLACES_TIMEOUT_MS = 1_700;
const ROUTES_TIMEOUT_MS = 2_100;
const RETRY_BACKOFF_MS = 150;

export type AirportQuoteFailureCode = "LOCATION_INVALID" | "LOCATION_UNAVAILABLE" | "NO_ROUTE" | "ROUTES_UNAVAILABLE" | "PRICING_UNAVAILABLE" | "PERSISTENCE_UNAVAILABLE" | "REQUEST_TIMEOUT";
export class AirportQuoteError extends Error {
  constructor(public readonly code: AirportQuoteFailureCode, message: string = code) { super(message); this.name = "AirportQuoteError"; }
}

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

type SafeError = { errorName: string; errorCode: string | number; safeMessage: string };
const safeError = (error: unknown): SafeError => {
  const detail = error as Error & { code?: string | number };
  return { errorName: detail?.name ?? "UnknownError", errorCode: detail?.code ?? "UNKNOWN", safeMessage: detail?.message ?? "Unknown Airport quote error" };
};
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const transientGoogleStatus = (status: number) => status === 429 || status >= 500;
const remaining = (deadline: number, maximum: number) => {
  const milliseconds = Math.min(maximum, deadline - Date.now());
  if (milliseconds < 100) throw new AirportQuoteError("REQUEST_TIMEOUT");
  return milliseconds;
};
async function fetchTimed(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
async function withinDeadline<T>(operation: Promise<T>, deadline: number): Promise<T> {
  const timeoutMs = remaining(deadline, QUOTE_BUDGET_MS);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new AirportQuoteError("REQUEST_TIMEOUT")), timeoutMs); })]);
  } finally { if (timer) clearTimeout(timer); }
}
function logFailure(attemptId: string, stage: string, startedAt: number, error: unknown, extra: Record<string, unknown> = {}) {
  console.error("Airport quote diagnostic", { attemptId, stage, result: "failure", durationMs: Date.now() - startedAt, pricingSource: "pending", ...safeError(error), ...extra });
}

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

async function verifyGooglePlace(placeId: string, attemptId: string, deadline: number): Promise<AirportPlace> {
  const stageStartedAt = Date.now();
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) { const error = new AirportQuoteError("LOCATION_UNAVAILABLE", "Missing server Maps configuration"); logFailure(attemptId, "place_verification", stageStartedAt, error, { retryAttempt: 0 }); throw error; }
  for (let retryAttempt = 0; retryAttempt <= 1; retryAttempt++) {
    const requestStartedAt = Date.now();
    try {
      const response = await fetchTimed(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "id,displayName,formattedAddress,location" },
        cache: "no-store",
      }, remaining(deadline, PLACES_TIMEOUT_MS));
      const data = await response.json().catch(() => ({})) as GooglePlaceDetails;
      if (!response.ok) {
        const category = data.error?.status ?? "UNKNOWN";
        console.warn("Airport quote diagnostic", { attemptId, stage: "place_verification", result: transientGoogleStatus(response.status) && retryAttempt === 0 ? "retry" : "failure", durationMs: Date.now() - requestStartedAt, httpStatus: response.status, errorName: "GooglePlacesError", errorCode: category, safeMessage: "Google Places request failed", retryAttempt, pricingSource: "pending" });
        if (transientGoogleStatus(response.status) && retryAttempt === 0) { await wait(RETRY_BACKOFF_MS); continue; }
        throw new AirportQuoteError(response.status === 400 || response.status === 404 ? "LOCATION_INVALID" : "LOCATION_UNAVAILABLE");
      }
      const latitude = Number(data.location?.latitude);
      const longitude = Number(data.location?.longitude);
      const formattedAddress = data.formattedAddress?.trim();
      if (data.id !== placeId || !formattedAddress || !validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) { const error = new AirportQuoteError("LOCATION_INVALID", "Malformed Google Place response"); logFailure(attemptId, "place_verification", stageStartedAt, error, { retryAttempt }); throw error; }
      const verified = { placeId: data.id, displayName: data.displayName?.text?.trim() || formattedAddress, formattedAddress, lat: latitude, lng: longitude };
      console.info("Airport quote diagnostic", { attemptId, stage: "place_verification", result: "success", durationMs: Date.now() - stageStartedAt, requestDurationMs: Date.now() - requestStartedAt, retryAttempt });
      return verified;
    } catch (error) {
      if (error instanceof AirportQuoteError) throw error;
      const timedOut = error instanceof Error && error.name === "AbortError";
      if (timedOut && retryAttempt === 0 && Date.now() < deadline - RETRY_BACKOFF_MS) {
        console.warn("Airport quote diagnostic", { attemptId, stage: "place_verification", result: "retry", durationMs: Date.now() - requestStartedAt, errorName: "TimeoutError", errorCode: "TIMEOUT", safeMessage: "Google Places request timed out", retryAttempt, pricingSource: "pending" });
        await wait(RETRY_BACKOFF_MS); continue;
      }
      logFailure(attemptId, "place_verification", stageStartedAt, error, { retryAttempt });
      throw new AirportQuoteError(timedOut ? "REQUEST_TIMEOUT" : "LOCATION_UNAVAILABLE");
    }
  }
  throw new AirportQuoteError("LOCATION_UNAVAILABLE");
}

async function calculateRoute(origin: AirportPlace, destination: AirportPlace, attemptId: string, deadline: number) {
  const stageStartedAt = Date.now();
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) { const error = new AirportQuoteError("ROUTES_UNAVAILABLE", "Missing server Maps configuration"); logFailure(attemptId, "routes", stageStartedAt, error, { retryAttempt: 0 }); throw error; }
  const location = (place: AirportPlace) => ({ location: { latLng: { latitude: place.lat, longitude: place.lng } } });
  for (let retryAttempt = 0; retryAttempt <= 1; retryAttempt++) {
    const requestStartedAt = Date.now();
    try {
      const response = await fetchTimed("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration" },
        body: JSON.stringify({ origin: location(origin), destination: location(destination), travelMode: "DRIVE", routingPreference: "TRAFFIC_AWARE" }),
        cache: "no-store",
      }, remaining(deadline, ROUTES_TIMEOUT_MS));
      const data = await response.json().catch(() => ({})) as { routes?: { distanceMeters?: number; duration?: string }[]; error?: { status?: string } };
      if (!response.ok) {
        const category = data.error?.status ?? "UNKNOWN";
        console.warn("Airport quote diagnostic", { attemptId, stage: "routes", result: transientGoogleStatus(response.status) && retryAttempt === 0 ? "retry" : "failure", durationMs: Date.now() - requestStartedAt, httpStatus: response.status, errorName: "GoogleRoutesError", errorCode: category, safeMessage: "Google Routes request failed", retryAttempt, pricingSource: "pending" });
        if (transientGoogleStatus(response.status) && retryAttempt === 0) { await wait(RETRY_BACKOFF_MS); continue; }
        throw new AirportQuoteError("ROUTES_UNAVAILABLE");
      }
      const first = data.routes?.[0];
      const seconds = Number(first?.duration?.replace("s", ""));
      if (!first?.distanceMeters || !Number.isFinite(seconds) || seconds <= 0) { const error = new AirportQuoteError("NO_ROUTE"); logFailure(attemptId, "routes", stageStartedAt, error, { retryAttempt }); throw error; }
      const route = { distanceKm: Math.round(first.distanceMeters / 100) / 10, durationMinutes: Math.max(1, Math.round(seconds / 60)) };
      console.info("Airport quote diagnostic", { attemptId, stage: "routes", result: "success", durationMs: Date.now() - stageStartedAt, requestDurationMs: Date.now() - requestStartedAt, retryAttempt });
      return route;
    } catch (error) {
      if (error instanceof AirportQuoteError) throw error;
      const timedOut = error instanceof Error && error.name === "AbortError";
      if (timedOut && retryAttempt === 0 && Date.now() < deadline - RETRY_BACKOFF_MS) {
        console.warn("Airport quote diagnostic", { attemptId, stage: "routes", result: "retry", durationMs: Date.now() - requestStartedAt, errorName: "TimeoutError", errorCode: "TIMEOUT", safeMessage: "Google Routes request timed out", retryAttempt, pricingSource: "pending" });
        await wait(RETRY_BACKOFF_MS); continue;
      }
      logFailure(attemptId, "routes", stageStartedAt, error, { retryAttempt });
      throw new AirportQuoteError(timedOut ? "REQUEST_TIMEOUT" : "ROUTES_UNAVAILABLE");
    }
  }
  throw new AirportQuoteError("ROUTES_UNAVAILABLE");
}

export async function createAirportQuotes(input: QuoteInput, attemptId: string = randomUUID()) {
  const requestStartedAt = Date.now();
  const deadline = requestStartedAt + QUOTE_BUDGET_MS;
  const pricingPromise = getAirportPricingConfigWithMeta(attemptId).catch((error) => {
    if (error instanceof AirportQuoteError) throw error;
    throw new AirportQuoteError("PRICING_UNAVAILABLE", error instanceof Error ? error.message : undefined);
  });
  const [pricingResult, verifiedPlace] = await Promise.all([pricingPromise, verifyGooglePlace(input.place.placeId, attemptId, deadline)]);
  const pickup = input.tripType === "airportPickup" ? ISLAMABAD_AIRPORT : verifiedPlace;
  const destination = input.tripType === "airportPickup" ? verifiedPlace : ISLAMABAD_AIRPORT;
  const { config, source: pricingSource } = pricingResult;
  const routeInfo = await calculateRoute(pickup, destination, attemptId, deadline);
  const fareStartedAt = Date.now();
  const hour = Number(input.time.slice(0, 2));
  const late = hour >= 22 || hour < 6;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.quoteValidityMinutes * 60000);
  const vehicleOptions = config.vehicles.filter((item) => item.active && item.passengers >= input.passengers).map((vehicle) => {
    const additionalCustomerKm = Math.max(0, routeInfo.distanceKm - vehicle.includedKm);
    const operationalKm = Math.max(0, vehicle.operationalKm);
    const distanceCharge = (additionalCustomerKm + operationalKm) * vehicle.additionalKmRate;
    const total = Math.ceil((vehicle.minimumFare + distanceCharge + (input.tripType === "airportPickup" ? vehicle.pickupAdjustment : vehicle.dropoffAdjustment) + (late && vehicle.lateNightEnabled ? vehicle.lateNightSurcharge : 0) + vehicle.operationalAllowance) / 50) * 50;
    return { vehicle: { id: vehicle.id, name: vehicle.name, passengers: vehicle.passengers, luggage: vehicle.luggage }, price: total, operationalKm, additionalCustomerKm, includedItems: [...(vehicle.fuelIncluded ? ["Fuel Included"] : []), "Professional Driver Included"], excludedItems: [...(!vehicle.tollIncluded ? ["Tolls"] : []), ...(!vehicle.parkingIncluded ? ["Parking"] : [])] };
  });
  console.info("Airport quote diagnostic", { attemptId, stage: "fare_calculation", result: "success", durationMs: Date.now() - fareStartedAt, pricingSource, optionCount: vehicleOptions.length });
  if (vehicleOptions.length === 0) throw new AirportQuoteError("PRICING_UNAVAILABLE", "No eligible Airport vehicles configured");
  const quoteId = randomUUID();
  const quote = { quoteId, ...input, place: verifiedPlace, pickup, destination, ...routeInfo, vehicleOptions, pricingVersion: config.version, advancePercentage: config.advancePercentage, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() };
  const persistenceStartedAt = Date.now();
  try { await withinDeadline(getAdminDb().collection("airportQuotes").doc(quoteId).set(quote), deadline); }
  catch (error) { logFailure(attemptId, "quote_persistence", persistenceStartedAt, error, { pricingSource }); throw new AirportQuoteError("PERSISTENCE_UNAVAILABLE"); }
  console.info("Airport quote diagnostic", { attemptId, stage: "quote_persistence", result: "success", durationMs: Date.now() - persistenceStartedAt, quoteDocumentCount: 1, optionCount: vehicleOptions.length, pricingSource });
  const totalDurationMs = Date.now() - requestStartedAt;
  console.info("Airport quote diagnostic", { attemptId, stage: "response", result: "success", durationMs: totalDurationMs, pricingSource, runtime: process.env.NODE_ENV });
  return { ...quote, diagnostics: { pricingSource, totalDurationMs } };
}
