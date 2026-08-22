import type { NormalRentalCityId, NormalRentalZoneId } from "./zones";

export type NormalRentalRateSet = { daily?: number; weekly?: number; monthly?: number };
export type NormalRentalPricing = {
  withDriver: { withinCity: NormalRentalRateSet; outsideCity: NormalRentalRateSet };
};
export type NormalizedNormalRentalInventory = {
  inventoryId: string;
  source: "legacy" | "operations";
  zoneId: NormalRentalZoneId;
  cityId: NormalRentalCityId;
  modelKey: string;
  modelName: string;
  modelSlug: string;
  vendorId: string;
  vendorName: string;
  active: boolean;
  imageURL: string;
  category?: string;
  seatingCapacity?: string;
  transmission?: string;
  modelYear?: number;
  modelYearLabel?: string;
  showAsSeparateCard: boolean;
  publicLabel?: string;
  pricing: NormalRentalPricing;
};

export type LahoreBookingInventory = Pick<NormalizedNormalRentalInventory,
  "inventoryId" | "modelKey" | "modelName" | "modelSlug" | "imageURL" | "category" | "seatingCapacity" |
  "transmission" | "modelYear" | "modelYearLabel" | "showAsSeparateCard" | "publicLabel" | "pricing"
> & Partial<Pick<NormalizedNormalRentalInventory, "vendorId" | "vendorName">>;

export type ResolverDocument = { id: string; data: Record<string, unknown> };
type ResolverInput = {
  zoneId: NormalRentalZoneId;
  cityId: NormalRentalCityId;
  legacyCars: ResolverDocument[];
  legacyVendors: ResolverDocument[];
  operationsInventory: ResolverDocument[];
  operationsVendors: ResolverDocument[];
};

const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
export const normalizeNormalRentalModelKey = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const validHttpsUrl = (value: string) => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};
const rates = (value: unknown): NormalRentalRateSet => {
  const data = object(value);
  return { daily: number(data.daily), weekly: number(data.weekly), monthly: number(data.monthly) };
};
const pricing = (value: unknown): NormalRentalPricing => {
  const withDriver = object(object(value).withDriver);
  return { withDriver: { withinCity: rates(withDriver.withinCity), outsideCity: rates(withDriver.outsideCity) } };
};
const validPricing = (value: NormalRentalPricing) =>
  (value.withDriver.withinCity.daily ?? 0) > 0 && (value.withDriver.outsideCity.daily ?? 0) > 0;

function representativeModels(cars: ResolverDocument[]) {
  const byId = new Map<string, ResolverDocument>();
  for (const car of cars) byId.set(car.id, car);
  return byId;
}

export function normalizeNormalRentalInventory(input: ResolverInput): NormalizedNormalRentalInventory[] {
  if (input.zoneId === "twin_cities") {
    const vendorById = new Map(input.legacyVendors.map((vendor) => [vendor.id, vendor.data]));
    return input.legacyCars.flatMap((car) => {
      const cities = Array.isArray(car.data.cityList) ? car.data.cityList.map((city) => text(city).toLowerCase()) : [];
      if (car.data.active === false || !cities.some((city) => city === "islamabad" || city === "rawalpindi")) return [];
      const modelName = text(car.data.model) || text(car.data.name);
      const vendorId = text(car.data.vendorId);
      const vendor = vendorById.get(vendorId);
      const resolvedPricing = pricing(car.data.pricing);
      if (!modelName || !vendorId || !vendor || !validPricing(resolvedPricing)) return [];
      return [{
        inventoryId: car.id, source: "legacy" as const, zoneId: input.zoneId, cityId: input.cityId,
        modelKey: normalizeNormalRentalModelKey(modelName), modelName, modelSlug: normalizeNormalRentalModelKey(modelName),
        vendorId, vendorName: text(vendor.name) || "Verified Partner", active: true,
        imageURL: text(car.data.imageURL), category: text(car.data.category) || undefined,
        seatingCapacity: text(car.data.seatingCapacity) || undefined, transmission: text(car.data.transmission) || undefined,
        modelYear: number(car.data.modelYear), modelYearLabel: text(car.data.modelYearLabel) || undefined,
        showAsSeparateCard: false,
        pricing: resolvedPricing,
      }];
    });
  }

  const modelBySourceId = representativeModels(input.legacyCars);
  const vendorById = new Map(input.operationsVendors.map((vendor) => [vendor.id, vendor.data]));
  return input.operationsInventory.flatMap((inventory) => {
    if (inventory.data.zoneId !== input.zoneId || inventory.data.active !== true) return [];
    const vendorId = text(inventory.data.vendorId);
    const vendor = vendorById.get(vendorId);
    if (!vendor || vendor.zoneId !== input.zoneId || vendor.active !== true) return [];
    const sourceCar = modelBySourceId.get(text(inventory.data.modelSourceCarId));
    if (!sourceCar) return [];
    const sourceModelName = text(sourceCar.data.model) || text(sourceCar.data.name);
    const sourceModelKey = normalizeNormalRentalModelKey(sourceModelName);
    const modelKey = text(inventory.data.modelKey);
    if (!sourceModelName || !modelKey || sourceModelKey !== modelKey) return [];
    const resolvedPricing = pricing(inventory.data.pricing);
    if (!validPricing(resolvedPricing)) return [];
    const override = text(inventory.data.imageOverride);
    const defaultImage = text(sourceCar.data.imageURL);
    return [{
      inventoryId: inventory.id, source: "operations" as const, zoneId: input.zoneId, cityId: input.cityId,
      modelKey, modelName: text(inventory.data.modelName) || sourceModelName, modelSlug: modelKey,
      vendorId, vendorName: text(vendor.name), active: true,
      imageURL: override && validHttpsUrl(override) ? override : defaultImage,
      category: text(sourceCar.data.category) || undefined, seatingCapacity: text(sourceCar.data.seatingCapacity) || undefined,
      transmission: text(sourceCar.data.transmission) || undefined,
      modelYearLabel: text(inventory.data.modelYearLabel) || undefined,
      showAsSeparateCard: inventory.data.showAsSeparateCard === true,
      publicLabel: text(inventory.data.publicLabel) || undefined, pricing: resolvedPricing,
    }];
  });
}

export type NormalRentalInventoryCard = {
  key: string;
  label: string;
  separate: boolean;
  options: LahoreBookingInventory[];
};

export function normalRentalPublicLabel(item: Pick<NormalizedNormalRentalInventory, "modelName" | "modelYearLabel" | "publicLabel">) {
  return item.publicLabel || (item.modelYearLabel ? `${item.modelName} — ${item.modelYearLabel}` : item.modelName);
}

export function groupNormalRentalInventoryCards(inventory: LahoreBookingInventory[]): NormalRentalInventoryCard[] {
  const cards = new Map<string, NormalRentalInventoryCard>();
  for (const item of inventory) {
    const separate = item.showAsSeparateCard === true;
    const key = separate ? `inventory:${item.inventoryId}` : `model:${item.modelKey}`;
    const current = cards.get(key);
    if (current) current.options.push(item);
    else cards.set(key, { key, label: separate ? normalRentalPublicLabel(item) : item.modelName, separate, options: [item] });
  }
  return [...cards.values()];
}

export function shouldOpenInventoryComparison(card: NormalRentalInventoryCard) {
  return !card.separate && card.options.length > 1;
}

export function normalRentalModelHref(item: Pick<NormalizedNormalRentalInventory, "modelSlug">) {
  return `/cars/${item.modelSlug}/lahore/with-driver`;
}
