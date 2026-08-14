import "server-only";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { AirportPricingConfig, AirportVehicleRule, LuggageLevel } from "./types";

export const DEFAULT_AIRPORT_PRICING: AirportPricingConfig = {
  version: 1, quoteValidityMinutes: 30, advancePercentage: 20,
  vehicles: [
    { id:"corolla",name:"Toyota Corolla",active:true,passengers:4,luggage:"standard",minimumFare:5000,includedKm:25,additionalKmRate:110,operationalKm:0,pickupAdjustment:0,dropoffAdjustment:0,lateNightSurcharge:750,lateNightEnabled:true,waitingAllowanceMinutes:45,additionalWaitingRate:500,operationalAllowance:0,fuelIncluded:true,tollIncluded:false,parkingIncluded:false },
    { id:"civic",name:"Honda Civic",active:true,passengers:4,luggage:"standard",minimumFare:7000,includedKm:25,additionalKmRate:140,operationalKm:0,pickupAdjustment:0,dropoffAdjustment:0,lateNightSurcharge:1000,lateNightEnabled:true,waitingAllowanceMinutes:45,additionalWaitingRate:600,operationalAllowance:0,fuelIncluded:true,tollIncluded:false,parkingIncluded:false },
    { id:"brv",name:"Honda BR-V",active:true,passengers:6,luggage:"heavy",minimumFare:8000,includedKm:25,additionalKmRate:160,operationalKm:0,pickupAdjustment:0,dropoffAdjustment:0,lateNightSurcharge:1000,lateNightEnabled:true,waitingAllowanceMinutes:45,additionalWaitingRate:700,operationalAllowance:0,fuelIncluded:true,tollIncluded:false,parkingIncluded:false },
    { id:"prado",name:"Toyota Prado",active:true,passengers:5,luggage:"heavy",minimumFare:15000,includedKm:25,additionalKmRate:260,operationalKm:0,pickupAdjustment:0,dropoffAdjustment:0,lateNightSurcharge:2000,lateNightEnabled:true,waitingAllowanceMinutes:45,additionalWaitingRate:1000,operationalAllowance:0,fuelIncluded:true,tollIncluded:false,parkingIncluded:false },
  ],
};

const ref = () => getAdminDb().collection("pricingConfigurations").doc("airportTransfer");
export type PricingSource = "firestore" | "cache_fresh" | "cache_stale" | "default_development";
type CachedPricing = { config: AirportPricingConfig; loadedAt: number; source: "firestore" | "default_development" };
const FRESH_CACHE_MS = 45_000;
const MAX_STALE_MS = 5 * 60_000;
const TRANSIENT_CODES = new Set(["4", "10", "14", "aborted", "deadline-exceeded", "deadline_exceeded", "unavailable"]);
const LUGGAGE = new Set<LuggageLevel>(["light", "standard", "heavy"]);
let cachedPricing: CachedPricing | undefined;
let pricingLoad: Promise<CachedPricing> | undefined;

const safeError = (error: unknown) => {
  const value = error as Error & { code?: string | number };
  return { errorName: value?.name ?? "UnknownError", errorCode: value?.code ?? "UNKNOWN", safeMessage: value?.message ?? "Unknown pricing read error" };
};
const transient = (error: unknown) => TRANSIENT_CODES.has(String((error as { code?: unknown })?.code ?? "").toLowerCase());
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const finite = (value: unknown, minimum = 0) => typeof value === "number" && Number.isFinite(value) && value >= minimum;

function validateVehicle(value: unknown): value is AirportVehicleRule {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && v.id.length > 0
    && typeof v.name === "string" && v.name.length > 0
    && typeof v.active === "boolean"
    && Number.isInteger(v.passengers) && Number(v.passengers) > 0
    && LUGGAGE.has(v.luggage as LuggageLevel)
    && ["minimumFare","includedKm","additionalKmRate","operationalKm","pickupAdjustment","dropoffAdjustment","lateNightSurcharge","waitingAllowanceMinutes","additionalWaitingRate","operationalAllowance"].every((key) => finite(v[key]))
    && typeof v.lateNightEnabled === "boolean"
    && typeof v.fuelIncluded === "boolean"
    && typeof v.tollIncluded === "boolean"
    && typeof v.parkingIncluded === "boolean";
}

export function validateAirportPricingConfig(value: unknown): AirportPricingConfig {
  if (!value || typeof value !== "object") throw new Error("INVALID_AIRPORT_PRICING_CONFIGURATION");
  const config = value as Record<string, unknown>;
  if (!Number.isInteger(config.version) || Number(config.version) < 1
    || !Number.isInteger(config.quoteValidityMinutes) || Number(config.quoteValidityMinutes) < 1
    || !finite(config.advancePercentage) || Number(config.advancePercentage) > 100
    || !Array.isArray(config.vehicles) || config.vehicles.length === 0
    || !config.vehicles.every(validateVehicle)) throw new Error("INVALID_AIRPORT_PRICING_CONFIGURATION");
  const ids = config.vehicles.map((vehicle) => vehicle.id);
  if (new Set(ids).size !== ids.length) throw new Error("INVALID_AIRPORT_PRICING_CONFIGURATION");
  return {
    version: Number(config.version),
    quoteValidityMinutes: Number(config.quoteValidityMinutes),
    advancePercentage: Number(config.advancePercentage),
    vehicles: config.vehicles.map((vehicle) => ({ ...vehicle })),
  };
}

async function readPricingFromFirestore(attemptId: string): Promise<CachedPricing> {
  const startedAt = Date.now();
  const snapshot = await ref().get();
  if (!snapshot.exists) {
    if (process.env.NODE_ENV === "production") throw new Error("AIRPORT_PRICING_CONFIGURATION_MISSING");
    const config = validateAirportPricingConfig(DEFAULT_AIRPORT_PRICING);
    console.warn("Airport quote diagnostic", { attemptId, stage: "pricing_configuration", result: "default_development", durationMs: Date.now() - startedAt, pricingSource: "default_development" });
    return { config, loadedAt: Date.now(), source: "default_development" };
  }
  const config = validateAirportPricingConfig(snapshot.data());
  console.info("Airport quote diagnostic", { attemptId, stage: "pricing_configuration", result: "success", durationMs: Date.now() - startedAt, pricingSource: "firestore" });
  return { config, loadedAt: Date.now(), source: "firestore" };
}

async function refreshPricing(attemptId: string): Promise<CachedPricing> {
  const startedAt = Date.now();
  try {
    return await readPricingFromFirestore(attemptId);
  } catch (error) {
    if (!transient(error)) throw error;
    const detail = safeError(error);
    console.warn("Airport quote diagnostic", { attemptId, stage: "pricing_configuration", result: "retry", durationMs: Date.now() - startedAt, retryAttempt: 1, pricingSource: "retry_firestore", ...detail });
    await wait(150);
    return readPricingFromFirestore(attemptId);
  }
}

export async function getAirportPricingConfigWithMeta(attemptId = "pricing-config"): Promise<{ config: AirportPricingConfig; source: PricingSource }> {
  const now = Date.now();
  if (cachedPricing && now - cachedPricing.loadedAt <= FRESH_CACHE_MS) {
    console.info("Airport quote diagnostic", { attemptId, stage: "pricing_configuration", result: "success", durationMs: 0, pricingSource: "cache_fresh" });
    return { config: cachedPricing.config, source: "cache_fresh" };
  }
  try {
    pricingLoad ??= refreshPricing(attemptId).finally(() => { pricingLoad = undefined; });
    cachedPricing = await pricingLoad;
    return { config: cachedPricing.config, source: cachedPricing.source };
  } catch (error) {
    const detail = safeError(error);
    if (cachedPricing && transient(error) && now - cachedPricing.loadedAt <= MAX_STALE_MS) {
      console.warn("Airport quote diagnostic", { attemptId, stage: "pricing_configuration", result: "success", durationMs: 0, pricingSource: "cache_stale", cacheAgeMs: now - cachedPricing.loadedAt, ...detail });
      return { config: cachedPricing.config, source: "cache_stale" };
    }
    console.error("Airport quote diagnostic", { attemptId, stage: "pricing_configuration", result: "failure", durationMs: 0, pricingSource: "firestore", ...detail });
    throw error;
  }
}

export function getAirportPricingCacheStatus() {
  return cachedPricing ? { state: Date.now() - cachedPricing.loadedAt <= FRESH_CACHE_MS ? "fresh" : "stale", ageMs: Date.now() - cachedPricing.loadedAt, version: cachedPricing.config.version } : { state: "empty", ageMs: null, version: null };
}

export async function getAirportPricingConfig(): Promise<AirportPricingConfig> {
  return (await getAirportPricingConfigWithMeta()).config;
}
export async function saveAirportPricingConfig(config: AirportPricingConfig) {
  const validated = validateAirportPricingConfig(config);
  await ref().set({ ...validated, version: validated.version + 1, updatedAt: new Date().toISOString() });
  cachedPricing = undefined;
}
