import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { DISPATCH_COLLECTIONS } from "./collections";
import { firestoreSafePayload } from "./firestore-payload";
import { driverSetupClassification, requireVendorDriverChoice, type DriverSetupChoice } from "./driver-setup";
import type { AuditActor, DispatchDriver, DispatchProtectedDocument, DispatchVehicle, DispatchVendor, FulfillmentQuickAdd } from "./types";
import { assertDriverSupplyRelationship, assertIndependentOwnerDriverDesignation, assertVehicleControlRelationship, LEGACY_DRIVER_RELATIONSHIP, LEGACY_SUPPLY_CLASSIFICATION, LEGACY_VEHICLE_CONTROL, type DriverSupplyRelationship, type SupplyClassification, type VehicleControlRelationship } from "./supply-classification";
import { normalizeVehicleRegistration } from "./vendor-fulfillment-quick-add-core";

export const SHARED_ADMIN_ACTOR: AuditActor = { type: "shared_admin_session" };
const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value ? (value as { toDate(): Date }).toDate().toISOString() : String(value ?? "");
const supplyExtras = (data: FirebaseFirestore.DocumentData | undefined): { fulfillmentQuickAdd?: FulfillmentQuickAdd; documents?: DispatchProtectedDocument[] } => ({
  ...(data?.fulfillmentQuickAdd ? { fulfillmentQuickAdd: { ...data.fulfillmentQuickAdd, createdAt: iso(data.fulfillmentQuickAdd.createdAt) } as FulfillmentQuickAdd } : {}),
  ...(Array.isArray(data?.documents) ? { documents: data.documents.map((document: FirebaseFirestore.DocumentData) => ({ ...document, uploadedAt: iso(document.uploadedAt), ...(document.reviewedAt ? { reviewedAt: iso(document.reviewedAt) } : {}) }) as DispatchProtectedDocument) } : {}),
});
const record = <T extends { id: string; createdAt: string; updatedAt: string }>(doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...doc.data(), id: doc.id, createdAt: iso(doc.data().createdAt), updatedAt: iso(doc.data().updatedAt) }) as T;
const vendorRecord = (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...record<DispatchVendor>(doc), supplyClassification: doc.data().supplyClassification ?? LEGACY_SUPPLY_CLASSIFICATION });
const vehicleRecord = (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...record<DispatchVehicle>(doc), ...supplyExtras(doc.data()), controlRelationship: doc.data().controlRelationship ?? LEGACY_VEHICLE_CONTROL });
const driverRecord = (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...record<DispatchDriver>(doc), ...supplyExtras(doc.data()), supplyRelationship: doc.data().supplyRelationship ?? LEGACY_DRIVER_RELATIONSHIP });

export async function listDispatchVendors() { const snap = await getAdminDb().collection(DISPATCH_COLLECTIONS.vendors).orderBy("name").get(); return snap.docs.map(vendorRecord); }
export async function listDispatchVehicles() { const snap = await getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).orderBy("registrationNumber").get(); return snap.docs.map(vehicleRecord); }
export async function listDispatchDrivers() { const snap = await getAdminDb().collection(DISPATCH_COLLECTIONS.drivers).orderBy("name").get(); return snap.docs.map(driverRecord); }

export async function getDispatchVendor(id: string) { const doc = await getAdminDb().collection(DISPATCH_COLLECTIONS.vendors).doc(id).get(); return doc.exists ? ({ ...doc.data(), id: doc.id, supplyClassification: doc.data()?.supplyClassification ?? LEGACY_SUPPLY_CLASSIFICATION, createdAt: iso(doc.data()?.createdAt), updatedAt: iso(doc.data()?.updatedAt) } as DispatchVendor) : null; }
export async function getDispatchVehicle(id: string) { const doc = await getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).doc(id).get(); return doc.exists ? ({ ...doc.data(), ...supplyExtras(doc.data()), id: doc.id, controlRelationship: doc.data()?.controlRelationship ?? LEGACY_VEHICLE_CONTROL, createdAt: iso(doc.data()?.createdAt), updatedAt: iso(doc.data()?.updatedAt) } as DispatchVehicle) : null; }
export async function getDispatchDriver(id: string) { const doc = await getAdminDb().collection(DISPATCH_COLLECTIONS.drivers).doc(id).get(); return doc.exists ? ({ ...doc.data(), ...supplyExtras(doc.data()), id: doc.id, supplyRelationship: doc.data()?.supplyRelationship ?? LEGACY_DRIVER_RELATIONSHIP, createdAt: iso(doc.data()?.createdAt), updatedAt: iso(doc.data()?.updatedAt) } as DispatchDriver) : null; }

type VendorInput = Omit<DispatchVendor, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
type VehicleInput = Omit<DispatchVehicle, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
type DriverInput = Omit<DispatchDriver, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
const audit = { updatedAt: FieldValue.serverTimestamp(), updatedBy: SHARED_ADMIN_ACTOR };

export async function saveDispatchVendor(id: string | undefined, input: VendorInput) {
  const db = getAdminDb(); const ref = id ? db.collection(DISPATCH_COLLECTIONS.vendors).doc(id) : db.collection(DISPATCH_COLLECTIONS.vendors).doc();
  const current = id ? await ref.get() : null; if (id && !current?.exists) throw new Error("Vendor not found.");
  const [drivers, vehicles] = id ? await Promise.all([db.collection(DISPATCH_COLLECTIONS.drivers).where("vendorId", "==", id).get(), db.collection(DISPATCH_COLLECTIONS.vehicles).where("vendorId", "==", id).get()]) : [{ docs: [] }, { docs: [] }];
  for (const driver of drivers.docs) assertDriverSupplyRelationship(input.supplyClassification, (driver.data().supplyRelationship ?? LEGACY_DRIVER_RELATIONSHIP) as DriverSupplyRelationship);
  for (const vehicle of vehicles.docs) assertVehicleControlRelationship(input.supplyClassification, (vehicle.data().controlRelationship ?? LEGACY_VEHICLE_CONTROL) as VehicleControlRelationship);
  const designatedDriver = input.independentOwnerDriverId ? await db.collection(DISPATCH_COLLECTIONS.drivers).doc(input.independentOwnerDriverId).get() : null;
  assertIndependentOwnerDriverDesignation(input.supplyClassification, ref.id, input.independentOwnerDriverId, designatedDriver?.exists ? ({ id: designatedDriver.id, ...designatedDriver.data() } as DispatchDriver) : null);
  const creation = current?.exists ? { createdAt: current.data()?.createdAt, createdBy: current.data()?.createdBy ?? SHARED_ADMIN_ACTOR } : { createdAt: FieldValue.serverTimestamp(), createdBy: SHARED_ADMIN_ACTOR };
  await db.runTransaction(async (tx) => { const latest = await tx.get(ref); if (id && !latest.exists) throw new Error("Vendor not found."); tx.set(ref, firestoreSafePayload({ ...input, ...creation, ...audit })); const before = (latest.data()?.supplyClassification ?? LEGACY_SUPPLY_CLASSIFICATION) as SupplyClassification; if (before !== input.supplyClassification) tx.create(ref.collection("events").doc(), { type: "supply_classification_changed", timestamp: FieldValue.serverTimestamp(), actor: SHARED_ADMIN_ACTOR, metadata: { from: before, to: input.supplyClassification } }); const beforeDesignation = String(latest.data()?.independentOwnerDriverId ?? ""); const afterDesignation = input.independentOwnerDriverId ?? ""; if (beforeDesignation !== afterDesignation) tx.create(ref.collection("events").doc(), { type: "independent_owner_driver_designation_changed", timestamp: FieldValue.serverTimestamp(), actor: SHARED_ADMIN_ACTOR, metadata: { from: beforeDesignation || null, to: afterDesignation || null } }); });
  return ref.id;
}

async function requireVendor(vendorId: string, zoneIds: string[]) { const vendor = await getDispatchVendor(vendorId); if (!vendor) throw new Error("Select an existing dispatch vendor."); if (!zoneIds.every((zone) => vendor.zoneIds.includes(zone as never))) throw new Error("Every selected zone must also belong to the vendor."); return vendor; }

export async function saveDispatchVehicle(id: string | undefined, input: VehicleInput) {
  const vendor = await requireVendor(input.vendorId, input.zoneIds); assertVehicleControlRelationship(vendor.supplyClassification, input.controlRelationship);
  const db = getAdminDb(); const collection = db.collection(DISPATCH_COLLECTIONS.vehicles); const ref = id ? collection.doc(id) : collection.doc(); const current = id ? await ref.get() : null;
  if (id && !current?.exists) throw new Error("Vehicle not found."); const duplicate = await collection.where("registrationNumber", "==", input.registrationNumber).limit(2).get(); if (duplicate.docs.some((doc) => doc.id !== ref.id)) throw new Error("A vehicle with this registration number already exists.");
  const creation = current?.exists ? { createdAt: current.data()?.createdAt, createdBy: current.data()?.createdBy ?? SHARED_ADMIN_ACTOR } : { createdAt: FieldValue.serverTimestamp(), createdBy: SHARED_ADMIN_ACTOR };
  await db.runTransaction(async (tx) => { const latest = await tx.get(ref); if (id && !latest.exists) throw new Error("Vehicle not found."); const preserved=latest.exists?{...(latest.data()?.documents?{documents:latest.data()?.documents}:{}),...(latest.data()?.fulfillmentQuickAdd?{fulfillmentQuickAdd:latest.data()?.fulfillmentQuickAdd}:{})}:{};tx.set(ref, firestoreSafePayload({ ...input,registrationNumberNormalized:normalizeVehicleRegistration(input.registrationNumber),...preserved, ...creation, ...audit })); const before = (latest.data()?.controlRelationship ?? LEGACY_VEHICLE_CONTROL) as VehicleControlRelationship; if (latest.exists && before !== input.controlRelationship) tx.create(ref.collection("events").doc(), { type: "vehicle_control_relationship_changed", timestamp: FieldValue.serverTimestamp(), actor: SHARED_ADMIN_ACTOR, metadata: { from: before, to: input.controlRelationship } }); }); return ref.id;
}

export async function saveDispatchDriver(id: string | undefined, input: DriverInput) {
  const vendor = await requireVendor(input.vendorId, input.zoneIds); assertDriverSupplyRelationship(vendor.supplyClassification, input.supplyRelationship); const eligibility = input.vehicleEligibility;
  if (eligibility?.mode === "specific_vehicles") { const ids = eligibility.vehicleIds ?? []; const docs = await Promise.all(ids.map((vehicleId) => getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).doc(vehicleId).get())); if (docs.some((doc) => !doc.exists || doc.data()?.vendorId !== input.vendorId)) throw new Error("Every permitted vehicle must belong to the selected vendor."); }
  if (eligibility?.mode === "models_or_categories") { const vendorVehicles = await getAdminDb().collection(DISPATCH_COLLECTIONS.vehicles).where("vendorId", "==", input.vendorId).get(); const allowed = new Set(vendorVehicles.docs.flatMap((doc) => { const data = doc.data(); return [`model:${String(data.make ?? "").trim()} ${String(data.model ?? "").trim()}`.toLowerCase(), `category:${String(data.category ?? "").trim()}`.toLowerCase()]; })); if ((eligibility.allowedModelsOrCategories ?? []).some((value) => !allowed.has(value.toLowerCase()))) throw new Error("Every permitted model/category must exist in the selected vendor fleet."); }
  const collection = getAdminDb().collection(DISPATCH_COLLECTIONS.drivers); const ref = id ? collection.doc(id) : collection.doc(); const current = id ? await ref.get() : null; if (id && !current?.exists) throw new Error("Driver not found.");
  const creation = current?.exists ? { createdAt: current.data()?.createdAt, createdBy: current.data()?.createdBy ?? SHARED_ADMIN_ACTOR } : { createdAt: FieldValue.serverTimestamp(), createdBy: SHARED_ADMIN_ACTOR };
  await getAdminDb().runTransaction(async (tx) => { const latest = await tx.get(ref); if (id && !latest.exists) throw new Error("Driver not found."); const preserved=latest.exists?{...(latest.data()?.documents?{documents:latest.data()?.documents}:{}),...(latest.data()?.fulfillmentQuickAdd?{fulfillmentQuickAdd:latest.data()?.fulfillmentQuickAdd}:{})}:{};tx.set(ref, firestoreSafePayload({ ...input,...preserved, ...creation, ...audit })); const before = (latest.data()?.supplyRelationship ?? LEGACY_DRIVER_RELATIONSHIP) as DriverSupplyRelationship; if (latest.exists && before !== input.supplyRelationship) tx.create(ref.collection("events").doc(), { type: "driver_supply_relationship_changed", timestamp: FieldValue.serverTimestamp(), actor: SHARED_ADMIN_ACTOR, metadata: { from: before, to: input.supplyRelationship } }); }); return ref.id;
}

export async function vendorRelationshipCounts(vendorId: string) { const db = getAdminDb(); const [vehicles, drivers] = await Promise.all([db.collection(DISPATCH_COLLECTIONS.vehicles).where("vendorId", "==", vendorId).get(), db.collection(DISPATCH_COLLECTIONS.drivers).where("vendorId", "==", vendorId).get()]); return { vehicles: vehicles.size, drivers: drivers.size }; }

export async function completeDispatchVendorDriverSetup(vendorId: string, choice: DriverSetupChoice, selectedDriverId?: string) {
  if (!vendorId) throw new Error("Supply account is required.");
  const db = getAdminDb(), vendorRef = db.collection(DISPATCH_COLLECTIONS.vendors).doc(vendorId);
  return db.runTransaction(async (tx) => {
    const [vendorSnap, driversSnap, vehiclesSnap] = await Promise.all([
      tx.get(vendorRef),
      tx.get(db.collection(DISPATCH_COLLECTIONS.drivers).where("vendorId", "==", vendorId)),
      tx.get(db.collection(DISPATCH_COLLECTIONS.vehicles).where("vendorId", "==", vendorId)),
    ]);
    if (!vendorSnap.exists) throw new Error("Supply account was not found.");
    const vendor = { id: vendorSnap.id, ...vendorSnap.data() } as DispatchVendor,
      drivers = driversSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), supplyRelationship: doc.data().supplyRelationship ?? LEGACY_DRIVER_RELATIONSHIP } as DispatchDriver)),
      vehicles = vehiclesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), controlRelationship: doc.data().controlRelationship ?? LEGACY_VEHICLE_CONTROL } as DispatchVehicle)),
      classification = driverSetupClassification(choice),
      now = FieldValue.serverTimestamp();

    requireVendorDriverChoice(choice, vendorId, selectedDriverId, drivers);
    const conflictingDrivers = drivers.filter((driver) => driver.supplyRelationship !== "unknown_needs_review" && driver.supplyRelationship !== classification);
    const targetVehicleControl = choice === "self" ? "independent_controlled" : "vendor_managed";
    const conflictingVehicles = vehicles.filter((vehicle) => vehicle.controlRelationship !== "unknown_needs_review" && (choice === "self" ? vehicle.controlRelationship !== targetVehicleControl : vehicle.controlRelationship !== "vendor_owned" && vehicle.controlRelationship !== "vendor_managed"));
    if (conflictingDrivers.length || conflictingVehicles.length)
      throw new Error("Existing driver or vehicle relationships conflict with this choice. Review those records before changing driver setup.");

    let effectiveDriverId = selectedDriverId;
    if (choice === "self") {
      const designated = drivers.find((driver) => driver.id === vendor.independentOwnerDriverId),
        matching = drivers.filter((driver) => driver.mobileNumberNormalized === vendor.primaryPhoneNormalized || driver.whatsappNumberNormalized === vendor.whatsappNumberNormalized);
      if (!designated && matching.length > 1) throw new Error("More than one driver matches the owner profile. Review the driver records first.");
      const existingOwner = designated ?? matching[0];
      const ownerRef = existingOwner ? db.collection(DISPATCH_COLLECTIONS.drivers).doc(existingOwner.id) : db.collection(DISPATCH_COLLECTIONS.drivers).doc();
      effectiveDriverId = ownerRef.id;
      if (existingOwner) {
        tx.set(ownerRef, { supplyRelationship: "independent_owner_driver", updatedAt: now, updatedBy: SHARED_ADMIN_ACTOR }, { merge: true });
      } else {
        tx.create(ownerRef, firestoreSafePayload({
          name: vendor.contactName?.trim() || vendor.name,
          mobileNumber: vendor.primaryPhone,
          mobileNumberNormalized: vendor.primaryPhoneNormalized,
          whatsappNumber: vendor.whatsappNumber,
          whatsappNumberNormalized: vendor.whatsappNumberNormalized,
          vendorId,
          supplyRelationship: "independent_owner_driver",
          zoneIds: vendor.zoneIds,
          priority: vendor.priority,
          status: "available",
          active: true,
          documentation: { cnicVerificationState: "unknown", licenceState: "unknown" },
          createdAt: now,
          createdBy: SHARED_ADMIN_ACTOR,
          updatedAt: now,
          updatedBy: SHARED_ADMIN_ACTOR,
        }));
      }
    } else {
      tx.set(db.collection(DISPATCH_COLLECTIONS.drivers).doc(effectiveDriverId!), { supplyRelationship: "vendor_managed", updatedAt: now, updatedBy: SHARED_ADMIN_ACTOR }, { merge: true });
    }
    for (const vehicle of vehicles.filter((item) => item.controlRelationship === "unknown_needs_review"))
      tx.set(db.collection(DISPATCH_COLLECTIONS.vehicles).doc(vehicle.id), { controlRelationship: targetVehicleControl, updatedAt: now, updatedBy: SHARED_ADMIN_ACTOR }, { merge: true });
    tx.set(vendorRef, {
      supplyClassification: classification,
      independentOwnerDriverId: choice === "self" ? effectiveDriverId : FieldValue.delete(),
      updatedAt: now,
      updatedBy: SHARED_ADMIN_ACTOR,
    }, { merge: true });
    tx.create(vendorRef.collection("events").doc(), {
      type: "driver_setup_completed",
      timestamp: now,
      actor: SHARED_ADMIN_ACTOR,
      metadata: { choice, classification, driverId: effectiveDriverId ?? null },
    });
    return { choice, classification, driverId: effectiveDriverId! };
  });
}
