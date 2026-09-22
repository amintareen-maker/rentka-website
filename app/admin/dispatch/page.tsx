import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";
import DispatchAdminNav from "../_components/DispatchAdminNav";
import { input, label } from "../_components/DispatchFormFields";
import {
  getOperationalBooking,
  listOperationalBookings,
  listOperationalEvents,
} from "@/lib/dispatch/booking-repository";
import {
  OPERATIONAL_SOURCE_TYPES,
  type OperationalBooking,
} from "@/lib/dispatch/booking-types";
import { NORMAL_RENTAL_ZONES } from "@/lib/normal-rental/zones";
import {
  applyCustomerDiscountInlineAction,
  cancelBookingInlineAction,
  createManualBookingAction,
  importBookingAction,
  overridePaymentInlineAction,
  recordPaymentInlineAction,
  reviewPayoutInlineAction,
  updateResponsibilitiesInlineAction,
} from "./actions";
import { formatDispatchAdminDate } from "@/lib/dispatch/validation";
import ManualBookingForm from "./ManualBookingForm";
import { listDispatchVehicles } from "@/lib/dispatch/vehicles";
import { getDispatchOfferPanel } from "@/lib/dispatch/offer-repository";
import MatchPanel from "./MatchPanel";
import OperationalResponsibilities from "./OperationalResponsibilities";
import { getAssignmentPanel } from "@/lib/dispatch/assignment-repository";
import AssignmentPanel from "./AssignmentPanel";
import { getDriverInstructionsPanel } from "@/lib/dispatch/driver-instructions-repository";
import DriverInstructions from "./DriverInstructions";
import { getCustomerDriverDetailsPanel } from "@/lib/dispatch/customer-driver-details-repository";
import CustomerDriverDetails from "./CustomerDriverDetails";
import { getTripOperationsPanel } from "@/lib/dispatch/trip-operations-repository";
import TripOperations from "./TripOperations";
import { getTripSettlementPanel } from "@/lib/dispatch/settlement-repository";
import SecureOfferControls from "./SecureOfferControls";
import TripSettlement from "./TripSettlement";
import { getDispatchBroadcastPanel } from "@/lib/dispatch/broadcast-approval-repository";
import VendorSecureOfferControls from "./VendorSecureOfferControls";
import { createManualVendorOfferMessage } from "@/lib/dispatch/post-assignment-messaging-core";
import { supplierResponsePresentation } from "@/lib/dispatch/admin-presentation";
import { deriveAdminDispatchWorkflow } from "@/lib/dispatch/admin-workflow-core";
import BookingWorkflow from "./BookingWorkflow";
import InlineActionForm from "./InlineActionForm";

// D7 source-contract anchors retained across formatting:
// q.open?getOperationalBooking(q.open) opened&&!filtered.some [opened,...filtered] no contact or assignment

export const metadata: Metadata = {
  title: "Dispatch Queue | RentKA Admin",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

const money = (n: number) =>
  `Rs ${(n / 100).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
const tabs = [
  "all",
  "awaiting_advance",
  "advance_recorded",
  "needs_vendor_payout",
  "ready_for_dispatch",
  "override_approved",
  "cancelled",
] as const;
const badge = (s: string) =>
  s === "ready_for_dispatch"
    ? "bg-green-100 text-green-800"
    : s === "cancelled"
      ? "bg-red-100 text-red-800"
      : s === "override_approved"
        ? "bg-purple-100 text-purple-800"
        : "bg-amber-50 text-amber-900";

function Financials({ b }: { b: OperationalBooking }) {
  const values = [
    [
      "Original sale",
      b.customerFinancials.originalCustomerTotalMinor ??
        b.customerFinancials.customerTotalMinor,
    ],
    ["Discounts", b.customerFinancials.customerDiscountTotalMinor ?? 0],
    [
      "Final sale",
      b.customerFinancials.finalCustomerTotalMinor ??
        b.customerFinancials.customerTotalMinor,
    ],
    ["Required advance", b.customerFinancials.requiredAdvanceMinor],
    ["Received", b.customerFinancials.receivedAmountMinor],
    ["Balance", b.customerFinancials.balanceMinor],
    ["Refund / credit due", b.customerFinancials.refundCreditDueMinor ?? 0],
  ] as const;
  return (
    <>
      <div className="grid gap-3 rounded-xl bg-blue-50 p-4 text-sm sm:grid-cols-4 lg:grid-cols-7">
        {values.map(([title, value]) => (
          <div key={title}>
            <p className="text-slate-500">{title}</p>
            <b>{money(value)}</b>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
        <b>Internal vendor payout:</b>{" "}
        {b.internalFinancials.payoutStatus === "reviewed"
          ? money(b.internalFinancials.vendorPayoutMinor ?? 0)
          : "Needs review"}
      </div>
    </>
  );
}

function D2Forms({ b }: { b: OperationalBooking }) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <InlineActionForm
        action={recordPaymentInlineAction}
        className="rounded-xl border p-4"
        label="Record payment"
        pendingLabel="Recording payment…"
        buttonClassName="mt-3 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white"
      >
        <input type="hidden" name="bookingDocumentId" value={b.id} />
        <h3 className="font-black">Record Payment</h3>
        <label className={`${label} mt-3 block`}>
          Amount (Rs)
          <input className={input} required name="amount" inputMode="decimal" />
        </label>
        <label className={`${label} mt-2 block`}>
          Method
          <select className={input} name="method">
            <option value="">Not specified</option>
            <option>Bank transfer</option>
            <option>Cash</option>
            <option>JazzCash</option>
            <option>Easypaisa</option>
            <option>Other</option>
          </select>
        </label>
        <label className={`${label} mt-2 block`}>
          Reference
          <input className={input} name="reference" />
        </label>
        <label className={`${label} mt-2 block`}>
          Note
          <input className={input} name="note" />
        </label>
      </InlineActionForm>

      <InlineActionForm
        action={applyCustomerDiscountInlineAction}
        className="rounded-xl border border-amber-200 bg-amber-50 p-4"
        label="Apply discount"
        pendingLabel="Applying discount…"
        buttonClassName="mt-3 rounded-lg bg-amber-700 px-4 py-2 font-bold text-white"
      >
        <input type="hidden" name="bookingDocumentId" value={b.id} />
        <h3 className="font-black">Apply Customer Discount / Adjustment</h3>
        <p className="mt-1 text-xs">
          Reduces final customer sale only. Vendor payout is unchanged.
        </p>
        <label className={`${label} mt-3 block`}>
          Discount amount (Rs)
          <input className={input} required name="discountAmount" inputMode="decimal" />
        </label>
        <label className={`${label} mt-2 block`}>
          Mandatory reason
          <input className={input} required minLength={3} name="discountReason" />
        </label>
      </InlineActionForm>

      <InlineActionForm
        action={reviewPayoutInlineAction}
        className="rounded-xl border p-4"
        label="Approve payout review"
        pendingLabel="Saving payout…"
        buttonClassName="mt-3 rounded-lg bg-green-700 px-4 py-2 font-bold text-white"
      >
        <input type="hidden" name="bookingDocumentId" value={b.id} />
        <h3 className="font-black">Review Vendor Payout</h3>
        <label className={`${label} mt-3 block`}>
          Approved payout (Rs)
          <input
            className={input}
            required
            name="vendorPayout"
            inputMode="decimal"
            defaultValue={
              b.internalFinancials.vendorPayoutMinor !== undefined
                ? b.internalFinancials.vendorPayoutMinor / 100
                : ""
            }
          />
        </label>
        <label className={`${label} mt-2 block`}>
          Internal payout notes
          <input className={input} name="payoutNotes" defaultValue={b.internalFinancials.payoutNotes} />
        </label>
      </InlineActionForm>

      <details className="lg:col-span-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
        <summary className="cursor-pointer font-black text-slate-800">
          Advanced / Exceptions
        </summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <InlineActionForm
            action={overridePaymentInlineAction}
            className="rounded-xl border border-purple-200 bg-purple-50 p-4"
            label="Approve override"
            pendingLabel="Approving override…"
            buttonClassName="mt-3 rounded-lg bg-purple-800 px-4 py-2 font-bold text-white"
            confirmMessage="Approve dispatch before payment for this booking?"
          >
            <input type="hidden" name="bookingDocumentId" value={b.id} />
            <h3 className="font-black text-purple-900">Dispatch Before Payment</h3>
            <p className="mt-1 text-xs">Does not bypass vendor payout review.</p>
            <label className={`${label} mt-3 block`}>
              Mandatory exception reason
              <input className={input} required minLength={8} name="overrideReason" />
            </label>
          </InlineActionForm>

          <InlineActionForm
            action={cancelBookingInlineAction}
            className="rounded-xl border border-red-200 bg-white p-4"
            label="Confirm stop"
            pendingLabel="Stopping…"
            buttonClassName="mt-3 rounded-lg bg-red-700 px-4 py-2 font-bold text-white"
            confirmMessage="Stop processing this booking?"
          >
            <input type="hidden" name="bookingDocumentId" value={b.id} />
            <h3 className="font-black text-red-800">Stop Processing</h3>
            <select className={input} name="cancellationType">
              <option value="not_proceeding">Not proceeding</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <label className={`${label} mt-2 block`}>
              Reason
              <input className={input} required name="cancellationReason" />
            </label>
          </InlineActionForm>

          <InlineActionForm
            action={updateResponsibilitiesInlineAction}
            className="lg:col-span-2 rounded-xl border bg-white p-4"
            label="Save Operational Responsibilities"
            pendingLabel="Saving responsibilities…"
            buttonClassName="mt-3 rounded-lg bg-[#0F2B46] px-4 py-2 font-bold text-white"
          >
            <input type="hidden" name="bookingDocumentId" value={b.id} />
            <OperationalResponsibilities
              service={b.serviceType}
              initial={b.responsibilities as never}
            />
            <p className="mt-2 text-xs text-slate-500">
              Does not change customer sale, payments, readiness or vendor payout.
            </p>
          </InlineActionForm>
        </div>
      </details>
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/pricing-calculator");
  const q = await searchParams;
  const [all, vehicles, opened] = await Promise.all([
    listOperationalBookings(),
    listDispatchVehicles(),
    q.open ? getOperationalBooking(q.open) : Promise.resolve(null),
  ]);
  const filtered = all.filter(
    (b) =>
      (!q.tab ||
        q.tab === "all" ||
        (q.tab === "advance_recorded"
          ? b.customerFinancials.paymentStatus === "sufficient"
          : b.readinessStatus === q.tab)) &&
      (!q.source || b.source.type === q.source) &&
      (!q.zone || b.zoneId === q.zone) &&
      (!q.date || b.itinerary.travelDate === q.date) &&
      (!q.search ||
        `${b.bookingId} ${b.customer.name} ${b.customer.phone}`
          .toLowerCase()
          .includes(q.search.toLowerCase())),
  );
  const rows =
    opened && !filtered.some((b) => b.id === opened.id)
      ? [opened, ...filtered]
      : filtered;
  const [
    events,
    offerPanel,
    assignmentPanel,
    instructionsPanel,
    customerDetailsPanel,
    tripOperationsPanel,
    settlementPanel,
    broadcastPanel,
  ] = await Promise.all([
    q.open ? listOperationalEvents(q.open) : Promise.resolve([]),
    q.open ? getDispatchOfferPanel(q.open) : Promise.resolve(null),
    q.open ? getAssignmentPanel(q.open) : Promise.resolve(null),
    q.open ? getDriverInstructionsPanel(q.open) : Promise.resolve(null),
    q.open ? getCustomerDriverDetailsPanel(q.open) : Promise.resolve(null),
    q.open ? getTripOperationsPanel(q.open) : Promise.resolve(null),
    q.open ? getTripSettlementPanel(q.open) : Promise.resolve(null),
    q.open ? getDispatchBroadcastPanel(q.open) : Promise.resolve(null),
  ]);
  const matches = offerPanel?.matches ?? null;
  const assignmentDrivers =
    assignmentPanel?.availableOffers
      .filter(
        (offer, index, offers) =>
          offers.findIndex((item) => item.driverId === offer.driverId) === index,
      )
      .map((offer) => {
        const driver = assignmentPanel.drivers.find((item) => item.id === offer.driverId);
        const vendor = assignmentPanel.vendors.find((item) => item.id === offer.vendorId);
        return driver && vendor
          ? {
              id: driver.id,
              name: driver.name,
              vendorId: vendor.id,
              vendorName: vendor.name,
              priority: driver.priority,
              phone: driver.mobileNumber,
              whatsapp: driver.whatsappNumber,
              responseAt: offer.responseAt,
              offerId: offer.id,
              vehicles: assignmentPanel.matches.eligible
                .filter((candidate) => candidate.driver.id === driver.id)
                .map((candidate) => {
                  const vehicle = assignmentPanel.vehicles.find(
                    (item) => item.id === candidate.vehicle.id,
                  )!;
                  return {
                    id: vehicle.id,
                    label: candidate.vehicle.label,
                    registrationNumber: vehicle.registrationNumber,
                    documentationState: vehicle.documentation.overallState,
                    reasons: candidate.reasons,
                  };
                }),
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => !!item) ?? [];

  const bookingHref = (id: string, showMatches = false) => {
    const params = new URLSearchParams();
    for (const key of ["tab", "source", "zone", "date", "search"] as const) {
      if (q[key]) params.set(key, q[key]!);
    }
    params.set("open", id);
    if (showMatches) params.set("matches", id);
    return `/admin/dispatch?${params.toString()}#booking-${id}`;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <DispatchAdminNav current="dispatch" />
        <header className="mb-6">
          <p className="text-sm font-bold uppercase tracking-widest text-[#5BAE4A]">RentKA operations</p>
          <h1 className="text-3xl font-black text-[#0F2B46]">Dispatch workspace</h1>
          <p className="text-slate-600">Move each booking through one clear next action. RentKA remains in control of every offer and assignment.</p>
        </header>
        {q.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-800">{q.error}</p>}
        {q.message && <p className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">{q.message}</p>}

        <div className="mb-6 grid gap-5 lg:grid-cols-2">
          <details className="rounded-2xl bg-white p-5">
            <summary className="cursor-pointer text-xl font-black">+ Create Manual Booking</summary>
            <ManualBookingForm action={createManualBookingAction} vehicles={vehicles} />
          </details>
          <details className="rounded-2xl bg-white p-5">
            <summary className="cursor-pointer text-xl font-black">Import Existing Booking</summary>
            <form action={importBookingAction} className="mt-4 grid gap-3">
              <label className={label}>
                Source
                <select className={input} name="sourceType">
                  {OPERATIONAL_SOURCE_TYPES.filter((x) => x !== "manual").map((x) => (
                    <option key={x} value={x}>{x.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Source document ID
                <input className={input} required name="sourceDocumentId" />
              </label>
              <button className="rounded-lg bg-[#0F2B46] px-5 py-3 font-bold text-white">Import into queue</button>
            </form>
          </details>
        </div>

        <nav className="mb-3 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t}
              href={`/admin/dispatch?tab=${t}`}
              className={`rounded-full px-3 py-2 text-xs font-bold ${q.tab === t || (!q.tab && t === "all") ? "bg-[#0F2B46] text-white" : "bg-white"}`}
            >
              {t.replaceAll("_", " ")}
            </Link>
          ))}
        </nav>
        <form className="mb-5 grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-5">
          <input className={input} name="search" placeholder="ID, customer or phone" defaultValue={q.search} />
          <select className={input} name="source" defaultValue={q.source ?? ""}>
            <option value="">All sources</option>
            {OPERATIONAL_SOURCE_TYPES.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select className={input} name="zone" defaultValue={q.zone ?? ""}>
            <option value="">All zones</option>
            {Object.entries(NORMAL_RENTAL_ZONES).map(([id, zone]) => <option key={id} value={id}>{zone.label}</option>)}
          </select>
          <input className={input} name="date" placeholder="YYYY-MM-DD" defaultValue={q.date} />
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-white">Filter</button>
        </form>

        <section className="grid gap-4">
          {rows.map((b) => {
            const isOpen = q.open === b.id;
            const offers = isOpen ? offerPanel?.offers ?? [] : [];
            const assignmentReady =
              assignmentDrivers.length > 0 ||
              Boolean(
                assignmentPanel?.vendorFulfillmentReviews.some(
                  (proposal) => proposal.current && proposal.assignmentEligible && proposal.agreedPayoutMinor !== undefined,
                ),
              );
            const workflow = deriveAdminDispatchWorkflow({
              lifecycle: b.lifecycle,
              readinessStatus: b.readinessStatus,
              assigned: b.assignment?.status === "assigned",
              matchesOpen: q.matches === b.id,
              offers,
              activeBroadcastId: broadcastPanel?.activeBroadcastId,
              assignmentReady,
            });
            const currentAccepted = workflow.currentOffers.find(
              (offer) => offer.responseStatus === "accepted",
            );

            const responseContent = (
              <section className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
                <h3 className="font-black text-indigo-950">Current Supplier Responses</h3>
                <p className="mt-1 text-sm text-slate-600">Only suppliers in the current offer round are actionable.</p>
                <div className="mt-3 space-y-3">
                  {workflow.currentOffers.map((offer) =>
                    offer.recipientType === "vendor" ? (
                      <VendorSecureOfferControls
                        key={offer.id}
                        bookingOperationalId={b.id}
                        offer={offer}
                        manualMessage={createManualVendorOfferMessage(b, offer)}
                      />
                    ) : offer.recipientType === "independent_driver" ? (
                      <div key={offer.id} className="rounded-lg bg-white p-3 text-sm">
                        {(() => {
                          const response = supplierResponsePresentation(offer);
                          return <><b>{response.recipientName}</b><p>{response.supplierType} · {response.responseLabel}</p><p className="mt-1 text-xs text-slate-500">Current offer: {money(response.currentPayoutMinor)}</p></>;
                        })()}
                      </div>
                    ) : (
                      <SecureOfferControls key={offer.id} bookingOperationalId={b.id} offer={offer} />
                    ),
                  )}
                  {!workflow.currentOffers.length && <p className="rounded-lg bg-white p-3 text-sm">No offers have been sent in the current round.</p>}
                </div>
                {workflow.historicalOffers.length > 0 && (
                  <details className="mt-4 rounded-lg border bg-white p-3">
                    <summary className="cursor-pointer font-bold">View offer history ({workflow.historicalOffers.length})</summary>
                    <div className="mt-3 space-y-2">
                      {workflow.historicalOffers.map((offer) => {
                        const response = supplierResponsePresentation(offer);
                        return <div key={offer.id} className="rounded bg-slate-50 p-2 text-sm"><b>{response.recipientName}</b> · revision {offer.offerRevision ?? 0} · {response.responseLabel}</div>;
                      })}
                    </div>
                  </details>
                )}
              </section>
            );

            const assignmentContent = assignmentPanel ? (
              <AssignmentPanel
                bookingDocumentId={b.id}
                bookingId={b.bookingId}
                payoutMinor={b.internalFinancials.vendorPayoutMinor ?? 0}
                current={b.assignment}
                drivers={assignmentDrivers}
                vendorProposals={assignmentPanel.vendorFulfillmentReviews}
              />
            ) : <p className="rounded-lg bg-amber-50 p-3 font-bold text-amber-900">Assignment information is unavailable. Refresh this booking before continuing.</p>;

            return (
              <article id={`booking-${b.id}`} key={b.id} className="scroll-mt-4 rounded-2xl bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">{b.bookingId}</h2>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${badge(b.readinessStatus)}`}>{workflow.dispatchState}</span>
                      {b.paymentOverride?.approved && <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-800">Payment override</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{NORMAL_RENTAL_ZONES[b.zoneId]?.label ?? b.zoneId} · {b.serviceType.replaceAll("_", " ")} · {b.requestedVehicle.categoryOrModel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Next action</p>
                    <p className="font-black text-[#0F2B46]">{workflow.nextAction}</p>
                    {!isOpen && <Link scroll={false} href={bookingHref(b.id)} className="mt-2 inline-block rounded-lg border px-4 py-2 text-sm font-bold">Open workflow</Link>}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-6">
                  <div><p className="text-slate-500">Trip</p><b>{formatDispatchAdminDate(b.itinerary.travelDate)} · {b.itinerary.pickupTime}</b></div>
                  <div><p className="text-slate-500">Route</p><b>{b.itinerary.pickup} → {b.itinerary.destinationOrUsage || "To confirm"}</b></div>
                  <div><p className="text-slate-500">Customer</p><b>{b.customer.name}</b><p>{b.customer.phone}</p></div>
                  <div><p className="text-slate-500">Payment</p><b>{b.customerFinancials.paymentStatus === "sufficient" ? "Ready" : money(b.customerFinancials.balanceMinor) + " balance"}</b></div>
                  <div><p className="text-slate-500">Payout</p><b>{b.internalFinancials.payoutStatus === "reviewed" ? money(b.internalFinancials.vendorPayoutMinor ?? 0) : "Needs review"}</b></div>
                  <div><p className="text-slate-500">Source</p><b>{b.source.type.replaceAll("_", " ")}</b></div>
                </div>

                {isOpen && (
                  <>
                    <BookingWorkflow
                      key={`${b.id}-${workflow.currentStage}`}
                      bookingId={b.id}
                      currentStage={workflow.currentStage}
                      stages={workflow.stages}
                      content={{
                        readiness: <><Financials b={b} /><D2Forms b={b} /></>,
                        find_supply: (
                          <div>
                            <h3 className="font-black">Find eligible supply</h3>
                            <p className="mt-1 text-sm text-slate-600">Matching checks availability, documents, relationships, vehicle fit and conflicts. No supplier is contacted.</p>
                            {b.readinessStatus === "ready_for_dispatch" && b.lifecycle === "active" ? (
                              <Link scroll={false} href={bookingHref(b.id, true)} className="mt-3 inline-block rounded-lg bg-[#0F2B46] px-4 py-2 font-bold text-white">Find Matches</Link>
                            ) : <p className="mt-3 rounded-lg bg-amber-50 p-3 font-bold text-amber-900">Complete booking readiness before matching.</p>}
                          </div>
                        ),
                        send_offers: matches && q.matches === b.id ? (
                          <MatchPanel
                            bookingDocumentId={b.id}
                            booking={b}
                            projection={matches}
                            offerProjections={offerPanel?.projections}
                            offers={workflow.currentOffers}
                            currentBroadcastRevision={broadcastPanel?.currentRevision}
                            activeBroadcastId={broadcastPanel?.activeBroadcastId}
                            defaultOfferExpiresAt={broadcastPanel?.defaultOfferExpiresAt}
                          />
                        ) : <Link scroll={false} href={bookingHref(b.id, true)} className="inline-block rounded-lg bg-[#0F2B46] px-4 py-2 font-bold text-white">Load supplier shortlist</Link>,
                        responses: responseContent,
                        fulfillment: (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <h3 className="font-black text-emerald-950">Driver & Vehicle</h3>
                            {currentAccepted?.recipientType === "vendor" ? (
                              currentAccepted.fulfillmentProposal?.status === "provided" ? assignmentContent : <p className="mt-2">The vendor accepted. Waiting for the vendor to propose an eligible driver and vehicle.</p>
                            ) : <p className="mt-2">Owner-driver flow uses the accepted supplier and eligible vehicle; no child-driver selection is required.</p>}
                          </div>
                        ),
                        assignment: assignmentReady ? assignmentContent : <p className="rounded-lg bg-amber-50 p-3 font-bold text-amber-900">A current accepted supplier and eligible driver/vehicle are required before final assignment.</p>,
                        notifications: (
                          <div className="space-y-4">
                            {assignmentContent}
                            {instructionsPanel && <DriverInstructions projection={instructionsPanel.projection} record={instructionsPanel.record} notification={instructionsPanel.notification} />}
                            {customerDetailsPanel && <CustomerDriverDetails projection={customerDetailsPanel.projection} record={customerDetailsPanel.record} notification={customerDetailsPanel.notification} />}
                            <details className="rounded-xl border p-4">
                              <summary className="cursor-pointer font-black">Trip Operations & Settlement</summary>
                              <div className="mt-4 space-y-4">
                                {tripOperationsPanel && <TripOperations projection={tripOperationsPanel.projection} />}
                                {settlementPanel && <TripSettlement projection={settlementPanel.projection} />}
                              </div>
                            </details>
                          </div>
                        ),
                      }}
                    />
                    <details className="mt-4 rounded-xl border p-4">
                      <summary className="cursor-pointer font-black">Audit history ({events.length})</summary>
                      <div className="mt-3 space-y-2">
                        {events.map((e) => <div key={String(e.id)} className="rounded-lg bg-slate-50 p-2 text-sm"><b>{String(e.type).replaceAll("_", " ")}</b> · {String(e.timestamp)}<pre className="overflow-auto text-xs">{JSON.stringify(e.metadata ?? {}, null, 2)}</pre></div>)}
                      </div>
                    </details>
                  </>
                )}
              </article>
            );
          })}
          {!rows.length && <p className="rounded-xl border border-dashed bg-white p-8 text-center">No operational bookings match these filters.</p>}
        </section>
      </div>
    </main>
  );
}
