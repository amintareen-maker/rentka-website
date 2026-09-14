import { getTemplatePreview, TEMPLATE_PREVIEW_BLOCKER } from "./template-preview";
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDualhookWhatsAppOutboundConfig } from "../messaging/dualhook-whatsapp-config";
import { campaignLiveEnabled } from "./send-core";
import { INTRODUCTION } from "./types";
import type { GateStatus } from "./send-types";

export class CampaignGateError extends Error {}
export async function campaignSendGate(): Promise<GateStatus> {
  const enabled = campaignLiveEnabled(process.env.WHATSAPP_CAMPAIGN_LIVE_SEND_ENABLED);
  const blockers: string[] = [];
  if (!getTemplatePreview(INTRODUCTION)) blockers.push(TEMPLATE_PREVIEW_BLOCKER);
  if (!enabled) blockers.push("Live campaign sending is disabled.");
  let headerReady = false;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "whatsapp", "rentka-introduction-header.jpg"));
    headerReady = bytes.length > 10 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
    if (!headerReady) blockers.push("Campaign header image must be a valid JPEG.");
  } catch { blockers.push("Campaign header image is missing."); }
  const config = getDualhookWhatsAppOutboundConfig();
  if (!config.apiKey || !config.phoneNumberId || !/^\d+$/.test(config.phoneNumberId)) blockers.push("Campaign provider configuration is unavailable.");
  return { enabled, headerReady, headerUrl: INTRODUCTION.headerImageUrl, headerMime: headerReady ? "image/jpeg" : null, blockers };
}
export async function requireCampaignSendGate() {
  const gate = await campaignSendGate();
  if (gate.blockers.length) throw new CampaignGateError(gate.blockers.join(" "));
  return gate;
}
