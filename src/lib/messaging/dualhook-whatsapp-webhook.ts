import { createHash } from "node:crypto";

export const DUALHOOK_FIELDS=["messages","smb_message_echoes","smb_app_state_sync","history"] as const;
export type DualhookField=typeof DUALHOOK_FIELDS[number];
export type DualhookWebhookEvent={eventId:string;field:DualhookField;wabaId:string;phoneNumberId:string;status?:string;messageId?:string;timestamp?:string};

export function verifyDualhookWebhookChallenge(input:{mode:string|null;token:string|null;challenge:string|null;expectedToken?:string}){
  return Boolean(input.expectedToken&&input.mode==="subscribe"&&input.token===input.expectedToken&&input.challenge!==null);
}

const text=(v:unknown)=>typeof v==="string"?v:"";
export function parseDualhookWebhookPayload(payload:unknown,expected:{wabaId?:string;phoneNumberId?:string},rawBody=""):DualhookWebhookEvent[]{
  if(!payload||typeof payload!=="object")return[];
  const root=payload as Record<string,unknown>;
  if(root.object!=="whatsapp_business_account"||!Array.isArray(root.entry))return[];
  const events:DualhookWebhookEvent[]=[];
  for(const rawEntry of root.entry){
    if(!rawEntry||typeof rawEntry!=="object")continue;
    const entry=rawEntry as Record<string,unknown>,wabaId=text(entry.id);
    if(!wabaId||!expected.wabaId||wabaId!==expected.wabaId||!Array.isArray(entry.changes))return[];
    for(const rawChange of entry.changes){
      if(!rawChange||typeof rawChange!=="object")continue;
      const change=rawChange as Record<string,unknown>,field=change.field;
      if(!DUALHOOK_FIELDS.includes(field as DualhookField)||!change.value||typeof change.value!=="object")continue;
      const value=change.value as Record<string,unknown>,metadata=value.metadata&&typeof value.metadata==="object"?value.metadata as Record<string,unknown>:undefined,phoneNumberId=text(metadata?.phone_number_id);
      if(!phoneNumberId||!expected.phoneNumberId||phoneNumberId!==expected.phoneNumberId)return[];
      const statuses=field==="messages"&&Array.isArray(value.statuses)?value.statuses:[];
      if(statuses.length){for(const item of statuses){if(!item||typeof item!=="object")continue;const status=item as Record<string,unknown>,messageId=text(status.id);if(!messageId)continue;events.push({eventId:createHash("sha256").update(`${rawBody}|${wabaId}|${phoneNumberId}|${field}|${messageId}|${text(status.status)}|${text(status.timestamp)}`).digest("hex"),field:field as DualhookField,wabaId,phoneNumberId,status:text(status.status)||undefined,messageId,timestamp:text(status.timestamp)||undefined})}}
      else events.push({eventId:createHash("sha256").update(`${rawBody}|${wabaId}|${phoneNumberId}|${field}|${JSON.stringify(value)}`).digest("hex"),field:field as DualhookField,wabaId,phoneNumberId});
    }
  }
  return [...new Map(events.map(event=>[event.eventId,event])).values()];
}
