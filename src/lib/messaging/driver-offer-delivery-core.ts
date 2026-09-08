import type { OperationalBooking } from "../dispatch/booking-types";
import type { DispatchBroadcast } from "../dispatch/broadcast-types";
import type { DispatchOfferRecord } from "../dispatch/offer-types";
import type { WhatsAppOutboundMessageJob, WhatsAppOutboundStatus } from "./whatsapp-outbox-types";
import type { WhatsAppOutboundProvider, WhatsAppTemplateComponent, WhatsAppTemplateMessage } from "./whatsapp-outbound-provider";
import { createBroadcastSafePreview } from "../dispatch/broadcast-approval-core.ts";

export const DRIVER_OFFER_TEMPLATE_NAME = "rentka_driver_trip_offer_v1";
const text = (value: string | number) => ({ type: "text", text: String(value) });
const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;

export function assertDriverOfferSendable(input: { job: WhatsAppOutboundMessageJob; booking: OperationalBooking; broadcast: DispatchBroadcast; offer: DispatchOfferRecord; activeBroadcastId: string; now?: Date }) {
  const { job, booking, broadcast, offer, activeBroadcastId, now = new Date() } = input;
  if (job.purpose !== "driver_offer" || (job.status !== "queued" && !(job.status === "failed" && job.failureRetryable))) throw new Error("This Driver offer job is not sendable.");
  if (broadcast.id !== job.broadcastId || !["approved", "queued", "sending", "partially_failed"].includes(broadcast.status) || activeBroadcastId !== broadcast.id) throw new Error("The broadcast is no longer current.");
  if (booking.lifecycle !== "active" || booking.readinessStatus !== "ready_for_dispatch" || booking.assignment?.status === "assigned") throw new Error("The booking is no longer dispatch-valid.");
  if (offer.id !== job.offerId || offer.broadcastId !== broadcast.id || offer.offerRevision !== broadcast.offerRevision || !broadcast.offerIds.includes(offer.id) || !broadcast.driverIds.includes(offer.driverId) || job.recipientReferenceId !== offer.driverId) throw new Error("The Driver offer revision is stale.");
  if (new Date(offer.offerExpiresAt ?? broadcast.offerExpiresAt).getTime() <= now.getTime()) throw new Error("The Driver offer has expired.");
  if (offer.approvedPayoutMinor !== broadcast.approvedPayoutMinor || booking.internalFinancials.vendorPayoutMinor !== broadcast.approvedPayoutMinor) throw new Error("The payout snapshot is stale.");
  return input;
}

export function driverOfferTemplateComponents(booking: OperationalBooking, offer: DispatchOfferRecord, secureUrl: string): WhatsAppTemplateComponent[] {
  const preview = createBroadcastSafePreview(booking);
  const expiry = new Date(offer.offerExpiresAt ?? "");
  const offerUrl = new URL(secureUrl);
  const pathPrefix = "/driver/offer/";
  const tokenSuffix = offerUrl.pathname.startsWith(pathPrefix) ? offerUrl.pathname.slice(pathPrefix.length) : "";
  if (offerUrl.protocol !== "https:" || !tokenSuffix || tokenSuffix.includes("/") || offerUrl.search || offerUrl.hash || Number.isNaN(expiry.getTime())) throw new Error("Secure offer delivery details are invalid.");
  return [{ type: "body", parameters: [
    text(preview.bookingId), text(preview.pickupArea), text(preview.destinationArea), text(preview.travelDate), text(preview.pickupTime),
    text(preview.vehicleRequirement), text(preview.dutySummary), text(money(offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor)), text(expiry.toISOString()),
  ] }, { type: "button", sub_type: "url", index: "0", parameters: [text(tokenSuffix)] }];
}

export function classifyProviderFailure(error: unknown) {
  const value = error as { code?: string; status?: number };
  if (value?.code === "INVALID_RESPONSE" || (value?.code === "REQUEST_FAILED" && value.status === undefined)) return { status: "outcome_unknown" as const, failureCode: "provider_outcome_unknown", retryable: false };
  const retryable = value?.code === "REQUEST_FAILED" && (value.status === 429 || (typeof value.status === "number" && value.status >= 500));
  return { status: "failed" as const, failureCode: retryable ? "provider_retryable" : "provider_rejected", retryable };
}

export async function invokeDriverOfferProvider(provider: WhatsAppOutboundProvider, message: WhatsAppTemplateMessage) {
  try {
    const result = await provider.sendTemplate(message);
    return { status: "provider_accepted" as const, providerMessageId: result.messageId, retryable: false };
  } catch (error) {
    return classifyProviderFailure(error);
  }
}

export function aggregateBroadcastStatus(statuses: WhatsAppOutboundStatus[]) {
  if (!statuses.length) return "approved" as const;
  const failed = statuses.filter(status => ["failed", "cancelled", "outcome_unknown"].includes(status)).length;
  const progressed = statuses.filter(status => ["provider_accepted", "sent", "delivered", "read"].includes(status)).length;
  if (failed === statuses.length) return "failed" as const;
  if (failed > 0 && progressed > 0) return "partially_failed" as const;
  if (statuses.every(status => ["sent", "delivered", "read"].includes(status))) return "sent" as const;
  if (progressed > 0 || statuses.some(status => status === "sending")) return "sending" as const;
  return "queued" as const;
}
