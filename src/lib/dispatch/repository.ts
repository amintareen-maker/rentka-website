import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { DISPATCH_COLLECTIONS } from "./collections";
import { firestoreSafePayload } from "./firestore-payload";
import type { AuditActor, DispatchDriver, DispatchVehicle, DispatchVendor } from "./types";

export const SHARED_ADMIN_ACTOR: AuditActor = { type: "shared_admin_session" };
const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value ? (value as { toDate(): Date }).toDate().toISOString() : String(value ?? "");
const record = <T extends { id: string; createdAt: string; updatedAt: string }>(doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...doc.data(), id: doc.id, createdAt: iso(doc.data().createdAt), updatedAt: iso(doc.data().updatedAt) }) as T;

export async function listDispatchVendors() { const snap = await getAdminDb().collection(DISPATCH_COLLECTIONS.vendors).orderBy("name").get(); return snap.docs.map((d) => record<DispatchVendor>(d)); }
export async function listDispatchVehicles() { const snap = await getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).orderBy("registrationNumber").get(); return snap.docs.map((d) => record<DispatchVehicle>(d)); }
export async function listDispatchDrivers() { const snap = await getAdminDb().collection(DISPATCH_COLLECTIONS.drivers).orderBy("name").get(); return snap.docs.map((d) => record<DispatchDriver>(d)); }

export async function getDispatchVendor(id: string) { const doc = await getAdminDb().collection(DISPATCH_COLLECTIONS.vendors).doc(id).get(); return doc.exists ? ({ ...doc.data(), id: doc.id, createdAt: iso(doc.data()?.createdAt), updatedAt: iso(doc.data()?.updatedAt) } as DispatchVendor) : null; }
export async function getDispatchVehicle(id: string) { const doc = await getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).doc(id).get(); return doc.exists ? ({ ...doc.data(), id: doc.id, createdAt: iso(doc.data()?.createdAt), updatedAt: iso(doc.data()?.updatedAt) } as DispatchVehicle) : null; }
export async function getDispatchDriver(id: string) { const doc = await getAdminDb().collection(DISPATCH_COLLECTIONS.drivers).doc(id).get(); return doc.exists ? ({ ...doc.data(), id: doc.id, createdAt: iso(doc.data()?.createdAt), updatedAt: iso(doc.data()?.updatedAt) } as DispatchDriver) : null; }

type VendorInput = Omit<DispatchVendor, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
type VehicleInput = Omit<DispatchVehicle, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
type DriverInput = Omit<DispatchDriver, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
const audit = { updatedAt: FieldValue.serverTimestamp(), updatedBy: SHARED_ADMIN_ACTOR };

export async function saveDispatchVendor(id: string | undefined, input: VendorInput) {
  const ref = id ? getAdminDb().collection(DISPATCH_COLLECTIONS.vendors).doc(id) : getAdminDb().collection(DISPATCH_COLLECTIONS.vendors).doc();
  const current = id ? await ref.get() : null;
  if (id && !current?.exists) throw new Error("Vendor not found.");
  const creation = current?.exists
    ? { createdAt: current.data()?.createdAt, createdBy: current.data()?.createdBy ?? SHARED_ADMIN_ACTOR }
    : { createdAt: FieldValue.serverTimestamp(), createdBy: SHARED_ADMIN_ACTOR };
  await ref.set(firestoreSafePayload({ ...input, ...creation, ...audit }));
  return ref.id;
}

async function requireVendor(vendorId: string, zoneIds: string[]) {
  const vendor = await getDispatchVendor(vendorId); if (!vendor) throw new Error("Select an existing dispatch vendor.");
  if (!zoneIds.every((zone) => vendor.zoneIds.includes(zone as never))) throw new Error("Every selected zone must also belong to the vendor.");
  return vendor;
}

export async function saveDispatchVehicle(id: string | undefined, input: VehicleInput) {
  await requireVendor(input.vendorId, input.zoneIds);
  const db = getAdminDb(); const collection = db.collection(DISPATCH_COLLECTIONS.vehicles); const ref = id ? collection.doc(id) : collection.doc();
  const current = id ? await ref.get() : null;
  if (id && !current?.exists) throw new Error("Vehicle not found.");
  const duplicate = await collection.where("registrationNumber", "==", input.registrationNumber).limit(2).get();
  if (duplicate.docs.some((doc) => doc.id !== ref.id)) throw new Error("A vehicle with this registration number already exists.");
  const creation = current?.exists
    ? { createdAt: current.data()?.createdAt, createdBy: current.data()?.createdBy ?? SHARED_ADMIN_ACTOR }
    : { createdAt: FieldValue.serverTimestamp(), createdBy: SHARED_ADMIN_ACTOR };
  await ref.set(firestoreSafePayload({ ...input, ...creation, ...audit }));
  return ref.id;
}

export async function saveDispatchDriver(id: string | undefined, input: DriverInput) {
  await requireVendor(input.vendorId, input.zoneIds);const eligibility=input.vehicleEligibility;if(eligibility?.mode==="specific_vehicles"){const ids=eligibility.vehicleIds??[];const docs=await Promise.all(ids.map(vehicleId=>getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).doc(vehicleId).get()));if(docs.some(doc=>!doc.exists||doc.data()?.vendorId!==input.vendorId))throw new Error("Every permitted vehicle must belong to the selected vendor.");}if(eligibility?.mode==="models_or_categories"){const vendorVehicles=await getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).where("vendorId","==",input.vendorId).get(),allowed=new Set(vendorVehicles.docs.flatMap(doc=>{const data=doc.data();return[`model:${String(data.make??"").trim()} ${String(data.model??"").trim()}`.toLowerCase(),`category:${String(data.category??"").trim()}`.toLowerCase()]}));if((eligibility.allowedModelsOrCategories??[]).some(value=>!allowed.has(value.toLowerCase())))throw new Error("Every permitted model/category must exist in the selected vendor fleet.");}
  const collection = getAdminDb().collection(DISPATCH_COLLECTIONS.drivers); const ref = id ? collection.doc(id) : collection.doc();
  const current = id ? await ref.get() : null;
  if (id && !current?.exists) throw new Error("Driver not found.");
  const creation = current?.exists
    ? { createdAt: current.data()?.createdAt, createdBy: current.data()?.createdBy ?? SHARED_ADMIN_ACTOR }
    : { createdAt: FieldValue.serverTimestamp(), createdBy: SHARED_ADMIN_ACTOR };
  await ref.set(firestoreSafePayload({ ...input, ...creation, ...audit }));
  return ref.id;
}

export async function vendorRelationshipCounts(vendorId: string) {
  const db = getAdminDb(); const [vehicles, drivers] = await Promise.all([db.collection(DISPATCH_COLLECTIONS.vehicles).where("vendorId", "==", vendorId).get(), db.collection(DISPATCH_COLLECTIONS.drivers).where("vendorId", "==", vendorId).get()]);
  return { vehicles: vehicles.size, drivers: drivers.size };
}
