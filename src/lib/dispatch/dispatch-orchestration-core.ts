import { createHash } from "node:crypto";
import type { ApprovedBroadcastInput,DispatchBroadcast,DispatchBroadcastStatus } from "./broadcast-types";
import type { DispatchOfferNotificationStatus,DispatchOfferRecord } from "./offer-types";
import type { WhatsAppOutboundJobInput,WhatsAppOutboundMessageJob,WhatsAppOutboundStatus } from "../messaging/whatsapp-outbox-types";

const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const uniqueSorted=(values:string[])=>[...new Set(values.map(value=>value.trim()).filter(Boolean))].sort();
const BROADCAST_TRANSITIONS:Record<DispatchBroadcastStatus,DispatchBroadcastStatus[]>={draft:["approved","cancelled"],approved:["queued","cancelled","closed"],queued:["sending","cancelled","closed"],sending:["sent","partially_failed","failed","cancelled","closed"],sent:["closed"],partially_failed:["sending","closed","cancelled"],failed:["queued","closed","cancelled"],closed:[],cancelled:[]};
const NOTIFICATION_TRANSITIONS:Record<WhatsAppOutboundStatus,WhatsAppOutboundStatus[]>={not_queued:["queued","cancelled"],queued:["sending","cancelled"],sending:["provider_accepted","failed","outcome_unknown","cancelled"],provider_accepted:["sent","delivered","read","failed","outcome_unknown"],sent:["delivered","read","failed"],delivered:["read"],read:[],failed:["sending","cancelled"],cancelled:[],outcome_unknown:["provider_accepted","sent","delivered","read","failed","cancelled"]};

export function assertBroadcastTransition(from:DispatchBroadcastStatus,to:DispatchBroadcastStatus){if(from===to)return to;if(!BROADCAST_TRANSITIONS[from]?.includes(to))throw new Error(`Invalid broadcast transition: ${from} -> ${to}.`);return to}
export function assertNotificationTransition(from:WhatsAppOutboundStatus,to:WhatsAppOutboundStatus){if(from===to)return to;if(!NOTIFICATION_TRANSITIONS[from]?.includes(to))throw new Error(`Invalid notification transition: ${from} -> ${to}.`);return to}
export function assertCurrentRevision(expected:number,current:number,label="revision"){if(!Number.isSafeInteger(expected)||expected<1||expected!==current)throw new Error(`Stale ${label}; refresh and try again.`);return current}
export function isOfferExpired(offerExpiresAt:string|undefined,now=new Date()){if(!offerExpiresAt)return false;const expires=new Date(offerExpiresAt);return Number.isNaN(expires.getTime())||expires.getTime()<=now.getTime()}
export function assertOfferOpen(offer:Pick<DispatchOfferRecord,"offerExpiresAt"|"portalStatus"|"responseStatus">,now=new Date()){if(offer.portalStatus==="closed"||["expired","closed","cancelled","not_selected"].includes(offer.responseStatus)||isOfferExpired(offer.offerExpiresAt,now))throw new Error("This offer is closed or expired.")}

export function dispatchBroadcastIdentity(input:Pick<ApprovedBroadcastInput,"bookingOperationalId"|"revision"|"offerRevision"|"candidateIds"|"offerIds"|"driverIds"|"approvedPayoutMinor"|"offerExpiresAt">){const candidates=uniqueSorted(input.candidateIds),offers=uniqueSorted(input.offerIds),drivers=uniqueSorted(input.driverIds);return hash([input.bookingOperationalId,input.revision,input.offerRevision,candidates.join(","),offers.join(","),drivers.join(","),input.approvedPayoutMinor,input.offerExpiresAt].join(":"))}
export function buildApprovedBroadcast(input:ApprovedBroadcastInput):DispatchBroadcast{
  const candidateIds=uniqueSorted(input.candidateIds),offerIds=uniqueSorted(input.offerIds),driverIds=uniqueSorted(input.driverIds);
  if(!input.bookingOperationalId||!input.bookingId||!candidateIds.length||candidateIds.length!==offerIds.length||candidateIds.length!==driverIds.length)throw new Error("Select matching candidate, offer and Driver recipients.");
  if(!Number.isSafeInteger(input.revision)||input.revision<1||!Number.isSafeInteger(input.offerRevision)||input.offerRevision<1)throw new Error("Broadcast revisions must be positive integers.");
  if(!Number.isSafeInteger(input.approvedPayoutMinor)||input.approvedPayoutMinor<0)throw new Error("Approved payout snapshot is invalid.");
  if(isOfferExpired(input.offerExpiresAt,new Date(input.approvedAt)))throw new Error("Offer expiry must be after broadcast approval.");
  const idempotencyKey=dispatchBroadcastIdentity({...input,candidateIds,offerIds,driverIds});
  return{id:idempotencyKey,broadcastId:idempotencyKey,...input,candidateIds,offerIds,driverIds,status:"approved",idempotencyKey,createdAt:input.approvedAt,updatedAt:input.approvedAt};
}
export function reuseOrCreateBroadcast(existing:DispatchBroadcast|undefined,proposed:DispatchBroadcast){return existing?{broadcast:existing,duplicate:true}:{broadcast:proposed,duplicate:false}}

export function outboundMessageIdentity(input:WhatsAppOutboundJobInput){
  if(input.purpose==="driver_offer"&&(!input.broadcastId||!input.offerId))throw new Error("Driver offer jobs require broadcast and offer identity.");
  if(input.purpose!=="driver_offer"&&!input.assignmentId)throw new Error("Assignment notification jobs require assignment identity.");
  return hash([input.purpose,input.bookingOperationalId,input.broadcastId??"",input.offerId??"",input.assignmentId??"",input.recipientType,input.recipientReferenceId].join(":"));
}
export function buildOutboundMessageJob(input:WhatsAppOutboundJobInput):WhatsAppOutboundMessageJob{if(!input.recipientReferenceId.trim())throw new Error("Outbound recipient reference is required.");const idempotencyKey=outboundMessageIdentity(input);return{id:idempotencyKey,...input,status:"not_queued",attemptCount:0,idempotencyKey}}
export function reuseOrCreateOutboundJob(existing:WhatsAppOutboundMessageJob|undefined,proposed:WhatsAppOutboundMessageJob){return existing?{job:existing,duplicate:true}:{job:proposed,duplicate:false}}
export function offerNotificationStatus(offer:Partial<DispatchOfferRecord>):DispatchOfferNotificationStatus{return offer.notificationStatus??"not_queued"}
