import "server-only";
import { getDualhookWhatsAppOutboundConfig } from "./dualhook-whatsapp-config";
import { createDualhookWhatsAppOutboundProvider } from "./dualhook-whatsapp-outbound-core";
import type { WhatsAppOutboundProvider } from "./whatsapp-outbound-provider";

export type WhatsAppOutboundProviderName="dualhook";

export function getWhatsAppOutboundProvider(provider:WhatsAppOutboundProviderName):WhatsAppOutboundProvider{
  if(provider==="dualhook")return createDualhookWhatsAppOutboundProvider(getDualhookWhatsAppOutboundConfig());
  throw new Error("Unsupported WhatsApp outbound provider.");
}
