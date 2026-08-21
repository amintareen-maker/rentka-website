import "server-only";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeNormalRentalInventory, type NormalizedNormalRentalInventory, type ResolverDocument } from "./inventory-core";
import { cityBelongsToNormalRentalZone, NORMAL_RENTAL_ZONES, type NormalRentalCityId, type NormalRentalZoneId } from "./zones";

export type ResolveNormalRentalInventoryInput = {
  zoneId: NormalRentalZoneId;
  cityId?: string;
  service?: "withDriver";
};

const documents = (snapshot: FirebaseFirestore.QuerySnapshot): ResolverDocument[] =>
  snapshot.docs.map((document) => ({ id: document.id, data: document.data() }));

export async function resolveNormalRentalInventory(input: ResolveNormalRentalInventoryInput): Promise<NormalizedNormalRentalInventory[]> {
  const zone = NORMAL_RENTAL_ZONES[input.zoneId];
  if (!zone) throw new Error("Unknown normal-rental zone.");
  if (input.service && input.service !== "withDriver") return [];
  const cityId = (input.cityId?.toLowerCase() || zone.defaultCityId) as NormalRentalCityId;
  if (!cityBelongsToNormalRentalZone(input.zoneId, cityId)) throw new Error("City does not belong to the selected normal-rental zone.");

  const db = getAdminDb();
  const carsRef = db.collection("countries").doc("PK").collection("cars");
  if (zone.inventorySource === "legacy") {
    const [cars, vendors] = await Promise.all([
      carsRef.get(),
      db.collection("countries").doc("PK").collection("vendors").get(),
    ]);
    return normalizeNormalRentalInventory({
      zoneId: input.zoneId, cityId, legacyCars: documents(cars), legacyVendors: documents(vendors),
      operationsInventory: [], operationsVendors: [],
    });
  }

  const [models, inventory, vendors] = await Promise.all([
    carsRef.get(),
    db.collection("normalRentalInventory").where("zoneId", "==", input.zoneId).get(),
    db.collection("normalRentalVendors").where("zoneId", "==", input.zoneId).get(),
  ]);
  return normalizeNormalRentalInventory({
    zoneId: input.zoneId, cityId, legacyCars: documents(models), legacyVendors: [],
    operationsInventory: documents(inventory), operationsVendors: documents(vendors),
  });
}
