import Link from "next/link";
import {
  IntercityRoute,
  intercityRoutes,
} from "@/data/intercityRoutes";

type Props = {
  route: IntercityRoute;
};

export default function IntercityRoutePage({ route }: Props) {
  const price = route.vehicles.corolla?.price;

  const relatedRoutes = intercityRoutes
  .filter(
    (r) =>
      r.slug !== route.slug &&
      r.active &&
      (
        r.from === route.from ||
        r.to === route.to ||
        r.from === route.to ||
        r.to === route.from
      )
  )
  .slice(0, 6);

  return (
    <main className="bg-white">

      {/* Hero */}

      <section className="bg-[#0F2B46] py-20">

        <div className="mx-auto max-w-7xl px-6">

          <nav className="mb-6 text-sm text-slate-300">

            <Link href="/" className="hover:text-white">
              Home
            </Link>

            {" / "}

            <Link href="/one-way-drop" className="hover:text-white">
              One Way Drop
            </Link>

            {" / "}

            <span className="text-white">
              {route.from} to {route.to}
            </span>

          </nav>

          <span className="rounded-full bg-[#5BAE4A] px-4 py-2 text-sm font-semibold text-white">
            One Way Drop
          </span>

          <h1 className="mt-6 text-5xl font-bold text-white">
            {route.from} to {route.to} Car Rental
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-300">
            Travel comfortably from <strong>{route.from}</strong> to{" "}
            <strong>{route.to}</strong> with a professional chauffeur,
            fuel included and transparent pricing.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl bg-white p-6">
              <p className="text-sm text-slate-500">Distance</p>

              <p className="mt-2 text-3xl font-bold text-[#0F2B46]">
                {route.distanceKm} km
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6">
              <p className="text-sm text-slate-500">Duration</p>

              <p className="mt-2 text-3xl font-bold text-[#0F2B46]">
                {route.duration}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6">
              <p className="text-sm text-slate-500">Starting From</p>

              <p className="mt-2 text-3xl font-bold text-[#5BAE4A]">
                PKR {price?.toLocaleString()}
              </p>
            </div>

          </div>

          <div className="mt-10 flex flex-wrap gap-4">

            <a
              href="https://wa.me/923020589999"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#5BAE4A] px-8 py-4 font-semibold text-white"
            >
              Book on WhatsApp
            </a>

            <Link
              href="/one-way-drop"
              className="rounded-xl border border-white px-8 py-4 font-semibold text-white"
            >
              View All Routes
            </Link>

          </div>

        </div>

      </section>

      {/* Route Details */}

      <section className="py-20">

        <div className="mx-auto max-w-5xl px-6">

          <h2 className="text-4xl font-bold text-[#0F2B46]">
            {route.from} to {route.to} One Way Drop
          </h2>

          <p className="mt-8 text-lg leading-9 text-slate-600">

            Book a one-way chauffeur-driven car rental from{" "}
            <strong>{route.from}</strong> to{" "}
            <strong>{route.to}</strong>.

            The journey covers approximately{" "}
            <strong>{route.distanceKm} km</strong> and normally takes{" "}
            <strong>{route.duration}</strong> depending on traffic.

          </p>

          <p className="mt-6 text-lg leading-9 text-slate-600">

            Your quoted fare includes:

          </p>

          <ul className="mt-8 space-y-4 text-lg text-slate-700">

            <li>✔ Professional Driver</li>

            <li>✔ Fuel Included</li>

            <li>✔ Air Conditioned Vehicle</li>

            <li>✔ Door Pickup</li>

            <li>✔ Fixed Pricing</li>

          </ul>

        </div>

      </section>

      {/* Related Routes */}

      {relatedRoutes.length > 0 && (
        <section className="bg-slate-50 py-20">

          <div className="mx-auto max-w-7xl px-6">

            <h2 className="text-4xl font-bold text-[#0F2B46]">
              Related One Way Routes
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Explore more one-way routes across Pakistan.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {relatedRoutes.map((related) => (

                <Link
                  key={related.slug}
                  href={`/one-way-drop/${related.slug}`}
                  className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >

                  <h3 className="text-2xl font-bold text-[#0F2B46]">
                    {related.from} → {related.to}
                  </h3>

                  <div className="mt-6 space-y-2 text-slate-600">

                    <p>
                      Distance: <strong>{related.distanceKm} km</strong>
                    </p>

                    <p>
                      Duration: <strong>{related.duration}</strong>
                    </p>

                    <p>
                      Starting From{" "}
                      <strong className="text-[#5BAE4A]">
                        PKR {related.vehicles.corolla?.price?.toLocaleString()}
                      </strong>
                    </p>

                  </div>

                </Link>

              ))}

            </div>

          </div>

        </section>
      )}

    </main>
  );
}