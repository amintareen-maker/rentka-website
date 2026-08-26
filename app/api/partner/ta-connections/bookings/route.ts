import { NextResponse } from "next/server";
import { hasTaSession } from "@/lib/ta-connections/session";
import { persistBooking, sendBookingEmails, validateBookingRequest, whatsappMessage } from "@/lib/ta-connections/booking";
import { minorToPkr } from "@/lib/ta-connections/validation";
import { attemptAutomaticOperationalIntake } from "@/lib/dispatch/automatic-intake";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await hasTaSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = validateBookingRequest(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const result = await persistBooking(parsed.input, parsed.quote);
    await attemptAutomaticOperationalIntake("ta_connections", result.booking.bookingId);
    if (!result.duplicate) await sendBookingEmails(result.booking).catch(() => undefined);
    const b = result.booking;
    return NextResponse.json({ duplicate: result.duplicate, booking: { bookingId: b.bookingId, taReferenceNumber: b.taReferenceNumber, airport: `${b.airportCode} — ${b.airportName}`, serviceType: b.serviceType, route: `${b.pickupLocation.address} → ${b.dropoffLocation.address}`, travelDate: b.travelDate, pickupTime: b.pickupTime, vehicleCategory: b.vehicleCategory, passengerCount: b.passengerCount, contractedFare: `${b.pricing.currency} ${minorToPkr(b.pricing.grossContractRateMinor)}`, status: b.bookingStatus }, whatsappUrl: `https://wa.me/923020589999?text=${encodeURIComponent(whatsappMessage(b))}` });
  } catch { return NextResponse.json({ error: "Unable to save the booking request." }, { status: 500 }); }
}
