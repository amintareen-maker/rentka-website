import { MAX_CSV_BYTES, MAX_IMPORT_ROWS, MAX_IMPORT_PHONES, validateContact } from "./core.ts";
import { SOURCES, type ContactInput, type Source } from "./types.ts";

/** Quoted CSV parser supporting Google exports, UTF-8 BOM and embedded newlines. */
export function parseCsv(text: string): string[][] {
  if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_CSV_BYTES) throw new Error("CSV exceeds 5 MB.");
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  const pushRow = () => {
    row.push(cell);
    if (row.some(value => value.trim())) rows.push(row);
    row = []; cell = ""; closed = false;
    if (rows.length > MAX_IMPORT_ROWS + 1) throw new Error(`Import at most ${MAX_IMPORT_ROWS.toLocaleString()} CSV rows at a time.`);
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
      else cell += char;
      continue;
    }
    if (char === '"') { if (cell || closed) throw new Error("Malformed CSV quotation."); quoted = true; }
    else if (char === ',') { row.push(cell); cell = ""; closed = false; }
    else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; pushRow(); }
    else { if (closed) throw new Error("Unexpected text after CSV quotation."); cell += char; }
  }
  if (quoted) throw new Error("Unclosed CSV quotation.");
  if (cell || row.length || closed) pushRow();
  return rows;
}

export type PreviewRow = {
  row: number; input: ContactInput; phoneE164: string | null; error: string | null;
  duplicateInFile: boolean; duplicateInDatabase: boolean; noPhone: boolean;
};
export const previewResult = (row: PreviewRow) => row.error ? "Invalid" : row.duplicateInFile ? "Duplicate in CSV" : row.duplicateInDatabase ? "Already exists" : "New";

export function csvPreview(text: string, requestedSource: Source, existingPhones: Set<string> = new Set()) {
  if (!SOURCES.includes(requestedSource)) throw new Error("Invalid import source.");
  const [header, ...data] = parseCsv(text);
  if (!header || !data.length) throw new Error("CSV needs a header and at least one contact.");
  const columns = header.map(value => value.trim().toLowerCase());
  const named = columns.filter(Boolean);
  if (new Set(named).size !== named.length) throw new Error("Duplicate column headers are ambiguous.");
  const googlePhones = columns.flatMap((name, index) => /^phone\s+\d+\s*-\s*value$/.test(name) ? [index] : []);
  const googleNames = ["first name", "given name", "family name", "last name", "file as"];
  const google = googlePhones.length > 0 || googleNames.some(name => columns.includes(name));
  const phoneColumns = googlePhones.length ? googlePhones : columns.flatMap((name, index) => name === "phone" ? [index] : []);
  if (!google && (!columns.includes("name") || !phoneColumns.length)) throw new Error("Use a Google Contacts export or a CSV with Name and Phone columns.");
  const source: Source = google ? "google_contacts" : requestedSource;
  const seen = new Set<string>();
  const rows: PreviewRow[] = [];
  let rowsWithPhoneNumbers = 0, contactsWithMultipleNumbers = 0, phoneCount = 0;
  data.forEach((cells, index) => {
    const value = (...keys: string[]) => keys.map(key => cells[columns.indexOf(key)]?.trim() ?? "").find(Boolean) ?? "";
    const parts = [value("name prefix"), value("first name", "given name"), value("middle name", "additional name"), value("last name", "family name"), value("name suffix")].filter(Boolean).join(" ");
    const displayName = value("name", "full name") || parts || value("file as", "nickname", "organization name", "organization 1 - name");
    // Google may store multiple values in one cell separated by :::. Do not split on
    // punctuation used by phone formatting, or guess country codes for local numbers.
    const phones = phoneColumns.flatMap(column => {
      const original = cells[column] ?? "";
      return (google ? original.split(/\s*:::\s*/) : [original]).filter(phone => phone.trim());
    });
    if (phones.length) rowsWithPhoneNumbers++;
    if (phones.length > 1) contactsWithMultipleNumbers++;
    phoneCount += phones.length;
    if (phoneCount > MAX_IMPORT_PHONES) throw new Error(`CSV exceeds ${MAX_IMPORT_PHONES.toLocaleString()} phone values.`);
    for (const phoneOriginal of phones.length ? phones : [""]) {
      const input: ContactInput = { displayName, phoneOriginal, source, sourceReferenceId: "", category: "unknown", notes: "" };
      let phoneE164: string | null = null, error: string | null = null;
      try {
        if (cells.length !== header.length) throw new Error("Column count does not match header.");
        if (!phones.length) throw new Error("No phone number; row skipped.");
        phoneE164 = validateContact(input).phoneE164;
      } catch (e) { error = e instanceof Error ? e.message : "Invalid contact."; }
      const duplicateInFile = !!phoneE164 && seen.has(phoneE164);
      if (phoneE164) seen.add(phoneE164);
      rows.push({ row: index + 2, input, phoneE164, error, duplicateInFile, duplicateInDatabase: !!phoneE164 && existingPhones.has(phoneE164), noPhone: !phones.length });
    }
  });
  return { source, format: google ? "google_contacts" as const : "name_phone" as const, rows, counts: {
    totalRows: data.length, rowsWithPhoneNumbers,
    validContacts: rows.filter(row => !row.error).length,
    invalidPhones: rows.filter(row => row.error && !row.noPhone).length,
    duplicatesWithinFile: rows.filter(row => row.duplicateInFile).length,
    duplicatesAlreadyInDatabase: new Set(rows.filter(row => row.duplicateInDatabase).map(row => row.phoneE164)).size,
    newContacts: rows.filter(row => !row.error && !row.duplicateInFile && !row.duplicateInDatabase).length,
    contactsWithMultipleNumbers, rowsWithoutPhoneNumbers: data.length - rowsWithPhoneNumbers,
  } };
}

/** Quote CSV fields and neutralize spreadsheet formula injection in downloaded reports. */
export function importErrorCsv(rows: PreviewRow[]) {
  const cell = (value: string) => `"${(/^[\s]*[=+@\-]|^[\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
  return ["Row,Name,Original phone,Source,Reason", ...rows.filter(row => row.error).map(row => [String(row.row), row.input.displayName, row.input.phoneOriginal, row.input.source, row.error!].map(cell).join(","))].join("\r\n");
}
