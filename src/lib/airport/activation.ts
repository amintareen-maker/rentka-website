import type { AirportVehicleRule } from "./types";

export const airportRuleHasValidPricing = (rule: AirportVehicleRule) => rule.minimumFare > 0 && rule.additionalKmRate > 0;

export const getBookableAirportRules = (rules: AirportVehicleRule[]) =>
  rules.filter((rule) => rule.active && rule.pricingConfigured === true && airportRuleHasValidPricing(rule));

export const isAirportPricingReady = (enabled: boolean | undefined, rules: AirportVehicleRule[]) =>
  enabled === true && getBookableAirportRules(rules).length > 0;