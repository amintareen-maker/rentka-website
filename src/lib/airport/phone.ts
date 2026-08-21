export function normalizeAirportPhone(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/[\s().-]/g, "") : "";
}

export function isValidAirportPhone(value: unknown) {
  const phone = normalizeAirportPhone(value);
  return /^03\d{9}$/.test(phone) || /^\+[1-9]\d{7,14}$/.test(phone);
}
