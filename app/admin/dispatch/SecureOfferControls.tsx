"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DispatchOfferRecord } from "@/lib/dispatch/offer-types";
import { deliverDriverOfferAction, issueSecureDriverOfferAction, reviewDriverCounterAction } from "./actions";

const money = (minor: number) => `Rs. ${(minor / 100).toLocaleString("en-PK")}`;
const responseTitle = (offer: DispatchOfferRecord) => offer.responseStatus === "accepted"
  ? offer.negotiationStatus === "counter_agreed" ? "Counter Agreed — Awaiting Assignment" : "Accepted — Awaiting RentKA Confirmation"
  : offer.responseStatus === "countered" ? "Countered — Awaiting RentKA Review"
  : offer.responseStatus === "declined" ? `Declined${offer.declineReason ? ` — ${offer.declineReason.replaceAll("_", " ")}` : ""}`
  : offer.responseStatus.replaceAll("_", " ");

export default function SecureOfferControls({ bookingOperationalId, offer }: { bookingOperationalId: string; offer: DispatchOfferRecord }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const router = useRouter();

  const issue = async () => {
    setBusy(true); setError("");
    try {
      const result = await issueSecureDriverOfferAction(bookingOperationalId, offer.id);
      if (!result.ok) throw new Error(result.message);
      setLink(new URL(result.url!, window.location.origin).toString());
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to issue secure offer link.");
    } finally { setBusy(false); }
  };

  const review = async (form: FormData) => {
    if (!window.confirm("Confirm this counter-offer decision? This does not assign the booking or send WhatsApp.")) return;
    form.set("bookingOperationalId", bookingOperationalId);
    form.set("offerId", offer.id);
    form.set("expectedRevision", String(offer.offerRevision ?? 0));
    form.set("expectedCounterMinor", String(offer.requestedPayoutMinor ?? 0));
    setBusy(true); setError("");
    const result = await reviewDriverCounterAction(form);
    setBusy(false);
    if (!result.ok) setError(result.message);
    else {
      if (result.url) setLink(new URL(result.url, window.location.origin).toString());
      router.refresh();
    }
  };
  const copy = async () => { if (link) await navigator.clipboard.writeText(link); };
  const deliver = async () => {
    if (!offer.outboundMessageId || !window.confirm("Send this approved privacy-safe Driver offer through WhatsApp now?")) return;
    setBusy(true); setError("");
    const result = await deliverDriverOfferAction(offer.outboundMessageId);
    setBusy(false);
    if (!result.ok) setError(result.message);
    router.refresh();
  };
  const open = () => {
    if (link) window.open(`https://wa.me/${offer.driverWhatsappNumber}?text=${encodeURIComponent(`RentKA trip offer ${offer.bookingId}\nReview and respond securely: ${link}\nAccepting does not assign the booking.`)}`, "_blank", "noopener,noreferrer");
  };

  return <div className="mt-3 rounded border border-indigo-200 bg-indigo-50 p-3 text-xs">
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={issue} className="rounded bg-indigo-800 px-3 py-2 font-bold text-white">{link ? "Reissue Secure Link" : "Issue Secure Response Link"}</button>
      {link && <>
        <button onClick={copy} className="rounded border bg-white px-3 py-2 font-bold">Copy Link</button>
        <button onClick={open} className="rounded bg-green-700 px-3 py-2 font-bold text-white">Open WhatsApp with Link</button>
      </>}
    </div>
    <p className="mt-2"><b>{offer.driverName}:</b> {responseTitle(offer)}</p>
    <p><b>Portal:</b> {offer.portalStatus ?? "not issued"} · {offer.secureViewedAt ? "Viewed" : "Not viewed"} · Revision {offer.offerRevision ?? 0} · Delivery: {offer.notificationStatus ?? "not queued"}</p>
    <p>Original: {money(offer.approvedPayoutMinor)} · Current offer: {money(offer.currentOfferedPayoutMinor ?? offer.approvedPayoutMinor)}{offer.requestedPayoutMinor !== undefined && ` · Counter: ${money(offer.requestedPayoutMinor)}`}{offer.agreedPayoutMinor !== undefined && ` · Agreed: ${money(offer.agreedPayoutMinor)}`}</p>
    {offer.outboundMessageId && (offer.notificationStatus === "queued" || (offer.notificationStatus === "failed" && offer.failureRetryable)) && <button disabled={busy} onClick={deliver} className="mt-3 rounded bg-green-800 px-3 py-2 font-bold text-white">{offer.notificationStatus === "failed" ? "Retry Automated Delivery" : "Send Approved Offer"}</button>}
    {offer.notificationStatus === "outcome_unknown" && <p className="mt-2 rounded bg-amber-100 p-2 font-bold text-amber-900">Outcome unknown — do not retry automatically. Reconcile or use manual fallback.</p>}
    {offer.responseStatus === "countered" && <form action={review} className="mt-3 grid gap-2 rounded bg-white p-3 sm:grid-cols-2">
      <button name="counterAction" value="accept" className="rounded bg-green-700 px-3 py-2 font-bold text-white">Accept Counter</button>
      <button name="counterAction" value="reject" className="rounded bg-red-700 px-3 py-2 font-bold text-white">Reject Counter</button>
      <label className="font-bold">Revised payout (Rs)
        <input name="revisedPayout" inputMode="decimal" placeholder="8000" className="mt-1 w-full rounded border p-2"/>
      </label>
      <label className="font-bold">New expiry
        <input name="revisedExpiry" type="datetime-local" className="mt-1 w-full rounded border p-2"/>
      </label>
      <button name="counterAction" value="revised_offer" className="rounded bg-amber-700 px-3 py-2 font-bold text-white sm:col-span-2">Prepare Revised Offer</button>
    </form>}
    {error && <p role="alert" className="mt-2 font-bold text-red-700">{error}</p>}
    <p className="mt-2 text-slate-600">Manual WhatsApp only. Responses and delivery are separate. No response or counter decision assigns the booking.</p>
  </div>;
}
