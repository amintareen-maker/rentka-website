import "server-only";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { AirportPricingConfig } from "./types";

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
type PricingSource = "firestore" | "cache" | "stale-cache" | "default";
type CachedPricing = { config: AirportPricingConfig; loadedAt: number; source: "firestore" | "default" };
const FRESH_CACHE_MS = 45_000;
const MAX_STALE_MS = 5 * 60_000;
const TRANSIENT_CODES = new Set([4, 10, 14, "4", "10", "14", "aborted", "deadline-exceeded", "deadline_exceeded", "unavailable"]);
let cachedPricing: CachedPricing | undefined;
let pricingLoad: Promise<CachedPricing> | undefined;

const safeError = (error: unknown) => {
  const value = error as Error & { code?: string | number };
  return { name: value?.name ?? "UnknownError", code: value?.code ?? "UNKNOWN", message: value?.message ?? "Unknown pricing read error" };
};
const transient = (error: unknown) => TRANSIENT_CODES.has(String((error as { code?: unknown })?.code ?? "").toLowerCase());
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const normalize = (stored: Partial<AirportPricingConfig>): AirportPricingConfig => {
  if (stored.vehicles !== undefined && !Array.isArray(stored.vehicles)) throw new Error("INVALID_AIRPORT_PRICING_CONFIGURATION");
  return {
    ...DEFAULT_AIRPORT_PRICING,
    ...stored,
    vehicles: DEFAULT_AIRPORT_PRICING.vehicles.map((fallback) => ({
      ...fallback,
      ...(stored.vehicles?.find((vehicle) => vehicle.id === fallback.id) ?? {}),
      operationalKm: stored.vehicles?.find((vehicle) => vehicle.id === fallback.id)?.operationalKm ?? 0,
    })),
  };
};

async function readPricingFromFirestore(): Promise<CachedPricing> {
  const snapshot = await ref().get();
  if (!snapshot.exists) return { config: DEFAULT_AIRPORT_PRICING, loadedAt: Date.now(), source: "default" };
  return { config: normalize(snapshot.data() as Partial<AirportPricingConfig>), loadedAt: Date.now(), source: "firestore" };
}

async function refreshPricing(): Promise<CachedPricing> {
  try {
    return await readPricingFromFirestore();
  } catch (error) {
    if (!transient(error)) throw error;
    console.warn("Airport pricing read transient failure; retrying once.", safeError(error));
    await wait(150);
    return readPricingFromFirestore();
  }
}

export async function getAirportPricingConfigWithMeta(): Promise<{ config: AirportPricingConfig; source: PricingSource }> {
  const now = Date.now();
  if (cachedPricing && now - cachedPricing.loadedAt <= FRESH_CACHE_MS) return { config: cachedPricing.config, source: "cache" };
  try {
    pricingLoad ??= refreshPricing().finally(() => { pricingLoad = undefined; });
    cachedPricing = await pricingLoad;
    return { config: cachedPricing.config, source: cachedPricing.source };
  } catch (error) {
    const detail = safeError(error);
    console.error("Airport pricing configuration read failed.", detail);
    if (cachedPricing && transient(error) && now - cachedPricing.loadedAt <= MAX_STALE_MS) {
      console.warn("Airport pricing stale cache used after transient failure.", { ageMs: now - cachedPricing.loadedAt, code: detail.code });
      return { config: cachedPricing.config, source: "stale-cache" };
    }
    throw error;
  }
}

export async function getAirportPricingConfig(): Promise<AirportPricingConfig> {
  return (await getAirportPricingConfigWithMeta()).config;
}
export async function saveAirportPricingConfig(config: AirportPricingConfig) {
  await ref().set({ ...config, version: config.version + 1, updatedAt: new Date().toISOString() });
  cachedPricing = undefined;
}
