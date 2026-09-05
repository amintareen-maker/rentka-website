export const SETTLEMENT_STATES=["not_ready","ready_to_settle","partially_settled","settled","review_required"] as const;
export type SettlementState=typeof SETTLEMENT_STATES[number];
export const CUSTOMER_ADJUSTMENT_CATEGORIES=["extra_hours","additional_distance","toll","parking","fuel","driver_food_accommodation","other"] as const;
export type CustomerAdjustmentCategory=typeof CUSTOMER_ADJUSTMENT_CATEGORIES[number];
export type SettlementEntry={id:string;amountMinor:number;note?:string;createdAt:string};
export type CustomerSettlementAdjustment=SettlementEntry&{category:CustomerAdjustmentCategory;direction:"charge"|"credit";signedAmountMinor:number};
export type PayoutSettlementAdjustment=SettlementEntry&{reason:string;direction:"addition"|"deduction";signedAmountMinor:number};
export type DriverCollectionReconciliation=SettlementEntry&{status:"collected"|"partially_collected"|"not_collected";actualAmountMinor:number;expectedAmountMinor:number};
export type VendorSettlementPayment=SettlementEntry&{method?:string;reference?:string};
export type TripSettlementRecord={id:string;bookingOperationalId:string;bookingId:string;assignmentId:string;driverId:string;vehicleId:string;originalFinalSaleMinor:number;originalApprovedPayoutMinor:number;driverCollectionExpectedMinor:number;createdAt:string;finalizedAt?:string};
export type TripSettlementProjection={bookingOperationalId:string;bookingId:string;assignmentId:string;driverId:string;vehicleId:string;eligible:boolean;state:SettlementState;originalSaleMinor:number;preTripAdjustmentsMinor:number;postTripAdjustmentsMinor:number;finalSaleMinor:number;rentkaReceivedMinor:number;driverCollectionExpectedMinor:number;driverCollectionActualMinor:number;customerRemainingMinor:number;refundCreditDueMinor:number;approvedPayoutMinor:number;payoutAdjustmentsMinor:number;finalPayoutMinor:number;vendorPaidMinor:number;vendorRemainingMinor:number;vendorOverpaidMinor:number;grossMarginMinor:number;warnings:string[];customerAdjustments:CustomerSettlementAdjustment[];payoutAdjustments:PayoutSettlementAdjustment[];driverCollection?:DriverCollectionReconciliation;vendorPayments:VendorSettlementPayment[];finalizedAt?:string};
export type SettlementMutation=
 |{kind:"customer_adjustment";direction:"charge"|"credit";category:CustomerAdjustmentCategory;amountMinor:number;note?:string}
 |{kind:"payout_adjustment";direction:"addition"|"deduction";reason:string;amountMinor:number;note?:string}
 |{kind:"driver_collection";status:"collected"|"partially_collected"|"not_collected";actualAmountMinor:number}
 |{kind:"vendor_payment";amountMinor:number;method?:string;reference?:string}
 |{kind:"finalize"};
