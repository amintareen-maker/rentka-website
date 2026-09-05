export const DECLINE_REASONS=["busy","vehicle_unavailable","route_not_suitable","price_too_low","other"] as const;
export type DeclineReason=typeof DECLINE_REASONS[number];
export type DriverOfferResponseKind="accepted"|"declined"|"countered";
export type DriverOfferResponse={id:string;kind:DriverOfferResponseKind;offeredPayoutMinor:number;requestedPayoutMinor?:number;declineReason?:DeclineReason;note?:string;timestamp:string;actor:{type:"driver_offer";driverId:string;offerId:string};source:"driver_secure_page"};
export type DriverOfferTokenRecord={bookingOperationalId:string;offerId:string;candidateId:string;driverId:string;vendorId:string;offeredPayoutMinor:number;active:boolean;createdAt:unknown;expiresAt:unknown;revokedAt?:unknown};
export type SecureDriverOfferProjection={bookingOperationalId:string;bookingId:string;offerId:string;driverId:string;vendorId:string;offeredPayoutMinor:number;generalPickupArea:string;generalDestination:string;travelDate:string;pickupTime:string;vehicleRequirement:string;packageInformation:string;responsibilities:string[];supportPhone:string;viewedAt?:string;closed:boolean;latestResponse?:DriverOfferResponse};
export type DriverOfferPortalMutation={kind:"accepted"}|{kind:"declined";declineReason:DeclineReason;note?:string}|{kind:"countered";requestedPayoutMinor:number;note?:string};
