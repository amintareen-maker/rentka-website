import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import { auditEvent } from "../dispatch/booking-core";
import type { OperationalBooking } from "../dispatch/booking-types";
import { reuseOrCreateOutboundJob } from "../dispatch/dispatch-orchestration-core";
import { getWhatsAppOutboundProvider } from "./dualhook-whatsapp-outbound";
import { getPostAssignmentDeliveryConfig } from "./post-assignment-delivery-config";
import { requirePostAssignmentDeliveryConfig } from "./post-assignment-delivery-config-core";
import {
  assertPostAssignmentJobSendable,
  buildPostAssignmentJobs,
  invokePostAssignmentProvider,
  isPostAssignmentPurpose,
  postAssignmentTemplateComponents,
  type PostAssignmentPurpose,
} from "./post-assignment-delivery-core";
import type { WhatsAppOutboundMessageJob } from "./whatsapp-outbox-types";

const OUTBOX = "whatsappOutboundMessages",
  BOOKINGS = "operationalBookings";
const doc = <T>(snap: FirebaseFirestore.DocumentSnapshot) =>
  ({ ...snap.data(), id: snap.id }) as T;
export async function ensurePostAssignmentNotificationJobs(
  bookingOperationalId: string,
  assignmentId: string,
) {
  const db = getAdminDb(),
    bookingRef = db.collection(BOOKINGS).doc(bookingOperationalId),
    initial = await bookingRef.get();
  if (!initial.exists) throw new Error("Operational booking not found.");
  const booking = doc<OperationalBooking>(initial);
  if (
    booking.assignment?.status !== "assigned" ||
    booking.assignment.id !== assignmentId
  )
    throw new Error("The final assignment is no longer current.");
  const jobs = buildPostAssignmentJobs(booking, new Date().toISOString());
  return db.runTransaction(async (tx) => {
    const latest = await tx.get(bookingRef);
    if (
      !latest.exists ||
      latest.data()?.assignment?.status !== "assigned" ||
      latest.data()?.assignment?.id !== assignmentId
    )
      throw new Error("The final assignment changed before notifications queued.");
    const refs = jobs.map((job) => db.collection(OUTBOX).doc(job.id)),
      existingJobs = await Promise.all(refs.map((ref) => tx.get(ref))),
      resolved = [];
    for (const [index, proposed] of jobs.entries()) {
      const ref = refs[index],
        existing = existingJobs[index],
        current = existing.exists
          ? doc<WhatsAppOutboundMessageJob>(existing)
          : undefined,
        value = reuseOrCreateOutboundJob(current, proposed);
      if (!value.duplicate) {
        const now = FieldValue.serverTimestamp();
        tx.create(ref, {
          ...proposed,
          status: "queued",
          createdAt: now,
          queuedAt: now,
        });
      }
      resolved.push({
        jobId: value.job.id,
        purpose: value.job.purpose as PostAssignmentPurpose,
        duplicate: value.duplicate,
      });
    }
    tx.set(
      bookingRef.collection("events").doc(`post-assignment-${assignmentId}`),
      auditEvent(
        "post_assignment_notifications_queued" as never,
        FieldValue.serverTimestamp(),
        { assignmentId, jobIds: jobs.map((job) => job.id) },
      ),
      { merge: true },
    );
    return resolved;
  });
}

export async function getPostAssignmentNotificationJob(
  booking: OperationalBooking,
  purpose: PostAssignmentPurpose,
) {
  if (booking.assignment?.status !== "assigned") return null;
  const proposed = buildPostAssignmentJobs(
      booking,
      new Date(0).toISOString(),
    ).find((job) => job.purpose === purpose)!,
    snap = await getAdminDb().collection(OUTBOX).doc(proposed.id).get();
  if (!snap.exists) return null;
  const data = doc<WhatsAppOutboundMessageJob>(snap),
    iso = (value: unknown) =>
      value && typeof value === "object" && "toDate" in value
        ? (value as { toDate(): Date }).toDate().toISOString()
        : String(value ?? ""),
    timestamps = [
      "createdAt",
      "queuedAt",
      "providerAcceptedAt",
      "lastAttemptAt",
      "nextAttemptAt",
      "sentAt",
      "deliveredAt",
      "readAt",
      "failedAt",
      "claimedAt",
    ] as const,
    plain = { ...data } as Record<string, unknown>;
  for (const field of timestamps)
    if (plain[field]) plain[field] = iso(plain[field]);
  return plain as WhatsAppOutboundMessageJob;
}

export async function deliverPostAssignmentNotificationJob(jobId: string) {
  const db = getAdminDb(),
    jobRef = db.collection(OUTBOX).doc(jobId),
    preflight = await jobRef.get();
  if (!preflight.exists) throw new Error("Notification job was not found.");
  const preflightJob = doc<WhatsAppOutboundMessageJob>(preflight);
  if (!isPostAssignmentPurpose(preflightJob.purpose))
    throw new Error("This is not a post-assignment notification job.");
  const config = requirePostAssignmentDeliveryConfig(
    getPostAssignmentDeliveryConfig(),
    preflightJob.purpose,
  );
  const claim = await db.runTransaction(async (tx) => {
    const jobSnap = await tx.get(jobRef);
    if (!jobSnap.exists) throw new Error("Notification job was not found.");
    const job = doc<WhatsAppOutboundMessageJob>(jobSnap);
    if (!isPostAssignmentPurpose(job.purpose))
      throw new Error("This is not a post-assignment notification job.");
    if (
      job.status !== "queued" &&
      !(job.status === "failed" && job.failureRetryable === true)
    )
      return { claimed: false as const, status: job.status };
    const bookingRef = db.collection(BOOKINGS).doc(job.bookingOperationalId),
      bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Operational booking not found.");
    const booking = doc<OperationalBooking>(bookingSnap),
      checked = assertPostAssignmentJobSendable({ job, booking }),
      attemptCount = job.attemptCount + 1,
      now = FieldValue.serverTimestamp();
    tx.update(jobRef, {
      status: "sending",
      attemptCount,
      claimedAt: now,
      claimedBy: "dispatch_admin",
      lastAttemptAt: now,
      failureCode: FieldValue.delete(),
      failureRetryable: FieldValue.delete(),
    });
    tx.create(
      bookingRef.collection("events").doc(),
      auditEvent("post_assignment_notification_send_started" as never, now, {
        assignmentId: job.assignmentId,
        outboxJobId: job.id,
        purpose: job.purpose,
        attemptNumber: attemptCount,
      }),
    );
    return {
      claimed: true as const,
      job,
      booking,
      target: checked.target,
      attemptCount,
    };
  });
  if (!claim.claimed)
    return { invoked: false as const, status: claim.status };
  const result = await invokePostAssignmentProvider(
    getWhatsAppOutboundProvider("dualhook"),
    {
      to: claim.target,
      name: config.templateName,
      languageCode: config.templateLanguage,
      components: postAssignmentTemplateComponents(
        claim.booking,
        claim.job.purpose as PostAssignmentPurpose,
      ),
    },
  );
  await finalizePostAssignmentAttempt(
    jobId,
    claim.job,
    claim.attemptCount,
    result.status,
    "providerMessageId" in result ? result.providerMessageId : undefined,
    "failureCode" in result ? result.failureCode : undefined,
    result.retryable,
  );
  return {
    invoked: true as const,
    status: result.status,
    attemptCount: claim.attemptCount,
    ...("providerMessageId" in result
      ? { providerMessageId: result.providerMessageId }
      : {}),
  };
}

async function finalizePostAssignmentAttempt(
  jobId: string,
  job: WhatsAppOutboundMessageJob,
  attemptCount: number,
  status: "provider_accepted" | "failed" | "outcome_unknown",
  providerMessageId?: string,
  failureCode?: string,
  retryable = false,
) {
  const db = getAdminDb(),
    jobRef = db.collection(OUTBOX).doc(jobId),
    bookingRef = db.collection(BOOKINGS).doc(job.bookingOperationalId);
  await db.runTransaction(async (tx) => {
    const current = await tx.get(jobRef);
    if (
      !current.exists ||
      current.data()?.status !== "sending" ||
      Number(current.data()?.attemptCount) !== attemptCount
    )
      return;
    const now = FieldValue.serverTimestamp();
    tx.update(jobRef, {
      status,
      ...(providerMessageId
        ? { providerMessageId, providerAcceptedAt: now }
        : {}),
      ...(failureCode
        ? { failureCode, failureRetryable: retryable, failedAt: now }
        : {}),
    });
    tx.create(
      bookingRef.collection("events").doc(),
      auditEvent(
        status === "provider_accepted"
          ? ("post_assignment_notification_provider_accepted" as never)
          : status === "failed"
            ? ("post_assignment_notification_failed" as never)
            : ("post_assignment_notification_outcome_unknown" as never),
        now,
        {
          assignmentId: job.assignmentId,
          outboxJobId: jobId,
          purpose: job.purpose,
          attemptNumber: attemptCount,
          ...(failureCode ? { failureCode, retryable } : {}),
        },
      ),
    );
  });
}

export async function deliverPostAssignmentNotificationJobs(jobIds: string[]) {
  const results = [];
  for (const jobId of [...new Set(jobIds)]) {
    try {
      results.push({
        jobId,
        ...(await deliverPostAssignmentNotificationJob(jobId)),
      });
    } catch (error) {
      results.push({
        jobId,
        invoked: false as const,
        status: "queued" as const,
        error:
          error instanceof Error
            ? error.message
            : "Notification delivery preflight failed.",
      });
    }
  }
  return results;
}
