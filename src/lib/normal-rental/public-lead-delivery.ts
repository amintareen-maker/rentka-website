import "server-only";
import { randomUUID } from "node:crypto";
import { getAdminDb } from "../firebaseAdmin";
import { attemptAutomaticOperationalIntake } from "../dispatch/automatic-intake";

type Source = "twin_cities_normal" | "lahore_normal";
type Destination = "email" | "googleSheet" | "dispatch";
type Claim = { status: "processing" | "delivered" | "failed"; token: string; startedAt: number };
const labels = { email: "email", googleSheet: "Google Sheets", dispatch: "dispatch" };

// The anonymous public flow uses the delivery endpoints already tracked in HEAD.
// Claims live on its persisted lead; no unrelated delivery subsystem is required.
export async function deliverPublicNormalRentalLead(source: Source, documentId: string, baseUrl: string) {
  const db = getAdminDb();
  const ref = db.collection("leads").doc(documentId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error("Persisted public lead was not found.");
  const lead = snapshot.data()!;
  if (lead.adminPrivateTest) return [];
  const common = {
    leadId: lead.leadId, carName: lead.carName, carId: lead.inventoryId,
    vendorName: lead.vendorName, vendorId: lead.vendorId,
    publicVehicleLabel: lead.publicVehicleLabel ?? null, modelYear: lead.modelYear ?? null,
    country: "PK", city: lead.city, service: "With Driver",
    pricingType: lead.pricingType, duration: lead.duration, originalPrice: lead.dailyRentalRate,
    dailyRentalRate: lead.dailyRentalRate, numberOfDays: lead.numberOfDays,
    estimatedRentalAmount: lead.estimatedRentalAmount, pickupDate: lead.pickupDate,
    preferredTime: lead.preferredTime, pickupAddress: lead.pickupAddress,
    pickupLatitude: lead.pickupLatitude, pickupLongitude: lead.pickupLongitude,
    pickupPlaceId: lead.pickupPlaceId, pickupMapLink: lead.pickupMapLink ?? "",
    isOutstation: lead.pricingType === "outsideCity", destinationAddress: lead.destinationAddress ?? "",
    destinationLatitude: lead.destinationLatitude, destinationLongitude: lead.destinationLongitude,
    destinationPlaceId: lead.destinationPlaceId ?? "", destinationMapLink: lead.destinationMapLink ?? "",
    customerName: lead.name, phone: lead.phone, email: lead.email ?? "",
    source: lead.source, reviewLink: lead.reviewLink,
  };
  const sheetPayload = {
    leadId: lead.leadId, name: lead.name, phone: lead.phone, email: lead.email ?? "",
    carName: lead.carName, vendorName: lead.vendorName, vendorId: lead.vendorId,
    modelYear: String(lead.modelYear ?? ""), publicVehicleLabel: lead.publicVehicleLabel ?? "",
    country: "PK", city: lead.city, service: "withDriver", serviceType: lead.pricingType,
    packageName: lead.pricingType, packageDuration: lead.duration, packagePrice: String(lead.dailyRentalRate),
    pickupDate: lead.pickupDate, preferredTime: lead.preferredTime, source: lead.source,
    status: "new", pickupAddress: lead.pickupAddress, numberOfDays: lead.numberOfDays,
    dailyRentalRate: lead.dailyRentalRate, estimatedRentalAmount: lead.estimatedRentalAmount,
    destinationAddress: lead.destinationAddress ?? "", isOutstation: lead.pricingType === "outsideCity",
  };
  async function post(path: string, payload: unknown) {
    const response = await fetch(new URL(path, baseUrl), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Delivery returned HTTP ${response.status}.`);
    if (path === "/api/lead-sheet") {
      const result = await response.json() as { success?: boolean; sheetStatus?: string };
      if (!result.success || !["inserted", "duplicate"].includes(result.sheetStatus ?? "")) throw new Error("Sheet insertion was not confirmed.");
    }
  }
  const warnings = await Promise.all((["email", "googleSheet", "dispatch"] as const).map(async (destination: Destination) => {
    const token = randomUUID();
    const field = `publicBookingDelivery.${destination}`;
    const claimed = await db.runTransaction(async (transaction) => {
      const current = (await transaction.get(ref)).data()?.publicBookingDelivery?.[destination] as Claim | undefined;
      if (current?.status === "delivered") return "delivered";
      if (current?.status === "processing" && Date.now() - current.startedAt < 5 * 60_000) return "processing";
      transaction.update(ref, { [field]: { status: "processing", token, startedAt: Date.now() } });
      return "claimed";
    });
    if (claimed === "delivered") return undefined;
    if (claimed === "processing") return `${labels[destination]} is still processing`;
    let status: Claim["status"] = "delivered";
    try {
      if (destination === "dispatch") {
        if (!await attemptAutomaticOperationalIntake(source, documentId)) throw new Error("Automatic intake failed.");
      } else {
        await post(destination === "email" ? "/api/lead-booking" : "/api/lead-sheet", destination === "email" ? common : sheetPayload);
      }
    } catch {
      status = "failed";
    }
    await db.runTransaction(async (transaction) => {
      const current = (await transaction.get(ref)).data()?.publicBookingDelivery?.[destination] as Claim | undefined;
      if (current?.token === token) transaction.update(ref, { [field]: { ...current, status } });
    });
    return status === "failed" ? `${labels[destination]} failed` : undefined;
  }));
  return warnings.filter((warning): warning is string => Boolean(warning));
}
