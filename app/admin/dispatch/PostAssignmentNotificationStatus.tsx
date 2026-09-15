"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WhatsAppOutboundMessageJob } from "@/lib/messaging/whatsapp-outbox-types";
import { deliverPostAssignmentNotificationAction } from "./actions";

const label = {
  not_queued: "Not queued",
  queued: "Pending",
  sending: "Sending",
  provider_accepted: "Provider accepted",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
  cancelled: "Cancelled",
  outcome_unknown: "Outcome unknown",
} as const;

export default function PostAssignmentNotificationStatus({
  job,
}: {
  job: WhatsAppOutboundMessageJob | null;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    router = useRouter();
  const retry = async () => {
    if (
      !job ||
      !window.confirm(
        "Retry this known-safe failed notification? The existing deterministic job will revalidate the current assignment before sending.",
      )
    )
      return;
    setBusy(true);
    setError("");
    const result = await deliverPostAssignmentNotificationAction(job.id);
    setBusy(false);
    if (!result.ok) setError(result.message);
    router.refresh();
  };
  return (
    <div className="rounded-lg border bg-white p-3 text-sm">
      <p>
        <b>Automated status:</b> {job ? label[job.status] : "Not queued"}
      </p>
      {job?.attemptCount !== undefined && (
        <p className="text-xs text-slate-600">
          Attempts: {job.attemptCount}
        </p>
      )}
      {job?.status === "failed" && job.failureRetryable && (
        <button
          type="button"
          disabled={busy}
          onClick={retry}
          className="mt-2 rounded bg-amber-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Retry
        </button>
      )}
      {job?.status === "outcome_unknown" && (
        <p className="mt-2 text-xs font-bold text-amber-900">
          Do not retry until provider reconciliation confirms the outcome.
        </p>
      )}
      <p className="mt-2 text-xs text-slate-600">
        Manual fallback is separate and does not change automated delivery state.
      </p>
      {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}
