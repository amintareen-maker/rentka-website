import { DELIVERY_DESTINATIONS, type BookingDeliveryPayload, type DeliveryDestination, type DeliveryRunResult, type DestinationOutcome } from "./types.ts";

export type DeliveryExecutor = (destination: DeliveryDestination, payload: BookingDeliveryPayload) => Promise<DestinationOutcome>;
export type DeliveryRecorder = {
  start(destination: DeliveryDestination, payload: BookingDeliveryPayload): Promise<boolean>;
  finish(destination: DeliveryDestination, payload: BookingDeliveryPayload, outcome: DestinationOutcome): Promise<void>;
};

const safeError = (error: unknown) => (error instanceof Error ? error.message : "Unknown delivery error").slice(0, 500);

export async function runBookingDelivery(
  payload: BookingDeliveryPayload,
  executor: DeliveryExecutor,
  recorder: DeliveryRecorder,
  requested: readonly DeliveryDestination[] = DELIVERY_DESTINATIONS,
): Promise<DeliveryRunResult> {
  const settled = await Promise.allSettled(requested.map(async (destination) => {
    const claimed = await recorder.start(destination, payload);
    if (!claimed) return [destination, { status: "delivered" } satisfies DestinationOutcome] as const;
    let outcome: DestinationOutcome;
    try { outcome = await executor(destination, payload); }
    catch (error) { outcome = { status: "failed", error: safeError(error) }; }
    await recorder.finish(destination, payload, outcome);
    return [destination, outcome] as const;
  }));
  const result: DeliveryRunResult = {};
  settled.forEach((entry, index) => {
    const destination = requested[index];
    result[destination] = entry.status === "fulfilled" ? entry.value[1] : { status: "failed", error: safeError(entry.reason) };
  });
  return result;
}
