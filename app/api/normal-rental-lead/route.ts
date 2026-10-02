export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { handleLahoreLead } from "@/lib/normal-rental/lahore-lead";
import { publicLeadRateLimit } from "@/lib/normal-rental/public-rate-limit";


export async function POST(request: Request) {
  const limit = publicLeadRateLimit(request);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "Too many booking attempts. Please wait before trying again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  return handleLahoreLead(request, "rent_a_car_lahore");
}
