import type { OperationalBooking } from "./booking-types";
import { createCustomerDriverDetailsMessage } from "./post-assignment-messaging-core.ts";
import type {
  CustomerDriverDetailsProjection,
  CustomerDriverDetailsRecord,
  CustomerDriverDetailsState,
} from "./customer-driver-details-types";

export const pickupInstant = (date: string, time: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    return null;
  const value = new Date(`${date}T${time}:00+05:00`);
  return Number.isNaN(value.getTime()) ? null : value;
};
export function resolveCustomerDriverDetailsState(
  record: CustomerDriverDetailsRecord | undefined,
  updated: boolean,
  now = new Date(),
): CustomerDriverDetailsState {
  if (record?.sharedAt) return "shared";
  if (record?.scheduledAt) {
    const due = new Date(record.scheduledAt).getTime(),
      delta = now.getTime() - due;
    if (delta < 0) return "scheduled";
    if (delta <= 15 * 60 * 1000) return "ready_to_share";
    return "overdue";
  }
  return updated ? "updated_details_required" : "not_scheduled";
}
export function resolveScheduleAt(
  booking: OperationalBooking,
  mode: string,
  custom: string | undefined,
) {
  const pickup = pickupInstant(
    booking.itinerary.travelDate,
    booking.itinerary.pickupTime,
  );
  if (!pickup)
    throw new Error(
      "A valid pickup date and time are required before scheduling.",
    );
  if (mode === "1" || mode === "2" || mode === "3")
    return new Date(pickup.getTime() - Number(mode) * 60 * 60 * 1000).toISOString();
  if (mode === "custom") {
    const match =
      custom && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(custom);
    if (!match)
      throw new Error("Select a valid custom notification date and time.");
    const [y, m, d, h, minute] = match.slice(1).map(Number),
      check = new Date(Date.UTC(y, m - 1, d, h, minute));
    if (
      check.getUTCFullYear() !== y ||
      check.getUTCMonth() !== m - 1 ||
      check.getUTCDate() !== d ||
      check.getUTCHours() !== h ||
      check.getUTCMinutes() !== minute
    )
      throw new Error("Select a valid custom notification date and time.");
    const value = new Date(`${custom}:00+05:00`);
    if (value.getTime() > pickup.getTime())
      throw new Error("Customer details cannot be scheduled after pickup.");
    return value.toISOString();
  }
  throw new Error("Select a valid notification schedule.");
}
export function createCustomerDriverDetailsProjection(
  booking: OperationalBooking,
  records: CustomerDriverDetailsRecord[] = [],
  now = new Date(),
): CustomerDriverDetailsProjection | null {
  const canonical = createCustomerDriverDetailsMessage(booking);
  if (!canonical) return null;
  const assignment = booking.assignment!,
    current = records.find((item) => item.assignmentId === assignment.id),
    previousShared = records.find(
      (item) => item.assignmentId !== assignment.id && !!item.sharedAt,
    ),
    updatedDetailsRequired = !!previousShared && !current?.sharedAt,
    state = resolveCustomerDriverDetailsState(
      current,
      updatedDetailsRequired,
      now,
    ),
    pickup = pickupInstant(
      booking.itinerary.travelDate,
      booking.itinerary.pickupTime,
    ),
    vehicle = assignment.vehicleSnapshot;
  return {
    bookingOperationalId: canonical.bookingOperationalId,
    bookingId: canonical.bookingId,
    assignmentId: canonical.assignmentId,
    driverId: canonical.driverId,
    vehicleId: canonical.vehicleId,
    customerName: booking.customer.name,
    ...(canonical.recipientNumber
      ? { customerWhatsappNumber: canonical.recipientNumber }
      : {}),
    driverName: assignment.driverSnapshot.name,
    vehicleLabel: `${vehicle.make} ${vehicle.model}${vehicle.modelYear ? ` ${vehicle.modelYear}` : ""} - ${vehicle.registrationNumber}`,
    message: canonical.message,
    ...(canonical.whatsappUrl ? { whatsappUrl: canonical.whatsappUrl } : {}),
    missingFields: canonical.missingFields,
    pickupAt: pickup?.toISOString() ?? "",
    state,
    ...(current?.scheduledAt ? { scheduledAt: current.scheduledAt } : {}),
    updatedDetailsRequired,
    ...(previousShared
      ? { previousSharedAssignmentId: previousShared.assignmentId }
      : {}),
  };
}
