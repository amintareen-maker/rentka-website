import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent, sharedActor } from "./booking-core";
import type { OperationalBooking } from "./booking-types";
import { createCustomerDriverDetailsProjection, resolveScheduleAt } from "./customer-driver-details-core";
import type { CustomerDriverDetailsMutation, CustomerDriverDetailsRecord } from "./customer-driver-details-types";

const BOOKINGS="operationalBookings",COLLECTION="customerDriverNotifications";
const iso=(value:unknown)=>value&&typeof value==="object"&&"toDate" in value?(value as{toDate():Date}).toDate().toISOString():String(value??"");
const record=(doc:FirebaseFirestore.DocumentSnapshot)=>{const data=doc.data()!;return{...data,id:doc.id,createdAt:iso(data.createdAt),updatedAt:iso(data.updatedAt),...(data.scheduledAt?{scheduledAt:iso(data.scheduledAt)}:{}),...(data.scheduleCancelledAt?{scheduleCancelledAt:iso(data.scheduleCancelledAt)}:{}),...(data.lastCopiedAt?{lastCopiedAt:iso(data.lastCopiedAt)}:{}),...(data.lastWhatsappOpenedAt?{lastWhatsappOpenedAt:iso(data.lastWhatsappOpenedAt)}:{}),...(data.sharedAt?{sharedAt:iso(data.sharedAt)}:{}),...(data.updateRequiredRecordedAt?{updateRequiredRecordedAt:iso(data.updateRequiredRecordedAt)}:{})} as CustomerDriverDetailsRecord};

export async function getCustomerDriverDetailsPanel(bookingOperationalId:string){
 const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(bookingOperationalId),[bookingSnap,recordsSnap]=await Promise.all([bookingRef.get(),bookingRef.collection(COLLECTION).get()]);if(!bookingSnap.exists)return null;
 const booking={...bookingSnap.data(),id:bookingSnap.id} as OperationalBooking,records=recordsSnap.docs.map(record),projection=createCustomerDriverDetailsProjection(booking,records);if(!projection)return null;
 return{projection,record:records.find(item=>item.assignmentId===projection.assignmentId)??null};
}

export async function mutateCustomerDriverDetails(bookingOperationalId:string,assignmentId:string,mutation:CustomerDriverDetailsMutation){
 const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(bookingOperationalId),recordRef=bookingRef.collection(COLLECTION).doc(assignmentId),recordsRef=bookingRef.collection(COLLECTION);
 return db.runTransaction(async tx=>{
  const[bookingSnap,currentSnap,recordsSnap]=await Promise.all([tx.get(bookingRef),tx.get(recordRef),tx.get(recordsRef)]);if(!bookingSnap.exists)throw new Error("Operational booking not found.");
  const booking={...bookingSnap.data(),id:bookingSnap.id} as OperationalBooking,records=recordsSnap.docs.map(record),projection=createCustomerDriverDetailsProjection(booking,records);if(!projection)throw new Error("Customer Driver Details require an active final assignment.");if(projection.assignmentId!==assignmentId)throw new Error("The assignment changed. Refresh before sharing customer details.");
  if(mutation.action==="whatsapp_opened"&&!projection.whatsappUrl)throw new Error("The customer does not have a valid WhatsApp number.");
  if((mutation.action==="whatsapp_opened"||mutation.action==="marked_shared")&&projection.missingFields.length)throw new Error(`Complete the missing customer-message data first: ${projection.missingFields.join(", ")}.`);
  const existing=currentSnap.exists?currentSnap.data() as CustomerDriverDetailsRecord:undefined,now=FieldValue.serverTimestamp(),base={bookingOperationalId,bookingId:projection.bookingId,assignmentId,driverId:projection.driverId,vehicleId:projection.vehicleId,createdAt:existing?.createdAt??now,createdBy:existing?.createdBy??sharedActor,updatedAt:now,updatedBy:sharedActor};
  if(projection.updatedDetailsRequired&&!existing?.updateRequiredRecordedAt){Object.assign(base,{updateRequiredRecordedAt:now});tx.create(bookingRef.collection("events").doc(),auditEvent("customer_driver_details_update_required",now,{assignmentId,previousSharedAssignmentId:projection.previousSharedAssignmentId}))}
  if(existing?.sharedAt&&mutation.action==="schedule")throw new Error("Current Driver details are already marked as shared.");
  if(mutation.action==="copied"){Object.assign(base,{lastCopiedAt:now,lastCopiedBy:sharedActor});tx.create(bookingRef.collection("events").doc(),auditEvent("customer_driver_details_copied",now,{assignmentId}))}
  if(mutation.action==="whatsapp_opened"){Object.assign(base,{lastWhatsappOpenedAt:now,lastWhatsappOpenedBy:sharedActor});tx.create(bookingRef.collection("events").doc(),auditEvent("customer_driver_details_whatsapp_opened",now,{assignmentId,status:"opened_not_confirmed_sent"}))}
  if(mutation.action==="marked_shared"&&!existing?.sharedAt){Object.assign(base,{sharedAt:now,sharedBy:sharedActor,scheduledAt:FieldValue.delete()});tx.create(bookingRef.collection("events").doc(),auditEvent("customer_driver_details_marked_shared",now,{assignmentId,status:"admin_confirmed_manual_share"}))}
  if(mutation.action==="schedule"){const scheduledAt=resolveScheduleAt(booking,mutation.scheduleMode??"",mutation.customSchedule),unchanged=!!existing?.scheduledAt&&iso(existing.scheduledAt)===scheduledAt&&existing.scheduleMode===mutation.scheduleMode;if(!unchanged){const event=existing?.scheduledAt?"customer_driver_details_schedule_changed":"customer_driver_details_scheduled";Object.assign(base,{scheduledAt:new Date(scheduledAt),scheduleMode:mutation.scheduleMode,scheduleCancelledAt:FieldValue.delete()});tx.create(bookingRef.collection("events").doc(),auditEvent(event,now,{assignmentId,scheduledAt,scheduleMode:mutation.scheduleMode,delivery:"manual_reminder_only"}))}}
  if(mutation.action==="cancel_schedule"){if(!existing?.scheduledAt)throw new Error("There is no active customer notification schedule.");Object.assign(base,{scheduledAt:FieldValue.delete(),scheduleMode:FieldValue.delete(),scheduleCancelledAt:now});tx.create(bookingRef.collection("events").doc(),auditEvent("customer_driver_details_schedule_cancelled",now,{assignmentId}))}
  tx.set(recordRef,base,{merge:true});return createCustomerDriverDetailsProjection(booking,[...records.filter(item=>item.assignmentId!==assignmentId),{...existing,...base,id:assignmentId} as unknown as CustomerDriverDetailsRecord])!;
 });
}

