import type { AuditActor } from "./types";

export type DriverInstructionProjection={
  bookingOperationalId:string;bookingId:string;assignmentId:string;driverId:string;vehicleId:string;
  driverName:string;driverWhatsappNumber?:string;message:string;whatsappUrl?:string;missingFields:string[];
};

export type DriverInstructionAction="copied"|"whatsapp_opened"|"marked_shared";

export type DriverInstructionRecord={
  id:string;bookingOperationalId:string;bookingId:string;assignmentId:string;driverId:string;vehicleId:string;
  createdAt:string;createdBy:AuditActor;updatedAt:string;updatedBy:AuditActor;
  lastCopiedAt?:string;lastCopiedBy?:AuditActor;
  lastWhatsappOpenedAt?:string;lastWhatsappOpenedBy?:AuditActor;
  sharedAt?:string;sharedBy?:AuditActor;
};
