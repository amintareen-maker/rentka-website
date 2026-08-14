import "server-only";
import { Resend } from "resend";

export type AirportBookingNotification = {
  bookingId: string;
  quoteId: string;
  service: string;
  tripType: "airportPickup" | "airportDropoff";
  customer: { name: string; phone: string; email: string };
  pickup: { displayName?: string; formattedAddress?: string };
  destination: { displayName?: string; formattedAddress?: string };
  distanceKm: number;
  durationMinutes: number;
  date: string;
  time: string;
  passengers: number;
  luggage: string;
  vehicle: { name: string };
  quotedTotal: number;
  advancePercentage: number;
  expectedAdvanceAmount: number;
  flightNumber: string;
  airline: string;
  notes: string;
  paymentStatus: string;
  bookingStatus: string;
  source: string;
  createdAt: string;
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export async function sendAirportBookingNotification(booking: AirportBookingNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.BOOKING_NOTIFICATION_EMAIL;
  const from = process.env.BOOKING_FROM_EMAIL;
  if (!apiKey || !recipient || !from) {
    console.error("Airport booking email configuration is incomplete.");
    return false;
  }

  const serviceDirection = booking.tripType === "airportPickup" ? "Airport Pickup" : "Airport Drop-off";
  const fields: Array<[string, unknown]> = [
    ["Booking ID", booking.bookingId],
    ["Quote ID", booking.quoteId],
    ["Service", "Islamabad Airport Transfer"],
    ["Trip type", serviceDirection],
    ["Customer name", booking.customer.name],
    ["Customer phone / WhatsApp", booking.customer.phone],
    ["Customer email", booking.customer.email || "Not provided"],
    ["Booking date", booking.date],
    ["Pickup time", booking.time],
    ["Flight number", booking.flightNumber || "Not provided"],
    ["Airline", booking.airline || "Not provided"],
    ["Pickup location", booking.pickup.formattedAddress || booking.pickup.displayName],
    ["Drop-off location", booking.destination.formattedAddress || booking.destination.displayName],
    ["Google route distance", `${booking.distanceKm} km`],
    ["Estimated duration", `${booking.durationMinutes} minutes`],
    ["Selected vehicle", booking.vehicle.name],
    ["Passenger count", booking.passengers],
    ["Luggage", booking.luggage],
    ["Final quoted fare", `PKR ${booking.quotedTotal.toLocaleString("en-PK")}`],
    ["Advance percentage", `${booking.advancePercentage}%`],
    ["Expected advance amount", `PKR ${booking.expectedAdvanceAmount.toLocaleString("en-PK")}`],
    ["Booking status", booking.bookingStatus],
    ["Payment status", booking.paymentStatus],
    ["Customer notes", booking.notes || "None"],
    ["Created timestamp", booking.createdAt],
    ["Source", "website airport booking"],
  ];
  const rows = fields.map(([label, value]) => `<tr><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;color:#475569">${escapeHtml(label)}</th><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${escapeHtml(value)}</td></tr>`).join("");
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: recipient,
      subject: `New Airport Booking — ${booking.bookingId}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#0f2b46"><h1>New Airport Booking Request</h1><p>This request is pending vehicle availability and payment.</p><table style="width:100%;border-collapse:collapse">${rows}</table></div>`,
    });
    if (error) {
      console.error("Airport booking notification was rejected by the email provider.");
      return false;
    }
    return true;
  } catch {
    console.error("Airport booking notification delivery failed.");
    return false;
  }
}
