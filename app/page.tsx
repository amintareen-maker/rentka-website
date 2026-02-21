import HeroBanner from "@/components/HeroBanner";
import HomePageClient from "@/components/HomePageClient";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Rent a Car in Islamabad & Rawalpindi with Driver | Affordable Car Rental – RentKA",
  description:
    "Affordable car rental in Islamabad and Rawalpindi with driver. Book full-day city rides, airport transfers, and Murree trips. Verified drivers, transparent pricing, and reliable service.",
  keywords: [
    "rent a car islamabad",
    "rent a car rawalpindi",
    "car rental islamabad with driver",
    "car rental rawalpindi with driver",
    "islamabad airport car rental",
    "murree trip car rental",
    "affordable car rental islamabad",
  ],
  openGraph: {
    title:
      "Rent a Car in Islamabad & Rawalpindi with Driver | RentKA",
    description:
      "Book affordable with-driver car rental in Islamabad and Rawalpindi. Airport pickup, full-day city rides, and Murree trips available.",
    url: "https://www.rentka.co",
    siteName: "RentKA",
    locale: "en_PK",
    type: "website",
  },
};

async function getInitialCars() {
  const ref = collection(db, "countries", "PK", "cars");
  const q = query(ref, limit(20));
  const snap = await getDocs(q);

  const cars: any[] = [];

  snap.forEach((doc) => {
    cars.push({
      ...doc.data(),
      id: doc.id,
      country: "PK",
    });
  });

  return cars;
}

export default async function Page() {
  const initialCars = await getInitialCars();

  return (
    <>
      <HeroBanner />
      <HomePageClient initialCars={initialCars} />
    </>
  );
}