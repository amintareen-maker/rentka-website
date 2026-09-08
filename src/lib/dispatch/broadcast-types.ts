import type { AuditActor } from "./types";

export const DISPATCH_BROADCAST_STATUSES=["draft","approved","queued","sending","sent","partially_failed","failed","closed","cancelled"] as const;
export type DispatchBroadcastStatus=typeof DISPATCH_BROADCAST_STATUSES[number];

export type DispatchBroadcast={
  id:string;
  broadcastId:string;
  bookingOperationalId:string;
  bookingId:string;
  revision:number;
  offerRevision:number;
  status:DispatchBroadcastStatus;
  candidateIds:string[];
  offerIds:string[];
  driverIds:string[];
  approvedPayoutMinor:number;
  offerExpiresAt:string;
  approvedAt:string;
  approvedBy:AuditActor;
  createdAt:string;
  updatedAt:string;
  idempotencyKey:string;
};

export type ApprovedBroadcastInput=Pick<DispatchBroadcast,"bookingOperationalId"|"bookingId"|"revision"|"offerRevision"|"candidateIds"|"offerIds"|"driverIds"|"approvedPayoutMinor"|"offerExpiresAt"|"approvedAt"|"approvedBy">;
