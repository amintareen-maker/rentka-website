import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { AirportQuoteError, createAirportQuotes, validateQuoteInput } from "@/lib/airport/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestedAttemptId = request.headers.get("x-airport-attempt-id");
  const attemptId = requestedAttemptId && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(requestedAttemptId) ? requestedAttemptId : randomUUID();
  const startedAt = Date.now();
  try {
    const body: unknown = await request.json();
    if (!validateQuoteInput(body)) {
      console.warn("Airport quote diagnostic", { attemptId, stage: "response", result: "failure", durationMs: Date.now() - startedAt, errorName: "ValidationError", errorCode: "INVALID_REQUEST", safeMessage: "Invalid quote request", httpStatus: 400, retryAttempt: 0, pricingSource: "unknown", runtime: process.env.NODE_ENV });
      return NextResponse.json({ error: "Choose a valid Google location and complete the trip details.", attemptId }, { status: 400 });
    }
    const quote = await createAirportQuotes(body, attemptId);
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
    return NextResponse.json({ quotes: publicQuotes, attemptId }, { headers: { "Server-Timing": `airport-quote;dur=${quote.diagnostics.totalDurationMs}`, "X-Airport-Pricing-Source": quote.diagnostics.pricingSource } });
  } catch (error) {
    const code = error instanceof AirportQuoteError ? error.code : "PERSISTENCE_UNAVAILABLE";
    const locationInvalid = code === "LOCATION_INVALID";
    const noRoute = code === "NO_ROUTE";
    const status = locationInvalid || noRoute ? 422 : code === "REQUEST_TIMEOUT" ? 504 : 503;
    const message = locationInvalid
      ? "Please select your location again from the Google suggestions."
      : noRoute
        ? "We couldn't find a driving route for this location. Please choose another location or contact RentKA."
        : "We couldn't calculate your fare just now. Your trip details are saved — please try again.";
    const detail = error as Error & { code?: string };
    console.error("Airport quote diagnostic", { attemptId, stage: "response", result: "failure", durationMs: Date.now() - startedAt, errorName: detail?.name ?? "UnknownError", errorCode: code, safeMessage: detail?.message ?? "Airport quote failed", httpStatus: status, retryAttempt: 0, pricingSource: "unknown", runtime: process.env.NODE_ENV });
    return NextResponse.json({ error: message, attemptId }, { status });
  }
}
