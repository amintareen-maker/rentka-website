import type { ExtractionResult } from "./types";

const date = (value: string) => { const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(value); if (!m) return ""; const iso = `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`; return new Date(`${iso}T00:00:00Z`).toISOString().slice(0,10) === iso ? iso : ""; };
const field = (value: string, confidence: number) => ({ value, confidence, source: "embedded_text" as const });
export function extractDocumentFields(text: string, kind: string, now = new Date()): ExtractionResult {
  try {
    const normalized = text.replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").slice(0, 100000);
    const fields: ExtractionResult["fields"] = {};
    const cnic = normalized.match(/\b\d{5}[- ]?\d{7}[- ]?\d\b/)?.[0];
    if (cnic && kind.includes("cnic")) fields.cnicNumber = field(cnic.replace(/\s/g,""), .96);
    const licence = normalized.match(/(?:licen[cs]e\s*(?:no|number)?\s*[:#-]?\s*)([A-Z0-9-]{5,24})/i)?.[1];
    if (licence && kind.includes("licence")) fields.licenceNumber = field(licence.toUpperCase(), .9);
    const expiry = normalized.match(/(?:exp(?:iry|ires|iration)?\s*(?:date)?\s*[:#-]?\s*)(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})/i)?.[1];
    if (expiry && date(expiry)) fields.licenceExpiryDate = field(date(expiry), .88);
    const issue = normalized.match(/(?:issue(?:d)?\s*(?:date)?\s*[:#-]?\s*)(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})/i)?.[1];
    if (issue && date(issue)) fields.licenceIssueDate = field(date(issue), .86);
    const registration = normalized.match(/(?:registration|reg(?:istration)?\s*no)\s*[:#-]?\s*([A-Z]{1,4}[- ]?\d{2,5}(?:[- ]?[A-Z])?)/i)?.[1];
    if (registration && kind.includes("vehicle")) fields.registrationNumber = field(registration.toUpperCase(), .87);
    const confident = Object.values(fields).some(x => x.confidence >= .85);
    return { status: confident ? "extracted" : Object.keys(fields).length ? "low_confidence" : "unavailable", fields, attemptedAt: now.toISOString(), engine: "rentka_local_embedded_text_v1" };
  } catch (error) { return { status: "failed", fields: {}, attemptedAt: now.toISOString(), engine: "rentka_local_embedded_text_v1", error: error instanceof Error ? error.message : "Extraction failed" }; }
}

export function printableDocumentText(buffer: Buffer) { return buffer.toString("latin1").replace(/[^\x20-\x7E\r\n]/g, " "); }
export function applicantConfirmedValue(current: string, extracted: string, accepted: boolean) { return current || (accepted ? extracted : ""); }
