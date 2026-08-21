import type { NormalizedNormalRentalInventory } from "./inventory-core";

export type PublicLahoreModel = {
  modelSlug: string;
  modelName: string;
  inventory: NormalizedNormalRentalInventory[];
};

export function groupEligibleLahoreModels(inventory: NormalizedNormalRentalInventory[]): PublicLahoreModel[] {
  const grouped = new Map<string, NormalizedNormalRentalInventory[]>();
  for (const item of inventory) {
    if (item.zoneId !== "lahore" || item.cityId !== "lahore" || !item.active || !item.modelSlug) continue;
    const options = grouped.get(item.modelSlug) ?? [];
    options.push(item);
    grouped.set(item.modelSlug, options);
  }
  return [...grouped.entries()]
    .map(([modelSlug, options]) => ({ modelSlug, modelName: options[0].modelName, inventory: options }))
    .sort((a, b) => a.modelName.localeCompare(b.modelName));
}

export function findEligibleLahoreModel(inventory: NormalizedNormalRentalInventory[], slug: string) {
  return groupEligibleLahoreModels(inventory).find((model) => model.modelSlug === slug);
}
