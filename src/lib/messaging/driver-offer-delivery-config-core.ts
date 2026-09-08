export type DriverOfferDeliveryConfig = {
  templateName?: string;
  templateLanguage?: string;
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
