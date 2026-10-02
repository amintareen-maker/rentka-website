import "server-only";
import { runBookingDelivery } from "./core";
import { bookingDeliveryExecutor, loadBookingDelivery } from "./service";
import { deliveryStore } from "./store";
import type { DeliveryDestination } from "./types";
import type { OperationalSourceType } from "../dispatch/booking-types";

type Source = Exclude<OperationalSourceType, "manual">;
export async function orchestrateBookingDelivery(source: Source, sourceDocumentId: string, baseUrl: string, requested?: readonly DeliveryDestination[]) {
  const payload = await loadBookingDelivery(source, sourceDocumentId);
  const result = await runBookingDelivery(payload, bookingDeliveryExecutor(baseUrl), deliveryStore, requested);
  for (const [destination, outcome] of Object.entries(result)) console.info("[booking-delivery]", { bookingId: payload.bookingId, source, sourceDocumentId, destination, status: outcome?.status });
  return { payload, result };
}
