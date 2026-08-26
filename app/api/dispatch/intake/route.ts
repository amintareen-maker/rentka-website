import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { attemptAutomaticOperationalIntake } from "@/lib/dispatch/automatic-intake";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const requestedSourceType = body?.sourceType;
  const sourceType = requestedSourceType === "twin_cities_normal" || requestedSourceType === "one_way_drop" ? requestedSourceType : null;
  const sourceDocumentId = typeof body?.sourceDocumentId === "string" ? body.sourceDocumentId.trim() : "";
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
  if (!sourceType || !/^[A-Za-z0-9_-]{1,128}$/.test(sourceDocumentId) || !bookingId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const source = await getAdminDb().collection("leads").doc(sourceDocumentId).get();
  const data = source.data();
  const expectedMarker = sourceType === "one_way_drop" ? "one_way_drop" : "website";
  if (!source.exists || data?.leadId !== bookingId || data?.source !== expectedMarker) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const result = await attemptAutomaticOperationalIntake(sourceType, sourceDocumentId);
  return NextResponse.json({ ok: result !== null, duplicate: result?.duplicate ?? false }, { status: result ? 200 : 202 });
}
