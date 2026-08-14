import {
  TA_CONTRACT_DISTANCE_BANDS,
  TA_VEHICLE_CATEGORIES,
  type TaAirport,
  type TaContractRateSet,
  type TaVehicleCategory,
  type TaVehicleRateTable,
} from "./types";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function parsePkrToMinor(value: string): number | null {
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) && minor >= 0 ? minor : null;
}

export function minorToPkr(minor: number): string {
  return Number.isSafeInteger(minor) ? (minor / 100).toFixed(2).replace(/\.00$/, "") : "";
}

export function parseAirportForm(form: FormData): ValidationResult<Omit<TaAirport, "id" | "createdAt" | "updatedAt">> {
  const code = text(form, "iataCode").toUpperCase();
  const name = text(form, "airportName");
  const city = text(form, "city");
  const country = text(form, "country");
  const currency = text(form, "currency").toUpperCase();
  const googlePlaceId = text(form, "googlePlaceId");
  const latitude = Number(text(form, "latitude"));
  const longitude = Number(text(form, "longitude"));
  if (!/^[A-Z]{3}$/.test(code)) return { ok: false, error: "IATA code must be exactly three letters." };
  if (!name || !city || !country) return { ok: false, error: "Airport name, city, and country are required." };
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "Currency must be a three-letter code." };
  if (!googlePlaceId) return { ok: false, error: "A stable Google place reference is required." };
  if (!Number.isFinite(latitude) || latitude < 23 || latitude > 38.5 || !Number.isFinite(longitude) || longitude < 60 || longitude > 78.5) return { ok: false, error: "Select a resolved airport location in Pakistan from Google Places." };
  return { ok: true, value: { code, name, city, country, currency, googlePlaceId, formattedAddress: text(form, "formattedAddress") || undefined, location: { latitude, longitude }, active: form.get("active") === "on" } };
}

export interface ParsedRateSet {
  airportId: string;
  effectiveFrom: string;
  commissionPercent: number;
  policies: TaContractRateSet["policies"];
  vehicleRates: TaVehicleRateTable[];
}

export function parseRateSetForm(form: FormData, validAirportIds: Set<string>): ValidationResult<ParsedRateSet> {
  const airportId = text(form, "airportId");
  if (!validAirportIds.has(airportId)) return { ok: false, error: "Select a valid active airport." };
  const effectiveFrom = text(form, "effectiveFrom");
  if (!isoDate.test(effectiveFrom) || Number.isNaN(Date.parse(`${effectiveFrom}T00:00:00Z`))) return { ok: false, error: "Enter a valid effective date." };
  const commissionPercent = Number(text(form, "commissionPercent"));
  if (!Number.isFinite(commissionPercent) || commissionPercent < 10 || commissionPercent > 15) return { ok: false, error: "Commission must be between 10% and 15%." };
  const policies = { waitingPolicy: text(form, "waitingPolicy"), cancellationPolicy: text(form, "cancellationPolicy"), noShowPolicy: text(form, "noShowPolicy") };
  if (Object.values(policies).some((value) => !value)) return { ok: false, error: "All three policy fields are required." };

  const vehicleRates: TaVehicleRateTable[] = [];
  for (const category of TA_VEHICLE_CATEGORIES) {
    if (!TA_VEHICLE_CATEGORIES.includes(category as TaVehicleCategory)) return { ok: false, error: "Invalid vehicle category." };
    const bandRatesMinor = {} as TaVehicleRateTable["bandRatesMinor"];
    for (const band of TA_CONTRACT_DISTANCE_BANDS) {
      const amount = parsePkrToMinor(text(form, `${category}_${band}`));
      if (amount === null) return { ok: false, error: `${category}: all distance bands require a non-negative PKR amount.` };
      bandRatesMinor[band] = amount;
    }
    const additionalPerKmMinor = parsePkrToMinor(text(form, `${category}_over50`));
    if (additionalPerKmMinor === null) return { ok: false, error: `${category}: enter a valid additional per-km amount.` };
    vehicleRates.push({ vehicleCategory: category, bandRatesMinor, additionalPerKmMinor });
  }
  return { ok: true, value: { airportId, effectiveFrom, commissionPercent, policies, vehicleRates } };
}
