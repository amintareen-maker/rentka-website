import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Rent a Car in Islamabad with Driver | Affordable Car Rental – RentKA",
  description:
    "Affordable car rental in Islamabad with driver. Book full-day city rides, airport transfers, and Murree trips. Verified drivers, transparent pricing, and reliable service.",
  keywords: [
    "rent a car islamabad",
    "car rental islamabad with driver",
    "affordable car rental islamabad",
    "islamabad airport car rental",
    "murree trip car rental",
  ],
};

export default function IslamabadRentalPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 space-y-12">
      
      <div>
        <h1 className="text-3xl font-bold mb-4">
          Rent a Car in Islamabad with Driver
        </h1>
        <p className="text-slate-700 leading-relaxed">
          Looking for affordable car rental in Islamabad with a professional driver?
          RentKA connects you with verified local vendors offering clean vehicles,
          transparent pricing, and reliable service. Whether you need a full-day
          rental within the city, an airport transfer, or an outstation trip, we
          provide a simple and dependable booking experience.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Full-Day Car Rental in Islamabad
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Our full-day rental model is ideal for business meetings, family visits,
          government office runs, weddings, and personal travel across Islamabad.
          Popular options include Alto for budget travel, Corolla for everyday
          comfort, and Civic for executive needs. Driver charges are included in
          the rental price, while fuel is calculated separately based on distance.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Islamabad Airport Transfers
        </h2>
        <p className="text-slate-700 leading-relaxed">
          We provide airport pickup and drop-off services from Islamabad
          International Airport. Our drivers ensure timely arrival, professional
          conduct, and smooth coordination for both domestic and international
          travel needs.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Murree & Outstation Trips
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Planning a trip to Murree, Nathia Gali, or nearby tourist destinations?
          RentKA offers comfortable outstation travel with experienced drivers
          familiar with mountain routes and highway travel. Perfect for weekend
          getaways and family trips.
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
              included and are charged separately based on usage.
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              Do I need to pay in advance?
            </h3>
            <p className="text-slate-700 mt-1">
              Advance confirmation may be required depending on booking type,
              especially during peak seasons or long-distance travel.
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              Which areas of Islamabad do you serve?
            </h3>
            <p className="text-slate-700 mt-1">
              We serve all major sectors including F-6, F-7, F-8, G-8, Blue Area,
              DHA, Bahria Town, and surrounding areas.
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}