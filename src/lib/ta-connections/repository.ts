import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { TA_FIRESTORE_COLLECTIONS } from "./storage";
import type { TaActor, TaAirport, TaContractRateSet } from "./types";
import type { TaBooking } from "./types";
import type { ParsedRateSet } from "./validation";

const actor: TaActor = { role: "RENTKA_ADMIN", displayName: "Authenticated RentKA admin" };
const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value ? (value as { toDate(): Date }).toDate().toISOString() : String(value ?? "");

export async function listTaAirports(): Promise<TaAirport[]> {
  const snapshot = await getAdminDb().collection(TA_FIRESTORE_COLLECTIONS.airports).orderBy("code").get();
  return snapshot.docs.map((doc) => ({ ...(doc.data() as TaAirport), id: doc.id, createdAt: iso(doc.data().createdAt), updatedAt: iso(doc.data().updatedAt) }));
}

export async function saveTaAirport(id: string | undefined, input: Omit<TaAirport, "id" | "createdAt" | "updatedAt">) {
  const collection = getAdminDb().collection(TA_FIRESTORE_COLLECTIONS.airports);
  if (id) {
    const ref = collection.doc(id);
    if (!(await ref.get()).exists) throw new Error("Airport not found.");
    await ref.update({ ...input, updatedAt: FieldValue.serverTimestamp() });
    return;
  }
  const duplicate = await collection.where("code", "==", input.code).limit(1).get();
  if (!duplicate.empty) throw new Error("An airport with that IATA code already exists.");
  await collection.add({ ...input, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
}

export async function listTaRateSets(): Promise<TaContractRateSet[]> {
  const snapshot = await getAdminDb().collection(TA_FIRESTORE_COLLECTIONS.rateSets).orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ ...(doc.data() as TaContractRateSet), id: doc.id, createdAt: iso(doc.data().createdAt), updatedAt: iso(doc.data().updatedAt), effectiveTo: doc.data().effectiveTo ? iso(doc.data().effectiveTo) : undefined }));
}

export async function getActiveTaContract(airportId: string) {
  const snapshot = await getAdminDb().collection(TA_FIRESTORE_COLLECTIONS.rateSets).where("airportId", "==", airportId).get();
  return snapshot.docs.find((doc) => doc.data().active === true) ? (() => { const doc = snapshot.docs.find((item) => item.data().active === true)!; return { ...(doc.data() as TaContractRateSet), id: doc.id, createdAt: iso(doc.data().createdAt), updatedAt: iso(doc.data().updatedAt) }; })() : null;
}

export async function getActiveTaAirport(id: string) {
  const doc = await getAdminDb().collection(TA_FIRESTORE_COLLECTIONS.airports).doc(id).get();
  return doc.exists && doc.data()?.active === true ? { ...(doc.data() as TaAirport), id: doc.id, createdAt: iso(doc.data()?.createdAt), updatedAt: iso(doc.data()?.updatedAt) } : null;
}

export async function listTaBookings(): Promise<TaBooking[]> {
  const snapshot = await getAdminDb().collection(TA_FIRESTORE_COLLECTIONS.bookings).orderBy("createdAt", "desc").limit(100).get();
  return snapshot.docs.map((doc) => ({ ...(doc.data() as TaBooking), bookingId: doc.id, createdAt: iso(doc.data().createdAt) }));
}

export async function createVersionedRateSet(input: ParsedRateSet, currency: string) {
  const db = getAdminDb();
  const collection = db.collection(TA_FIRESTORE_COLLECTIONS.rateSets);
  await db.runTransaction(async (transaction) => {
    const currentQuery = collection.where("airportId", "==", input.airportId);
    const current = await transaction.get(currentQuery);
    const now = FieldValue.serverTimestamp();
    current.docs.filter((doc) => doc.data().active === true).forEach((doc) => transaction.update(doc.ref, { active: false, effectiveTo: input.effectiveFrom, updatedAt: now, updatedBy: actor }));
    const version = `${input.effectiveFrom}-v${current.size + 1}-${Date.now().toString(36)}`;
    transaction.create(collection.doc(), { ...input, version, currency, active: true, over50KmBillingMode: "EXACT_DISTANCE_ROUND_MINOR", createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor });
  });
}
