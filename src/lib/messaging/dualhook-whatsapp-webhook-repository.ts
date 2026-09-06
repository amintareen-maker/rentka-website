import "server-only";
import { FieldValue,Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import type { DualhookWebhookEvent } from "./dualhook-whatsapp-webhook";

const EVENTS="dualhookWhatsAppWebhookEvents",MESSAGES="metaWhatsAppMessages";
export type DualhookPersistResult={received:number;created:number;duplicates:number};
export async function persistDualhookWebhookEvents(events:DualhookWebhookEvent[]):Promise<DualhookPersistResult>{
  const db=getAdminDb();let created=0,duplicates=0;
  for(const event of events){const ref=db.collection(EVENTS).doc(event.eventId);await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(snap.exists){duplicates++;return}const now=FieldValue.serverTimestamp(),occurredAt=event.timestamp&&/^\d{1,16}$/.test(event.timestamp)?Timestamp.fromMillis(Number(event.timestamp)*1000):undefined;tx.create(ref,{eventId:event.eventId,field:event.field,wabaId:event.wabaId,phoneNumberId:event.phoneNumberId,receivedAt:now,...(event.messageId?{metaMessageId:event.messageId}:{}),...(event.status?{status:event.status}:{}),...(occurredAt?{occurredAt}:{}),...(event.messageId&&event.status?{statusTimestamp:occurredAt??now}: {})});if(event.messageId&&event.status)tx.set(db.collection(MESSAGES).doc(event.messageId),{metaMessageId:event.messageId,status:event.status,statusTimestamp:occurredAt??now,updatedAt:now,wabaId:event.wabaId,phoneNumberId:event.phoneNumberId},{merge:true});created++})}
  return{received:events.length,created,duplicates};
}
