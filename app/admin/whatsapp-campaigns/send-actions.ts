"use server";
import { hasAdminSession } from "../_lib/session";
import { campaignSender } from "@/lib/whatsapp-campaigns/sender";
import { campaignSendGate } from "@/lib/whatsapp-campaigns/send-gate";
import type { SendMode } from "@/lib/whatsapp-campaigns/send-types";

async function authorize() { if (!(await hasAdminSession())) throw new Error("Unauthorized"); }
export async function reviewAudienceSend(id: string, mode: SendMode) {
  await authorize();
  return { ...await campaignSender().review(id, mode), gate: await campaignSendGate() };
}
export async function confirmAudienceSend(token: string, phrase: string) {
  await authorize(); return campaignSender().start(token, phrase);
}
export async function processAudienceSend(id: string, approvalId: string) {
  await authorize(); return campaignSender().processChunk(id, approvalId);
}
export async function audienceSendResults(id: string) {
  await authorize(); return campaignSender().results(id);
}
