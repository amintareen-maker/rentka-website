import { NextResponse } from "next/server";

export const runtime = "nodejs";

const REQUIRED_FIELDS = [
  "leadId",
  "name",
  "phone",
  "carName",
  "city",
  "pickupDate",
  "preferredTime",
] as const;

type LeadSheetPayload = Record<string, unknown>;

function isPresent(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
}

export async function POST(request: Request) {
  let payload: LeadSheetPayload;

  try {
    payload = (await request.json()) as LeadSheetPayload;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid booking data." }, { status: 400 });
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !isPresent(payload[field]));
  if (missingFields.length > 0) {
    return NextResponse.json({ success: false, error: "Required booking data is missing." }, { status: 400 });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("Lead sheet sync is not configured.");
    return NextResponse.json(
      { success: false, error: "Unable to sync booking with the lead sheet." },
      { status: 503 }
    );
  }

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) {
      body.set(key, "");
    } else if (["string", "number", "boolean"].includes(typeof value)) {
      body.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("Lead sheet sync returned a non-success response.", { status: response.status });
      return NextResponse.json(
        { success: false, error: "Unable to sync booking with the lead sheet." },
        { status: 502 }
      );
    }

    const responseText = await response.text();
    let result: { success?: boolean; status?: string };
    try {
      result = JSON.parse(responseText) as { success?: boolean; status?: string };
    } catch {
      console.warn("Lead sheet sync returned an invalid response.");
      return NextResponse.json(
        { success: false, error: "Unable to sync booking with the lead sheet." },
        { status: 502 }
      );
    }

    if (result.success !== true || !["inserted", "duplicate"].includes(result.status ?? "")) {
      console.warn("Lead sheet sync did not confirm the booking.");
      return NextResponse.json(
        { success: false, error: "Unable to sync booking with the lead sheet." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId: String(payload.leadId),
      sheetStatus: result.status,
    });
  } catch (error) {
    console.warn("Lead sheet sync request failed.", {
      reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "request-error",
    });
    return NextResponse.json(
      { success: false, error: "Unable to sync booking with the lead sheet." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
