import "server-only";
import type { PostAssignmentDeliveryConfig } from "./post-assignment-delivery-config-core";

export function getPostAssignmentDeliveryConfig(): PostAssignmentDeliveryConfig {
  return {
    driverTemplateName: process.env.META_WHATSAPP_DRIVER_FINAL_TEMPLATE_NAME,
    driverTemplateLanguage:
      process.env.META_WHATSAPP_DRIVER_FINAL_TEMPLATE_LANGUAGE,
    customerTemplateName:
      process.env.META_WHATSAPP_CUSTOMER_DETAILS_TEMPLATE_NAME,
    customerTemplateLanguage:
      process.env.META_WHATSAPP_CUSTOMER_DETAILS_TEMPLATE_LANGUAGE,
  };
}
