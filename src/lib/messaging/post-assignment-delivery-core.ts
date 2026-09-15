import type { OperationalBooking } from "../dispatch/booking-types";
import { buildOutboundMessageJob } from "../dispatch/dispatch-orchestration-core.ts";
import {
  createCustomerDriverDetailsMessage,
  createDriverFinalMessage,
} from "../dispatch/post-assignment-messaging-core.ts";
import type {
  WhatsAppOutboundMessageJob,
  WhatsAppOutboundPurpose,
} from "./whatsapp-outbox-types";
import type {
  WhatsAppOutboundProvider,
  WhatsAppTemplateComponent,
} from "./whatsapp-outbound-provider";
import { classifyProviderFailure } from "./driver-offer-delivery-core.ts";

export type PostAssignmentPurpose =
  | "driver_final_instructions"
  | "customer_driver_details";
const text = (value: string) => ({ type: "text", text: value });
const canonical = (
  booking: OperationalBooking,
  purpose: PostAssignmentPurpose,
) =>
  purpose === "driver_final_instructions"
    ? createDriverFinalMessage(booking)
    : createCustomerDriverDetailsMessage(booking);

export function buildPostAssignmentJobs(
  booking: OperationalBooking,
  createdAt: string,
) {
  if (booking.assignment?.status !== "assigned")
    throw new Error("An active final assignment is required.");
  return (
    ["driver_final_instructions", "customer_driver_details"] as const
  ).map((purpose) => {
    const message = canonical(booking, purpose);
    if (!message) throw new Error("An active final assignment is required.");
    return buildOutboundMessageJob({
      purpose,
      bookingOperationalId: booking.id,
      bookingId: booking.bookingId,
      assignmentId: booking.assignment!.id,
      recipientType:
        purpose === "driver_final_instructions" ? "driver" : "customer",
      recipientReferenceId: message.recipientReferenceId,
      provider: "dualhook",
      messageKind: "template",
      createdAt,
    });
  });
}

export function postAssignmentTemplateComponents(
  booking: OperationalBooking,
  purpose: PostAssignmentPurpose,
): WhatsAppTemplateComponent[] {
  const message = canonical(booking, purpose);
  if (!message || message.missingFields.length)
    throw new Error("Post-assignment message data is incomplete.");
  return [{ type: "body", parameters: message.parameters.map(text) }];
}

export function assertPostAssignmentJobSendable(input: {
  job: WhatsAppOutboundMessageJob;
  booking: OperationalBooking;
}) {
  const { job, booking } = input;
  if (
    job.purpose !== "driver_final_instructions" &&
    job.purpose !== "customer_driver_details"
  )
    throw new Error("This is not a post-assignment notification job.");
  if (
    job.status !== "queued" &&
    !(job.status === "failed" && job.failureRetryable === true)
  )
    throw new Error("This post-assignment notification job is not sendable.");
  if (
    booking.lifecycle !== "active" ||
    booking.assignment?.status !== "assigned" ||
    booking.assignment.id !== job.assignmentId
  )
    throw new Error("The final assignment is no longer current.");
  const message = canonical(booking, job.purpose);
  if (!message || message.missingFields.length || !message.recipientNumber)
    throw new Error("Post-assignment message data is incomplete.");
  if (
    message.recipientReferenceId !== job.recipientReferenceId ||
    (job.purpose === "driver_final_instructions" &&
      job.recipientType !== "driver") ||
    (job.purpose === "customer_driver_details" &&
      job.recipientType !== "customer")
  )
    throw new Error("The post-assignment recipient is no longer current.");
  return { ...input, message, target: message.recipientNumber };
}

export async function invokePostAssignmentProvider(
  provider: WhatsAppOutboundProvider,
  input: {
    to: string;
    name: string;
    languageCode: string;
    components: WhatsAppTemplateComponent[];
  },
) {
  try {
    const result = await provider.sendTemplate(input);
    return {
      status: "provider_accepted" as const,
      providerMessageId: result.messageId,
      retryable: false,
    };
  } catch (error) {
    return classifyProviderFailure(error);
  }
}

export const isPostAssignmentPurpose = (
  purpose: WhatsAppOutboundPurpose,
): purpose is PostAssignmentPurpose =>
  purpose === "driver_final_instructions" ||
  purpose === "customer_driver_details";
