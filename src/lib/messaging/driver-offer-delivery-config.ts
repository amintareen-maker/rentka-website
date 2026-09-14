import "server-only";
import type { DriverOfferDeliveryConfig } from "./driver-offer-delivery-config-core";

export function getDriverOfferDeliveryConfig(): DriverOfferDeliveryConfig {
  return {
    templateName: process.env.META_WHATSAPP_DRIVER_OFFER_TEMPLATE_NAME,
    templateLanguage: process.env.META_WHATSAPP_DRIVER_OFFER_TEMPLATE_LANGUAGE,
    vendorTemplateName: process.env.META_WHATSAPP_VENDOR_OFFER_TEMPLATE_NAME,
    vendorTemplateLanguage: process.env.META_WHATSAPP_VENDOR_OFFER_TEMPLATE_LANGUAGE,
    publicBaseUrl: process.env.RENTKA_PUBLIC_BASE_URL,
  };
}
