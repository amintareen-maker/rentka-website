import type { DispatchOfferRecord } from "./offer-types.ts";

export const ADMIN_DISPATCH_STAGE_IDS = [
  "readiness",
  "find_supply",
  "send_offers",
  "responses",
  "fulfillment",
  "assignment",
  "notifications",
] as const;

export type AdminDispatchStageId = (typeof ADMIN_DISPATCH_STAGE_IDS)[number];
export type AdminDispatchStageState = "complete" | "current" | "future" | "skipped";
export type AdminDispatchStage = {
  id: AdminDispatchStageId;
  number: number;
  label: string;
  state: AdminDispatchStageState;
  summary: string;
};
export type AdminDispatchWorkflow = {
  currentStage: AdminDispatchStageId;
  nextAction: string;
  dispatchState: string;
  stages: AdminDispatchStage[];
  currentOffers: DispatchOfferRecord[];
  historicalOffers: DispatchOfferRecord[];
};

const labels: Record<AdminDispatchStageId, string> = {
  readiness: "Booking Readiness",
  find_supply: "Find Supply",
  send_offers: "Send Offers",
  responses: "Supplier Responses",
  fulfillment: "Driver & Vehicle",
  assignment: "Final Assignment",
  notifications: "Notifications / Completed",
};

const revision = (offer: DispatchOfferRecord) => offer.offerRevision ?? 0;

export function splitCurrentSupplierOffers(
  offers: DispatchOfferRecord[],
  activeBroadcastId?: string,
) {
  if (!offers.length) return { current: [], historical: [] };
  const active = activeBroadcastId
    ? offers.filter((offer) => offer.broadcastId === activeBroadcastId)
    : [];
  const maxRevision = Math.max(...offers.map(revision));
  const current = active.length
    ? active
    : offers.filter((offer) => revision(offer) === maxRevision);
  const ids = new Set(current.map((offer) => offer.id));
  return {
    current,
    historical: offers.filter((offer) => !ids.has(offer.id)),
  };
}

export function deriveAdminDispatchWorkflow(input: {
  lifecycle: string;
  readinessStatus: string;
  assigned: boolean;
  matchesOpen: boolean;
  offers: DispatchOfferRecord[];
  activeBroadcastId?: string;
  assignmentReady: boolean;
}): AdminDispatchWorkflow {
  const split = splitCurrentSupplierOffers(
      input.offers,
      input.activeBroadcastId,
    ),
    offers = split.current,
    accepted = offers.filter((offer) => offer.responseStatus === "accepted"),
    countered = offers.some((offer) => offer.responseStatus === "countered"),
    acceptedVendor = accepted.find((offer) => offer.recipientType === "vendor"),
    acceptedOwner = accepted.find(
      (offer) =>
        offer.recipientType === "independent_driver" || !offer.recipientType,
    ),
    proposalProvided = Boolean(
      acceptedVendor?.fulfillmentProposal &&
        acceptedVendor.fulfillmentProposal.status === "provided" &&
        acceptedVendor.proposalStatus !== "superseded" &&
        acceptedVendor.proposalStatus !== "rejected",
    ),
    ready =
      input.lifecycle === "active" &&
      input.readinessStatus === "ready_for_dispatch";

  let currentStage: AdminDispatchStageId = "readiness",
    nextAction = "Complete Booking Readiness",
    dispatchState = ready ? "Ready for dispatch" : "Booking readiness blocked";

  if (input.assigned) {
    currentStage = "notifications";
    nextAction = "Review Notifications";
    dispatchState = "Assigned";
  } else if (!ready) {
    currentStage = "readiness";
  } else if (!offers.length && !input.matchesOpen) {
    currentStage = "find_supply";
    nextAction = "Find Matches";
    dispatchState = "Waiting for matches";
  } else if (!offers.length) {
    currentStage = "send_offers";
    nextAction = "Select Suppliers and Send Offers";
    dispatchState = "Select suppliers";
  } else if (countered) {
    currentStage = "responses";
    nextAction = "Review Supplier Counter";
    dispatchState = "Counter awaiting RentKA";
  } else if (acceptedVendor && !proposalProvided) {
    currentStage = "fulfillment";
    nextAction = "Wait for Driver & Vehicle";
    dispatchState = "Vendor selecting driver";
  } else if (
    (acceptedOwner || (acceptedVendor && proposalProvided)) &&
    input.assignmentReady
  ) {
    currentStage = "assignment";
    nextAction = "Confirm Final Assignment";
    dispatchState = "Ready for final assignment";
  } else if (acceptedOwner || (acceptedVendor && proposalProvided)) {
    currentStage = acceptedVendor ? "fulfillment" : "responses";
    nextAction = "Refresh and Review Eligibility";
    dispatchState = "Assignment eligibility needs review";
  } else {
    currentStage = "responses";
    nextAction = "Review Supplier Responses";
    dispatchState = "Waiting for supplier response";
  }

  const currentIndex = ADMIN_DISPATCH_STAGE_IDS.indexOf(currentStage),
    ownerFlow = Boolean(acceptedOwner) && !acceptedVendor,
    stages = ADMIN_DISPATCH_STAGE_IDS.map((id, index): AdminDispatchStage => {
      const skipped = id === "fulfillment" && ownerFlow;
      const state: AdminDispatchStageState = skipped
        ? "skipped"
        : index < currentIndex
          ? "complete"
          : index === currentIndex
            ? "current"
            : "future";
      const summary =
        id === "readiness"
          ? ready
            ? "Booking ready for dispatch"
            : "Payment or payout action required"
          : id === "find_supply"
            ? input.matchesOpen || offers.length
              ? "Supply search opened"
              : "Find eligible suppliers"
            : id === "send_offers"
              ? offers.length
                ? `Offer sent to ${offers.length} supplier${offers.length === 1 ? "" : "s"}`
                : "Select suppliers and approve the offer"
              : id === "responses"
                ? offers.length
                  ? `${offers.length} current supplier response${offers.length === 1 ? "" : "s"}`
                  : "Waiting for offers"
                : id === "fulfillment"
                  ? ownerFlow
                    ? "Owner-driver uses the accepted driver and vehicle"
                    : proposalProvided
                      ? "Driver and vehicle proposed"
                      : "Waiting for vendor driver and vehicle"
                  : id === "assignment"
                    ? input.assigned
                      ? "Final assignment confirmed"
                      : "RentKA confirmation required"
                    : input.assigned
                      ? "Assignment complete; notifications available"
                      : "Available after final assignment";
      return { id, number: index + 1, label: labels[id], state, summary };
    });

  return {
    currentStage,
    nextAction,
    dispatchState,
    stages,
    currentOffers: split.current,
    historicalOffers: split.historical,
  };
}
