"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supplierResponsePresentation } from "@/lib/dispatch/admin-presentation";
import type { DispatchOfferRecord } from "@/lib/dispatch/offer-types";
import {
  deliverBookingOfferAction,
  issueSecureVendorOfferAction,
  reviewVendorCounterAction,
} from "./actions";

const money = (minor: number) =>
  `Rs. ${(minor / 100).toLocaleString("en-PK")}`;

export default function VendorSecureOfferControls({
  bookingOperationalId,
  offer,
}: {
  bookingOperationalId: string;
  offer: DispatchOfferRecord;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const router = useRouter();
  const response = supplierResponsePresentation(offer);

  const issue = async () => {
    setBusy(true);
    setError("");
    const result = await issueSecureVendorOfferAction(
      bookingOperationalId,
      offer.id,
    );
    setBusy(false);
    if (!result.ok) setError(result.message);
    else {
      setLink(new URL(result.url!, window.location.origin).toString());
      router.refresh();
    }
  };

  const retry = async () => {
    if (
      !offer.outboundMessageId ||
      !window.confirm(
        "Retry this known-safe Supplier delivery failure? The existing idempotent worker will revalidate current eligibility before sending.",
      )
    )
      return;
    setBusy(true);
    setError("");
    const result = await deliverBookingOfferAction(offer.outboundMessageId);
    setBusy(false);
    if (!result.ok) setError(result.message);
    router.refresh();
  };

  const review = async (form: FormData) => {
    if (
      !window.confirm(
        "Confirm this Vendor counter decision? This does not assign the booking or send WhatsApp.",
      )
    )
      return;
    form.set("bookingOperationalId", bookingOperationalId);
    form.set("offerId", offer.id);
    form.set("expectedRevision", String(offer.offerRevision ?? 0));
    form.set("expectedCounterMinor", String(offer.requestedPayoutMinor ?? 0));
    setBusy(true);
    setError("");
    const result = await reviewVendorCounterAction(form);
    setBusy(false);
    if (!result.ok) setError(result.message);
    else {
      if (result.url)
        setLink(new URL(result.url, window.location.origin).toString());
      router.refresh();
    }
  };

  return (
    <div className="mt-3 rounded border border-blue-300 bg-blue-50 p-3 text-xs">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={issue}
          className="rounded bg-blue-800 px-3 py-2 font-bold text-white"
        >
          {link ? "Reissue Vendor Link" : "Issue Vendor Response Link"}
        </button>
        {link && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(link)}
            className="rounded border bg-white px-3 py-2 font-bold"
          >
            Copy Link
          </button>
        )}
        {offer.notificationStatus === "failed" &&
          offer.failureRetryable &&
          offer.outboundMessageId && (
            <button
              type="button"
              disabled={busy}
              onClick={retry}
              className="rounded bg-amber-700 px-3 py-2 font-bold text-white"
            >
              Retry Supplier Delivery
            </button>
          )}
      </div>
      <p className="mt-2">
        <b>Vendor:</b> {response.recipientName}
      </p>
      <p>
        <b>Type:</b> {response.supplierType}
      </p>
      <p>
        <b>Delivery:</b> {response.deliveryLabel}
      </p>
      <p>
        <b>Response:</b> {response.responseLabel}
      </p>
      <p>
        <b>Assignment:</b> Awaiting RentKA Confirmation · Revision{" "}
        {offer.offerRevision ?? 0}
      </p>
      {offer.notificationStatus === "outcome_unknown" && (
        <p className="mt-1 font-bold text-amber-900">
          Delivery outcome is unknown. Do not retry until provider reconciliation
          confirms a safe next action.
        </p>
      )}
      <p>
        <b>Original payout:</b> {money(response.originalPayoutMinor)}
      </p>
      <p>
        <b>Current offer:</b> {money(response.currentPayoutMinor)}
      </p>
      {response.counterPayoutMinor !== undefined && (
        <p>
          <b>Vendor counter:</b> {money(response.counterPayoutMinor)}
        </p>
      )}
      {response.agreedPayoutMinor !== undefined && (
        <p>
          <b>Agreed payout:</b> {money(response.agreedPayoutMinor)}
        </p>
      )}
      <p>
        <b>Fulfillment:</b>{" "}
        {offer.fulfillmentProposal
          ? `${offer.fulfillmentProposal.driverName} · ${offer.fulfillmentProposal.vehicleLabel} · Awaiting RentKA Assignment`
          : "Not provided"}
      </p>
      {offer.responseStatus === "countered" && (
        <form
          action={review}
          className="mt-3 grid gap-2 rounded bg-white p-3 sm:grid-cols-2"
        >
          <button
            name="counterAction"
            value="accept"
            className="rounded bg-green-700 px-3 py-2 font-bold text-white"
          >
            Accept Counter
          </button>
          <button
            name="counterAction"
            value="reject"
            className="rounded bg-red-700 px-3 py-2 font-bold text-white"
          >
            Reject Counter
          </button>
          <label className="font-bold">
            Revised payout (Rs)
            <input
              name="revisedPayout"
              inputMode="decimal"
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <label className="font-bold">
            New expiry
            <input
              name="revisedExpiry"
              type="datetime-local"
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <button
            name="counterAction"
            value="revised_offer"
            className="rounded bg-amber-700 px-3 py-2 font-bold text-white sm:col-span-2"
          >
            Revise Offer
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 font-bold text-red-700">
          {error}
        </p>
      )}
      <p className="mt-2 text-slate-600">
        Vendor acceptance and fulfillment proposals do not assign or reserve
        resources. No WhatsApp is sent here.
      </p>
    </div>
  );
}
