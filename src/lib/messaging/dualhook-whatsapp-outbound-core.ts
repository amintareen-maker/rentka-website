import type {
  WhatsAppOutboundProvider,
  WhatsAppSendResult,
  WhatsAppTemplateMessage,
  WhatsAppTextMessage,
} from "./whatsapp-outbound-provider";

export const DUALHOOK_WHATSAPP_BASE_URL="https://api.dualhook.com";
export const DUALHOOK_WHATSAPP_GRAPH_VERSION="v25.0";

export type DualhookOutboundConfig={
  apiKey?:string;
  phoneNumberId?:string;
  baseUrl?:string;
};

export type WhatsAppFetch=typeof fetch;

export class WhatsAppProviderError extends Error{
  readonly code:"CONFIGURATION"|"REQUEST_FAILED"|"INVALID_RESPONSE";
  readonly status?:number;

  constructor(code:WhatsAppProviderError["code"],message:string,status?:number){
    super(message);
    this.name="WhatsAppProviderError";
    this.code=code;
    this.status=status;
  }
}

export function requireDualhookOutboundConfig(config:DualhookOutboundConfig){
  if(!config.apiKey)throw new WhatsAppProviderError("CONFIGURATION","Dualhook WhatsApp API key is not configured.");
  if(!config.phoneNumberId||!/^\d+$/.test(config.phoneNumberId))throw new WhatsAppProviderError("CONFIGURATION","Dualhook WhatsApp Phone Number ID is not configured.");
  return{apiKey:config.apiKey,phoneNumberId:config.phoneNumberId,baseUrl:(config.baseUrl||DUALHOOK_WHATSAPP_BASE_URL).replace(/\/$/,"")};
}

export function dualhookMessagesUrl(phoneNumberId:string,baseUrl=DUALHOOK_WHATSAPP_BASE_URL){
  if(!/^\d+$/.test(phoneNumberId))throw new WhatsAppProviderError("CONFIGURATION","Dualhook WhatsApp Phone Number ID is invalid.");
  return`${baseUrl.replace(/\/$/,"")}/${DUALHOOK_WHATSAPP_GRAPH_VERSION}/${phoneNumberId}/messages`;
}

export function dualhookTextPayload(message:WhatsAppTextMessage){
  if(!message.to||!message.body)throw new WhatsAppProviderError("CONFIGURATION","A recipient and message body are required.");
  return{messaging_product:"whatsapp",recipient_type:"individual",to:message.to,type:"text",text:{preview_url:message.previewUrl??false,body:message.body}};
}

export function dualhookTemplatePayload(message:WhatsAppTemplateMessage){
  if(!message.to||!message.name||!message.languageCode)throw new WhatsAppProviderError("CONFIGURATION","A recipient, template name and language are required.");
  return{messaging_product:"whatsapp",recipient_type:"individual",to:message.to,type:"template",template:{name:message.name,language:{code:message.languageCode},...(message.components?.length?{components:message.components}:{})}};
}

async function send(config:DualhookOutboundConfig,fetchImpl:WhatsAppFetch,payload:unknown):Promise<WhatsAppSendResult>{
  const resolved=requireDualhookOutboundConfig(config);
  let response:Response;
  try{
    response=await fetchImpl(dualhookMessagesUrl(resolved.phoneNumberId,resolved.baseUrl),{method:"POST",headers:{Authorization:`Bearer ${resolved.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
  }catch{
    throw new WhatsAppProviderError("REQUEST_FAILED","Dualhook WhatsApp request could not be completed.");
  }
  if(!response.ok)throw new WhatsAppProviderError("REQUEST_FAILED","Dualhook WhatsApp request was rejected.",response.status);
  let result:unknown;
  try{result=await response.json()}catch{throw new WhatsAppProviderError("INVALID_RESPONSE","Dualhook WhatsApp returned an invalid response.")}
  const messageId=result&&typeof result==="object"&&Array.isArray((result as Record<string,unknown>).messages)&&typeof ((result as {messages:Array<Record<string,unknown>>}).messages[0]?.id)==="string"?(result as {messages:Array<{id:string}>}).messages[0].id:"";
  if(!messageId)throw new WhatsAppProviderError("INVALID_RESPONSE","Dualhook WhatsApp returned an invalid response.");
  return{provider:"dualhook",messageId};
}

export function createDualhookWhatsAppOutboundProvider(config:DualhookOutboundConfig,fetchImpl:WhatsAppFetch=fetch):WhatsAppOutboundProvider{
  requireDualhookOutboundConfig(config);
  return{
    sendText(message){return send(config,fetchImpl,dualhookTextPayload(message))},
    sendTemplate(message){return send(config,fetchImpl,dualhookTemplatePayload(message))},
  };
}
