import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Islamabad Airport Car Rental with Driver | Airport Pickup & Drop – RentKA",
  description:
    "Book reliable car rental for Islamabad International Airport pickup and drop-off. Affordable airport transfers with professional drivers. No hidden charges.",
  keywords: [
    "islamabad airport car rental",
    "islamabad airport pickup",
    "airport transfer islamabad",
    "rent a car islamabad airport",
    "airport drop islamabad",
  ],
};

export default function AirportRentalPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 space-y-12">

      <div>
        <h1 className="text-3xl font-bold mb-4">
          Islamabad Airport Car Rental with Driver
        </h1>
        <p className="text-slate-700 leading-relaxed">
          RentKA provides reliable airport car rental services for Islamabad
          International Airport. Whether you need pickup on arrival or drop-off
          for departure, our professional drivers ensure timely coordination
          and comfortable travel.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Airport Pickup Service
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Avoid the stress of waiting or ride-hailing delays. Our drivers track
          flight timings and coordinate directly to ensure smooth airport
          pickup. Ideal for families, business travelers, and overseas guests.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Airport Drop-Off Service
        </h2>
        <p className="text-slate-700 leading-relaxed">
          We provide scheduled airport drop services from Islamabad and
          Rawalpindi. Our drivers ensure on-time arrival so you never miss
          a flight.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Available Vehicles
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Choose from budget-friendly Alto, comfortable Corolla, or executive
          Civic options. All rentals include a professional driver. Fuel is
          charged separately based on travel distance.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">

          <div>
            <h3 className="font-medium">
              Is driver included in airport rental?
            </h3>
            <p className="text-slate-700 mt-1">
              Yes, all airport transfers include a professional driver.
              Fuel charges are calculated separately.
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              Do you track flight delays?
            </h3>
            <p className="text-slate-700 mt-1">
              Yes, drivers coordinate based on flight arrival times to
              ensure timely pickup.
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              Do you serve Rawalpindi airport transfers?
            </h3>
            <p className="text-slate-700 mt-1">
              Yes, we provide airport pickup and drop services from both
              Islamabad and Rawalpindi areas.
            </p>
          </div>

        </div>
      </div>

    </section>
  );
}