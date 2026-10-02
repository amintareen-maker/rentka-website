import { NextResponse } from "next/server";
import { hasAdminSession } from "../../../../admin/_lib/session";
import { orchestrateBookingDelivery } from "@/lib/booking-delivery/orchestrator";
import { recordReplay } from "@/lib/booking-delivery/store";
import { DELIVERY_DESTINATIONS, type DeliveryDestination } from "@/lib/booking-delivery/types";
import { OPERATIONAL_SOURCE_TYPES, type OperationalSourceType } from "@/lib/dispatch/booking-types";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!await hasAdminSession()) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const source = body?.source as OperationalSourceType, destination = body?.destination as DeliveryDestination;
  const sourceDocumentId = typeof body?.sourceDocumentId === "string" ? body.sourceDocumentId : "";
  if (source === "manual" || !OPERATIONAL_SOURCE_TYPES.includes(source) || !DELIVERY_DESTINATIONS.includes(destination) || !/^[A-Za-z0-9_-]{1,128}$/.test(sourceDocumentId)) return NextResponse.json({ ok: false, error: "Invalid replay request." }, { status: 400 });
  const delivery = await orchestrateBookingDelivery(source, sourceDocumentId, request.url, [destination]);
  await recordReplay(delivery.payload, destination, "shared_admin_session", delivery.result[destination]);
  return NextResponse.json({ ok: true, bookingId: delivery.payload.bookingId, destination, result: delivery.result[destination] });
}
