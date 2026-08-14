import { NextResponse } from "next/server";
import { hasTaSession } from "@/lib/ta-connections/session";
import { createQuote, encodeQuote, validQuoteRequest } from "@/lib/ta-connections/portal";
import { minorToPkr } from "@/lib/ta-connections/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await hasTaSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!validQuoteRequest(body)) return NextResponse.json({ error: "Select a resolved Pakistan location and valid booking options." }, { status: 400 });
  try {
    const quote = await createQuote(body);
    return NextResponse.json({ token: encodeQuote(quote), distanceKm: quote.distanceKm, durationMinutes: quote.durationMinutes, band: quote.band, grossFare: minorToPkr(quote.grossMinor), currency: quote.currency, vehicleCategory: quote.vehicleCategory });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate route." }, { status: 422 }); }
}
