"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";
import {
  applyOperationalCustomerDiscount,
  approvePaymentOverride,
  cancelOperationalBooking,
  createManualOperationalBooking,
  getOperationalBooking,
  normalizeExistingSource,
  recordOperationalPayment,
  reviewVendorPayout,
  updateOperationalResponsibilities,
} from "@/lib/dispatch/booking-repository";
import {
  majorToMinor,
  parseCustomerDiscount,
  parseImport,
  parseManualBooking,
  parseResponsibilityUpdate,
} from "@/lib/dispatch/booking-validation";
import { assertMinor } from "@/lib/dispatch/booking-core";
import { getDispatchVehicle } from "@/lib/dispatch/vehicles";
import { setOperationalMatchOverride } from "@/lib/dispatch/matching-repository";
import { mutateDispatchOffer } from "@/lib/dispatch/offer-repository";
import { mutateCustomerDriverDetails } from "@/lib/dispatch/customer-driver-details-repository";
import {
  issueDriverTripAccess,
  transitionTrip,
} from "@/lib/dispatch/trip-operations-repository";
import {
  TRIP_STATUSES,
  type TripStatus,
} from "@/lib/dispatch/trip-operations-types";
import { assignOperationalBooking } from "@/lib/dispatch/assignment-repository";
import { mutateDriverInstructions } from "@/lib/dispatch/driver-instructions-repository";

import { mutateTripSettlement } from "@/lib/dispatch/settlement-repository";
import { CUSTOMER_ADJUSTMENT_CATEGORIES } from "@/lib/dispatch/settlement-types";
import {
  closeSecureOffersAfterCancellation,
  issueSecureDriverOfferLink,
  reviewDriverCounter,
} from "@/lib/dispatch/driver-offer-portal-repository";
import { approveDispatchBroadcast } from "@/lib/dispatch/broadcast-approval-repository";
import { deliverApprovedBookingOfferJobs,deliverDriverOfferJob } from "@/lib/messaging/driver-offer-delivery-repository";
import {
  deliverPostAssignmentNotificationJob,
  deliverPostAssignmentNotificationJobs,
  ensurePostAssignmentNotificationJobs,
} from "@/lib/messaging/post-assignment-delivery-repository";
import {
  issueSecureVendorOfferLink,
  reviewVendorCounter,
} from "@/lib/dispatch/vendor-offer-portal-repository";
const auth = async () => {
  if (!(await hasAdminSession())) throw new Error("Unauthorized");
};
// Legacy source contracts: createManualBookingAction(form:FormData):Promise return{ok:false,message:
// transitionTrip({bookingOperationalId,assignmentId,requestedStatus,source:"admin_fallback"})
const value = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
const finish = (message: string): never => {
  revalidatePath("/admin/dispatch");
  redirect(`/admin/dispatch?message=${encodeURIComponent(message)}`);
};
const fail = (error: unknown): never =>
  redirect(
    `/admin/dispatch?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to complete action.")}`,
  );

async function mutateThenRedirect(work: () => Promise<string>): Promise<never> {
  let message: string;
  try{await auth();message=await work()}catch(error){return fail(error)}
  return finish(message);
}

export async function createManualBookingAction(
  form: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    await auth();
    const parsed = parseManualBooking(form);
    let categoryOrModel: string, vehicleSnapshot: Record<string, unknown>;
    if (parsed.vehicleSelection === "custom") {
      categoryOrModel = parsed.customVehicle!;
      vehicleSnapshot = { type: "custom", label: categoryOrModel };
    } else {
      const id = parsed.vehicleSelection.slice("dispatch:".length),
        vehicle = await getDispatchVehicle(id);
      if (
        !vehicle ||
        !vehicle.active ||
        vehicle.status === "inactive" ||
        !vehicle.zoneIds.includes(parsed.zoneId)
      )
        throw new Error(
          "Selected vehicle is no longer available for this zone.",
        );
      categoryOrModel = `${vehicle.make} ${vehicle.model}`;
      vehicleSnapshot = {
        type: "dispatch_vehicle",
        vehicleId: vehicle.id,
        label: categoryOrModel,
        category: vehicle.category,
        make: vehicle.make,
        model: vehicle.model,
        ...(vehicle.modelYear ? { modelYear: vehicle.modelYear } : {}),
      };
    }
    const result = await createManualOperationalBooking({
      ...parsed,
      categoryOrModel,
      vehicleSnapshot,
    });
    revalidatePath("/admin/dispatch");
    return { ok: true, message: `Manual booking ${result.bookingId} created` };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create manual booking.",
    };
  }
}

export async function importBookingAction(form:FormData):Promise<never>{return mutateThenRedirect(async () => {
    const input = parseImport(form);
    const result = await normalizeExistingSource(
      input.type as Exclude<typeof input.type, "manual">,
      input.documentId,
    );
    return result.duplicate
      ? `${result.bookingId} was already in the queue`
      : `${result.bookingId} imported`;
  });
}
export async function recordPaymentAction(form:FormData):Promise<never>{return mutateThenRedirect(async () => {
    const amountMinor = majorToMinor(value(form, "amount"), "Payment amount");
    assertMinor(amountMinor, "Payment amount");
    await recordOperationalPayment(value(form, "bookingDocumentId"), {
      amountMinor,
      ...(value(form, "method") ? { method: value(form, "method") } : {}),
      ...(value(form, "reference")
        ? { reference: value(form, "reference") }
        : {}),
      ...(value(form, "note") ? { note: value(form, "note") } : {}),
    });
    return "Payment recorded";
  });
}
export async function applyCustomerDiscountAction(
  form: FormData,
): Promise<never> {
  return mutateThenRedirect(async () => {
    const input = parseCustomerDiscount(form);
    await applyOperationalCustomerDiscount(input.bookingDocumentId, {
      amountMinor: input.amountMinor,
      reason: input.reason,
    });
    return "Customer discount applied";
  });
}
export async function reviewPayoutAction(form:FormData):Promise<never>{return mutateThenRedirect(async () => {
    const vendorPayoutMinor = majorToMinor(
      value(form, "vendorPayout"),
      "Vendor payout",
      true,
    );
    await reviewVendorPayout(value(form, "bookingDocumentId"), {
      vendorPayoutMinor,
      ...(value(form, "payoutNotes")
        ? { notes: value(form, "payoutNotes") }
        : {}),
    });
    return "Vendor payout reviewed";
  });
}
export async function overridePaymentAction(form:FormData):Promise<never>{return mutateThenRedirect(async () => {
    const reason = value(form, "overrideReason");
    if (reason.length < 8)
      throw new Error("Override reason is required and must be specific.");
    await approvePaymentOverride(value(form, "bookingDocumentId"), reason);
    return "Dispatch-before-payment override approved";
  });
}
export async function cancelBookingAction(form:FormData):Promise<never>{return mutateThenRedirect(async () => {
    const reason = value(form, "cancellationReason"),
      bookingDocumentId = value(form, "bookingDocumentId");
    if (reason.length < 3) throw new Error("Cancellation reason is required.");
    await cancelOperationalBooking(
      bookingDocumentId,
      reason,
      value(form, "cancellationType") === "not_proceeding",
    );
    await closeSecureOffersAfterCancellation(bookingDocumentId);
    return "Booking marked as not proceeding";
  });
}
export async function setMatchOverrideAction(form: FormData): Promise<never> {
  return mutateThenRedirect(async () => {
    const bookingDocumentId = value(form, "bookingDocumentId"),
      candidateId = value(form, "candidateId"),
      mode = value(form, "mode");
    if (mode !== "include" && mode !== "exclude")
      throw new Error("Select a valid matching action.");
    await setOperationalMatchOverride(bookingDocumentId, candidateId, mode);
    return mode === "include"
      ? "Candidate included for this booking"
      : "Candidate excluded for this booking";
  });
}
export async function updateResponsibilitiesAction(
  form: FormData,
): Promise<never> {
  return mutateThenRedirect(async () => {
    const id = value(form, "bookingDocumentId"),
      booking = await getOperationalBooking(id);
    if (!booking) throw new Error("Operational booking not found.");
    const parsed = parseResponsibilityUpdate(form, booking.serviceType);
    await updateOperationalResponsibilities(id, parsed.responsibilities);
    return "Operational responsibilities updated";
  });
}
export async function mutateDriverOfferAction(
  form: FormData,
): Promise<{ ok: boolean; message: string; whatsappUrl?: string }> {
  try {
    await auth();
    const bookingDocumentId = value(form, "bookingDocumentId"),
      candidateId = value(form, "candidateId"),
      kind = value(form, "kind"),
      response = value(form, "response"),
      note = value(form, "note");
    if (!bookingDocumentId || !candidateId)
      throw new Error("Select a valid offer candidate.");
    if (note.length > 500) throw new Error("Response note is too long.");
    const mutation =
      kind === "prepare"
        ? { kind: "prepare" as const }
        : kind === "opened"
          ? { kind: "opened" as const }
          : kind === "sent"
            ? { kind: "sent" as const }
            : kind === "response" &&
                (response === "available" ||
                  response === "declined" ||
                  response === "no_response")
              ? {
                  kind: "response" as const,
                  response: response as
                    "available" | "declined" | "no_response",
                  ...(note ? { note } : {}),
                }
              : null;
    if (!mutation) throw new Error("Select a valid offer action.");
    const projection = await mutateDispatchOffer(
      bookingDocumentId,
      candidateId,
      mutation,
    );
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: "Driver offer updated",
      whatsappUrl: projection.whatsappUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update driver offer.",
    };
  }
}
export async function issueSecureDriverOfferAction(
  bookingOperationalId: string,
  offerId: string,
): Promise<{ ok: boolean; message: string; url?: string }> {
  try {
    await auth();
    const result = await issueSecureDriverOfferLink(
      bookingOperationalId,
      offerId,
    );
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: "Secure Driver offer link issued.",
      url: result.url,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to issue secure offer link.",
    };
  }
}
export async function reviewDriverCounterAction(
  form: FormData,
): Promise<{ ok: boolean; message: string; url?: string }> {
  try {
    await auth();
    const bookingOperationalId = value(form, "bookingOperationalId"),
      offerId = value(form, "offerId"),
      action = value(form, "counterAction");
    if (
      action !== "accept" &&
      action !== "reject" &&
      action !== "revised_offer"
    )
      throw new Error("Select a valid counter action.");
    const expectedRevision = Number(value(form, "expectedRevision")),
      expectedCounterMinor = Number(value(form, "expectedCounterMinor"));
    if (
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 0 ||
      !Number.isSafeInteger(expectedCounterMinor) ||
      expectedCounterMinor <= 0
    )
      throw new Error(
        "Counter review state is invalid. Refresh and try again.",
      );
    const revisedPayoutMinor =
        action === "revised_offer"
          ? majorToMinor(value(form, "revisedPayout"), "Revised payout")
          : undefined,
      revisedExpiryRaw = value(form, "revisedExpiry"),
      revisedOfferExpiresAt =
        action === "revised_offer" && revisedExpiryRaw
          ? new Date(revisedExpiryRaw).toISOString()
          : undefined;
    const result = await reviewDriverCounter(bookingOperationalId, offerId, {
      action,
      expectedRevision,
      expectedCounterMinor,
      revisedPayoutMinor,
      revisedOfferExpiresAt,
    });
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: result.duplicate
        ? "This counter decision was already recorded."
        : action === "accept"
          ? "Counter agreed; awaiting explicit assignment."
          : action === "reject"
            ? "Counter rejected; negotiation closed."
            : "Revised offer prepared; no message sent.",
      ...(result.url ? { url: result.url } : {}),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to review counter offer.",
    };
  }
}
export async function assignBookingAction(
  form: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    await auth();
    const vendorProposalId = value(form, "vendorProposalId");
    const vendorId = value(form, "vendorId");
    const vendorOfferRevision = Number(value(form, "vendorOfferRevision"));
    const vendorResponseRevision = Number(value(form, "vendorResponseRevision"));
    if (
      vendorProposalId &&
      (!vendorId ||
        !Number.isSafeInteger(vendorOfferRevision) ||
        vendorOfferRevision < 0 ||
        !Number.isSafeInteger(vendorResponseRevision) ||
        vendorResponseRevision < 0)
    )
      throw new Error("Vendor proposal review state is invalid. Refresh and try again.");
    const result = await assignOperationalBooking(
      value(form, "bookingDocumentId"),
      {
        driverId: value(form, "driverId"),
        vehicleId: value(form, "vehicleId"),
        offerId: value(form, "offerId"),
        ...(vendorProposalId
          ? {
              vendorProposal: {
                proposalId: vendorProposalId,
                vendorId,
                offerRevision: vendorOfferRevision,
                responseRevision: vendorResponseRevision,
              },
            }
          : {}),
      },
      { ...(value(form, "reason") ? { reason: value(form, "reason") } : {}) },
    );
    let notificationMessage =
      " Post-assignment notifications could not be queued; assignment remains valid.";
    if (result.assignment.previousAssignmentId) {
      notificationMessage =
        " Reassignment notifications require separate lifecycle review; no automatic message was sent.";
    } else try {
      const jobs = await ensurePostAssignmentNotificationJobs(
          value(form, "bookingDocumentId"),
          result.assignment.id,
        ),
        delivery = await deliverPostAssignmentNotificationJobs(
          jobs.map((job) => job.jobId),
        ),
        accepted = delivery.filter(
          (item) => item.status === "provider_accepted",
        ).length,
        progressed = delivery.filter(
          (item) =>
            !item.invoked &&
            ["sending", "provider_accepted", "sent", "delivered", "read"].includes(
              item.status,
            ),
        ).length,
        pending = delivery.length - accepted - progressed;
      notificationMessage = ` Post-assignment notifications: provider accepted ${accepted}; already progressed ${progressed}; pending configuration or retry ${pending}.`;
    } catch {
      // Assignment is authoritative and must never roll back for messaging failure.
    }
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: result.duplicate
        ? `Booking already has this assignment. No duplicate was created.${notificationMessage}`
        : `Booking assigned successfully.${notificationMessage}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to assign booking.",
    };
  }
}
export async function deliverPostAssignmentNotificationAction(
  jobId: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    await auth();
    if (!jobId) throw new Error("Post-assignment notification job is required.");
    const result = await deliverPostAssignmentNotificationJob(jobId);
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: result.invoked
        ? result.status === "provider_accepted"
          ? "Provider accepted the post-assignment message. Delivery is tracked separately."
          : result.status === "outcome_unknown"
            ? "Delivery outcome is unknown. Do not retry until reconciled."
            : "Post-assignment delivery attempt completed."
        : `No message sent; job status is ${result.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to deliver post-assignment notification.",
    };
  }
}
export async function approveBroadcastAction(
  form: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    await auth();
    const bookingOperationalId = value(form, "bookingDocumentId"),
      candidateIds = form
        .getAll("candidateId")
        .map((item) => String(item).trim())
        .filter(Boolean),
      offerExpiresAt = value(form, "offerExpiresAt"),
      payoutSnapshotMinor = Number(value(form, "payoutSnapshotMinor")),
      expectedCurrentRevision = Number(value(form, "expectedCurrentRevision"));
    if (!Number.isSafeInteger(payoutSnapshotMinor) || payoutSnapshotMinor < 0)
      throw new Error("Vendor payout snapshot is invalid.");
    if (
      !Number.isSafeInteger(expectedCurrentRevision) ||
      expectedCurrentRevision < 0
    )
      throw new Error("Broadcast revision is invalid. Refresh Smart Matching.");
    const result = await approveDispatchBroadcast({
      bookingOperationalId,
      candidateIds,
      offerExpiresAt,
      payoutSnapshotMinor,
      expectedCurrentRevision,
    });
    const delivery=await deliverApprovedBookingOfferJobs(result.broadcastId);
    const accepted=delivery.results.filter(item=>item.status==="provider_accepted").length,
      alreadyProgressed=delivery.results.filter(item=>!item.invoked&&["sending","provider_accepted","sent","delivered","read"].includes(item.status)).length,
      failed=delivery.results.filter(item=>item.status==="failed"||item.status==="outcome_unknown"||item.status==="cancelled").length;
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message:`Broadcast approved. Provider accepted ${accepted}; already in progress/completed ${alreadyProgressed}; failed or blocked ${failed}. Delivery status is tracked separately from Supplier response and assignment.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to approve broadcast.",
    };
  }
}
export async function deliverBookingOfferAction(jobId:string):Promise<{ok:boolean;message:string}>{
 try{await auth();if(!jobId)throw new Error("Supplier offer delivery job is required.");const result=await deliverDriverOfferJob(jobId);revalidatePath("/admin/dispatch");return{ok:true,message:result.invoked?result.status==="provider_accepted"?"Provider accepted the Supplier offer. Delivery is not yet confirmed.":result.status==="outcome_unknown"?"Delivery outcome is unknown. Do not retry until reconciled.":"Supplier offer delivery attempt completed.":`No message sent; job status is ${result.status}.`}}catch(error){return{ok:false,message:error instanceof Error?error.message:"Unable to deliver Supplier offer."}}
}
export async function deliverDriverOfferAction(
  jobId: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    await auth();
    if (!jobId) throw new Error("Driver offer delivery job is required.");
    const result = await deliverDriverOfferJob(jobId);
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: result.invoked
        ? result.status === "provider_accepted"
          ? "Provider accepted the Driver offer. Delivery is not yet confirmed."
          : result.status === "outcome_unknown"
            ? "Delivery outcome is unknown. Do not retry until reconciled."
            : "Driver offer delivery failed."
        : `No message sent; job status is ${result.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to deliver Driver offer.",
    };
  }
}
export async function issueSecureVendorOfferAction(
  bookingOperationalId: string,
  offerId: string,
): Promise<{ ok: boolean; message: string; url?: string }> {
  try {
    await auth();
    const result = await issueSecureVendorOfferLink(
      bookingOperationalId,
      offerId,
    );
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: "Secure Vendor offer link issued. No message sent.",
      url: result.url,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to issue secure Vendor offer link.",
    };
  }
}
export async function reviewVendorCounterAction(
  form: FormData,
): Promise<{ ok: boolean; message: string; url?: string }> {
  try {
    await auth();
    const bookingOperationalId = value(form, "bookingOperationalId"),
      offerId = value(form, "offerId"),
      action = value(form, "counterAction");
    if (
      action !== "accept" &&
      action !== "reject" &&
      action !== "revised_offer"
    )
      throw new Error("Select a valid Vendor counter action.");
    const expectedRevision = Number(value(form, "expectedRevision")),
      expectedCounterMinor = Number(value(form, "expectedCounterMinor"));
    if (
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 0 ||
      !Number.isSafeInteger(expectedCounterMinor) ||
      expectedCounterMinor <= 0
    )
      throw new Error(
        "Vendor counter review state is invalid. Refresh and try again.",
      );
    const revisedPayoutMinor =
        action === "revised_offer"
          ? majorToMinor(value(form, "revisedPayout"), "Revised payout")
          : undefined,
      revisedExpiryRaw = value(form, "revisedExpiry"),
      revisedOfferExpiresAt =
        action === "revised_offer" && revisedExpiryRaw
          ? new Date(revisedExpiryRaw).toISOString()
          : undefined,
      result = await reviewVendorCounter(bookingOperationalId, offerId, {
        action,
        expectedRevision,
        expectedCounterMinor,
        revisedPayoutMinor,
        revisedOfferExpiresAt,
      });
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: result.duplicate
        ? "This Vendor counter decision was already recorded."
        : action === "accept"
          ? "Vendor counter agreed; awaiting fulfillment proposal and explicit RentKA assignment."
          : action === "reject"
            ? "Vendor counter rejected; negotiation closed."
            : "Revised Vendor offer prepared; no message sent.",
      ...(result.url ? { url: result.url } : {}),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to review Vendor counter.",
    };
  }
}
export async function mutateDriverInstructionsAction(
  form: FormData,
): Promise<{ ok: boolean; message: string; whatsappUrl?: string }> {
  try {
    await auth();
    const bookingDocumentId = value(form, "bookingDocumentId"),
      assignmentId = value(form, "assignmentId"),
      kind = value(form, "kind");
    if (!bookingDocumentId || !assignmentId)
      throw new Error("Select a valid final assignment.");
    if (
      kind !== "copied" &&
      kind !== "whatsapp_opened" &&
      kind !== "marked_shared"
    )
      throw new Error("Select a valid Driver Instructions action.");
    const projection = await mutateDriverInstructions(
      bookingDocumentId,
      assignmentId,
      kind,
    );
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message:
        kind === "whatsapp_opened"
          ? "WhatsApp compose window opened; delivery is not confirmed."
          : kind === "marked_shared"
            ? "Instructions marked as manually shared."
            : "Instructions copied.",
      whatsappUrl: projection.whatsappUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update Driver Instructions.",
    };
  }
}
export async function mutateCustomerDriverDetailsAction(
  form: FormData,
): Promise<{ ok: boolean; message: string; whatsappUrl?: string }> {
  try {
    await auth();
    const bookingDocumentId = value(form, "bookingDocumentId"),
      assignmentId = value(form, "assignmentId"),
      kind = value(form, "kind"),
      scheduleMode = value(form, "scheduleMode"),
      customSchedule = value(form, "customSchedule");
    if (!bookingDocumentId || !assignmentId)
      throw new Error("Select a valid final assignment.");
    if (
      kind !== "copied" &&
      kind !== "whatsapp_opened" &&
      kind !== "marked_shared" &&
      kind !== "schedule" &&
      kind !== "cancel_schedule"
    )
      throw new Error("Select a valid Customer Driver Details action.");
    const projection = await mutateCustomerDriverDetails(
      bookingDocumentId,
      assignmentId,
      {
        action: kind,
        ...(scheduleMode ? { scheduleMode } : {}),
        ...(customSchedule ? { customSchedule } : {}),
      },
    );
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message:
        kind === "whatsapp_opened"
          ? "WhatsApp compose window opened; delivery is not confirmed."
          : kind === "marked_shared"
            ? "Customer details marked as manually shared."
            : kind === "schedule"
              ? "Customer notification reminder scheduled."
              : kind === "cancel_schedule"
                ? "Customer notification schedule cancelled."
                : "Customer message copied.",
      whatsappUrl: projection.whatsappUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update Customer Driver Details.",
    };
  }
}
export async function issueDriverTripAccessAction(
  bookingOperationalId: string,
): Promise<{ ok: boolean; message: string; url?: string }> {
  try {
    await auth();
    const result = await issueDriverTripAccess(bookingOperationalId);
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: "Secure Driver trip access issued.",
      url: result.url,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to issue Driver trip access.",
    };
  }
}
export async function transitionTripAdminAction(
  bookingOperationalId: string,
  assignmentId: string,
  requestedStatus: TripStatus,
): Promise<{ ok: boolean; message: string }> {
  try {
    await auth();
    if (!TRIP_STATUSES.includes(requestedStatus))
      throw new Error("Select a valid trip status.");
    const result = await transitionTrip({
      bookingOperationalId,
      assignmentId,
      requestedStatus,
      source: "admin_fallback",
    });
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message: result.duplicate
        ? "Trip status was already updated."
        : "Trip status updated by Admin fallback.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to advance trip.",
    };
  }
}
export async function mutateTripSettlementAction(
  form: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    await auth();
    const bookingOperationalId = value(form, "bookingOperationalId"),
      assignmentId = value(form, "assignmentId"),
      kind = value(form, "kind"),
      amountMinor =
        kind === "finalize"
          ? 0
          : majorToMinor(
              value(form, "amount"),
              "Amount",
              kind === "driver_collection",
            );
    if (kind === "customer_adjustment") {
      const direction = value(form, "direction"),
        category = value(form, "category");
      if (direction !== "charge" && direction !== "credit")
        throw new Error("Select charge or credit.");
      if (!CUSTOMER_ADJUSTMENT_CATEGORIES.includes(category as never))
        throw new Error("Select a valid adjustment category.");
      await mutateTripSettlement(bookingOperationalId, assignmentId, {
        kind,
        direction,
        category: category as never,
        amountMinor,
        note: value(form, "note") || undefined,
      });
    } else if (kind === "payout_adjustment") {
      const direction = value(form, "direction");
      if (direction !== "addition" && direction !== "deduction")
        throw new Error("Select addition or deduction.");
      await mutateTripSettlement(bookingOperationalId, assignmentId, {
        kind,
        direction,
        reason: value(form, "reason"),
        amountMinor,
        note: value(form, "note") || undefined,
      });
    } else if (kind === "driver_collection") {
      const status = value(form, "status");
      if (
        status !== "collected" &&
        status !== "partially_collected" &&
        status !== "not_collected"
      )
        throw new Error("Select a valid collection status.");
      await mutateTripSettlement(bookingOperationalId, assignmentId, {
        kind,
        status,
        actualAmountMinor: amountMinor,
      });
    } else if (kind === "vendor_payment")
      await mutateTripSettlement(bookingOperationalId, assignmentId, {
        kind,
        amountMinor,
        method: value(form, "method") || undefined,
        reference: value(form, "reference") || undefined,
      });
    else if (kind === "finalize")
      await mutateTripSettlement(bookingOperationalId, assignmentId, { kind });
    else throw new Error("Select a valid settlement action.");
    revalidatePath("/admin/dispatch");
    return {
      ok: true,
      message:
        kind === "finalize"
          ? "Settlement finalized."
          : "Settlement entry recorded.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update Trip Settlement.",
    };
  }
}
