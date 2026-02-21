import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Rent a Car in Rawalpindi with Driver | Affordable Car Rental – RentKA",
  description:
    "Affordable car rental in Rawalpindi with driver. Book full-day city rides, airport transfers, and outstation trips. Verified drivers, transparent pricing, and reliable service.",
  keywords: [
    "rent a car rawalpindi",
    "car rental rawalpindi with driver",
    "affordable car rental rawalpindi",
    "rawalpindi airport car rental",
    "rawalpindi to murree car rental",
  ],
};

export default function RawalpindiRentalPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 space-y-12">
      
      <div>
        <h1 className="text-3xl font-bold mb-4">
          Rent a Car in Rawalpindi with Driver
        </h1>
        <p className="text-slate-700 leading-relaxed">
          RentKA provides affordable car rental in Rawalpindi with experienced
          drivers and reliable service. Whether you need a full-day rental for
          personal use, business travel, or family events, we connect you with
          verified local vendors to ensure smooth and professional transport.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Full-Day Car Rental Across Rawalpindi
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Our services cover major areas including Saddar, Commercial Market,
          Bahria Town, Chaklala, and surrounding localities. Choose from
          popular options like Alto for budget travel, Corolla for everyday
          comfort, and Civic for executive needs. Driver charges are included
          in the rental, while fuel is calculated separately based on usage.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Airport Transfers from Rawalpindi
        </h2>
        <p className="text-slate-700 leading-relaxed">
          We provide convenient airport pickup and drop-off services between
          Rawalpindi and Islamabad International Airport. Our drivers ensure
          timely arrival and smooth coordination for both domestic and
          international flights.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Murree & Outstation Travel
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Planning a trip from Rawalpindi to Murree, Nathia Gali, or nearby
          tourist destinations? RentKA offers comfortable outstation travel
          with professional drivers familiar with highway and mountain routes,
          making your journey safe and convenient.
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
              Yes. All rentals include a professional driver. Fuel costs are not
              included and are charged separately based on travel distance.
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              Do I need advance payment?
            </h3>
            <p className="text-slate-700 mt-1">
              Advance confirmation may be required depending on the booking type,
              especially during weekends, peak travel seasons, or long-distance trips.
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              Which areas of Rawalpindi do you serve?
            </h3>
            <p className="text-slate-700 mt-1">
              We serve Saddar, Commercial Market, Bahria Town phases,
              Chaklala Scheme, and surrounding areas.
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}