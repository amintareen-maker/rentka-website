export const cleanText = (value: unknown, max = 2000) => typeof value === "string" ? value.trim().slice(0, max) : "";
export function normalizeCnic(value: unknown) { const digits = cleanText(value, 30).replace(/\D/g, ""); return /^\d{13}$/.test(digits) ? digits : ""; }
export function normalizeLicence(value: unknown) { return cleanText(value, 60).toUpperCase().replace(/[^A-Z0-9]/g, ""); }
export function normalizeRegistration(value: unknown) { return cleanText(value, 40).toUpperCase().replace(/[^A-Z0-9]/g, ""); }
export function normalizeVendorName(value: unknown) { return cleanText(value, 160).toLowerCase().replace(/\b(pvt|private|limited|ltd|rentals?|rent a car|cars?|fleet)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }
export function validIsoDate(value: unknown) { const text = cleanText(value, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ""; const date = new Date(`${text}T00:00:00Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === text ? text : ""; }
