export function nextAirportPricingVersion(persistedVersion?: number) {
  return persistedVersion === undefined ? 1 : persistedVersion + 1;
}
