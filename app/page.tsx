import HeroBanner from "@/components/HeroBanner";
import HomePageClient from "@/components/HomePageClient";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const metadata = {
  title: "Verified Car Rentals in Your City | RentKA",
  description:
    "Find verified rental cars from trusted local partners. Self-drive or with driver. No upfront payment required.",
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