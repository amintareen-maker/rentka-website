import { NextResponse } from "next/server";
import { createAirportQuotes, validateQuoteInput } from "@/lib/airport/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!validateQuoteInput(body)) return NextResponse.json({ error: "Choose a valid Google location and complete the trip details." }, { status: 400 });
    const quote = await createAirportQuotes(body);
    if (!quote.vehicleOptions.length) return NextResponse.json({ error: "No suitable vehicle is currently configured. Please contact us on WhatsApp." }, { status: 404 });
    const publicQuotes = quote.vehicleOptions.map((option) => ({
      quoteId: quote.quoteId,
      tripType: quote.tripType,
      pickup: quote.pickup,
      destination: quote.destination,
      distanceKm: quote.distanceKm,
      durationMinutes: quote.durationMinutes,
      vehicle: option.vehicle,
      price: option.price,
      includedItems: option.includedItems,
      excludedItems: option.excludedItems,
      createdAt: quote.createdAt,
      expiresAt: quote.expiresAt,
    }));
    return NextResponse.json({ quotes: publicQuotes });
  } catch (error) {
    if (error instanceof Error && error.message === "PLACE_VERIFICATION_FAILED") {
      return NextResponse.json({ error: "We could not verify that Google location. Please select it again from the suggestions." }, { status: 422 });
    }
    if (error instanceof Error && error.message === "PLACE_VERIFICATION_UNAVAILABLE") {
      return NextResponse.json({ error: "Location verification is temporarily unavailable. Please try again or use WhatsApp." }, { status: 503 });
    }
    const message = error instanceof Error && error.message === "NO_ROUTE"
      ? "No driving route was found for that location."
      : "We could not calculate this route right now. Please try again or use WhatsApp.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
