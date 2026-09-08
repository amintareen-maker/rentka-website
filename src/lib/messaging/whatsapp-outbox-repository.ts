import "server-only";
import { getAdminDb } from "../firebaseAdmin";
import { buildOutboundMessageJob,reuseOrCreateOutboundJob } from "../dispatch/dispatch-orchestration-core";
import type { WhatsAppOutboundJobInput,WhatsAppOutboundMessageJob } from "./whatsapp-outbox-types";

const OUTBOX="whatsappOutboundMessages";
export async function createOrReuseWhatsAppOutboundJob(input:WhatsAppOutboundJobInput){const proposed=buildOutboundMessageJob(input),ref=getAdminDb().collection(OUTBOX).doc(proposed.id);return getAdminDb().runTransaction(async tx=>{const existing=await tx.get(ref),resolved=reuseOrCreateOutboundJob(existing.exists?{...existing.data(),id:existing.id} as WhatsAppOutboundMessageJob:undefined,proposed);if(!resolved.duplicate)tx.create(ref,proposed);return resolved})}
