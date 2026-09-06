import "server-only";

export type DualhookWhatsAppConfig={
  verifyToken?:string;
  pathSecret?:string;
  wabaId?:string;
  phoneNumberId?:string;
};

export function getDualhookWhatsAppConfig():DualhookWhatsAppConfig{return{
  verifyToken:process.env.DUALHOOK_WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  pathSecret:process.env.DUALHOOK_WHATSAPP_WEBHOOK_PATH_SECRET,
  wabaId:process.env.META_WHATSAPP_WABA_ID,
  phoneNumberId:process.env.META_WHATSAPP_PHONE_NUMBER_ID,
}}
