"use client";
import { useState } from "react";
import { MAX_CSV_BYTES } from "@/lib/whatsapp-campaigns/core";
import { csvPreview, importErrorCsv, previewResult, type PreviewRow } from "@/lib/whatsapp-campaigns/csv";
import { SOURCES, type Source, type ImportDetails } from "@/lib/whatsapp-campaigns/types";
import { confirmImport, previewImport } from "../actions";

const control = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const button = "rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
const labels = {
  totalRows: "Total CSV rows", rowsWithPhoneNumbers: "Rows with phone numbers",
  validContacts: "Valid normalized phone numbers", invalidPhones: "Invalid phone numbers",
  duplicatesWithinFile: "Duplicate numbers inside CSV", duplicatesAlreadyInDatabase: "Already-existing campaign contacts",
  newContacts: "New contacts to be created", contactsWithMultipleNumbers: "Contacts with multiple numbers",
  rowsWithoutPhoneNumbers: "Rows without phone numbers (skipped)",
};
function downloadErrors(rows: PreviewRow[]) {
  const url = URL.createObjectURL(new Blob([importErrorCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "campaign-import-errors.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CsvImport() {
  const [details, setDetails] = useState<ImportDetails>({ uploadId: "", audienceName: "", originalFilename: "" });
  const [csv, setCsv] = useState(""), [source, setSource] = useState<Source>("google_contacts");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewImport>> | null>(null);
  const [pending, setPending] = useState(false), [message, setMessage] = useState(""), [page, setPage] = useState(0);
  async function previewFile() {
    setPreview(null); setMessage(""); setPage(0);
    // Show safe parser validation errors locally. Database failures never expose server details.
    try { csvPreview(csv, source); } catch (error) { setMessage(error instanceof Error ? error.message : "Invalid CSV."); return; }
    setPending(true);
    try { setPreview(await previewImport(csv, source, details)); }
    catch { setMessage("Preview could not load. Check your admin session and retry. No contacts were saved."); }
    finally { setPending(false); }
  }
  async function confirm() {
    if (!preview) return;
    setPending(true); setMessage("Importing on the server in safe chunks. Keep this page open.");
    try {
      const result = await confirmImport(csv, source, preview.token, details);
      setMessage(`${result.audienceName} — Ready. ${result.created} contacts created and ${result.merged} duplicate merges across ${result.chunks} chunks. ${result.reusedChunks} chunks were already completed; totals include them. Invalid and phone-free rows were skipped. New contacts are eligible for campaign use.`);
      setPreview(null); setCsv("");
    } catch {
      setMessage("Import did not finish. Some chunks may already be saved. Check your admin session, preview this same file and Confirm Import again to resume safely. Existing opt-outs remain protected.");
    } finally { setPending(false); }
  }
  return <section className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-xl font-bold">Review CSV import</h2>
    <p className="my-3 text-sm text-slate-600">Upload a Google Contacts CSV directly, including multiple phone columns. Name/Phone CSVs are also supported. Maximum 5,000 rows, 20,000 phone values and 5 MB. Previewing never saves contacts.</p>
    <label className="block">Source for Name/Phone CSVs<select disabled={pending} className={`${control} mb-3 block w-full`} value={source} onChange={e => { setSource(e.target.value as Source); setPreview(null); }}>{SOURCES.map(value => <option key={value}>{value}</option>)}</select></label>
    <p className="mb-3 text-xs text-slate-600">Recognized Google exports always use google_contacts, regardless of the source selection.</p>
    <input aria-label="CSV file" type="file" accept=".csv,text/csv" disabled={pending} className="block w-full text-sm" onChange={async e => {
      const file = e.target.files?.[0]; setPreview(null); setCsv(""); setMessage(""); setPage(0);
      if (!file) return;
      setDetails({ uploadId: crypto.randomUUID(), audienceName: "", originalFilename: file.name });
      if (file.size > MAX_CSV_BYTES) { setMessage("CSV exceeds 5 MB."); return; }
      setPending(true);
      try { setCsv(await file.text()); } catch { setMessage("Unable to read the selected file."); } finally { setPending(false); }
    }} />
    <label className="mt-4 block">Audience / File Name<input className={`${control} block w-full`} required maxLength={120} disabled={pending} placeholder="File A" value={details.audienceName} onChange={e => { setDetails({ ...details, audienceName: e.target.value }); setPreview(null); }} /></label>
    <p className="mt-2 text-sm">Original filename: {details.originalFilename || "No file selected"}</p>
    <button className={`${button} mt-4`} disabled={pending || !csv || !details.audienceName.trim()} onClick={() => void previewFile()}>Preview import</button>
    <p role="status" aria-live="polite" className="my-3 text-sm">{message}</p>
    {preview && <div className="mt-4">
      <h3 className="text-xl font-bold">{preview.details.audienceName}</h3><p className="mb-2 text-sm">{preview.details.originalFilename}</p><p className="mb-3 text-sm font-bold">Detected format: {preview.format === "google_contacts" ? "Google Contacts" : "Name / Phone"} · Source: {preview.source}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm">{Object.entries(preview.counts).map(([key, count]) => <div key={key} className="rounded bg-slate-100 p-2"><dt>{labels[key as keyof typeof labels]}</dt><dd className="text-xl font-bold">{count}</dd></div>)}</dl>
      <p className="mt-3 font-bold">Eligible for this audience: {preview.eligibleForAudience} · Suppressed valid contacts: {preview.suppressedForAudience}</p>
      <p className="my-3 text-sm">Each valid phone is imported separately. Duplicate phones keep existing review and opt-out status; file approval is recorded separately from original contact source. Contacts uploaded through this campaign importer are considered eligible after Confirm Import. Opt-outs, invalid numbers and excluded contacts remain suppressed. Counts are checked again while saving.</p>
      <button className={button} disabled={pending} onClick={() => void confirm()}>{pending ? "Working…" : "Confirm Import"}</button>
      {preview.rows.some(row => row.error) && <button className="ml-3 text-sm underline" onClick={() => downloadErrors(preview.rows)}>Download invalid / skipped rows</button>}
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="mb-2 text-left">Phone preview — showing {page * 100 + 1}–{Math.min((page + 1) * 100, preview.rows.length)} of {preview.rows.length} entries</caption><thead><tr>{["CSV row", "Name", "Original phone", "Normalized phone", "Source", "Result"].map(title => <th className="p-2" key={title}>{title}</th>)}</tr></thead><tbody>{preview.rows.slice(page * 100, (page + 1) * 100).map((row, index) => <tr key={`${page}-${index}`} className="border-t"><td className="p-2">{row.row}</td><td className="p-2">{row.input.displayName || "—"}</td><td className="p-2 whitespace-nowrap">{row.input.phoneOriginal || "—"}</td><td className="p-2 whitespace-nowrap">{row.phoneE164 || "—"}</td><td className="p-2">{row.input.source}</td><td className="p-2">{previewResult(row)}{row.error && <span className="block text-red-800">{row.error}</span>}</td></tr>)}</tbody></table></div>
      <div className="mt-3 flex gap-3"><button className={control} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous preview rows</button><button className={control} disabled={(page + 1) * 100 >= preview.rows.length} onClick={() => setPage(page + 1)}>Next preview rows</button></div>
    </div>}
  </section>;
}
