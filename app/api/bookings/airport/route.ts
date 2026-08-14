import { randomUUID } from "node:crypto";
import { after, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendAirportBookingNotification, type AirportBookingNotification } from "@/lib/airport/notification";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const attemptId = randomUUID();
  const startedAt = Date.now();
  let stage = "request_body_parse";
  try {
    const body = await request.json() as Record<string, unknown>;
    stage = "request_validation";
    const phone = typeof body.phone === "string" ? body.phone.replace(/[\s-]/g, "") : "";
    if (typeof body.quoteId !== "string" || typeof body.name !== "string" || body.name.trim().length < 2 || !/^((\+92)|0)?3\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Enter your name and a valid Pakistani mobile number." }, { status: 400 });
    }
    const customerName = body.name.trim();

    stage = "firestore_setup";
    const adminDb = getAdminDb();
    const quoteRef = adminDb.collection("airportQuotes").doc(body.quoteId);
    const counterRef = adminDb.collection("airportCounters").doc("islamabadAirportBookings");
    const internalDocumentId = randomUUID();
    const bookingRef = adminDb.collection("airportBookings").doc(internalDocumentId);
    stage = "firestore_transaction";
    const booking = await adminDb.runTransaction(async (transaction) => {
      stage = "transaction_reads";
      const [quoteSnapshot, counterSnapshot] = await Promise.all([
        transaction.get(quoteRef),
        transaction.get(counterRef),
      ]);
      if (!quoteSnapshot.exists) throw new Error("QUOTE_NOT_FOUND");
      stage = "quote_validation";
      const quote = quoteSnapshot.data()!;
      if (new Date(String(quote.expiresAt)).getTime() <= Date.now()) throw new Error("QUOTE_EXPIRED");
      const selectedOption = Array.isArray(quote.vehicleOptions)
        ? quote.vehicleOptions.find((option: { vehicle?: { id?: unknown } }) => option?.vehicle?.id === body.vehicleId)
        : quote.vehicle && typeof quote.vehicle === "object"
          ? { vehicle: quote.vehicle, price: quote.price, operationalKm: quote.operationalKm, includedItems: quote.includedItems, excludedItems: quote.excludedItems }
          : undefined;
      if (!selectedOption) throw new Error("QUOTE_VEHICLE_MISSING");
      stage = "counter_increment";
      const sequence = Number(counterSnapshot.data()?.value ?? 1000) + 1;
      if (!Number.isSafeInteger(sequence) || sequence < 1001) throw new Error("SEQUENCE_UNAVAILABLE");
      const bookingId = `RK-ISB-ARPT-${String(sequence).padStart(4, "0")}`;
      const createdAt = new Date().toISOString();
      const nextBooking: AirportBookingNotification & { operationalKm: number } = {
        bookingId,
        quoteId: body.quoteId as string,
        service: "airportTransfer",
        tripType: quote.tripType === "airportDropoff" ? "airportDropoff" : "airportPickup",
        customer: { name: customerName, phone: String(body.phone), email: typeof body.email === "string" ? body.email.trim() : "" },
        pickup: quote.pickup,
        destination: quote.destination,
        distanceKm: quote.distanceKm,
        durationMinutes: quote.durationMinutes,
        operationalKm: selectedOption.operationalKm ?? 0,
        date: quote.date,
        time: quote.time,
        passengers: quote.passengers,
        luggage: quote.luggage,
        vehicle: selectedOption.vehicle,
        quotedTotal: selectedOption.price,
        advancePercentage: quote.advancePercentage,
        expectedAdvanceAmount: Math.round(selectedOption.price * quote.advancePercentage / 100),
        flightNumber: typeof body.flightNumber === "string" ? body.flightNumber.trim() : "",
        airline: typeof body.airline === "string" ? body.airline.trim() : "",
        notes: typeof body.notes === "string" ? body.notes.trim() : "",
        paymentStatus: "not_started",
        bookingStatus: "pending_availability",
        source: "website_airport_booking",
        createdAt,
      };
      stage = "transaction_writes";
      transaction.set(counterRef, { value: sequence, updatedAt: createdAt });
      transaction.create(bookingRef, { ...nextBooking, internalDocumentId, notificationStatus: "pending" });
      return nextBooking;
    });
    const persistedAt = Date.now();
    after(async () => {
      const emailStartedAt = Date.now();
      const emailSent = await sendAirportBookingNotification(booking);
      await bookingRef.update({ notificationStatus: emailSent ? "sent" : "failed", notificationUpdatedAt: new Date().toISOString() }).catch(() => {
        console.error("Airport booking notification status could not be updated.", { attemptId });
      });
      console.info("Airport booking diagnostic", { attemptId, stage: "email_notification", result: emailSent ? "sent" : "failed", durationMs: Date.now() - emailStartedAt });
    });
    stage = "api_response";
    console.info("Airport booking diagnostic", { attemptId, stage: "booking_persistence", result: "success", durationMs: persistedAt - startedAt });
    return NextResponse.json({
      success: true,
      bookingId: booking.bookingId,
      quoteId: booking.quoteId,
      status: booking.bookingStatus,
      tripType: booking.tripType,
      date: booking.date,
      time: booking.time,
      pickup: booking.pickup,
      destination: booking.destination,
      vehicle: booking.vehicle,
      quotedTotal: booking.quotedTotal,
      advancePercentage: booking.advancePercentage,
      expectedAdvanceAmount: booking.expectedAdvanceAmount,
      passengers: booking.passengers,
      luggage: booking.luggage,
      customer: booking.customer,
      flightNumber: booking.flightNumber,
      airline: booking.airline,
      notes: booking.notes,
    });
  } catch (error) {
    const diagnostic = error as Error & { code?: string | number };
    console.error("Airport booking diagnostic", {
      attemptId,
      stage,
      errorName: diagnostic?.name ?? "UnknownError",
      errorCode: diagnostic?.code ?? "UNKNOWN",
      errorMessage: diagnostic?.message ?? "Unknown booking error",
    });
    if (error instanceof Error && error.message === "QUOTE_NOT_FOUND") return NextResponse.json({ error: "This quote could not be verified. Please calculate it again." }, { status: 404 });
    if (error instanceof Error && error.message === "QUOTE_EXPIRED") return NextResponse.json({ error: "This quote has expired. Please calculate a fresh price." }, { status: 410 });
    if (error instanceof Error && error.message === "QUOTE_VEHICLE_MISSING") return NextResponse.json({ error: "That vehicle option could not be verified. Please calculate a fresh price." }, { status: 400 });
    return NextResponse.json({ error: "We could not create the booking request. Please try again or use WhatsApp." }, { status: 500 });
  }
}
