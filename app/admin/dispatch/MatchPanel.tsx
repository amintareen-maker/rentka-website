import type { MatchCandidate, MatchProjection, SupplyRecipientProjection } from "@/lib/dispatch/matching-types";
import type { DispatchOfferRecord, DriverOfferProjection } from "@/lib/dispatch/offer-types";
import type { OperationalBooking } from "@/lib/dispatch/booking-types";
import { createBroadcastSafePreview,supplyBroadcastRecipients } from "@/lib/dispatch/broadcast-approval-core";
import { setMatchOverrideAction } from "./actions";
import OfferControls from "./OfferControls";
import BroadcastApproval from "./BroadcastApproval";

const CandidateCard = ({ bookingDocumentId, candidate, rank, offerProjection, offer }: {
  bookingDocumentId: string;
  candidate: MatchCandidate;
  rank?: number;
  offerProjection?: DriverOfferProjection;
  offer?: DispatchOfferRecord;
}) => <article className={`rounded-xl border ${candidate.manuallyIncluded ? "border-purple-300 bg-purple-50" : "border-green-200 bg-green-50"} p-4`}>
  <div className="flex flex-wrap items-start justify-between gap-2">
    <div>
      <p className="font-black text-[#0F2B46]">{rank ? `${rank}. ` : ""}{candidate.vendor.name}</p>
      <p className="font-bold">{candidate.driver.name} + {candidate.vehicle.label} — {candidate.vehicle.registrationNumber}</p>
      <p className="text-sm">Score: {candidate.score} · {candidate.compatibility.replaceAll("_", " ")}</p>
    </div>
    <form action={setMatchOverrideAction}>
      <input type="hidden" name="bookingDocumentId" value={bookingDocumentId}/>
      <input type="hidden" name="candidateId" value={candidate.id}/>
      <input type="hidden" name="mode" value="exclude"/>
      <button className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700">Exclude</button>
    </form>
  </div>
  <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">{candidate.reasons.map(reason => <li key={reason}>• {reason}</li>)}</ul>
  {offerProjection
    ? <OfferControls projection={offerProjection} offer={offer}/>
    : <p className="mt-3 rounded bg-red-50 p-2 text-xs font-bold text-red-700">Driver WhatsApp number is invalid or missing. Offer actions are unavailable.</p>}
</article>;

const SupplyRecipientPanel=({projection}:{projection:SupplyRecipientProjection})=><section className="mt-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4"><div><h4 className="font-black text-[#0F2B46]">Recommended Supply</h4><p className="text-xs text-slate-600">Grouped vendor-first recipient projection. D4 pair-level controls remain available below.</p></div><div className="mt-3 grid gap-3">{projection.top.map((candidate,index)=><article key={candidate.id} className="rounded-lg bg-white p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-black">{index+1}. {candidate.displayName}</p><p className="text-sm">Type: {candidate.classification==="vendor_managed"?"Vendor Managed":"Independent Owner-Driver"}</p></div><span className={`h-fit rounded-full px-2 py-1 text-xs font-bold ${candidate.sendReady?"bg-green-100 text-green-800":"bg-amber-100 text-amber-900"}`}>{candidate.sendReady?"Operational WhatsApp ready":"Operational WhatsApp unavailable"}</span></div><dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">Compatible vehicles</dt><dd className="font-bold">{candidate.eligibleVehicleCount}</dd></div><div><dt className="text-slate-500">Eligible drivers</dt><dd className="font-bold">{candidate.eligibleDriverCount}</dd></div><div><dt className="text-slate-500">Best pair score</dt><dd className="font-bold">{candidate.bestPairScore}</dd></div></dl><p className="mt-2 text-sm"><b>Best matching vehicle:</b> {candidate.bestVehicleLabel}</p><p className="mt-1 text-xs text-slate-500">{candidate.eligiblePairCount} eligible internal combination(s), grouped as one recipient.</p></article>)}{!projection.top.length&&<p className="rounded-lg bg-white p-3 text-sm">No supply account is eligible for automated recipient selection.</p>}</div>{projection.excluded.length>0&&<details className="mt-3 rounded-lg border border-blue-200 bg-white p-3"><summary className="cursor-pointer text-sm font-bold">Review-required / internal supply ({projection.excluded.length})</summary><div className="mt-2 grid gap-2 text-sm">{projection.excluded.map(item=><p key={item.supplyAccountId}><b>{item.displayName}</b> — {item.reason}</p>)}</div></details>}</section>;

export default function MatchPanel({
  bookingDocumentId,
  booking,
  projection,
  offerProjections = [],
  offers = [],
  currentBroadcastRevision = 0,
  activeBroadcastId = "",
  defaultOfferExpiresAt = "",
}: {
  bookingDocumentId: string;
  booking: OperationalBooking;
  projection: MatchProjection;
  offerProjections?: DriverOfferProjection[];
  offers?: DispatchOfferRecord[];
  currentBroadcastRevision?: number;
  activeBroadcastId?: string;
  defaultOfferExpiresAt?: string;
}) {
  const offerFor = (candidateId: string) => offers.find(item => item.candidateId === candidateId);
  const projectionFor = (candidateId: string) => offerProjections.find(item => item.candidateId === candidateId);

  return <section className="lg:col-span-2 rounded-xl border-2 border-[#0F2B46] bg-white p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-black text-[#0F2B46]">D3 Smart Matches + D4 Manual Dispatch</h3>
        <p className="text-sm text-slate-600">Admin-controlled dispatch. Broadcast approval queues records only; no message is sent yet.</p>
      </div>
      <a href={`/admin/dispatch?open=${bookingDocumentId}&matches=${bookingDocumentId}`} className="rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white">Refresh matches</a>
    </div>
    <p className="mt-2 text-xs text-slate-500">Conflict window: {projection.window.start} → {projection.window.end}. {projection.window.basis}.</p>
    {projection.supplyRecipients&&<SupplyRecipientPanel projection={projection.supplyRecipients}/>}

    {offers.length > 0 && <div className="mt-4 rounded-xl bg-slate-100 p-3">
      <h4 className="font-black">Driver Responses</h4>
      <div className="mt-2 grid gap-2 text-sm">{offers.map(offer => <div key={offer.id} className="rounded bg-white p-2">
        <b>{offer.recipientDisplayName??offer.driverName??offer.vendorName??"Historical recipient"}</b>{offer.vehicleRegistration?` — ${offer.vehicleRegistration}`:""} · <b>{offer.responseStatus === "available" ? "🟢 AVAILABLE" : offer.responseStatus === "declined" ? "🔴 DECLINED" : offer.responseStatus === "no_response" ? "⚪ NO RESPONSE" : offer.offerStage.replaceAll("_", " ")}</b>{offer.responseAt && ` · ${new Date(offer.responseAt).toLocaleString("en-PK")}`}
      </div>)}</div>
      <p className="mt-2 text-xs font-bold">Availability only — no driver or vehicle is assigned.</p>
    </div>}

    {!projection.ready
      ? <p className="mt-4 rounded-lg bg-amber-50 p-3 font-bold text-amber-900">Matching unavailable: {projection.unavailableReason}. Historical responses remain visible; new offer actions are disabled.</p>
      : <>
        <BroadcastApproval
          bookingDocumentId={bookingDocumentId}
          recipients={supplyBroadcastRecipients(projection.supplyRecipients?.eligible??[],projection.supplyRecipients?.top??[])}
          preview={createBroadcastSafePreview(booking)}
          currentRevision={currentBroadcastRevision}
          activeBroadcastId={activeBroadcastId}
          defaultOfferExpiresAt={defaultOfferExpiresAt}
        />
        <h4 className="mt-5 font-black">Recommended Top {projection.top.length}</h4>
        <div className="mt-2 grid gap-3">{projection.top.map((candidate, index) => <CandidateCard key={candidate.id} bookingDocumentId={bookingDocumentId} candidate={candidate} rank={index + 1} offerProjection={projectionFor(candidate.id)} offer={offerFor(candidate.id)}/>)}</div>
        {!projection.top.length && <p className="mt-2 rounded-lg bg-amber-50 p-3">No eligible combination was found. Review diagnostics below.</p>}
        <details className="mt-4 rounded-lg border p-3">
          <summary className="cursor-pointer font-bold">View all eligible ({projection.eligible.length})</summary>
          <div className="mt-3 grid gap-2">{projection.eligible.map(candidate => <div key={candidate.id}>
            <CandidateCard bookingDocumentId={bookingDocumentId} candidate={candidate} offerProjection={projectionFor(candidate.id)} offer={offerFor(candidate.id)}/>
            {!candidate.manuallyIncluded && <form action={setMatchOverrideAction} className="mt-1 text-right">
              <input type="hidden" name="bookingDocumentId" value={bookingDocumentId}/>
              <input type="hidden" name="candidateId" value={candidate.id}/>
              <input type="hidden" name="mode" value="include"/>
              <button className="rounded-lg border bg-white px-3 py-1.5 text-xs font-bold">Prioritize</button>
            </form>}
          </div>)}</div>
        </details>
        <details className="mt-3 rounded-lg border p-3">
          <summary className="cursor-pointer font-bold">Excluded / Not Eligible ({projection.excluded.length})</summary>
          <div className="mt-3 space-y-2">{projection.excluded.map((item, index) => <div key={`${item.kind}:${item.id}:${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm">
            <span><b>{item.kind}:</b> {item.label} — {item.reason}{item.critical && " (critical block)"}</span>
            {item.kind === "candidate" && !item.critical && <form action={setMatchOverrideAction}>
              <input type="hidden" name="bookingDocumentId" value={bookingDocumentId}/>
              <input type="hidden" name="candidateId" value={item.id}/>
              <input type="hidden" name="mode" value="include"/>
              <button className="rounded border bg-white px-2 py-1 text-xs font-bold">Include again</button>
            </form>}
          </div>)}</div>
        </details>
      </>}
  </section>;
}
