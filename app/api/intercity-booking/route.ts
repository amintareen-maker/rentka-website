import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type IntercityBookingPayload = {
  tripType: "one-way" | "round-trip";
  route: {
    from: string;
    to: string;
    slug: string;
  };
  vehicle: string;
  price: number | null;
  name: string;
  phone: string;
  passengers: string;
  travelDate: string;
  pickupTime: string;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  pickupPlaceId: string;
  pickupMapLink: string;
  dropAddress: string;
  dropLat: number | null;
  dropLng: number | null;
  dropPlaceId: string;
  dropMapLink: string;
  notes: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isBookingPayload(value: unknown): value is IntercityBookingPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Record<string, unknown>;
  const route = payload.route;

  if (!route || typeof route !== "object") return false;
  const routeData = route as Record<string, unknown>;

  return (
    (payload.tripType === "one-way" || payload.tripType === "round-trip") &&
    isString(routeData.from) &&
    isString(routeData.to) &&
    isString(routeData.slug) &&
    isString(payload.vehicle) &&
    (payload.price === null ||
      (typeof payload.price === "number" && Number.isFinite(payload.price))) &&
    isString(payload.name) &&
    isString(payload.phone) &&
    isString(payload.passengers) &&
    isString(payload.travelDate) &&
    isString(payload.pickupTime) &&
    isString(payload.pickupAddress) &&
    isNullableNumber(payload.pickupLat) &&
    isNullableNumber(payload.pickupLng) &&
    isString(payload.pickupPlaceId) &&
    isString(payload.pickupMapLink) &&
    isString(payload.dropAddress) &&
    isNullableNumber(payload.dropLat) &&
    isNullableNumber(payload.dropLng) &&
    isString(payload.dropPlaceId) &&
    isString(payload.dropMapLink) &&
    isString(payload.notes)
  );
}

function hasRequiredFields(payload: IntercityBookingPayload): boolean {
  return [
    payload.name,
    payload.phone,
    payload.travelDate,
    payload.pickupTime,
    payload.pickupAddress,
    payload.dropAddress,
    payload.route.from,
    payload.route.to,
    payload.vehicle,
    payload.tripType,
  ].every((value) => value.trim().length > 0);
}

function mapLink(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) return null;
  return `https://maps.google.com/?q=${lat},${lng}`;
}

function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:9px 12px;color:#64748b;width:38%;vertical-align:top;border-bottom:1px solid #e2e8f0;">${label}</td><td style="padding:9px 12px;color:#0f172a;font-weight:600;vertical-align:top;border-bottom:1px solid #e2e8f0;">${value}</td></tr>`;
}

export async function POST(request: Request) {
  let rawPayload: unknown;

  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid booking information." },
      { status: 400 }
    );
  }

  if (!isBookingPayload(rawPayload) || !hasRequiredFields(rawPayload)) {
    return NextResponse.json(
      { success: false, error: "Invalid booking information." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL;
  const fromEmail = process.env.BOOKING_FROM_EMAIL;

  if (!apiKey || !notificationEmail || !fromEmail) {
    console.error("Intercity booking email configuration is incomplete.");
    return NextResponse.json(
      { success: false, error: "Unable to send booking notification." },
      { status: 500 }
    );
  }

  const payload = rawPayload;
  const pickupGoogleMapsLink = mapLink(payload.pickupLat, payload.pickupLng);
  const dropGoogleMapsLink = mapLink(payload.dropLat, payload.dropLng);
  const phoneHref = payload.phone.replace(/[^+\d]/g, "");
  const submittedAt = new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());

  const safe = {
    from: escapeHtml(payload.route.from.trim()),
    to: escapeHtml(payload.route.to.trim()),
    slug: escapeHtml(payload.route.slug.trim() || "Not provided"),
    tripType: escapeHtml(payload.tripType === "one-way" ? "One Way" : "Round Trip"),
    vehicle: escapeHtml(payload.vehicle.trim()),
    price: escapeHtml(payload.price === null ? "Custom Quote" : `PKR ${payload.price.toLocaleString("en-PK")}`),
    name: escapeHtml(payload.name.trim()),
    phone: escapeHtml(payload.phone.trim()),
    phoneHref: escapeHtml(phoneHref),
    passengers: escapeHtml(payload.passengers.trim() || "Not provided"),
    travelDate: escapeHtml(payload.travelDate.trim()),
    pickupTime: escapeHtml(payload.pickupTime.trim()),
    pickupAddress: escapeHtml(payload.pickupAddress.trim()),
    pickupCoordinates: escapeHtml(
      payload.pickupLat === null || payload.pickupLng === null
        ? "Not available"
        : `${payload.pickupLat}, ${payload.pickupLng}`
    ),
    pickupPlaceId: escapeHtml(payload.pickupPlaceId.trim() || "Not available"),
    dropAddress: escapeHtml(payload.dropAddress.trim()),
    dropCoordinates: escapeHtml(
      payload.dropLat === null || payload.dropLng === null
        ? "Not available"
        : `${payload.dropLat}, ${payload.dropLng}`
    ),
    dropPlaceId: escapeHtml(payload.dropPlaceId.trim() || "Not available"),
    notes: escapeHtml(payload.notes.trim() || "None").replaceAll("\n", "<br />"),
    submittedAt: escapeHtml(submittedAt),
  };

  const pickupLinkHtml = pickupGoogleMapsLink
    ? `<a href="${escapeHtml(pickupGoogleMapsLink)}" style="color:#5BAE4A;font-weight:700;">Open pickup in Google Maps</a>`
    : "Not available";
  const dropLinkHtml = dropGoogleMapsLink
    ? `<a href="${escapeHtml(dropGoogleMapsLink)}" style="color:#5BAE4A;font-weight:700;">Open drop-off in Google Maps</a>`
    : "Not available";

  const html = `<!doctype html>
  <html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
      <div style="background:#0F2B46;border-radius:18px 18px 0 0;padding:28px;color:#fff;">
        <div style="font-size:13px;font-weight:700;letter-spacing:.12em;color:#9bd38f;">RENTKA BOOKINGS</div>
        <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;">New Intercity Booking</h1>
        <p style="margin:9px 0 0;color:#dbeafe;">${safe.from} &rarr; ${safe.to}</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #dbe3ec;border-top:0;">
        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Booking Summary</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">${detailRow("Route", `${safe.from} &rarr; ${safe.to}`)}${detailRow("Route slug", safe.slug)}${detailRow("Trip type", safe.tripType)}${detailRow("Vehicle", safe.vehicle)}${detailRow("Estimated price", safe.price)}${detailRow("Submitted", `${safe.submittedAt} (Asia/Karachi)`)}</table>

        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Customer Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">${detailRow("Full name", safe.name)}${detailRow("Phone", `<a href="tel:${safe.phoneHref}" style="color:#5BAE4A;font-weight:700;">${safe.phone}</a>`)}${detailRow("Passengers", safe.passengers)}</table>

        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Travel Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">${detailRow("Travel date", safe.travelDate)}${detailRow("Pickup time", safe.pickupTime)}${detailRow("Pickup address", safe.pickupAddress)}${detailRow("Pickup coordinates", safe.pickupCoordinates)}${detailRow("Pickup map", pickupLinkHtml)}${detailRow("Pickup place ID", safe.pickupPlaceId)}${detailRow("Drop-off address", safe.dropAddress)}${detailRow("Drop-off coordinates", safe.dropCoordinates)}${detailRow("Drop-off map", dropLinkHtml)}${detailRow("Drop-off place ID", safe.dropPlaceId)}</table>

        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Special Instructions</h2>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;line-height:1.6;">${safe.notes}</div>
      </div>
      <div style="background:#e8f5e5;border-radius:0 0 18px 18px;padding:16px;text-align:center;color:#0F2B46;font-size:13px;">RentKA intercity booking notification</div>
    </div>
  </body></html>`;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `New Intercity Booking: ${payload.route.from.trim()} → ${payload.route.to.trim()} | ${payload.name.trim()}`,
      html,
    });

    if (error || !data?.id) {
      console.error("Resend rejected intercity booking notification:", error);
      return NextResponse.json(
        { success: false, error: "Unable to send booking notification." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emailId: data.id });
  } catch (error) {
    console.error("Intercity booking notification failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to send booking notification." },
      { status: 500 }
    );
  }
}
