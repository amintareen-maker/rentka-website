import "server-only";
import { createHash } from "node:crypto";

import { resolveNormalRentalInventory } from "./inventory-resolver";
import { findEligibleLahoreModel, groupEligibleLahoreModels } from "./public-models";
import type { LahoreBookingInventory, NormalizedNormalRentalInventory } from "./inventory-core";

export async function getEligibleLahoreModels() {
  const inventory = await resolveNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", service: "withDriver" });
  return groupEligibleLahoreModels(inventory);
}

export async function getEligibleLahoreModel(slug: string) {
  const inventory = await resolveNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", service: "withDriver" });
  return findEligibleLahoreModel(inventory, slug);
}

export function publicLahoreOptionId(inventoryId: string) {
  return createHash("sha256").update(`rentka-lahore:${inventoryId}`).digest("base64url").slice(0, 24);
}

export function toPublicLahoreInventory(inventory: NormalizedNormalRentalInventory[]): LahoreBookingInventory[] {
  return inventory.map((item) => ({
    inventoryId: publicLahoreOptionId(item.inventoryId), modelKey: item.modelKey, modelName: item.modelName,
    modelSlug: item.modelSlug, imageURL: item.imageURL, category: item.category,
    seatingCapacity: item.seatingCapacity, transmission: item.transmission, modelYear: item.modelYear,
    modelYearLabel: item.modelYearLabel, pricing: item.pricing,
  }));
}
