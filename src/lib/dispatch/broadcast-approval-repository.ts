import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent,sharedActor } from "./booking-core";
import type { OperationalBooking } from "./booking-types";
import { assertBroadcastBookingCurrent,selectBroadcastRecipients } from "./broadcast-approval-core";
import { buildApprovedBroadcast,buildOutboundMessageJob } from "./dispatch-orchestration-core";
import { dispatchOfferId,createDriverOfferProjection } from "./offer-core";
import { computeMatches } from "./matching-core";
import type { MatchOverride,ResourceReservation } from "./matching-types";
import type { DispatchOfferRecord } from "./offer-types";
import type { DispatchDriver,DispatchVehicle,DispatchVendor } from "./types";
import { DISPATCH_COLLECTIONS } from "./collections";

const BOOKINGS="operationalBookings",OFFERS="dispatchOffers",BROADCASTS="dispatchBroadcasts",CONTROL="dispatchBroadcastControl",OUTBOX="whatsappOutboundMessages";
const resource=<T>(doc:FirebaseFirestore.QueryDocumentSnapshot|FirebaseFirestore.DocumentSnapshot)=>({...doc.data(),id:doc.id}) as T;
const iso=(value:unknown)=>value&&typeof value==="object"&&"toDate" in value?(value as{toDate():Date}).toDate().toISOString():String(value??"");
const reservation=(doc:FirebaseFirestore.QueryDocumentSnapshot):ResourceReservation=>{const data=doc.data();return{id:doc.id,bookingId:String(data.bookingId??""),...(data.vehicleId?{vehicleId:String(data.vehicleId)}:{}),...(data.driverId?{driverId:String(data.driverId)}:{}),startsAt:iso(data.startsAt),endsAt:iso(data.endsAt),active:data.active===true}};
export type ApproveBroadcastRequest={bookingOperationalId:string;candidateIds:string[];offerExpiresAt:string;payoutSnapshotMinor:number;expectedCurrentRevision:number};

export async function getDispatchBroadcastPanel(bookingOperationalId:string){const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(bookingOperationalId),[control,broadcasts]=await Promise.all([bookingRef.collection(CONTROL).doc("current").get(),bookingRef.collection(BROADCASTS).orderBy("revision","desc").limit(5).get()]);return{currentRevision:Number(control.data()?.revision??0),activeBroadcastId:String(control.data()?.activeBroadcastId??""),defaultOfferExpiresAt:new Date(Date.now()+30*60000).toISOString(),broadcasts:broadcasts.docs.map(doc=>({...doc.data(),id:doc.id}))}}

export async function approveDispatchBroadcast(request:ApproveBroadcastRequest){
 const expiry=new Date(request.offerExpiresAt);if(Number.isNaN(expiry.getTime())||expiry.getTime()<=Date.now())throw new Error("Offer expiry must be in the future.");
 const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(request.bookingOperationalId),controlRef=bookingRef.collection(CONTROL).doc("current");
 return db.runTransaction(async tx=>{
  const[bookingSnap,controlSnap,vendorsSnap,driversSnap,vehiclesSnap,reservationsSnap,overridesSnap]=await Promise.all([tx.get(bookingRef),tx.get(controlRef),tx.get(db.collection(DISPATCH_COLLECTIONS.vendors)),tx.get(db.collection(DISPATCH_COLLECTIONS.drivers)),tx.get(db.collection(DISPATCH_COLLECTIONS.vehicles)),tx.get(db.collection(DISPATCH_COLLECTIONS.reservations).where("active","==",true)),tx.get(bookingRef.collection("matchingOverrides"))]);
  if(!bookingSnap.exists)throw new Error("Operational booking not found.");const booking=assertBroadcastBookingCurrent(resource<OperationalBooking>(bookingSnap),request.payoutSnapshotMinor),currentRevision=Number(controlSnap.data()?.revision??0),revision=request.expectedCurrentRevision+1;
  const matches=computeMatches({booking,vendors:vendorsSnap.docs.map(doc=>resource<DispatchVendor>(doc)),drivers:driversSnap.docs.map(doc=>resource<DispatchDriver>(doc)),vehicles:vehiclesSnap.docs.map(doc=>resource<DispatchVehicle>(doc)),reservations:reservationsSnap.docs.map(reservation),overrides:overridesSnap.docs.map(doc=>({candidateId:doc.id,mode:doc.data().mode} as MatchOverride))});
  if(!matches.ready)throw new Error("Booking changed. Refresh Smart Matching before approving.");const selected=selectBroadcastRecipients(request.candidateIds,matches.eligible),offerIds=selected.map(candidate=>dispatchOfferId(booking.id,candidate.id)),approvedAt=new Date().toISOString(),broadcast=buildApprovedBroadcast({bookingOperationalId:booking.id,bookingId:booking.bookingId,revision,offerRevision:revision,candidateIds:selected.map(candidate=>candidate.id),offerIds,driverIds:selected.map(candidate=>candidate.driver.id),approvedPayoutMinor:request.payoutSnapshotMinor,offerExpiresAt:request.offerExpiresAt,approvedAt,approvedBy:sharedActor}),broadcastRef=bookingRef.collection(BROADCASTS).doc(broadcast.id);
  const existingBroadcast=await tx.get(broadcastRef);if(existingBroadcast.exists)return{broadcastId:broadcast.id,revision:Number(existingBroadcast.data()?.revision??revision),queuedCount:selected.length,duplicate:true};
  if(currentRevision!==request.expectedCurrentRevision)throw new Error("Booking changed. Refresh Smart Matching before approving.");
  const drivers=new Map(driversSnap.docs.map(doc=>[doc.id,resource<DispatchDriver>(doc)])),offerRefs=offerIds.map(id=>bookingRef.collection(OFFERS).doc(id)),jobs=selected.map((candidate,index)=>buildOutboundMessageJob({purpose:"driver_offer",bookingOperationalId:booking.id,bookingId:booking.bookingId,broadcastId:broadcast.id,offerId:offerIds[index],recipientType:"driver",recipientReferenceId:candidate.driver.id,provider:"dualhook",messageKind:"template",createdAt:approvedAt})),jobRefs=jobs.map(job=>db.collection(OUTBOX).doc(job.id)),[offerSnaps,jobSnaps]=await Promise.all([Promise.all(offerRefs.map(ref=>tx.get(ref))),Promise.all(jobRefs.map(ref=>tx.get(ref)))]);
  const previousId=String(controlSnap.data()?.activeBroadcastId??"");if(previousId){const previousRef=bookingRef.collection(BROADCASTS).doc(previousId),previous=await tx.get(previousRef);if(previous.exists&&!["closed","cancelled"].includes(String(previous.data()?.status)))tx.update(previousRef,{status:"closed",closeReason:"superseded",updatedAt:approvedAt})}
  tx.create(broadcastRef,broadcast);tx.set(controlRef,{activeBroadcastId:broadcast.id,revision,offerRevision:revision,updatedAt:approvedAt,updatedBy:sharedActor});
  selected.forEach((candidate,index)=>{const driver=drivers.get(candidate.driver.id);if(!driver)throw new Error("A selected Driver no longer exists.");const projection=createDriverOfferProjection({booking,candidate,driver}),existing=offerSnaps[index].exists?offerSnaps[index].data() as DispatchOfferRecord:undefined,now=FieldValue.serverTimestamp(),base={bookingOperationalId:booking.id,bookingId:booking.bookingId,vendorId:candidate.vendor.id,driverId:candidate.driver.id,vehicleId:candidate.vehicle.id,candidateId:candidate.id,vehicleRegistration:candidate.vehicle.registrationNumber,driverName:candidate.driver.name,vendorName:candidate.vendor.name,driverWhatsappNumber:projection.driverWhatsappNumber,approvedPayoutMinor:request.payoutSnapshotMinor,offerStage:existing?.offerStage??"prepared",responseStatus:existing?.responseStatus??"not_recorded",createdAt:existing?.createdAt??now,createdBy:existing?.createdBy??sharedActor,updatedAt:now,updatedBy:sharedActor,broadcastId:broadcast.id,offerRevision:revision,offerExpiresAt:request.offerExpiresAt,notificationStatus:"queued",outboundMessageId:jobs[index].id};tx.set(offerRefs[index],base,{merge:true});if(!jobSnaps[index].exists)tx.create(jobRefs[index],{...jobs[index],status:"queued",queuedAt:approvedAt})});
  tx.create(bookingRef.collection("events").doc(),auditEvent("driver_broadcast_approved" as never,FieldValue.serverTimestamp(),{broadcastId:broadcast.id,revision,selectedRecipientCount:selected.length,candidateIds:broadcast.candidateIds,offerIds:broadcast.offerIds,approvedPayoutMinor:broadcast.approvedPayoutMinor,offerExpiresAt:broadcast.offerExpiresAt}));
  return{broadcastId:broadcast.id,revision,queuedCount:selected.length,duplicate:false};
 });
}
