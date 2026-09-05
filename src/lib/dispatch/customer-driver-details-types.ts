import type { AuditActor } from "./types";

export type CustomerDriverDetailsState="not_scheduled"|"scheduled"|"ready_to_share"|"overdue"|"shared"|"updated_details_required";
export type CustomerDriverDetailsAction="copied"|"whatsapp_opened"|"marked_shared"|"schedule"|"cancel_schedule";
export type CustomerDriverDetailsMutation={action:CustomerDriverDetailsAction;scheduleMode?:string;customSchedule?:string};

export type CustomerDriverDetailsRecord={
 id:string;bookingOperationalId:string;bookingId:string;assignmentId:string;driverId:string;vehicleId:string;
 createdAt:string;createdBy:AuditActor;updatedAt:string;updatedBy:AuditActor;
 scheduledAt?:string;scheduleMode?:string;scheduleCancelledAt?:string;
 lastCopiedAt?:string;lastCopiedBy?:AuditActor;lastWhatsappOpenedAt?:string;lastWhatsappOpenedBy?:AuditActor;
 sharedAt?:string;sharedBy?:AuditActor;updateRequiredRecordedAt?:string;
};

export type CustomerDriverDetailsProjection={
 bookingOperationalId:string;bookingId:string;assignmentId:string;driverId:string;vehicleId:string;
 customerName:string;customerWhatsappNumber?:string;driverName:string;vehicleLabel:string;
 message:string;whatsappUrl?:string;missingFields:string[];pickupAt:string;
 state:CustomerDriverDetailsState;scheduledAt?:string;updatedDetailsRequired:boolean;previousSharedAssignmentId?:string;
};

