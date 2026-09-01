import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { assignmentSnapshots, validateAssignmentSelection, type AssignmentSelection } from "./assignment-core";
import type { DispatchAssignment } from "./assignment-types";
import { auditEvent, sharedActor } from "./booking-core";
import type { OperationalBooking } from "./booking-types";
import { DISPATCH_COLLECTIONS } from "./collections";
import { computeMatches, matchingWindow } from "./matching-core";
import type { ResourceReservation } from "./matching-types";
import type { DispatchOfferRecord } from "./offer-types";
import type { DispatchDriver, DispatchVehicle, DispatchVendor } from "./types";

const BOOKINGS="operationalBookings",OFFERS="dispatchOffers";
const iso=(value:unknown)=>value&&typeof value==="object"&&"toDate" in value?(value as{toDate():Date}).toDate().toISOString():String(value??"");
const offerFrom=(doc:FirebaseFirestore.QueryDocumentSnapshot|FirebaseFirestore.DocumentSnapshot)=>{const data=doc.data()!;return{...data,id:doc.id,createdAt:iso(data.createdAt),updatedAt:iso(data.updatedAt),...(data.responseAt?{responseAt:iso(data.responseAt)}:{})} as DispatchOfferRecord};
const resource=<T>(snap:FirebaseFirestore.DocumentSnapshot)=>({...snap.data(),id:snap.id}) as T;
const reservation=(doc:FirebaseFirestore.QueryDocumentSnapshot):ResourceReservation=>{const data=doc.data();return{id:doc.id,bookingId:String(data.bookingId??""),...(data.vehicleId?{vehicleId:String(data.vehicleId)}:{}),...(data.driverId?{driverId:String(data.driverId)}:{}),startsAt:iso(data.startsAt),endsAt:iso(data.endsAt),active:data.active===true}};

export async function getAssignmentPanel(bookingOperationalId:string){
 const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(bookingOperationalId);const[bookingSnap,offersSnap,vendorsSnap,driversSnap,vehiclesSnap,reservationsSnap]=await Promise.all([bookingRef.get(),bookingRef.collection(OFFERS).orderBy("updatedAt","desc").get(),db.collection(DISPATCH_COLLECTIONS.vendors).get(),db.collection(DISPATCH_COLLECTIONS.drivers).get(),db.collection(DISPATCH_COLLECTIONS.vehicles).get(),db.collection(DISPATCH_COLLECTIONS.reservations).where("active","==",true).get()]);
 if(!bookingSnap.exists)throw new Error("Operational booking not found.");const booking=resource<OperationalBooking>(bookingSnap),vendors=vendorsSnap.docs.map(doc=>resource<DispatchVendor>(doc)),drivers=driversSnap.docs.map(doc=>resource<DispatchDriver>(doc)),vehicles=vehiclesSnap.docs.map(doc=>resource<DispatchVehicle>(doc)),offers=offersSnap.docs.map(offerFrom),matches=computeMatches({booking,vendors,drivers,vehicles,reservations:reservationsSnap.docs.map(reservation)});
 const availableOffers=offers.filter(offer=>offer.responseStatus==="available");return{booking,matches,offers,availableOffers,vendors,drivers,vehicles};
}

export async function assignOperationalBooking(bookingOperationalId:string,selection:AssignmentSelection,input?:{reason?:string}){
 if(!bookingOperationalId||!selection.driverId||!selection.vehicleId||!selection.offerId)throw new Error("Choose an AVAILABLE Driver and an eligible Vehicle.");
 const db=getAdminDb(),bookingRef=db.collection(BOOKINGS).doc(bookingOperationalId),driverRef=db.collection(DISPATCH_COLLECTIONS.drivers).doc(selection.driverId),vehicleRef=db.collection(DISPATCH_COLLECTIONS.vehicles).doc(selection.vehicleId),offerRef=bookingRef.collection(OFFERS).doc(selection.offerId),assignmentRef=db.collection(DISPATCH_COLLECTIONS.assignments).doc(),reservationRef=db.collection(DISPATCH_COLLECTIONS.reservations).doc(assignmentRef.id);
 return db.runTransaction(async tx=>{
  const[bookingSnap,driverSnap,vehicleSnap,offerSnap,reservationsSnap]=await Promise.all([tx.get(bookingRef),tx.get(driverRef),tx.get(vehicleRef),tx.get(offerRef),tx.get(db.collection(DISPATCH_COLLECTIONS.reservations).where("active","==",true))]);
  if(!bookingSnap.exists)throw new Error("Operational booking not found.");if(!driverSnap.exists)throw new Error("Selected Driver no longer exists.");if(!vehicleSnap.exists)throw new Error("Selected Vehicle no longer exists.");if(!offerSnap.exists)throw new Error("The selected Driver response no longer exists.");
  const booking=resource<OperationalBooking>(bookingSnap),driver=resource<DispatchDriver>(driverSnap),vehicle=resource<DispatchVehicle>(vehicleSnap),offer=offerFrom(offerSnap),vendorRef=db.collection(DISPATCH_COLLECTIONS.vendors).doc(driver.vendorId),vendorSnap=await tx.get(vendorRef);if(!vendorSnap.exists)throw new Error("Selected Vendor no longer exists.");const vendor=resource<DispatchVendor>(vendorSnap);
  if(booking.assignment?.status==="assigned"){if(booking.assignment.assignedDriverId===selection.driverId&&booking.assignment.assignedVehicleId===selection.vehicleId)return{assignment:booking.assignment,duplicate:true};if(!input?.reason||input.reason.trim().length<8)throw new Error("A specific reassignment reason of at least 8 characters is required.");}
  const reservations=reservationsSnap.docs.map(reservation),matches=computeMatches({booking,vendors:[vendor],drivers:[driver],vehicles:[vehicle],reservations});
  const validated=validateAssignmentSelection({booking,matches,offers:[offer],vendors:[vendor],drivers:[driver],vehicles:[vehicle],selection}),window=matchingWindow(booking),now=FieldValue.serverTimestamp(),snapshots=assignmentSnapshots(driver,vehicle),previous=booking.assignment?.status==="assigned"?booking.assignment:undefined;
  const assignment={id:assignmentRef.id,status:"assigned" as const,bookingOperationalId:booking.id,bookingId:booking.bookingId,dispatchVendorId:vendor.id,vendorName:vendor.name,assignedDriverId:driver.id,driverSnapshot:snapshots.driverSnapshot,assignedVehicleId:vehicle.id,vehicleSnapshot:snapshots.vehicleSnapshot,approvedVendorPayoutMinor:booking.internalFinancials.vendorPayoutMinor!,offerId:validated.offer.id,offerCandidateId:validated.offer.candidateId,assignedAt:now,assignedBy:sharedActor,window,...(previous?{previousAssignmentId:previous.id,reason:input!.reason!.trim()}:{})};
  if(previous)tx.update(db.collection(DISPATCH_COLLECTIONS.reservations).doc(previous.id),{active:false,releasedAt:now,releasedBy:sharedActor,releaseReason:"reassigned"});
  tx.create(assignmentRef,assignment);tx.create(reservationRef,{bookingId:booking.id,driverId:driver.id,vehicleId:vehicle.id,startsAt:window.start,endsAt:window.end,active:true,assignmentId:assignmentRef.id,createdAt:now,createdBy:sharedActor});tx.update(bookingRef,{assignment,updatedAt:now,updatedBy:sharedActor});
  tx.create(bookingRef.collection("events").doc(),auditEvent(previous?"booking_reassigned":"booking_assigned",now,{assignmentId:assignmentRef.id,driverId:driver.id,vehicleId:vehicle.id,vendorId:vendor.id,approvedVendorPayoutMinor:booking.internalFinancials.vendorPayoutMinor,offerId:offer.id,candidateId:offer.candidateId,...(previous?{previousAssignmentId:previous.id,reason:input!.reason!.trim()}: {})}));
  return{assignment:{...assignment,assignedAt:new Date().toISOString()} as DispatchAssignment,duplicate:false};
 });
}
