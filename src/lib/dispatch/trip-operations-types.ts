import type { AuditActor } from "./types";
import type { DriverAssignmentSnapshot, VehicleAssignmentSnapshot } from "./assignment-types";
export const TRIP_STATUSES=["assigned","en_route","arrived","customer_onboard","completed"] as const;
export type TripStatus=typeof TRIP_STATUSES[number];
export type TripTransitionSource="driver_secure_page"|"admin_fallback";
export type TripTransitionActor=AuditActor|{type:"assigned_driver";driverId:string;assignmentId:string};
export type TripTransition={id:string;bookingOperationalId:string;bookingId:string;assignmentId:string;previousStatus:TripStatus;newStatus:TripStatus;timestamp:string;actor:TripTransitionActor;source:TripTransitionSource};
export type TripOperationRecord={id:string;bookingOperationalId:string;bookingId:string;assignmentId:string;assignedDriverId:string;assignedVehicleId:string;driverSnapshot:DriverAssignmentSnapshot;vehicleSnapshot:VehicleAssignmentSnapshot;currentStatus:TripStatus;statusTimestamps:Partial<Record<TripStatus,string>>;createdAt:string;updatedAt:string};
export type DriverTripTokenRecord={bookingOperationalId:string;assignmentId:string;assignedDriverId:string;active:boolean;createdAt:string;expiresAt:string;revokedAt?:string};
export type TripOperationsProjection={bookingOperationalId:string;bookingId:string;assignmentId:string;driverId:string;vehicleId:string;driverName:string;vehicleLabel:string;currentStatus:TripStatus;nextStatus?:TripStatus;nextAction?:string;latestTransitionAt?:string;history:TripTransition[]};
export type DriverTripProjection=TripOperationsProjection&{customerName:string;customerPhone:string;pickup:string;pickupMapLink?:string;destination:string;destinationMapLink?:string;pickupDate:string;pickupTime:string;responsibilities:string[];supportPhone:string};

