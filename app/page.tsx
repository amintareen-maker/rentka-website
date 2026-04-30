export const revalidate = 60;

import HomeCTA from "@/components/HomeCTA";
import HeroBanner from "@/components/HeroBanner";
import HomePageClient from "@/components/HomePageClient";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

import type { Metadata } from "next";
import Link from "next/link";

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
      <section className="bg-white mx-auto max-w-5xl px-4 py-16">
        <div className="space-y-10">

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              Rent a Car in Islamabad & Rawalpindi with Driver
            </h2>
            <p className="text-slate-700 leading-relaxed">
              RentKA offers affordable{" "}
              <Link
                href="/rent-a-car-islamabad"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                car rental in Islamabad
              </Link>{" "}
              and{" "}
              <Link
                href="/rent-a-car-rawalpindi"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                car rental in Rawalpindi
              </Link>{" "}
              with professional drivers and transparent pricing. Whether you need a
              full-day city ride, airport transfer, or outstation trip, we connect
              you with verified local vendors to ensure reliable service without
              unnecessary complications.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              Affordable Full-Day Car Rental
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Choose from popular options like Alto, Corolla, and Civic for your
              daily travel needs. Our full-day rental model is ideal for business
              meetings, family visits, weddings, and personal use within the city.
              Driver charges are included in the rental, while fuel costs are
              calculated separately based on distance traveled.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              Airport Transfers & Murree Trips
            </h2>
            <p className="text-slate-700 leading-relaxed">
              We provide convenient{" "}
              <Link
                href="/airport-car-rental-islamabad"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                airport pickup and drop-off services from Islamabad International Airport
              </Link>
              , as well as outstation trips to destinations like Murree and nearby tourist locations.
              With experienced drivers and well-maintained vehicles, you can travel comfortably and safely.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium">
                  Is driver included in the rental price?
                </h3>
                <p className="text-slate-700 mt-1">
                  Yes, all listed rentals include a professional driver. Fuel is not included
                  and is charged separately depending on usage.
                </p>
              </div>

              <div>
                <h3 className="font-medium">
                  Do I need to pay in advance?
                </h3>
                <p className="text-slate-700 mt-1">
                  Advance confirmation may be required depending on the booking type,
                  especially for long-distance or peak-day reservations.
                </p>
              </div>

              <div>
                <h3 className="font-medium">
                  Which areas do you serve?
                </h3>
                <p className="text-slate-700 mt-1">
                  We primarily operate in Islamabad and Rawalpindi, including airport
                  transfers and outstation travel.
                </p>
              </div>
            </div>
          </div>

          <HomeCTA />

        </div>
      </section>
    </>
  );
}