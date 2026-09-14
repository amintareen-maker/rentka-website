"use client";
import { useEffect, useRef, useState } from "react";
import TemplateMessagePreview from "./TemplateMessagePreview";
import { templateConfirmationReady } from "@/lib/whatsapp-campaigns/template-preview";
import type { Contact, FileAudienceView } from "@/lib/whatsapp-campaigns/types";
import { fileAudience } from "@/lib/whatsapp-campaigns/core";
import { SEND_STATUSES, type GateStatus, type SendMode, type SendRecord, type SendSummary } from "@/lib/whatsapp-campaigns/send-types";
import { audienceSendResults, confirmAudienceSend, processAudienceSend, reviewAudienceSend } from "./send-actions";

const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40";
const labels: Record<string, string> = { imported: "Imported members", valid: "Valid members", eligibleNow: "Eligible now", optedOut: "Opted out", excluded: "Excluded", invalid: "Invalid", duplicates: "Duplicates suppressed", alreadySent: "Already sent this campaign", currentlyLocked: "Locked / uncertain", otherSuppressed: "Other suppressed", suppressed: "Suppressed", willSend: "Will actually send" };
type Review = Awaited<ReturnType<typeof reviewAudienceSend>>;

export default function AudienceSender({ audiences, contacts, gate }: { audiences: FileAudienceView[]; contacts: Contact[]; gate: GateStatus }) {
  return <section className="my-6 space-y-4"><h2 className="text-2xl font-bold">RentKA Introduction — file sends</h2>
    <p>Review and confirm one file at a time. Each file runs in small server chunks. Leaving this page stops requesting new chunks; use a confirmed Resume to continue. No other file starts automatically.</p>
    {gate.blockers.length > 0 && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">{gate.blockers.map(text => <p key={text}>{text}</p>)}</div>}
    {audiences.filter(a => a.importState === "completed").map(audience => <Audience key={audience.audienceId} audience={audience} contacts={contacts} gate={gate} />)}
  </section>;
}
function Audience({ audience, contacts, gate }: { audience: FileAudienceView; contacts: Contact[]; gate: GateStatus }) {
  const live = fileAudience(contacts, audience.members);
  const [state, setState] = useState<SendSummary | null>(audience.sendState ?? null);
  const [previewImageReady, setPreviewImageReady] = useState(false);
  const [review, setReview] = useState<Review | null>(null), [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false), [running, setRunning] = useState(false), [message, setMessage] = useState("");
  const [records, setRecords] = useState<SendRecord[] | null>(null), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const mounted = useRef(true), stop = useRef(false), executing = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop.current = true; }; }, []);
  async function inspect(mode: SendMode) {
    setBusy(true); setMessage(""); setPhrase(""); setPreviewImageReady(false); setReview(null);
    try { setReview(await reviewAudienceSend(audience.audienceId, mode)); }
    catch { setMessage("Unable to review this file. Refresh its results and try again."); }
    finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true);
    try { const result = await audienceSendResults(audience.audienceId); setState(result.state); setRecords(result.records); }
    catch { setMessage("Unable to load results."); }
    finally { setBusy(false); }
  }
  async function execute() {
    if (!review || executing.current || !previewImageReady || !templateConfirmationReady(review.templatePreview, phrase, review.confirmation)) return;
    executing.current = true; stop.current = false; setRunning(true); setMessage("");
    try {
      const approved = await confirmAudienceSend(review.token, phrase); setState(approved); setReview(null); setPhrase("");
      while (mounted.current && !stop.current) {
        const result = await processAudienceSend(audience.audienceId, approved.approvalId);
        if (!mounted.current) break;
        setState(result.state);
        if (!result.hasMore) { if (result.busy) setMessage("No new worker started. Refresh results to see the current run."); break; }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (mounted.current) await refresh();
    } catch { if (mounted.current) setMessage("Processing stopped. Refresh results and review again before resuming. The live gate, eligibility, or worker state may have changed; uncertain attempts will not be retried."); }
    finally { executing.current = false; if (mounted.current) setRunning(false); }
  }
  async function control(action: "pause" | "cancel") {
    stop.current = true;
    try {
      const response = await fetch("/api/admin/whatsapp-campaigns/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audienceId: audience.audienceId, action }) });
      if (!response.ok) throw new Error();
      setState((await response.json()).state); setMessage(action === "pause" ? "Paused. Any current in-flight request may finish." : "This file send is cancelled.");
    } catch { setMessage("Control request failed. Refresh results and try Pause again."); }
  }
  const counts = state?.counts;
  const filtered = records?.filter(record => (!status || record.status === status) && `${record.displayName} ${record.phoneE164}`.toLowerCase().includes(search.toLowerCase()));
  return <article className="rounded-xl border bg-white p-5 shadow-sm">
    <h3 className="text-xl font-bold">{audience.audienceName}</h3><p className="text-sm text-slate-600">{audience.originalFilename}</p>
    <p className="my-2 font-semibold">Status: {state?.status ?? "ready"} · {live.finalEligible} eligible before campaign checks · {counts?.suppressed ?? live.suppressedCount} suppressed · {counts?.sentTotal ?? 0} sent</p>
    <p className="text-sm">Imported {audience.members.length} · Target {state?.targetCount ?? "Review required"} · Attempted {counts?.attempted ?? 0} · Accepted {counts?.acceptedTotal ?? 0} · Delivered {counts?.deliveredTotal ?? 0} · Read {counts?.readTotal ?? 0} · Failed {counts?.failed ?? 0} · Remaining {(counts?.pending ?? 0) + (counts?.locked ?? 0) + (counts?.sending ?? 0)} · Unknown {counts?.unknown ?? 0}</p>
    <p className="my-2 text-sm">Last send: {state?.lastSendAt ?? "Never"}</p>
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={busy || running} onClick={() => void inspect("send")}>Review / Send {audience.audienceName}</button>
      <button className={button} disabled={busy} onClick={() => void refresh()}>Recipient results / Refresh</button>
      {!!counts?.failed && state?.status !== "cancelled" && <button className={button} disabled={busy || running} onClick={() => void inspect("retry")}>Retry Failed</button>}
      {state && state.status !== "cancelled" && state.status !== "completed" && <>
        <button className={button} onClick={() => void control("pause")}>Pause</button>
        <button className={button} disabled={busy || running} onClick={() => void inspect("resume")}>Review Resume</button>

        <button className={button} onClick={() => { if (window.confirm(`Cancel sending ${audience.audienceName}? This cannot be resumed.`)) void control("cancel"); }}>Cancel file send</button>
      </>}
    </div>
    {review && <div className="my-4 rounded-xl border-2 border-slate-500 p-4">
      <h4 className="text-lg font-bold">Pre-send review: {review.audienceName}</h4>
      <p>{review.campaignName} · {review.originalFilename}</p><p>Template: {review.templateName} · Language: {review.templateLanguage} · Category: {review.templatePreview?.category ?? "Unavailable"}</p>
      <p className="break-all">IMAGE header: <a className="underline" href={review.headerUrl} target="_blank" rel="noreferrer">{review.headerUrl}</a> · {review.gate.headerReady ? "JPEG ready locally" : "Unavailable"}</p>
      <p className="mt-3 font-bold">Audience: {review.audienceName} · Will actually send: {review.counts.willSend}</p>
      <TemplateMessagePreview preview={review.templatePreview} onImageReady={setPreviewImageReady} />
      {review.templatePreview && !previewImageReady && <p role="status" className="text-sm text-amber-800">The header image must load before confirming. If it fails, close this review and try again.</p>}
      <dl className="my-3 grid grid-cols-2 gap-2 md:grid-cols-3">{Object.entries(review.counts).map(([key, value]) => <div key={key}><dt className="text-sm text-slate-600">{labels[key] ?? key}</dt><dd className="font-bold">{value}</dd></div>)}</dl>
      {review.gate.blockers.map(text => <p className="font-semibold text-amber-800" key={text}>{text}</p>)}
      <label className="my-3 block">Type <strong>{review.confirmation}</strong><input className="mt-2 block w-full rounded border p-2" value={phrase} onChange={event => setPhrase(event.target.value)} autoComplete="off" /></label>
      <button className={button} disabled={running || busy || !!gate.blockers.length || !!review.gate.blockers.length || !review.counts.willSend || !previewImageReady || !templateConfirmationReady(review.templatePreview, phrase, review.confirmation)} onClick={() => void execute()}>Confirm {review.mode === "retry" ? "Retry Failed" : review.mode === "resume" ? "Resume" : "Send"}</button>
      <button className={`${button} ml-2`} disabled={running} onClick={() => setReview(null)}>Close review</button>
    </div>}
    <p role="status" className="my-3">{running ? "Processing this file in server chunks. " : ""}{message}</p>
    {records && <div className="mt-4"><h4 className="font-bold">Recipient results</h4>
      <div className="my-2 flex flex-wrap gap-2"><input aria-label="Search name or phone" placeholder="Search name or phone" className="rounded border p-2" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filter status" className="rounded border p-2" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{SEND_STATUSES.map(value => <option key={value}>{value}</option>)}</select></div>
      <p className="text-sm">{filtered?.length} matches. Showing the first 200; narrow the filters for more.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Name", "Phone", "Status", "Attempts", "Provider message ID", "Last update", "Result"].map(title => <th className="p-2" key={title}>{title}</th>)}</tr></thead><tbody>{filtered?.slice(0, 200).map(row => <tr className="border-t" key={row.membershipId}><td className="p-2">{row.displayName}</td><td className="p-2">{row.phoneE164}</td><td className="p-2">{row.status}</td><td className="p-2">{row.attemptCount}</td><td className="max-w-52 break-all p-2">{row.providerMessageId ?? "—"}</td><td className="p-2">{row.updatedAt}</td><td className="p-2">{row.errorMessage ?? "—"}</td></tr>)}</tbody></table></div>
    </div>}
  </article>;
}
