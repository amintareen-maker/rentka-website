import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type LeadBookingPayload = {
  leadId: string;
  carName: string;
  carId: string | null;
  vendorName: string | null;
  vendorId: string | null;
  modelYear: string | number | null;
  country: string | null;
  city: string;
  service: string;
  pricingType: string | null;
  duration: string | null;
  originalPrice: string | number | null;
  dailyRentalRate: number;
  numberOfDays: number;
  estimatedRentalAmount: number;
  pickupDate: string;
  preferredTime: string;
  pickupAddress: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupPlaceId: string;
  pickupMapLink: string;
  isOutstation: boolean;
  destinationAddress: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationPlaceId: string;
  destinationMapLink: string;
  customerName: string;
  phone: string;
  email: string;
  source: string;
  reviewLink: string;
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

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isStringNumberOrNull(value: unknown): value is string | number | null {
  return value === null || isString(value) || isFiniteNumber(value);
}

function isLeadBookingPayload(value: unknown): value is LeadBookingPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;

  return (
    isString(payload.leadId) &&
    isString(payload.carName) &&
    isNullableString(payload.carId) &&
    isNullableString(payload.vendorName) &&
    isNullableString(payload.vendorId) &&
    isStringNumberOrNull(payload.modelYear) &&
    isNullableString(payload.country) &&
    isString(payload.city) &&
    isString(payload.service) &&
    isNullableString(payload.pricingType) &&
    isNullableString(payload.duration) &&
    isStringNumberOrNull(payload.originalPrice) &&
    isFiniteNumber(payload.dailyRentalRate) &&
    isFiniteNumber(payload.numberOfDays) &&
    isFiniteNumber(payload.estimatedRentalAmount) &&
    isString(payload.pickupDate) &&
    isString(payload.preferredTime) &&
    isString(payload.pickupAddress) &&
    isNullableNumber(payload.pickupLatitude) &&
    isNullableNumber(payload.pickupLongitude) &&
    isString(payload.pickupPlaceId) &&
    isString(payload.pickupMapLink) &&
    typeof payload.isOutstation === "boolean" &&
    isString(payload.destinationAddress) &&
    isNullableNumber(payload.destinationLatitude) &&
    isNullableNumber(payload.destinationLongitude) &&
    isString(payload.destinationPlaceId) &&
    isString(payload.destinationMapLink) &&
    isString(payload.customerName) &&
    isString(payload.phone) &&
    isString(payload.email) &&
    isString(payload.source) &&
    isString(payload.reviewLink)
  );
}

function hasRequiredFields(payload: LeadBookingPayload): boolean {
  return (
    [
      payload.leadId,
      payload.carName,
      payload.city,
      payload.pickupDate,
      payload.preferredTime,
      payload.pickupAddress,
      payload.customerName,
      payload.phone,
    ].every((value) => value.trim().length > 0) &&
    payload.dailyRentalRate > 0 &&
    Number.isInteger(payload.numberOfDays) &&
    payload.numberOfDays >= 1 &&
    payload.estimatedRentalAmount > 0
  );
}

function formatPkr(value: number): string {
  return `PKR ${value.toLocaleString("en-PK")}`;
}

function display(value: unknown): string {
  const text = String(value ?? "").trim();
  return escapeHtml(text || "Not provided");
}

function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:9px 12px;color:#64748b;width:38%;vertical-align:top;border-bottom:1px solid #e2e8f0;">${label}</td><td style="padding:9px 12px;color:#0f172a;font-weight:600;vertical-align:top;border-bottom:1px solid #e2e8f0;">${value}</td></tr>`;
}

function coordinates(latitude: number | null, longitude: number | null): string {
  return latitude === null || longitude === null
    ? "Not available"
    : escapeHtml(`${latitude}, ${longitude}`);
}

function safeMapsLink(
  providedLink: string,
  latitude: number | null,
  longitude: number | null
): string | null {
  if (latitude !== null && longitude !== null) {
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  return providedLink.startsWith("https://maps.google.com/?q=") ? providedLink : null;
}

function linkOrUnavailable(url: string | null, label: string): string {
  return url
    ? `<a href="${escapeHtml(url)}" style="color:#5BAE4A;font-weight:700;">${label}</a>`
    : "Not available";
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

  if (!isLeadBookingPayload(rawPayload) || !hasRequiredFields(rawPayload)) {
    return NextResponse.json(
      { success: false, error: "Invalid booking information." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL;
  const fromEmail = process.env.BOOKING_FROM_EMAIL;

  if (!apiKey || !notificationEmail || !fromEmail) {
    console.error("Standard booking email configuration is incomplete.");
    return NextResponse.json(
      { success: false, error: "Unable to send booking notification." },
      { status: 500 }
    );
  }

  const payload = rawPayload;
  const pickupMapsLink = safeMapsLink(
    payload.pickupMapLink,
    payload.pickupLatitude,
    payload.pickupLongitude
  );
  const destinationMapsLink = safeMapsLink(
    payload.destinationMapLink,
    payload.destinationLatitude,
    payload.destinationLongitude
  );
  const phoneHref = payload.phone.replace(/[^+\d]/g, "");
  const submittedAt = new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());
  const reviewLink = payload.reviewLink.startsWith("https://www.rentka.co/review?")
    ? payload.reviewLink
    : null;
  const dayLabel = `${payload.numberOfDays} ${payload.numberOfDays === 1 ? "Day" : "Days"}`;

  const bookingRows = [
    detailRow("Lead ID", display(payload.leadId)),
    detailRow("Car", display(payload.carName)),
    detailRow("Car ID", display(payload.carId)),
    detailRow("Vendor", display(payload.vendorName)),
    detailRow("Vendor ID", display(payload.vendorId)),
    detailRow("Model", display(payload.modelYear)),
    detailRow("Country", display(payload.country)),
    detailRow("City", display(payload.city)),
    detailRow("Service", display(payload.service)),
    detailRow("Package", display(payload.pricingType)),
    detailRow("Duration", display(payload.duration)),
    detailRow("Original price", display(payload.originalPrice)),
    detailRow("Source", display(payload.source)),
    detailRow("Submitted", `${display(submittedAt)} (Asia/Karachi)`),
  ].join("");

  const pricingRows = [
    detailRow("Daily Rental", escapeHtml(formatPkr(payload.dailyRentalRate))),
    detailRow("Number of Days", escapeHtml(dayLabel)),
    detailRow(
      "Calculation",
      escapeHtml(`${formatPkr(payload.dailyRentalRate)} × ${dayLabel}`)
    ),
    detailRow(
      "Estimated Rental Amount",
      `<span style="color:#5BAE4A;font-size:18px;">${escapeHtml(
        formatPkr(payload.estimatedRentalAmount)
      )}</span>`
    ),
  ].join("");

  const travelRows = [
    detailRow("Pickup Date", display(payload.pickupDate)),
    detailRow("Preferred Time", display(payload.preferredTime)),
    detailRow("Pickup Location", display(payload.pickupAddress)),
    detailRow(
      "Pickup coordinates",
      coordinates(payload.pickupLatitude, payload.pickupLongitude)
    ),
    detailRow("Pickup Google Maps", linkOrUnavailable(pickupMapsLink, "Open pickup in Google Maps")),
    detailRow("Pickup Place ID", display(payload.pickupPlaceId)),
    ...(payload.isOutstation
      ? [
          detailRow("Travelling To", display(payload.destinationAddress)),
          detailRow(
            "Destination coordinates",
            coordinates(payload.destinationLatitude, payload.destinationLongitude)
          ),
          detailRow(
            "Destination Google Maps",
            linkOrUnavailable(destinationMapsLink, "Open destination in Google Maps")
          ),
          detailRow("Destination Place ID", display(payload.destinationPlaceId)),
        ]
      : []),
  ].join("");

  const customerRows = [
    detailRow("Customer name", display(payload.customerName)),
    detailRow(
      "Phone",
      `<a href="tel:${escapeHtml(phoneHref)}" style="color:#5BAE4A;font-weight:700;">${display(
        payload.phone
      )}</a>`
    ),
    detailRow("Email", display(payload.email)),
    detailRow(
      "Review link",
      reviewLink
        ? `<a href="${escapeHtml(reviewLink)}" style="color:#5BAE4A;font-weight:700;">Open review link</a>`
        : "Not available"
    ),
  ].join("");

  const html = `<!doctype html>
  <html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
      <div style="background:#0F2B46;border-radius:18px 18px 0 0;padding:28px;color:#fff;">
        <div style="font-size:13px;font-weight:700;letter-spacing:.12em;color:#9bd38f;">RENTKA BOOKINGS</div>
        <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;">New Car Booking</h1>
        <p style="margin:9px 0 0;color:#dbeafe;">${display(payload.carName)} &middot; ${display(
          payload.city
        )} &middot; ${display(payload.leadId)}</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #dbe3ec;border-top:0;">
        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Booking Summary</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">${bookingRows}</table>

        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Pricing Summary</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">${pricingRows}</table>

        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Travel Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">${travelRows}</table>

        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Customer Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">${customerRows}</table>

        <h2 style="color:#0F2B46;font-size:18px;margin:0 0 10px;border-left:4px solid #5BAE4A;padding-left:10px;">Important Note</h2>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;line-height:1.6;">Estimated rental only. Fuel, toll tax, parking, overtime, driver food and accommodation, and other applicable charges are excluded unless explicitly stated.</div>
      </div>
      <div style="background:#e8f5e5;border-radius:0 0 18px 18px;padding:16px;text-align:center;color:#0F2B46;font-size:13px;">RentKA standard booking notification</div>
    </div>
  </body></html>`;

  const subjectCar = payload.carName.replace(/[\r\n]+/g, " ").trim();
  const subjectCity = payload.city.replace(/[\r\n]+/g, " ").trim();
  const subjectLeadId = payload.leadId.replace(/[\r\n]+/g, " ").trim();

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `New Car Booking: ${subjectCar} | ${subjectCity} | ${subjectLeadId}`,
      html,
    });

    if (error || !data?.id) {
      console.error("Standard booking notification was rejected.");
      return NextResponse.json(
        { success: false, error: "Unable to send booking notification." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emailId: data.id });
  } catch {
    console.error("Standard booking notification failed.");
    return NextResponse.json(
      { success: false, error: "Unable to send booking notification." },
      { status: 500 }
    );
  }
}
