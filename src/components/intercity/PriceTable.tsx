import Link from "next/link";
import { intercityRoutes } from "@/data/intercityRoutes";

export default function PriceTable() {
  const routes = [...intercityRoutes].sort(
    (a, b) => a.distanceKm - b.distanceKm
  );

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-[#0F2B46]">
            Transparent Pricing
          </span>

          <h2 className="mt-5 text-4xl font-bold text-[#0F2B46]">
            One Way Drop Price List
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            Fixed pricing for Toyota Corolla with professional driver and fuel
            included. Round trips and custom itineraries are quoted separately.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#0F2B46] text-white">
                <tr>
                  <th className="px-6 py-5 text-left">Route</th>
                  <th className="px-6 py-5 text-left">Distance</th>
                  <th className="px-6 py-5 text-left">Duration</th>
                  <th className="px-6 py-5 text-left">Vehicle</th>
                  <th className="px-6 py-5 text-left">Starting From</th>
                  <th className="px-6 py-5 text-center">Details</th>
                </tr>
              </thead>

              <tbody>
                {routes.map((route) => (
                  <tr
                    key={route.slug}
                    className="border-b transition last:border-none hover:bg-slate-50"
                  >
                    <td className="px-6 py-6 font-semibold text-[#0F2B46]">
                      {route.from} → {route.to}
                    </td>

                    <td className="px-6 py-6">
                      {route.distanceKm} km
                    </td>

                    <td className="px-6 py-6">
                      {route.duration}
                    </td>

                    <td className="px-6 py-6">
                      Toyota Corolla
                    </td>

                    <td className="px-6 py-6">
                      <span className="text-lg font-bold text-[#5BAE4A]">
                        PKR{" "}
                        {route.vehicles.corolla.price?.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <Link
                        href={`/one-way-drop/${route.slug}`}
                        className="rounded-xl bg-[#5BAE4A] px-5 py-3 font-semibold text-white transition hover:opacity-90"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border bg-[#F8FAFC] p-8">
          <h3 className="text-2xl font-bold text-[#0F2B46]">
            Need a Round Trip?
          </h3>

          <p className="mt-4 leading-8 text-slate-600">
            Round trips, waiting charges, multiple destinations and multi-day
            travel are quoted individually to ensure you receive the best
            possible price.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://wa.me/923020589999"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#5BAE4A] px-7 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Get WhatsApp Quote
            </a>

            <Link
              href="/contact"
              className="rounded-xl border border-[#0F2B46] px-7 py-4 font-semibold text-[#0F2B46] transition hover:bg-[#0F2B46] hover:text-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}