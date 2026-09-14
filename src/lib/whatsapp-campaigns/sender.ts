import "server-only";
import { getAdminDb } from "../firebaseAdmin";
import { getDualhookWhatsAppOutboundConfig } from "../messaging/dualhook-whatsapp-config";
import { createDualhookWhatsAppOutboundProvider } from "../messaging/dualhook-whatsapp-outbound-core";
import { createCampaignSender } from "./send-service";
import { requireCampaignSendGate } from "./send-gate";

export function campaignSender() {
  return createCampaignSender({
    db: getAdminDb(), requireGate: requireCampaignSendGate,
    signingSecret: () => process.env.RENTKA_ADMIN_PASSWORD ?? "",
    sendTemplate: async message => {
      await requireCampaignSendGate();
      const provider = createDualhookWhatsAppOutboundProvider(getDualhookWhatsAppOutboundConfig(), (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }));
      return provider.sendTemplate(message);
    },
  });
}
export async function reconcileCampaignDelivery(event: { messageId: string; status: string; errorCode?: string }) {
  return campaignSender().reconcile(event);
}
