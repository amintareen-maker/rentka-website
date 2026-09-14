"use client";
import { useState } from "react";
import Link from "next/link";
import { INTRODUCTION, type Campaign, type FileAudienceView, type Contact } from "@/lib/whatsapp-campaigns/types";
import { saveAudience } from "./actions";
import FileAudiences from "./FileAudiences";
export default function Drafts({ campaigns, audiences, contacts }: { campaigns: Campaign[]; audiences: FileAudienceView[]; contacts: Contact[] }) {
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  async function create() {
    setPending(true); const id = requestId ?? crypto.randomUUID(); setRequestId(id);
    try { await saveAudience([], id); setMessage("Empty draft saved. Choose an uploaded file audience below."); setRequestId(null); }
    catch { setMessage("Unable to save draft. Check your admin session and database configuration, then retry."); }
    finally { setPending(false); }
  }
  return <><h1 className="text-3xl font-black text-[#0F2B46]">WhatsApp campaign drafts</h1><section className="my-6 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{INTRODUCTION.name}</h2><p className="mt-2">Template: {INTRODUCTION.templateName} · {INTRODUCTION.templateLanguage} · {INTRODUCTION.templateCategory} · IMAGE header</p><p className="mt-2 break-all text-sm">Header path: /whatsapp/rentka-introduction-header.jpg</p><p className="mt-2 text-sm text-amber-800">The file-send review above shows the current header image and live-gate status.</p><button onClick={create} disabled={pending} className="mt-4 rounded-lg bg-[#0F2B46] px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Create empty draft"}</button><Link className="ml-4 underline" href="/admin/whatsapp-campaigns/contacts">Upload named file audiences</Link></section><p role="status">{message}</p><FileAudiences audiences={audiences} contacts={contacts} /><div className="grid gap-4">{campaigns.map(c => <article key={c.campaignId} className="rounded-xl bg-white p-5"><h2 className="font-bold">{c.name}</h2><p className="font-semibold">Audience source: {c.audienceSources?.map(source => source.audienceName).join(", ") || "No file selected"}</p>{c.audienceSources?.map(source => <p key={source.audienceId} className="text-sm">Imported: {source.importedCount} · Eligible at creation: {source.eligibleCount} · Suppressed: {source.suppressedCount}</p>)}<p>{c.status} · {c.audienceCount} contacts · {c.createdAt.slice(0, 10)}</p><p className="mt-1 text-xs text-slate-500">Draft ID: {c.campaignId}</p><p className="mt-2 text-sm">Audience is a snapshot. Suppressions must be checked again before any future send.</p></article>)}{!campaigns.length && <p>No campaign drafts yet.</p>}</div></>;
}
