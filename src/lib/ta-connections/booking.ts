import "server-only";

import { createHash } from "node:crypto";
import { Resend } from "resend";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { bookingMeetsAdvanceNotice } from "./contract";
import { decodeQuote, type QuotePayload } from "./portal";
import { TA_FIRESTORE_COLLECTIONS } from "./storage";
import { TA_PASSENGER_CAPACITY, type TaBooking } from "./types";
import { minorToPkr } from "./validation";

export interface BookingRequest { quoteToken: string; idempotencyKey: string; travelDate: string; pickupTime: string; requesterName: string; requesterEmail: string; airline: string; flightNumber: string; taReferenceNumber: string; passengerOrGroupName: string; passengerCount: number; passengerContact: string; specialInstructions?: string }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const required = (value: unknown, max = 300) => typeof value === "string" && value.trim().length > 0 && value.length <= max;

export function validateBookingRequest(value: unknown): { ok: true; input: BookingRequest; quote: QuotePayload } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Invalid booking request." };
  const b = value as BookingRequest;
  if (!required(b.quoteToken, 20_000) || !/^[0-9a-f-]{36}$/i.test(b.idempotencyKey)) return { ok: false, error: "Invalid booking request." };
  const quote = decodeQuote(b.quoteToken);
  if (!quote) return { ok: false, error: "The route quote expired. Please calculate it again." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.travelDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.pickupTime)) return { ok: false, error: "Enter a valid travel date and pickup time." };
  const pickupAt = new Date(`${b.travelDate}T${b.pickupTime}:00+05:00`);
  if (!bookingMeetsAdvanceNotice(pickupAt)) return { ok: false, error: "Bookings must be submitted at least 4 hours before the scheduled pickup time." };
  if (![b.requesterName, b.airline, b.flightNumber, b.taReferenceNumber, b.passengerOrGroupName, b.passengerContact].every((item) => required(item))) return { ok: false, error: "Complete all required booking details." };
  if (!required(b.requesterEmail) || !emailPattern.test(b.requesterEmail)) return { ok: false, error: "Enter a valid requesting employee email." };
  if (!Number.isInteger(b.passengerCount) || b.passengerCount < 1 || b.passengerCount > TA_PASSENGER_CAPACITY[quote.vehicleCategory]) return { ok: false, error: `Select a suitable vehicle category; this category supports up to ${TA_PASSENGER_CAPACITY[quote.vehicleCategory]} passengers.` };
  if (b.specialInstructions && b.specialInstructions.length > 2000) return { ok: false, error: "Special instructions are too long." };
  return { ok: true, input: b, quote };
}

export async function persistBooking(input: BookingRequest, quote: QuotePayload): Promise<{ booking: TaBooking; duplicate: boolean }> {
  const db = getAdminDb();
  const idemId = `${quote.airportId}_${createHash("sha256").update(input.idempotencyKey).digest("hex")}`;
  const idemRef = db.collection(TA_FIRESTORE_COLLECTIONS.idempotency).doc(idemId);
  const counterRef = db.collection(TA_FIRESTORE_COLLECTIONS.counters).doc(`booking_${quote.airportId}`);
  const outcome = await db.runTransaction(async (transaction) => {
    const [idem, counter] = await Promise.all([transaction.get(idemRef), transaction.get(counterRef)]);
    if (idem.exists) return { bookingId: String(idem.data()?.bookingId), duplicate: true };
    const sequence = Number(counter.data()?.value ?? 0) + 1;
    if (!Number.isSafeInteger(sequence)) throw new Error("Booking sequence unavailable.");
    const bookingId = `RK-TA-${quote.airportCode}-${String(sequence).padStart(4, "0")}`;
    const createdAt = new Date().toISOString();
    const over50Snapshot = quote.band === "50_PLUS" ? { fixed50KmBaseRateMinor: quote.fixed50KmBaseRateMinor!, additionalDistanceKm: quote.additionalDistanceKm!, additionalPerKmRateMinor: quote.additionalPerKmRateMinor!, additionalDistanceChargeMinor: quote.additionalDistanceChargeMinor! } : {};
    const optionalInstructions = input.specialInstructions?.trim() ? { specialInstructions: input.specialInstructions.trim() } : {};
    const booking: TaBooking = { bookingId, createdAt, createdBy: { role: "TA_REQUESTER", displayName: input.requesterName.trim(), email: input.requesterEmail.trim().toLowerCase() }, serviceType: quote.serviceType, airportId: quote.airportId, airportCode: quote.airportCode, airportName: quote.airportName, pickupLocation: quote.pickup, dropoffLocation: quote.dropoff, pricing: { rateSetId: quote.rateSetId, rateVersion: quote.rateVersion, rateEffectiveFrom: quote.rateEffectiveFrom, routeDistanceKm: quote.distanceKm, routeDurationMinutes: quote.durationMinutes, contractDistanceBand: quote.band, grossContractRateMinor: quote.grossMinor, ...over50Snapshot, commissionPercent: quote.commissionPercent, commissionAmountMinor: quote.commissionMinor, netRentkaAmountMinor: quote.netMinor, currency: quote.currency, ...quote.policies, over50KmBillingMode: quote.over50KmBillingMode }, vehicleCategory: quote.vehicleCategory, passengerCapacity: TA_PASSENGER_CAPACITY[quote.vehicleCategory], travelDate: input.travelDate, pickupTime: input.pickupTime, airline: input.airline.trim(), flightNumber: input.flightNumber.trim(), taReferenceNumber: input.taReferenceNumber.trim(), passengerOrGroupName: input.passengerOrGroupName.trim(), passengerCount: input.passengerCount, passengerContact: input.passengerContact.trim(), requesterEmail: input.requesterEmail.trim().toLowerCase(), ...optionalInstructions, bookingStatus: "NEW_REQUEST", invoice: { invoiceStatus: "NOT_GENERATED" }, payment: { paymentStatus: "UNPAID", currency: quote.currency }, statusHistory: [{ status: "NEW_REQUEST", timestamp: createdAt, actor: { role: "TA_REQUESTER", displayName: input.requesterName.trim(), email: input.requesterEmail.trim().toLowerCase() } }], notificationStatus: { rentkaEmail: "PENDING", requesterEmail: "PENDING" } };
    transaction.set(counterRef, { value: sequence, updatedAt: createdAt });
    transaction.create(db.collection(TA_FIRESTORE_COLLECTIONS.bookings).doc(bookingId), booking);
    transaction.create(idemRef, { bookingId, createdAt });
    return { bookingId, duplicate: false };
  });
  const stored = await db.collection(TA_FIRESTORE_COLLECTIONS.bookings).doc(outcome.bookingId).get();
  if (!stored.exists) throw new Error("Booking persistence could not be verified.");
  return { booking: stored.data() as TaBooking, duplicate: outcome.duplicate };
}

const escape = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const rows = (booking: TaBooking, internal: boolean) => {
  const values: Array<[string, unknown]> = [["Booking ID", booking.bookingId], ["TA reference", booking.taReferenceNumber], ["Requester", `${booking.createdBy?.displayName} (${booking.requesterEmail})`], ["Airline / Flight", `${booking.airline} / ${booking.flightNumber}`], ["Passenger / Group", booking.passengerOrGroupName], ["Passenger contact", booking.passengerContact], ["Passengers", booking.passengerCount], ["Airport", `${booking.airportCode} — ${booking.airportName}`], ["Service", booking.serviceType], ["Pickup", booking.pickupLocation.address], ["Drop-off", booking.dropoffLocation.address], ["Travel", `${booking.travelDate} ${booking.pickupTime} PKT`], ["Vehicle", booking.vehicleCategory], ["Distance / Duration", `${booking.pricing.routeDistanceKm.toFixed(1)} km / ${booking.pricing.routeDurationMinutes} min`], ["Contract band", booking.pricing.contractDistanceBand], ["Contracted fare", `${booking.pricing.currency} ${minorToPkr(booking.pricing.grossContractRateMinor)}`], ["Status", booking.bookingStatus], ["Instructions", booking.specialInstructions || "None"]];
  if (internal) values.splice(values.length - 2, 0, ["TA commission", `${booking.pricing.commissionPercent}% — ${booking.pricing.currency} ${minorToPkr(booking.pricing.commissionAmountMinor)}`], ["RentKA net", `${booking.pricing.currency} ${minorToPkr(booking.pricing.netRentkaAmountMinor)}`]);
  return values.map(([label, value]) => `<tr><td style="padding:7px;color:#64748b">${escape(label)}</td><td style="padding:7px;font-weight:600">${escape(value)}</td></tr>`).join("");
};

export async function sendBookingEmails(booking: TaBooking) {
  const db = getAdminDb(); const ref = db.collection(TA_FIRESTORE_COLLECTIONS.bookings).doc(booking.bookingId);
  const key = process.env.RESEND_API_KEY, from = process.env.BOOKING_FROM_EMAIL, rentka = process.env.BOOKING_NOTIFICATION_EMAIL;
  if (!key || !from || !rentka) { await ref.update({ "notificationStatus.rentkaEmail": "FAILED", "notificationStatus.requesterEmail": "FAILED", "notificationStatus.updatedAt": new Date().toISOString() }); return; }
  const resend = new Resend(key); const shell = (title: string, body: string) => `<div style="font-family:Arial;max-width:720px;margin:auto"><h1>${escape(title)}</h1><table style="width:100%;border-collapse:collapse">${body}</table><p>This is a transport request awaiting RentKA confirmation.</p></div>`;
  const [a, b] = await Promise.allSettled([resend.emails.send({ from, to: rentka, subject: `New TA booking ${booking.bookingId}`, html: shell("New TA Connections Booking", rows(booking, true)) }), resend.emails.send({ from, to: booking.requesterEmail!, subject: `Booking request received — ${booking.bookingId}`, html: shell("Booking Request Submitted", rows(booking, false)) })]);
  await ref.update({ "notificationStatus.rentkaEmail": a.status === "fulfilled" && !a.value.error ? "SENT" : "FAILED", "notificationStatus.requesterEmail": b.status === "fulfilled" && !b.value.error ? "SENT" : "FAILED", "notificationStatus.updatedAt": new Date().toISOString() });
}

export function whatsappMessage(booking: TaBooking) {
  return [`NEW TA CONNECTIONS BOOKING`, `Booking ID: ${booking.bookingId}`, `TA Reference: ${booking.taReferenceNumber}`, `Requester: ${booking.createdBy?.displayName} / ${booking.requesterEmail}`, `Airline / Flight: ${booking.airline} / ${booking.flightNumber}`, `Passenger/Group: ${booking.passengerOrGroupName}`, `Passenger Contact: ${booking.passengerContact}`, `Passengers: ${booking.passengerCount}`, `Airport: ${booking.airportCode} — ${booking.airportName}`, `Service Type: ${booking.serviceType}`, `Pickup: ${booking.pickupLocation.address}`, `Drop: ${booking.dropoffLocation.address}`, `Date / Time: ${booking.travelDate} ${booking.pickupTime} PKT`, `Vehicle: ${booking.vehicleCategory}`, `Distance / Duration: ${booking.pricing.routeDistanceKm.toFixed(1)} km / ${booking.pricing.routeDurationMinutes} min`, `Contract Band: ${booking.pricing.contractDistanceBand}`, `Contract Rate: ${booking.pricing.currency} ${minorToPkr(booking.pricing.grossContractRateMinor)}`, `Special Instructions: ${booking.specialInstructions || "None"}`, `Status: NEW REQUEST`].join("\n");
}
