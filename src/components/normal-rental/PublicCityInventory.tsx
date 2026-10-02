import LahoreBookingClient from "@/components/lahore/LahoreBookingClient";
import { getPublicNormalRentalInventory } from "@/lib/normal-rental/public-inventory";
import { getNormalRentalBookingContext, normalRentalZoneForCity } from "@/lib/normal-rental/zones";

export default async function PublicCityInventory({ city }: { city: string }) {
  const zoneId = normalRentalZoneForCity(city);
  if (!zoneId) throw new Error("Unknown public city.");
  const context = getNormalRentalBookingContext(zoneId, city);
  const inventory = await getPublicNormalRentalInventory(zoneId, context.cityId);
  return <section id="cars" className="scroll-mt-24">
    <h2 className="mb-6 text-3xl font-extrabold text-[var(--rentka-blue)]">Choose a Car With Driver</h2>
    <LahoreBookingClient inventory={inventory} context={context} variant="prelaunch" source="city_page" />
  </section>;
}
