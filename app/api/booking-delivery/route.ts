import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { orchestrateBookingDelivery } from "@/lib/booking-delivery/orchestrator";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const source = body?.source === "twin_cities_normal" || body?.source === "one_way_drop" ? body.source : null;
  const sourceDocumentId = typeof body?.sourceDocumentId === "string" ? body.sourceDocumentId : "";
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
  if (!source || !/^[A-Za-z0-9_-]{1,128}$/.test(sourceDocumentId) || !bookingId) return NextResponse.json({ ok: false, error: "Invalid delivery request." }, { status: 400 });
  const snapshot = await getAdminDb().collection("leads").doc(sourceDocumentId).get();
  const expectedSource = source === "one_way_drop" ? "one_way_drop" : "website";
  if (!snapshot.exists || snapshot.data()?.leadId !== bookingId || snapshot.data()?.source !== expectedSource) return NextResponse.json({ ok: false, error: "Source booking could not be verified." }, { status: 404 });
  const delivery = await orchestrateBookingDelivery(source, sourceDocumentId, request.url);
  return NextResponse.json({ ok: true, delivery: delivery.result });
}
