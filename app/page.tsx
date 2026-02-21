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

    {/* SEO Content Section */}
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="prose max-w-none">
        <h2>Rent a Car in Islamabad & Rawalpindi with Driver</h2>
        <p>
          RentKA offers affordable car rental in Islamabad and Rawalpindi with
          professional drivers and transparent pricing. Whether you need a
          full-day city ride, airport transfer, or outstation trip, we connect
          you with verified local vendors to ensure reliable service without
          unnecessary complications.
        </p>

        <h2>Affordable Full-Day Car Rental</h2>
        <p>
          Choose from popular options like Alto, Corolla, and Civic for your
          daily travel needs. Our full-day rental model is ideal for business
          meetings, family visits, weddings, and personal use within the city.
          Driver charges are included in the rental, while fuel costs are
          calculated separately based on distance traveled.
        </p>

        <h2>Airport Transfers & Murree Trips</h2>
        <p>
          We provide convenient airport pickup and drop-off services from
          Islamabad International Airport, as well as outstation trips to
          destinations like Murree and nearby tourist locations. With
          experienced drivers and well-maintained vehicles, you can travel
          comfortably and safely.
        </p>

        <h2>Frequently Asked Questions</h2>
        <p><strong>Is driver included in the rental price?</strong><br />
          Yes, all listed rentals include a professional driver. Fuel is not included
          and is charged separately depending on usage.
        </p>

        <p><strong>Do I need to pay in advance?</strong><br />
          Advance confirmation may be required depending on the booking type,
          especially for long-distance or peak-day reservations.
        </p>

        <p><strong>Which areas do you serve?</strong><br />
          We primarily operate in Islamabad and Rawalpindi, including airport
          transfers and outstation travel.
        </p>
      </div>
    </section>
  </>
);
}