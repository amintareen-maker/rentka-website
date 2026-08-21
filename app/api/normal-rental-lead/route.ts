export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { handleLahoreLead } from "@/lib/normal-rental/lahore-lead";
import { publicLeadRateLimit } from "@/lib/normal-rental/public-rate-limit";
import { NORMAL_RENTAL_ZONES } from "@/lib/normal-rental/zones";

export async function POST(request: Request) {
  if (!NORMAL_RENTAL_ZONES.lahore.publicEnabled) return NextResponse.json({ ok: false, error: "Lahore booking is not publicly available." }, { status: 404 });
  const limit = publicLeadRateLimit(request);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "Too many booking attempts. Please wait before trying again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  return handleLahoreLead(request, "rent_a_car_lahore");
}
