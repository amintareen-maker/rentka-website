import "server-only";

export type MetaWhatsAppConfig={
 appSecret?:string;webhookVerifyToken?:string;graphApiVersion?:string;accessToken?:string;
 phoneNumberId?:string;wabaId?:string;businessPortfolioId?:string;appId?:string;publicBaseUrl?:string;
};

export function getMetaWhatsAppConfig():MetaWhatsAppConfig{return{
 appSecret:process.env.META_WHATSAPP_APP_SECRET,
 webhookVerifyToken:process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN,
 graphApiVersion:process.env.META_WHATSAPP_GRAPH_API_VERSION,
 accessToken:process.env.META_WHATSAPP_ACCESS_TOKEN,
 phoneNumberId:process.env.META_WHATSAPP_PHONE_NUMBER_ID,
 wabaId:process.env.META_WHATSAPP_WABA_ID,
 businessPortfolioId:process.env.META_WHATSAPP_BUSINESS_PORTFOLIO_ID,
 appId:process.env.META_WHATSAPP_APP_ID,
 publicBaseUrl:process.env.RENTKA_PUBLIC_BASE_URL,
}}
