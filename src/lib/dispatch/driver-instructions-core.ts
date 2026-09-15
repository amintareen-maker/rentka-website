import type { OperationalBooking } from "./booking-types";
import { createDriverFinalMessage } from "./post-assignment-messaging-core.ts";
import type { DriverInstructionProjection } from "./driver-instructions-types";

export function createDriverInstructionsProjection(
  booking: OperationalBooking,
): DriverInstructionProjection | null {
  const canonical = createDriverFinalMessage(booking);
  if (!canonical) return null;
  return {
    bookingOperationalId: canonical.bookingOperationalId,
    bookingId: canonical.bookingId,
    assignmentId: canonical.assignmentId,
    driverId: canonical.driverId,
    vehicleId: canonical.vehicleId,
    driverName: booking.assignment!.driverSnapshot.name,
    ...(canonical.recipientNumber
      ? { driverWhatsappNumber: canonical.recipientNumber }
      : {}),
    message: canonical.message,
    ...(canonical.whatsappUrl ? { whatsappUrl: canonical.whatsappUrl } : {}),
    missingFields: canonical.missingFields,
  };
}
