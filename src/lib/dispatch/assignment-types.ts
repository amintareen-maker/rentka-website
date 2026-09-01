import type { AuditActor, DispatchDriver, DispatchVehicle } from "./types";

export type AssignmentStatus="assigned"|"cancelled"|"reassigned";
export type DriverAssignmentSnapshot=Pick<DispatchDriver,"id"|"name"|"vendorId"|"mobileNumber"|"whatsappNumber"|"priority"|"zoneIds"|"vehicleEligibility">;
export type VehicleAssignmentSnapshot=Pick<DispatchVehicle,"id"|"vendorId"|"zoneIds"|"category"|"make"|"model"|"modelYear"|"registrationNumber">&{documentationState:DispatchVehicle["documentation"]["overallState"]};
export type DispatchAssignment={
  id:string;status:AssignmentStatus;bookingOperationalId:string;bookingId:string;dispatchVendorId:string;vendorName:string;
  assignedDriverId:string;driverSnapshot:DriverAssignmentSnapshot;assignedVehicleId:string;vehicleSnapshot:VehicleAssignmentSnapshot;
  approvedVendorPayoutMinor:number;offerId:string;offerCandidateId:string;assignedAt:string;assignedBy:AuditActor;
  window:{start:string;end:string;basis:string};previousAssignmentId?:string;reason?:string;
};
