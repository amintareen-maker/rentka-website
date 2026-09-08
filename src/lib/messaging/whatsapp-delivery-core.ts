import type { WhatsAppOutboundStatus } from "./whatsapp-outbox-types";

export type DeliveryWebhookStatus = "sent" | "delivered" | "read" | "failed";
const order: WhatsAppOutboundStatus[] = ["not_queued", "queued", "sending", "provider_accepted", "sent", "delivered", "read"];

export function nextDeliveryStatus(current: WhatsAppOutboundStatus, incoming: DeliveryWebhookStatus) {
  if (incoming === "failed") return ["read", "delivered"].includes(current) ? current : "failed";
  if (["failed", "cancelled", "outcome_unknown"].includes(current)) return current;
  return order.indexOf(incoming) > order.indexOf(current) ? incoming : current;
}
