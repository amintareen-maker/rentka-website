import "server-only";
import { createHash } from "node:crypto";

import { resolveNormalRentalInventory } from "./inventory-resolver";
import { findEligibleLahoreModel, groupEligibleLahoreModels } from "./public-models";
import type { LahoreBookingInventory, NormalizedNormalRentalInventory } from "./inventory-core";
import type { NormalRentalCityId, NormalRentalZoneId } from "./zones";
import { isValidVehicleRoute } from "../seo";

export async function getPublicNormalRentalInventory(zoneId: NormalRentalZoneId, cityId?: NormalRentalCityId) {
  return toPublicNormalRentalInventory(await resolveNormalRentalInventory({ zoneId, cityId, service: "withDriver" }));
}

export function publicNormalRentalOptionId(inventoryId: string, zoneId: NormalRentalZoneId) {
  // Keep all existing Lahore opaque option IDs stable.
  return createHash("sha256").update(`rentka-${zoneId === "lahore" ? "lahore" : zoneId}:${inventoryId}`).digest("base64url").slice(0, 24);
}

export function toPublicNormalRentalInventory(inventory: NormalizedNormalRentalInventory[]): LahoreBookingInventory[] {
  return inventory.filter((item) => item.zoneId !== "twin_cities" || isValidVehicleRoute(item.modelSlug, item.cityId, "with-driver"))
    .map((item) => ({
      inventoryId: publicNormalRentalOptionId(item.inventoryId, item.zoneId), modelKey: item.modelKey, modelName: item.modelName,
      modelSlug: item.modelSlug, imageURL: item.imageURL, category: item.category,
      seatingCapacity: item.seatingCapacity, transmission: item.transmission, modelYear: item.modelYear,
      modelYearLabel: item.modelYearLabel, showAsSeparateCard: item.showAsSeparateCard,
      publicLabel: item.publicLabel, pricing: item.pricing,
    }));
}

export async function getEligibleLahoreModels() {
  const inventory = await resolveNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", service: "withDriver" });
  return groupEligibleLahoreModels(inventory);
}

export async function getEligibleLahoreModel(slug: string) {
  const inventory = await resolveNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", service: "withDriver" });
  return findEligibleLahoreModel(inventory, slug);
}

export function publicLahoreOptionId(inventoryId: string) {
  return publicNormalRentalOptionId(inventoryId, "lahore");
}

export function toPublicLahoreInventory(inventory: NormalizedNormalRentalInventory[]): LahoreBookingInventory[] {
  return toPublicNormalRentalInventory(inventory);
}
