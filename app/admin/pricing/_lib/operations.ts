import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  isNormalRentalZoneId,
  NORMAL_RENTAL_ZONES,
  type NormalRentalZoneId,
} from "@/lib/normal-rental/zones";
import { normalizeNormalRentalModelKey } from "@/lib/normal-rental/inventory-core";

export const OPERATING_ZONES = {
  twin_cities: { label: NORMAL_RENTAL_ZONES.twin_cities.label, cityList: NORMAL_RENTAL_ZONES.twin_cities.cityIds },
  lahore: { label: NORMAL_RENTAL_ZONES.lahore.label, cityList: NORMAL_RENTAL_ZONES.lahore.cityIds },
} as const;

export type OperatingZoneId = NormalRentalZoneId;
export type RateSet = { daily?: number; weekly?: number; monthly?: number };
export type ModelOption = {
  key: string;
  name: string;
  imageURL: string;
  category: string;
  seatingCapacity: string;
  sourceCarId: string;
};
export type VendorOption = {
  id: string;
  name: string;
  phone: string;
  zoneId: OperatingZoneId;
  source: "legacy" | "operations";
};
export type InventoryRow = {
  id: string;
  modelKey: string;
  modelName: string;
  vendorId: string;
  vendorName: string;
  active: boolean;
  withinCity: RateSet;
  outsideCity: RateSet;
  imageURL: string;
  imageOverride: string;
  source: "legacy" | "operations";
};

type DocumentData = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const rate = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
const rateSet = (value: unknown): RateSet => {
  const data = value && typeof value === "object" ? value as DocumentData : {};
  return { daily: rate(data.daily), weekly: rate(data.weekly), monthly: rate(data.monthly) };
};
export const normalizeModelKey = normalizeNormalRentalModelKey;
export const isOperatingZone = isNormalRentalZoneId;

export async function loadOperations(zoneId: OperatingZoneId) {
  const db = getAdminDb();
  const [carsSnapshot, legacyVendorsSnapshot, operationsVendorsSnapshot, inventorySnapshot] = await Promise.all([
    db.collection("countries").doc("PK").collection("cars").get(),
    db.collection("countries").doc("PK").collection("vendors").get(),
    db.collection("normalRentalVendors").where("zoneId", "==", zoneId).get(),
    db.collection("normalRentalInventory").where("zoneId", "==", zoneId).get(),
  ]);

  const allCars = carsSnapshot.docs.map((document) => ({ id: document.id, data: document.data() as DocumentData }));
  const modelMap = new Map<string, ModelOption>();
  for (const { id, data } of allCars) {
    const name = text(data.model) || text(data.name);
    if (!name) continue;
    const key = normalizeModelKey(name);
    const candidate = {
      key,
      name,
      imageURL: text(data.imageURL),
      category: text(data.category),
      seatingCapacity: text(data.seatingCapacity),
      sourceCarId: id,
    };
    const current = modelMap.get(key);
    if (!current || (!current.imageURL && candidate.imageURL)) modelMap.set(key, candidate);
  }
  const models = [...modelMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const legacyVendorMap = new Map(legacyVendorsSnapshot.docs.map((document) => [document.id, document.data() as DocumentData]));
  const vendors: VendorOption[] = [];
  if (zoneId === "twin_cities") {
    const usedVendorIds = new Set(allCars.flatMap(({ data }) => {
      const cities = Array.isArray(data.cityList) ? data.cityList.map((city) => text(city).toLowerCase()) : [];
      return cities.some((city) => OPERATING_ZONES.twin_cities.cityList.includes(city as "islamabad" | "rawalpindi")) && text(data.vendorId)
        ? [text(data.vendorId)] : [];
    }));
    for (const vendorId of usedVendorIds) {
      const data = legacyVendorMap.get(vendorId) ?? {};
      vendors.push({ id: vendorId, name: text(data.name) || "Legacy vendor", phone: text(data.phone), zoneId, source: "legacy" });
    }
  }
  for (const document of operationsVendorsSnapshot.docs) {
    const data = document.data() as DocumentData;
    vendors.push({ id: document.id, name: text(data.name), phone: text(data.phone), zoneId, source: "operations" });
  }
  vendors.sort((a, b) => a.name.localeCompare(b.name));

  const inventory: InventoryRow[] = [];
  if (zoneId === "twin_cities") {
    for (const { id, data } of allCars) {
      const cities = Array.isArray(data.cityList) ? data.cityList.map((city) => text(city).toLowerCase()) : [];
      if (!cities.some((city) => OPERATING_ZONES.twin_cities.cityList.includes(city as "islamabad" | "rawalpindi"))) continue;
      const pricing = data.pricing && typeof data.pricing === "object" ? data.pricing as DocumentData : {};
      const withDriver = pricing.withDriver && typeof pricing.withDriver === "object" ? pricing.withDriver as DocumentData : {};
      const modelName = text(data.model) || text(data.name);
      const vendorId = text(data.vendorId);
      inventory.push({
        id,
        modelKey: normalizeModelKey(modelName),
        modelName,
        vendorId,
        vendorName: text(legacyVendorMap.get(vendorId)?.name) || "Legacy vendor",
        active: data.active !== false,
        withinCity: rateSet(withDriver.withinCity),
        outsideCity: rateSet(withDriver.outsideCity),
        imageURL: text(data.imageURL),
        imageOverride: "",
        source: "legacy",
      });
    }
  }
  for (const document of inventorySnapshot.docs) {
    const data = document.data() as DocumentData;
    const pricing = data.pricing && typeof data.pricing === "object" ? data.pricing as DocumentData : {};
    const withDriver = pricing.withDriver && typeof pricing.withDriver === "object" ? pricing.withDriver as DocumentData : {};
    const modelKey = text(data.modelKey);
    const model = modelMap.get(modelKey);
    inventory.push({
      id: document.id,
      modelKey,
      modelName: text(data.modelName) || model?.name || modelKey,
      vendorId: text(data.vendorId),
      vendorName: text(data.vendorName),
      active: data.active === true,
      withinCity: rateSet(withDriver.withinCity),
      outsideCity: rateSet(withDriver.outsideCity),
      imageURL: model?.imageURL || "",
      imageOverride: text(data.imageOverride),
      source: "operations",
    });
  }
  inventory.sort((a, b) => a.modelName.localeCompare(b.modelName) || a.vendorName.localeCompare(b.vendorName));
  return { models, vendors, inventory };
}

export async function createOperationsVendor(zoneId: OperatingZoneId, name: string, phone: string) {
  await getAdminDb().collection("normalRentalVendors").add({
    zoneId, name, phone: phone || null, active: true,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function saveOperationsInventory(input: {
  id?: string; zoneId: OperatingZoneId; model: ModelOption; vendor: VendorOption;
  active: boolean; withinCity: RateSet; outsideCity: RateSet; imageOverride: string;
}) {
  const db = getAdminDb();
  const collection = db.collection("normalRentalInventory");
  const ref = input.id ? collection.doc(input.id) : collection.doc();
  if (input.id) {
    const current = await ref.get();
    if (!current.exists || current.data()?.zoneId !== input.zoneId) throw new Error("Inventory context does not match the selected zone.");
  }
  await ref.set({
    zoneId: input.zoneId,
    cityList: [...OPERATING_ZONES[input.zoneId].cityList],
    modelKey: input.model.key,
    modelName: input.model.name,
    modelSourceCarId: input.model.sourceCarId,
    vendorId: input.vendor.id,
    vendorName: input.vendor.name,
    vendorSource: input.vendor.source,
    active: input.active,
    pricing: { withDriver: { withinCity: input.withinCity, outsideCity: input.outsideCity } },
    imageOverride: input.imageOverride || null,
    updatedAt: FieldValue.serverTimestamp(),
    ...(!input.id ? { createdAt: FieldValue.serverTimestamp() } : {}),
  }, { merge: true });
}

export async function updateLegacyInventory(input: {
  id: string; active: boolean; withinCity: RateSet; outsideCity: RateSet;
}) {
  const ref = getAdminDb().collection("countries").doc("PK").collection("cars").doc(input.id);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("Car record was not found.");
    const cities = Array.isArray(snapshot.data()?.cityList) ? snapshot.data()!.cityList.map((city: unknown) => text(city).toLowerCase()) : [];
    if (!cities.some((city: string) => OPERATING_ZONES.twin_cities.cityList.includes(city as "islamabad" | "rawalpindi"))) {
      throw new Error("This car is not part of the Islamabad / Rawalpindi zone.");
    }
    transaction.update(ref, {
      active: input.active,
      "pricing.withDriver.withinCity": input.withinCity,
      "pricing.withDriver.outsideCity": input.outsideCity,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
