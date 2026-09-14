"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fileAudience } from "@/lib/whatsapp-campaigns/core";
import type { Contact, FileAudienceView } from "@/lib/whatsapp-campaigns/types";
import { checkFileAudience, saveFileAudience } from "./actions";

export default function FileAudiences({ audiences, contacts }: { audiences: FileAudienceView[]; contacts: Contact[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  const [review, setReview] = useState<{ audienceId: string; campaignId: string; result: Awaited<ReturnType<typeof checkFileAudience>> } | null>(null);
  async function check(audienceId: string) {
    setPending(true); setMessage(""); setReview(null);
    try { const campaignId = crypto.randomUUID(); const result = await checkFileAudience(audienceId, campaignId); setReview({ audienceId, campaignId, result }); }
    catch { setMessage("Unable to preview this audience. Check that its import is complete and retry."); }
    finally { setPending(false); }
  }
  async function create() {
    if (!review) return; setPending(true); setMessage("");
    try { await saveFileAudience(review.audienceId, review.campaignId, review.result.fingerprint); setMessage(`Draft created from ${review.result.audienceName}. No messages sent.`); setReview(null); router.refresh(); }
    catch { setMessage("The audience may have changed. Run the audience check again before creating its draft."); }
    finally { setPending(false); }
  }
  return <section className="my-6 rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-xl font-bold">Uploaded file audiences / Import History</h2>
    <p className="my-3 text-sm text-slate-600">Choose one file by name. File size is independent of future send batches; files are never combined automatically. Use the file send panel for current campaign results and controlled sending.</p>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Audience / File", "Original CSV", "Imported", "Total valid", "New", "Existing", "CSV repeats", "Invalid", "Eligible now", "Campaign sent status", "Actions"].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead><tbody>{audiences.map(audience => {
      const live = fileAudience(contacts, audience.members);
      const sent = audience.members.filter(member => ["sent", "delivered", "read"].includes(member.sendStatus)).length;
      const delivered = audience.members.filter(member => ["delivered", "read"].includes(member.sendStatus)).length;
      const failed = audience.members.filter(member => member.sendStatus === "failed").length;
      return <tr key={audience.audienceId} className="border-t"><td className="p-2"><Link className="font-bold text-[#0F2B46] underline" href={`/admin/whatsapp-campaigns/contacts?audience=${audience.audienceId}`}>{audience.audienceName} — {audience.validCount} contacts</Link><p className="text-xs">{audience.importState === "completed" ? audience.status : audience.importState}</p></td><td className="p-2">{audience.originalFilename}</td><td className="p-2">{audience.createdAt.slice(0, 10)}</td><td className="p-2">{audience.validCount}</td><td className="p-2">{audience.newContactCount}</td><td className="p-2">{audience.existingContactCount}</td><td className="p-2">{audience.duplicateCount}</td><td className="p-2">{audience.invalidCount}</td><td className="p-2">{live.finalEligible}</td><td className="p-2">{sent ? `${sent} sent` : "Not sent"}<p className="text-xs">{delivered} delivered · {failed} failed</p></td><td className="p-2"><button className="rounded-lg bg-[#0F2B46] px-3 py-2 text-white disabled:opacity-50" disabled={pending || audience.importState !== "completed" || audience.status === "cancelled"} onClick={() => void check(audience.audienceId)}>Check {audience.audienceName} audience</button></td></tr>;
    })}</tbody></table></div>
    {!audiences.length && <p className="py-4 text-slate-500">No named file audiences yet. Existing contacts are preserved; confirm a named CSV to create its file membership.</p>}
    {review && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4"><h3 className="font-bold">{review.result.audienceName}</h3><p>File contacts: {review.result.fileContacts} · Suppressed: {review.result.suppressedCount} · Final eligible audience: {review.result.finalEligible}</p><p className="my-2 text-sm">Checks include current opt-outs, exclusions, valid E.164, duplicate numbers and same-campaign send locks. These checks run again when saving.</p><button disabled={pending || !review.result.finalEligible} className="rounded-lg bg-[#0F2B46] px-4 py-2 font-bold text-white disabled:opacity-50" onClick={() => void create()}>Create Audience from {review.result.audienceName}</button></div>}
    <p role="status" className="mt-3 text-sm">{message}</p>
  </section>;
}
