// src/app/page.tsx

import HeroBanner from "@/components/HeroBanner";
import HomePageClient from "@/components/HomePageClient";
import { getCars } from "@/lib/getCars";
import { getCountries, getCities } from "@/lib/getLocations";

export const metadata = {
  title: "Rent a Car in Your City | Verified Rentals – RentKA",
  description:
    "Find verified rental cars from trusted local partners. Self-drive or with driver. No upfront payment required.",
};

export default async function Page() {
  // ✅ SERVER-SIDE FETCH (SEO + SPEED)
  const cars = await getCars();
  const countries = await getCountries();
  const cities = await getCities();

  return (
    <>
      {/* Hero is static → renders instantly */}
      <HeroBanner />

      {/* Client handles interaction ONLY */}
      <HomePageClient
        initialCars={cars}
        initialCountries={countries}
        initialCities={cities}
      />
    </>
  );
}
