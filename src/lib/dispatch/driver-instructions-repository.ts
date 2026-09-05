import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent, sharedActor } from "./booking-core";
import type { OperationalBooking } from "./booking-types";
import { createDriverInstructionsProjection } from "./driver-instructions-core";
import type { DriverInstructionAction, DriverInstructionRecord } from "./driver-instructions-types";

const BOOKINGS="operationalBookings",INSTRUCTIONS="driverInstructions";
const iso=(value:unknown)=>value&&typeof value==="object"&&"toDate" in value?(value as{toDate():Date}).toDate().toISOString():String(value??"");
const record=(doc:FirebaseFirestore.DocumentSnapshot)=>{const data=doc.data()!;return{...data,id:doc.id,createdAt:iso(data.createdAt),updatedAt:iso(data.updatedAt),...(data.lastCopiedAt?{lastCopiedAt:iso(data.lastCopiedAt)}:{}),...(data.lastWhatsappOpenedAt?{lastWhatsappOpenedAt:iso(data.lastWhatsappOpenedAt)}:{}),...(data.sharedAt?{sharedAt:iso(data.sharedAt)}:{})} as DriverInstructionRecord};

export async function getDriverInstructionsPanel(bookingOperationalId:string){
 const db=getAdminDb(),bookingSnap=await db.collection(BOOKINGS).doc(bookingOperationalId).get();if(!bookingSnap.exists)return null;
 const booking={...bookingSnap.data(),id:bookingSnap.id} as OperationalBooking,projection=createDriverInstructionsProjection(booking);if(!projection)return null;
 const instructionSnap=await bookingSnap.ref.collection(INSTRUCTIONS).doc(projection.assignmentId).get();
 return{projection,record:instructionSnap.exists?record(instructionSnap):null};
}

export async function mutateDriverInstructions(bookingOperationalId:string,assignmentId:string,action:DriverInstructionAction){
 const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(bookingOperationalId),instructionRef=bookingRef.collection(INSTRUCTIONS).doc(assignmentId);
 return db.runTransaction(async tx=>{
  const[bookingSnap,instructionSnap]=await Promise.all([tx.get(bookingRef),tx.get(instructionRef)]);if(!bookingSnap.exists)throw new Error("Operational booking not found.");
  const booking={...bookingSnap.data(),id:bookingSnap.id} as OperationalBooking,projection=createDriverInstructionsProjection(booking);if(!projection)throw new Error("Driver Instructions require an active final assignment.");if(projection.assignmentId!==assignmentId)throw new Error("The assignment changed. Refresh before sharing Driver Instructions.");
  if(action==="whatsapp_opened"&&!projection.whatsappUrl)throw new Error("The assigned Driver does not have a valid WhatsApp number.");
  const existing=instructionSnap.exists?instructionSnap.data() as DriverInstructionRecord:undefined,now=FieldValue.serverTimestamp(),base={bookingOperationalId,bookingId:projection.bookingId,assignmentId,driverId:projection.driverId,vehicleId:projection.vehicleId,createdAt:existing?.createdAt??now,createdBy:existing?.createdBy??sharedActor,updatedAt:now,updatedBy:sharedActor};
  if(action==="copied"){Object.assign(base,{lastCopiedAt:now,lastCopiedBy:sharedActor});tx.create(bookingRef.collection("events").doc(),auditEvent("driver_instructions_copied",now,{assignmentId,driverId:projection.driverId,vehicleId:projection.vehicleId}))}
  if(action==="whatsapp_opened"){Object.assign(base,{lastWhatsappOpenedAt:now,lastWhatsappOpenedBy:sharedActor});tx.create(bookingRef.collection("events").doc(),auditEvent("driver_instructions_whatsapp_opened",now,{assignmentId,driverId:projection.driverId,vehicleId:projection.vehicleId,status:"opened_not_confirmed_sent"}))}
  if(action==="marked_shared"&&!existing?.sharedAt){Object.assign(base,{sharedAt:now,sharedBy:sharedActor});tx.create(bookingRef.collection("events").doc(),auditEvent("driver_instructions_marked_shared",now,{assignmentId,driverId:projection.driverId,vehicleId:projection.vehicleId,status:"admin_confirmed_manual_share"}))}
  tx.set(instructionRef,base,{merge:true});return projection;
 });
}
