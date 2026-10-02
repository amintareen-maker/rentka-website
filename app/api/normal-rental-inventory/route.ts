import { NextResponse } from "next/server";
import { getPublicNormalRentalInventory } from "@/lib/normal-rental/public-inventory";
import { getNormalRentalBookingContext, NORMAL_RENTAL_ZONES, normalRentalZoneForCity } from "@/lib/normal-rental/zones";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cityId = new URL(request.url).searchParams.get("city") ?? "";
  const zoneId = normalRentalZoneForCity(cityId);
  if (!zoneId || !NORMAL_RENTAL_ZONES[zoneId].publicEnabled) return NextResponse.json({ error: "Unknown public city." }, { status: 400 });
  const context = getNormalRentalBookingContext(zoneId, cityId);
  try {
    return NextResponse.json({ inventory: await getPublicNormalRentalInventory(zoneId, context.cityId) }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch {
    return NextResponse.json({ error: "Current cars could not be loaded. Please try again." }, { status: 503 });
  }
}
