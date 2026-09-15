export type PostAssignmentDeliveryConfig = {
  driverTemplateName?: string;
  driverTemplateLanguage?: string;
  customerTemplateName?: string;
  customerTemplateLanguage?: string;
};

const language = /^[a-z]{2,3}(?:_[A-Z]{2})?$/;
export function requirePostAssignmentDeliveryConfig(
  config: PostAssignmentDeliveryConfig,
  purpose: "driver_final_instructions" | "customer_driver_details",
) {
  const templateName =
      purpose === "driver_final_instructions"
        ? config.driverTemplateName
        : config.customerTemplateName,
    templateLanguage =
      purpose === "driver_final_instructions"
        ? config.driverTemplateLanguage
        : config.customerTemplateLanguage;
  if (!templateName?.trim())
    throw new Error(
      purpose === "driver_final_instructions"
        ? "The approved Driver final-instructions WhatsApp template is not configured."
        : "The approved Customer driver-details WhatsApp template is not configured.",
    );
  if (!templateLanguage || !language.test(templateLanguage))
    throw new Error(
      purpose === "driver_final_instructions"
        ? "The Driver final-instructions template language is not configured."
        : "The Customer driver-details template language is not configured.",
    );
  return { templateName: templateName.trim(), templateLanguage };
}
