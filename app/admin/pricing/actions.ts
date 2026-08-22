"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";
import {
  createOperationsVendor, deleteOperationsInventory, isOperatingZone, loadOperations, normalizeModelKey,
  saveOperationsInventory, updateLegacyInventory, type RateSet,
} from "./_lib/operations";

function required(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value.trim();
}
function zone(form: FormData) {
  const value = required(form, "zoneId");
  if (!isOperatingZone(value)) throw new Error("Invalid operating zone.");
  return value;
}
function rates(form: FormData, prefix: string): RateSet {
  const result: RateSet = {};
  for (const duration of ["daily", "weekly", "monthly"] as const) {
    const raw = form.get(`${prefix}.${duration}`);
    if (raw === null || raw === "") continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 10_000_000) throw new Error(`Invalid ${prefix} ${duration} rate.`);
    result[duration] = value;
  }
  if (result.daily === undefined) throw new Error(`${prefix} daily rate is required.`);
  return result;
}
const done = (zoneId: string, message: string) => {
  revalidatePath("/admin/pricing");
  revalidatePath("/admin/pricing/inventory");
  redirect(`/admin/pricing/inventory?zone=${encodeURIComponent(zoneId)}&saved=${encodeURIComponent(message)}`);
};

export async function createVendor(form: FormData) {
  if (!(await hasAdminSession())) throw new Error("Unauthorized");
  const zoneId = zone(form);
  const name = required(form, "name");
  if (name.length > 120) throw new Error("Vendor name is too long.");
  const phoneValue = typeof form.get("phone") === "string" ? String(form.get("phone")).trim() : "";
  if (phoneValue.length > 40) throw new Error("Vendor phone is too long.");
  await createOperationsVendor(zoneId, name, phoneValue);
  done(zoneId, "Vendor created");
}

export async function saveInventory(form: FormData) {
  if (!(await hasAdminSession())) throw new Error("Unauthorized");
  const zoneId = zone(form);
  const source = required(form, "source");
  const idValue = typeof form.get("inventoryId") === "string" ? String(form.get("inventoryId")) : "";
  const withinCity = rates(form, "withinCity");
  const outsideCity = rates(form, "outsideCity");
  const active = form.get("active") === "on";

  if (source === "legacy") {
    if (zoneId !== "twin_cities" || !idValue) throw new Error("Invalid legacy inventory context.");
    await updateLegacyInventory({ id: idValue, active, withinCity, outsideCity });
    done(zoneId, "Existing inventory updated");
  }
  if (source !== "operations") throw new Error("Invalid inventory source.");

  const { models, vendors, inventory } = await loadOperations(zoneId);
  const modelKey = normalizeModelKey(required(form, "modelKey"));
  const vendorId = required(form, "vendorId");
  const model = models.find((item) => item.key === modelKey);
  const vendor = vendors.find((item) => item.id === vendorId);
  if (!model || !vendor || vendor.zoneId !== zoneId) throw new Error("Vehicle or vendor does not belong to the selected zone.");
  if (idValue && !inventory.some((item) => item.id === idValue && item.source === "operations")) throw new Error("Invalid inventory record.");
  const imageOverride = typeof form.get("imageOverride") === "string" ? String(form.get("imageOverride")).trim() : "";
  if (imageOverride && !/^https:\/\//i.test(imageOverride)) throw new Error("Image override must be an HTTPS URL.");
  const modelYearLabel = required(form, "modelYearLabel");
  if (modelYearLabel.length > 40 || /[\u0000-\u001f\u007f]/.test(modelYearLabel)) throw new Error("Invalid model year / year range.");
  const showAsSeparateCard = form.get("showAsSeparateCard") === "on";
  const publicLabel = typeof form.get("publicLabel") === "string" ? String(form.get("publicLabel")).trim() : "";
  if (publicLabel.length > 120 || /[\u0000-\u001f\u007f]/.test(publicLabel)) throw new Error("Invalid public vehicle label.");
  await saveOperationsInventory({ id: idValue || undefined, zoneId, model, vendor, active, withinCity, outsideCity, imageOverride, modelYearLabel, showAsSeparateCard, publicLabel });
  done(zoneId, idValue ? "Inventory updated" : "Inventory created");
}

export async function deleteInventory(form: FormData) {
  if (!(await hasAdminSession())) throw new Error("Unauthorized");
  const zoneId = zone(form);
  const source = required(form, "source");
  const id = required(form, "inventoryId");
  if (source !== "operations") throw new Error("Only zone inventory records can be deleted here.");
  await deleteOperationsInventory({ id, zoneId });
  done(zoneId, "Inventory deleted");
}
