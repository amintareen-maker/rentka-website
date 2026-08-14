import "server-only";

import { timingSafeEqual } from "node:crypto";
import { calculateContractRateMinor, contractDistanceBand } from "./contract";
import { getActiveTaAirport, getActiveTaContract } from "./repository";
import { signTaPayload } from "./session";
import type { TaLocationSnapshot, TaVehicleCategory } from "./types";
import { TA_VEHICLE_CATEGORIES } from "./types";

export interface PortalPlace { placeId: string; address: string; latitude: number; longitude: number }
export interface QuoteRequest { airportId: string; serviceType: "airport_pickup" | "airport_drop"; vehicleCategory: TaVehicleCategory; location: PortalPlace }
export interface QuotePayload extends QuoteRequest { issuedAt: number; airportCode: string; airportName: string; pickup: TaLocationSnapshot; dropoff: TaLocationSnapshot; distanceKm: number; durationMinutes: number; band: ReturnType<typeof contractDistanceBand>; grossMinor: number; fixed50KmBaseRateMinor?: number; additionalDistanceKm?: number; additionalPerKmRateMinor?: number; additionalDistanceChargeMinor?: number; commissionPercent: number; commissionMinor: number; netMinor: number; currency: string; rateSetId: string; rateVersion: string; rateEffectiveFrom: string; policies: { waitingPolicy: string; cancellationPolicy: string; noShowPolicy: string }; over50KmBillingMode: "EXACT_DISTANCE_ROUND_MINOR" }

export const validPortalPlace = (value: unknown): value is PortalPlace => {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PortalPlace>;
  return typeof p.placeId === "string" && p.placeId.length > 0 && p.placeId.length <= 256 && typeof p.address === "string" && p.address.length > 0 && p.address.length <= 1000 && typeof p.latitude === "number" && p.latitude >= 23 && p.latitude <= 38.5 && typeof p.longitude === "number" && p.longitude >= 60 && p.longitude <= 78.5;
};

export function validQuoteRequest(value: unknown): value is QuoteRequest {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<QuoteRequest>;
  return typeof q.airportId === "string" && ["airport_pickup", "airport_drop"].includes(q.serviceType ?? "") && TA_VEHICLE_CATEGORIES.includes(q.vehicleCategory as TaVehicleCategory) && validPortalPlace(q.location);
}

async function googleRoute(airportPlaceId: string, serviceType: QuoteRequest["serviceType"], place: PortalPlace) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) throw new Error("Route calculation is not configured.");
  const airport = { placeId: airportPlaceId };
  const location = { location: { latLng: { latitude: place.latitude, longitude: place.longitude } } };
  const body = serviceType === "airport_pickup" ? { origin: airport, destination: location } : { origin: location, destination: airport };
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration" }, body: JSON.stringify({ ...body, travelMode: "DRIVE", routingPreference: "TRAFFIC_AWARE" }), cache: "no-store" });
  if (!response.ok) throw new Error("Google Routes could not calculate this journey.");
  const data = await response.json() as { routes?: Array<{ distanceMeters?: number; duration?: string }> };
  const route = data.routes?.[0];
  const meters = Number(route?.distanceMeters);
  const seconds = Number(route?.duration?.replace(/s$/, ""));
  if (!Number.isFinite(meters) || meters <= 0 || !Number.isFinite(seconds)) throw new Error("No driving route was found.");
  return { distanceKm: meters / 1000, durationMinutes: Math.ceil(seconds / 60) };
}

export async function createQuote(request: QuoteRequest): Promise<QuotePayload> {
  const [airport, rateSet] = await Promise.all([getActiveTaAirport(request.airportId), getActiveTaContract(request.airportId)]);
  if (!airport || !rateSet) throw new Error("No active airport contract is available.");
  if (rateSet.over50KmBillingMode !== "EXACT_DISTANCE_ROUND_MINOR") throw new Error("This contract uses an unsupported over-50 km billing mode.");
  const rates = rateSet.vehicleRates.find((item) => item.vehicleCategory === request.vehicleCategory);
  if (!rates) throw new Error("This vehicle category is not configured.");
  const route = await googleRoute(airport.googlePlaceId, request.serviceType, request.location);
  const calculation = calculateContractRateMinor(route.distanceKm, rates);
  const grossMinor = calculation.grossRateMinor;
  const commissionMinor = Math.round(grossMinor * rateSet.commissionPercent / 100);
  const airportLocation: TaLocationSnapshot = { address: airport.formattedAddress || airport.name, placeId: airport.googlePlaceId, coordinates: airport.location };
  const entered: TaLocationSnapshot = { address: request.location.address, placeId: request.location.placeId, coordinates: { latitude: request.location.latitude, longitude: request.location.longitude } };
  return { ...request, issuedAt: Date.now(), airportCode: airport.code, airportName: airport.name, pickup: request.serviceType === "airport_pickup" ? airportLocation : entered, dropoff: request.serviceType === "airport_pickup" ? entered : airportLocation, ...route, band: calculation.contractDistanceBand, grossMinor, fixed50KmBaseRateMinor: calculation.fixed50KmBaseRateMinor, additionalDistanceKm: calculation.additionalDistanceKm, additionalPerKmRateMinor: calculation.additionalPerKmRateMinor, additionalDistanceChargeMinor: calculation.additionalDistanceChargeMinor, commissionPercent: rateSet.commissionPercent, commissionMinor, netMinor: grossMinor - commissionMinor, currency: rateSet.currency, rateSetId: rateSet.id, rateVersion: rateSet.version, rateEffectiveFrom: rateSet.effectiveFrom, policies: rateSet.policies, over50KmBillingMode: rateSet.over50KmBillingMode };
}

export function encodeQuote(quote: QuotePayload) {
  const payload = Buffer.from(JSON.stringify(quote)).toString("base64url");
  return `${payload}.${signTaPayload(payload)}`;
}

export function decodeQuote(token: string): QuotePayload | null {
  const [payload, suppliedText, ...extra] = token.split(".");
  if (!payload || !suppliedText || extra.length) return null;
  const supplied = Buffer.from(suppliedText, "base64url");
  const expected = Buffer.from(signTaPayload(payload), "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try { const quote = JSON.parse(Buffer.from(payload, "base64url").toString()) as QuotePayload; return Date.now() - quote.issuedAt <= 30 * 60 * 1000 ? quote : null; } catch { return null; }
}
