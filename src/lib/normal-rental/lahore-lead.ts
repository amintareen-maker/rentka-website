import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { resolveNormalRentalInventory } from "@/lib/normal-rental/inventory-resolver";
import { normalRentalPublicLabel } from "@/lib/normal-rental/inventory-core";
import { getNormalRentalBookingContext, resolveNormalRentalLeadCode } from "@/lib/normal-rental/zones";
import { isValidPakistanPlace } from "@/lib/normal-rental/place-validation";
import { publicLahoreOptionId } from "@/lib/normal-rental/public-inventory";

type Payload = Record<string, unknown>;
const value = (payload: Payload, key: string) => typeof payload[key] === "string" ? payload[key].trim() : "";
const coordinate = (payload: Payload, key: string) => typeof payload[key] === "number" ? payload[key] : Number.NaN;
const mapsLink = (latitude: number, longitude: number) => `https://maps.google.com/?q=${latitude},${longitude}`;

export async function createLahoreLead(request: Request, source: "admin_lahore_preview" | "rent_a_car_lahore") {
  let payload: Payload;
  try { payload = await request.json() as Payload; } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }
  const inventoryId = value(payload, "inventoryId");
  const pricingType = value(payload, "pricingType");
  const duration = value(payload, "duration");
  const pickupDate = value(payload, "pickupDate");
  const preferredTime = value(payload, "preferredTime");
  const pickupAddress = value(payload, "pickupAddress");
  const pickupPlaceId = value(payload, "pickupPlaceId");
  const pickupLatitude = coordinate(payload, "pickupLatitude");
  const pickupLongitude = coordinate(payload, "pickupLongitude");
  const destinationAddress = value(payload, "destinationAddress");
  const destinationPlaceId = value(payload, "destinationPlaceId");
  const destinationLatitude = coordinate(payload, "destinationLatitude");
  const destinationLongitude = coordinate(payload, "destinationLongitude");
  const customerName = value(payload, "customerName");
  const phone = value(payload, "phone");
  const email = value(payload, "email");
  const numberOfDays = Number(payload.numberOfDays);
  if (!inventoryId
    || !["withinCity", "outsideCity"].includes(pricingType) || !["daily", "weekly", "monthly"].includes(duration)
    || !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || !/^\d{2}:\d{2}$/.test(preferredTime)
    || !isValidPakistanPlace({ address: pickupAddress, placeId: pickupPlaceId, latitude: pickupLatitude, longitude: pickupLongitude })
    || (pricingType === "outsideCity" && !isValidPakistanPlace({ address: destinationAddress, placeId: destinationPlaceId, latitude: destinationLatitude, longitude: destinationLongitude })) || !customerName || !phone
    || !Number.isInteger(numberOfDays) || numberOfDays < 1 || numberOfDays > 30) {
    return NextResponse.json({ ok: false, error: "Complete all required test booking fields." }, { status: 400 });
  }
  const inventory = await resolveNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", service: "withDriver" });
  const selected = inventory.find((item) => source === "rent_a_car_lahore" ? publicLahoreOptionId(item.inventoryId) === inventoryId : item.inventoryId === inventoryId);
  if (!selected) return NextResponse.json({ ok: false, error: "This Lahore inventory option is not active or eligible." }, { status: 409 });
  const rate = selected.pricing.withDriver[pricingType as "withinCity" | "outsideCity"][duration as "daily" | "weekly" | "monthly"];
  if (!rate || rate <= 0) return NextResponse.json({ ok: false, error: "The selected Lahore rate is unavailable." }, { status: 409 });
  const context = getNormalRentalBookingContext("lahore");
  const cityCode = resolveNormalRentalLeadCode(context);
  const db = getAdminDb();
  const counterRef = db.collection("meta").doc("counters");
  const leadRef = db.collection("leads").doc();
  const reviewToken = randomBytes(8).toString("base64url");
  const reviewLink = `https://www.rentka.co/review?leadId=${leadRef.id}&token=${reviewToken}`;
  const leadId = await db.runTransaction(async (transaction) => {
    const counter = await transaction.get(counterRef);
    if (!counter.exists) throw new Error("Counter document does not exist.");
    const next = Number(counter.data()?.leadCounter ?? 0) + 1;
    if (!Number.isSafeInteger(next)) throw new Error("Lead counter is unavailable.");
    const generated = `RK-${cityCode}-${next}`;
    transaction.update(counterRef, { leadCounter: next });
    transaction.create(leadRef, {
      leadId: generated, name: customerName, phone, email: email || null,
      carName: selected.modelName, inventoryId: selected.inventoryId,
      publicVehicleLabel: selected.showAsSeparateCard ? normalRentalPublicLabel(selected) : null,
      country: "PK", city: context.cityLabel, cityId: context.cityId,
      zoneId: context.zoneId, cityCode, service: "withDriver", modelYear: selected.modelYearLabel ?? selected.modelYear ?? null,
      vendorName: selected.vendorName, vendorId: selected.vendorId, pricingType, duration, price: rate,
      pickupDate, preferredTime, pickupAddress, pickupLatitude, pickupLongitude, pickupPlaceId, pickupMapLink: mapsLink(pickupLatitude, pickupLongitude),
      numberOfDays, dailyRentalRate: rate, estimatedRentalAmount: rate * numberOfDays,
      destinationAddress: pricingType === "outsideCity" ? destinationAddress : null,
      destinationLatitude: pricingType === "outsideCity" ? destinationLatitude : null,
      destinationLongitude: pricingType === "outsideCity" ? destinationLongitude : null,
      destinationPlaceId: pricingType === "outsideCity" ? destinationPlaceId : null,
      destinationMapLink: pricingType === "outsideCity" ? mapsLink(destinationLatitude, destinationLongitude) : null,
      source, status: "new", adminPrivateTest: source === "admin_lahore_preview",
      reviewSubmitted: false, reviewSent: false, reviewToken, reviewLink, createdAt: FieldValue.serverTimestamp(),
    });
    return generated;
  });
  const integrationWarnings: string[] = [];
  if (source === "rent_a_car_lahore") {
    const base = new URL(request.url);
    const destinationMapLink = pricingType === "outsideCity" ? mapsLink(destinationLatitude, destinationLongitude) : "";
    const common = {
      leadId, carName: selected.modelName, carId: selected.inventoryId, vendorName: selected.vendorName, vendorId: selected.vendorId,
      modelYear: selected.modelYearLabel ?? selected.modelYear ?? null, country: "PK", city: context.cityLabel,
      service: "With Driver", pricingType, duration, originalPrice: rate, dailyRentalRate: rate, numberOfDays,
      estimatedRentalAmount: rate * numberOfDays, pickupDate, preferredTime, pickupAddress, pickupLatitude, pickupLongitude,
      pickupPlaceId, pickupMapLink: mapsLink(pickupLatitude, pickupLongitude), isOutstation: pricingType === "outsideCity",
      destinationAddress: pricingType === "outsideCity" ? destinationAddress : "",
      destinationLatitude: pricingType === "outsideCity" ? destinationLatitude : null,
      destinationLongitude: pricingType === "outsideCity" ? destinationLongitude : null,
      destinationPlaceId: pricingType === "outsideCity" ? destinationPlaceId : "", destinationMapLink,
      customerName, phone, email, source, reviewLink,
    };
    const sheetPayload = {
      leadId, name: customerName, phone, email, carName: selected.modelName, vendorName: selected.vendorName,
      vendorId: selected.vendorId, modelYear: String(common.modelYear ?? ""), country: "PK", city: context.cityLabel,
      service: "withDriver", serviceType: pricingType, packageName: pricingType, packageDuration: duration,
      packagePrice: String(rate), pickupDate, preferredTime, source, status: "new", pickupAddress,
      numberOfDays, dailyRentalRate: rate, estimatedRentalAmount: rate * numberOfDays,
      destinationAddress: pricingType === "outsideCity" ? destinationAddress : "", isOutstation: pricingType === "outsideCity",
    };
    const integrations = await Promise.allSettled([
      fetch(new URL("/api/lead-booking", base), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(common) }),
      fetch(new URL("/api/lead-sheet", base), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sheetPayload) }),
    ]);
    const labels = ["email", "Google Sheets"];
    integrations.forEach((result, index) => {
      if (result.status === "rejected" || !result.value.ok) integrationWarnings.push(`${labels[index]} failed`);
    });
  }
  return NextResponse.json({
    ok: true, leadId, reviewLink, dailyRentalRate: rate, estimatedRentalAmount: rate * numberOfDays,
    ...(source === "admin_lahore_preview" ? { inventory: selected } : {}),
    ...(integrationWarnings.length ? { integrationWarnings } : {}),
  });
}

export async function handleLahoreLead(request: Request, source: "admin_lahore_preview" | "rent_a_car_lahore") {
  try {
    return await createLahoreLead(request, source);
  } catch (error) {
    const failure = error as { code?: unknown; name?: unknown; message?: unknown };
    console.error("Private Lahore test lead failed before returning success JSON.", {
      name: typeof failure?.name === "string" ? failure.name : "Error",
      code: typeof failure?.code === "string" || typeof failure?.code === "number" ? failure.code : undefined,
      message: typeof failure?.message === "string" ? failure.message : "Unknown server error",
    });
    return NextResponse.json({
      ok: false,
      error: "The booking request could not be confirmed. Check the server log and Firestore before resubmitting.",
    }, { status: 500 });
  }
}
