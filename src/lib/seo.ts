export const SITE_URL = "https://rentka.co";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const LOGO_ID = `${SITE_URL}/#logo`;

export const VEHICLE_MODELS = [
  "toyota-corolla",
  "honda-civic",
  "toyota-prado",
  "toyota-hiace",
  "honda-br-v",
  "toyota-hilux",
  "honda-city",
  "suzuki-wagon-r",
  "toyota-yaris",
  "suzuki-alto",
] as const;

export const VEHICLE_CITIES = ["islamabad", "rawalpindi"] as const;
export const VEHICLE_SERVICE = "with-driver" as const;

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString().replace(/\/$/, path === "/" ? "/" : "");
}

export function isValidVehicleRoute(model: string, city: string, service: string) {
  return (
    VEHICLE_MODELS.includes(model as (typeof VEHICLE_MODELS)[number]) &&
    VEHICLE_CITIES.includes(city as (typeof VEHICLE_CITIES)[number]) &&
    service === VEHICLE_SERVICE
  );
}
