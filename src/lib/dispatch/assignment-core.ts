import type { OperationalBooking } from "./booking-types";
import type { DispatchOfferRecord } from "./offer-types";
import type { MatchProjection } from "./matching-types";
import type { DispatchDriver, DispatchVehicle, DispatchVendor } from "./types";
import type { VendorFulfillmentProposal } from "./vendor-offer-portal-types";

export type VendorProposalSelection={proposalId:string;vendorId:string;offerRevision:number;responseRevision:number};
export type AssignmentSelection={driverId:string;vehicleId:string;offerId:string;vendorProposal?:VendorProposalSelection};

export function requireAvailableOffer(offers:DispatchOfferRecord[],selection:AssignmentSelection){
 const offer=offers.find(item=>item.id===selection.offerId&&(selection.vendorProposal?item.recipientType==="vendor":item.driverId===selection.driverId));
 if(!offer)throw new Error("Select an AVAILABLE response for this Driver.");
 if(offer.responseStatus!=="available"&&offer.responseStatus!=="accepted")throw new Error(offer.responseStatus==="declined"?"This Driver declined the booking.":"This Driver does not have an AVAILABLE or ACCEPTED response.");
 if(offer.responseStatus==="accepted"&&offer.offerRevision!==undefined&&offer.agreedPayoutMinor===undefined)throw new Error("The accepted Driver payout is incomplete. Refresh the offer before assignment.");
 return offer;
}

export function validateVendorAssignmentProposal(input:{offer:DispatchOfferRecord;proposal:VendorFulfillmentProposal;selection:AssignmentSelection}){
 const{offer,proposal,selection}=input,expected=selection.vendorProposal;
 if(!expected||offer.recipientType!=="vendor")throw new Error("A current Vendor fulfillment proposal is required.");
 if(offer.responseStatus!=="accepted"||offer.agreedPayoutMinor===undefined)throw new Error("The Vendor offer is not currently accepted with an agreed payout.");
 if(offer.vendorId!==expected.vendorId||offer.supplyAccountId!==expected.vendorId||proposal.vendorId!==expected.vendorId)throw new Error("The Vendor proposal does not belong to this accepted supply account.");
 if(proposal.id!==expected.proposalId||proposal.status!=="provided")throw new Error("The Vendor proposal has been superseded. Refresh assignment review.");
 if((offer.offerRevision??0)!==expected.offerRevision||proposal.offerRevision!==expected.offerRevision||proposal.responseRevision!==expected.responseRevision)throw new Error("The Vendor offer or proposal revision is stale. Refresh assignment review.");
 if(proposal.driverId!==selection.driverId||proposal.vehicleId!==selection.vehicleId)throw new Error("The selected resources no longer match the current Vendor proposal.");
 if(offer.fulfillmentProposal?.proposalId&&offer.fulfillmentProposal.proposalId!==proposal.id)throw new Error("The Vendor proposal has been superseded. Refresh assignment review.");
 return{agreedPayoutMinor:offer.agreedPayoutMinor,vendorId:expected.vendorId,proposalId:proposal.id,offerRevision:expected.offerRevision,responseRevision:expected.responseRevision};
}

export function validateAssignmentSelection(input:{booking:OperationalBooking;matches:MatchProjection;offers:DispatchOfferRecord[];vendors:DispatchVendor[];drivers:DispatchDriver[];vehicles:DispatchVehicle[];selection:AssignmentSelection;activeBroadcastId?:string}){
 const{booking,matches,offers,vendors,drivers,vehicles,selection}=input;
 if(booking.lifecycle!=="active")throw new Error("A cancelled or not-proceeding booking cannot be assigned.");
 if(booking.readinessStatus!=="ready_for_dispatch")throw new Error("Booking is no longer Ready for Dispatch.");
 if(booking.internalFinancials.payoutStatus!=="reviewed"||booking.internalFinancials.vendorPayoutMinor===undefined)throw new Error("Vendor payout must be reviewed before assignment.");
 const offer=requireAvailableOffer(offers,selection),candidate=matches.eligible.find(item=>item.driver.id===selection.driverId&&item.vehicle.id===selection.vehicleId);
 if(offer.broadcastId&&offer.broadcastId!==input.activeBroadcastId)throw new Error("The selected Driver agreement is stale. Refresh matching details.");
 if(!matches.ready||!candidate)throw new Error("The selected Driver and Vehicle are no longer an eligible pair. Refresh matching details.");
 const driver=drivers.find(item=>item.id===selection.driverId),vehicle=vehicles.find(item=>item.id===selection.vehicleId),vendor=vendors.find(item=>item.id===candidate.vendor.id);
 if(!driver)throw new Error("Selected Driver no longer exists.");if(!vehicle)throw new Error("Selected Vehicle no longer exists.");if(!vendor)throw new Error("Selected Vendor no longer exists.");
 if(driver.vendorId!==vehicle.vendorId||vendor.id!==driver.vendorId)throw new Error("Driver and Vehicle must belong to the same Vendor.");
 return{offer,candidate,driver,vehicle,vendor};
}

export function assignmentSnapshots(driver:DispatchDriver,vehicle:DispatchVehicle){return{
 driverSnapshot:{id:driver.id,name:driver.name,vendorId:driver.vendorId,mobileNumber:driver.mobileNumber,whatsappNumber:driver.whatsappNumber,priority:driver.priority,zoneIds:driver.zoneIds,...(driver.vehicleEligibility?{vehicleEligibility:driver.vehicleEligibility}:{})},
 vehicleSnapshot:{id:vehicle.id,vendorId:vehicle.vendorId,zoneIds:vehicle.zoneIds,category:vehicle.category,make:vehicle.make,model:vehicle.model,...(vehicle.modelYear?{modelYear:vehicle.modelYear}:{}),registrationNumber:vehicle.registrationNumber,documentationState:vehicle.documentation.overallState}
}}
