import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent, sharedActor } from "./booking-core";
import { getOperationalBooking } from "./booking-repository";
import { DISPATCH_COLLECTIONS } from "./collections";
import { computeMatches } from "./matching-core";
import type { MatchOverride, ResourceReservation } from "./matching-types";
import { listDispatchDrivers, listDispatchVehicles, listDispatchVendors } from "./repository";

const BOOKINGS="operationalBookings";
const iso=(value:unknown)=>value&&typeof value==="object"&&"toDate" in value?(value as{toDate():Date}).toDate().toISOString():String(value??"");
async function listReservations():Promise<ResourceReservation[]>{const snap=await getAdminDb().collection(DISPATCH_COLLECTIONS.reservations).where("active","==",true).get();return snap.docs.map(doc=>{const data=doc.data();return{id:doc.id,bookingId:String(data.bookingId??""),...(data.vehicleId?{vehicleId:String(data.vehicleId)}:{}),...(data.driverId?{driverId:String(data.driverId)}:{}),startsAt:iso(data.startsAt),endsAt:iso(data.endsAt),active:data.active===true}})}
async function listOverrides(bookingDocumentId:string):Promise<MatchOverride[]>{const snap=await getAdminDb().collection(BOOKINGS).doc(bookingDocumentId).collection("matchingOverrides").get();return snap.docs.map(doc=>({candidateId:doc.id,mode:doc.data().mode as MatchOverride["mode"]})).filter(x=>x.mode==="include"||x.mode==="exclude")}
export async function findOperationalMatches(bookingDocumentId:string){const[booking,vendors,vehicles,drivers,reservations,overrides]=await Promise.all([getOperationalBooking(bookingDocumentId),listDispatchVendors(),listDispatchVehicles(),listDispatchDrivers(),listReservations(),listOverrides(bookingDocumentId)]);if(!booking)throw new Error("Operational booking not found.");return computeMatches({booking,vendors,vehicles,drivers,reservations,overrides})}
export async function setOperationalMatchOverride(bookingDocumentId:string,candidateId:string,mode:"include"|"exclude"){
 const[booking,vendors,vehicles,drivers,reservations]=await Promise.all([getOperationalBooking(bookingDocumentId),listDispatchVendors(),listDispatchVehicles(),listDispatchDrivers(),listReservations()]);if(!booking)throw new Error("Operational booking not found.");if(!/^[a-f0-9]{24}$/.test(candidateId))throw new Error("Select a valid matching candidate.");
 const baseline=computeMatches({booking,vendors,vehicles,drivers,reservations});if(!baseline.ready)throw new Error(baseline.unavailableReason??"This booking cannot be matched.");const candidate=baseline.eligible.find(x=>x.id===candidateId);if(!candidate)throw new Error("This candidate is subject to a safety or eligibility block and cannot be overridden.");
 const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(bookingDocumentId),overrideRef=bookingRef.collection("matchingOverrides").doc(candidateId),now=FieldValue.serverTimestamp();await db.runTransaction(async tx=>{const latest=await tx.get(bookingRef);if(!latest.exists||latest.data()?.lifecycle!=="active"||latest.data()?.readinessStatus!=="ready_for_dispatch")throw new Error("This booking is no longer Ready for Dispatch.");tx.set(overrideRef,{mode,candidateId,vendorId:candidate.vendor.id,vehicleId:candidate.vehicle.id,driverId:candidate.driver.id,updatedAt:now,updatedBy:sharedActor});tx.create(bookingRef.collection("events").doc(),auditEvent(mode==="include"?"match_override_included":"match_override_excluded",now,{candidateId,vendorId:candidate.vendor.id,vehicleId:candidate.vehicle.id,driverId:candidate.driver.id}))});
}
