export type TrackingPayload = Record<string, unknown>;

export const GOOGLE_ADS_LEAD_DESTINATION =
  "AW-18044696705/e9EwCIuvgaMcEIHxsJxD";

export function trackDataLayer(
  event: string,
  payload: TrackingPayload = {},
) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

export function trackGoogleAdsLead(payload: TrackingPayload) {
  trackDataLayer("google_ads_conversion", {
    send_to: GOOGLE_ADS_LEAD_DESTINATION,
    ...payload,
  });
}

export function trackMetaPixel(
  event: string,
  payload: TrackingPayload = {},
) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, payload);
}

export function trackWhatsAppClick(source: string) {
  trackDataLayer("whatsapp_click", { source });
}

