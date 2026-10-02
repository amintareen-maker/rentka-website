export const revalidate = 60;

import type { Metadata } from "next";
import LahoreBookingClient from "@/components/lahore/LahoreBookingClient";
import { getPublicNormalRentalInventory } from "@/lib/normal-rental/public-inventory";
import { getNormalRentalBookingContext } from "@/lib/normal-rental/zones";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const context = getNormalRentalBookingContext("twin_cities", "islamabad");
  const inventory = (await getPublicNormalRentalInventory(context.zoneId, context.cityId)).filter((item) => item.modelSlug === slug);
  return <section className="mx-auto max-w-6xl px-6 py-12">
    <h1 className="mb-6 text-3xl font-bold capitalize">{slug.replaceAll("-", " ")} for rent in Islamabad</h1>
    <LahoreBookingClient inventory={inventory} context={context} variant="prelaunch" source="model_page" />
  </section>;
}
