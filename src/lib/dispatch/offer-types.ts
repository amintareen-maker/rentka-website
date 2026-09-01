import type { AuditActor } from "./types";

export type DispatchOfferStage="prepared"|"whatsapp_opened"|"sent_manual";
export type DispatchResponseStatus="not_recorded"|"available"|"declined"|"no_response";
export type DriverOfferProjection={offerId:string;candidateId:string;bookingOperationalId:string;bookingId:string;vendorId:string;driverId:string;vehicleId:string;vehicleRegistration:string;driverName:string;vendorName:string;driverWhatsappNumber:string;approvedPayoutMinor:number;message:string;whatsappUrl:string};
export type DispatchOfferRecord={id:string;bookingOperationalId:string;bookingId:string;vendorId:string;driverId:string;vehicleId:string;candidateId:string;vehicleRegistration:string;driverName:string;vendorName:string;driverWhatsappNumber:string;approvedPayoutMinor:number;offerStage:DispatchOfferStage;responseStatus:DispatchResponseStatus;createdAt:string;updatedAt:string;createdBy:AuditActor;updatedBy:AuditActor;openedAt?:string;sentAt?:string;responseAt?:string;responseNote?:string};
