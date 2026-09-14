import "server-only";
import { getDualhookWhatsAppOutboundConfig } from "../messaging/dualhook-whatsapp-config";
import { dualhookMessagesUrl, dualhookTemplatePayload, requireDualhookOutboundConfig } from "../messaging/dualhook-whatsapp-outbound-core";
import { normalizeCampaignPhone } from "./core";
import { INTRODUCTION } from "./types";

/** Server-only request preparation. No fetch, provider instantiation, queue or send method. */
export function prepareIntroductionTemplate(phone: string) {
  const normalized = normalizeCampaignPhone(phone);
  if (!normalized) throw new Error("Invalid recipient.");
  const config = requireDualhookOutboundConfig(getDualhookWhatsAppOutboundConfig());
  return {
    url: dualhookMessagesUrl(config.phoneNumberId),
    // Deliberately omit authorization: do not return credentials from a helper.
    payload: dualhookTemplatePayload({ to: normalized.phoneE164.slice(1), name: INTRODUCTION.templateName, languageCode: INTRODUCTION.templateLanguage, components: [{ type: "header", parameters: [{ type: "image", image: { link: INTRODUCTION.headerImageUrl } }] }] }),
    sendingEnabled: false as const,
  };
}
