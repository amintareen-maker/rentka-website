export type DriverOfferDeliveryConfig = {
  templateName?: string;
  templateLanguage?: string;
  vendorTemplateName?: string;
  vendorTemplateLanguage?: string;
  publicBaseUrl?: string;
};

export function requireDriverOfferDeliveryConfig(config: DriverOfferDeliveryConfig) {
  if (config.templateName !== "rentka_driver_trip_offer_v1") throw new Error("The approved Driver offer WhatsApp template is not configured.");
  if (!config.templateLanguage || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(config.templateLanguage)) throw new Error("The Driver offer template language is not configured.");
  let base: URL;
  try { base = new URL(config.publicBaseUrl ?? ""); } catch { throw new Error("The public RentKA URL is not configured."); }
  if (base.protocol !== "https:") throw new Error("The public RentKA URL must use HTTPS.");
  return { templateName: config.templateName, templateLanguage: config.templateLanguage, publicBaseUrl: base.origin };
}

export function requireBookingOfferDeliveryConfig(config:DriverOfferDeliveryConfig,recipientType:"vendor"|"independent_driver"){
 if(recipientType==="independent_driver")return requireDriverOfferDeliveryConfig(config);
 if(config.vendorTemplateName!=="rentka_vendor_trip_offer_v1")throw new Error("The approved Vendor offer WhatsApp template is not configured.");
 if(!config.vendorTemplateLanguage||!/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(config.vendorTemplateLanguage))throw new Error("The Vendor offer template language is not configured.");
 let base:URL;try{base=new URL(config.publicBaseUrl??"")}catch{throw new Error("The public RentKA URL is not configured.")}
 if(base.protocol!=="https:")throw new Error("The public RentKA URL must use HTTPS.");
 return{templateName:config.vendorTemplateName,templateLanguage:config.vendorTemplateLanguage,publicBaseUrl:base.origin};
}
