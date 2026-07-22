import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About RentKA | Chauffeur-Driven Car Rental Islamabad",
  description:
    "Learn about RentKA, a chauffeur-driven car rental company based in Islamabad providing reliable transport across Islamabad, Rawalpindi and intercity Pakistan.",
  alternates: {
    canonical: "https://rentka.co/about",
  },
  openGraph: {
    url: "https://rentka.co/about",
  },
};

export default function AboutPage() {
  return (
    <main className="bg-white pt-16 overflow-hidden">

      {/* =========================================
          HERO
      ========================================== */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">

          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 mb-6">
            Chauffeur-Driven Car Rental Company in Islamabad
          </span>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Renting a car should be simple,
            <span className="text-[var(--rentka-green)]">
              {" "}transparent
            </span>
            {" "}and stress-free.
          </h1>

          <p className="max-w-3xl mx-auto text-lg text-slate-600 leading-8">
            RentKA is a professionally managed chauffeur-driven car rental
            company headquartered in Islamabad, providing reliable transport
            across Islamabad, Rawalpindi and intercity Pakistan.
          </p>
        </div>
      </section>

      {/* =========================================
          STATS
      ========================================== */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <div className="text-center border rounded-2xl p-6">
              <div className="text-3xl font-bold text-slate-900">100%</div>
              <div className="text-slate-600 mt-2">
                Verified Vehicles
              </div>
            </div>

            <div className="text-center border rounded-2xl p-6">
              <div className="text-3xl font-bold text-slate-900">24/7</div>
              <div className="text-slate-600 mt-2">
                Booking Support
              </div>
            </div>

            <div className="text-center border rounded-2xl p-6">
              <div className="text-3xl font-bold text-slate-900">
                Multiple
              </div>
              <div className="text-slate-600 mt-2">
                Vehicle Categories
              </div>
            </div>

            <div className="text-center border rounded-2xl p-6">
              <div className="text-3xl font-bold text-slate-900">
                Nationwide
              </div>
              <div className="text-slate-600 mt-2">
                Expansion Vision
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          THE PROBLEM
      ========================================== */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-24">

          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
            Why renting a car often feels frustrating
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            <div className="bg-white rounded-2xl border p-8">
              <h3 className="font-semibold text-xl mb-3 text-slate-900">
                Inconsistent Pricing
              </h3>
              <p className="text-slate-600">
                Different vendors quote different prices for similar vehicles,
                making comparisons difficult.
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-8">
              <h3 className="font-semibold text-xl mb-3 text-slate-900">
                Unclear Terms
              </h3>
              <p className="text-slate-600">
                Important details are often hidden until the last minute.
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-8">
              <h3 className="font-semibold text-xl mb-3 text-slate-900">
                Trust Concerns
              </h3>
              <p className="text-slate-600">
                First-time renters struggle to know which providers are
                reliable.
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-8">
              <h3 className="font-semibold text-xl mb-3 text-slate-900">
                Availability Issues
              </h3>
              <p className="text-slate-600">
                Vehicles shown online are not always actually available.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          OUR APPROACH
      ========================================== */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-24">

          <h2 className="text-4xl font-bold text-center mb-14 text-slate-900">
            How RentKA is different
          </h2>

          <div className="grid md:grid-cols-4 gap-6">

            <div className="rounded-2xl border p-8 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-3">
                Verified Vehicles
              </h3>
              <p className="text-slate-600">
                Vehicle options are carefully selected for reliable journeys.
              </p>
            </div>

            <div className="rounded-2xl border p-8 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-3">
                Human Verification
              </h3>
              <p className="text-slate-600">
                Availability is confirmed manually before booking progresses.
              </p>
            </div>

            <div className="rounded-2xl border p-8 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-3">
                Transparent Pricing
              </h3>
              <p className="text-slate-600">
                Clear rental pricing without unnecessary surprises.
              </p>
            </div>

            <div className="rounded-2xl border p-8 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-3">
                One Point of Contact
              </h3>
              <p className="text-slate-600">
                Our team provides clear communication throughout your journey.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          WHO WE ARE
      ========================================== */}
      <section className="bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">

          <h2 className="text-4xl font-bold text-slate-900 mb-8">
            Who We Are
          </h2>

          <p className="text-lg text-slate-600 leading-9 max-w-4xl mx-auto">
            RentKA (SMC-PRIVATE) Limited is a professionally managed
            chauffeur-driven car rental company headquartered in Islamabad.
            We provide airport transfers, corporate transport, monthly rentals
            and one-way intercity travel across Islamabad, Rawalpindi and
            destinations throughout Pakistan.
          </p>

        </div>
      </section>

      {/* =========================================
          WHERE WE OPERATE
      ========================================== */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-24">

          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
            Where We Operate
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="border rounded-2xl p-6 text-center">
              Islamabad Headquarters
            </div>

            <div className="border rounded-2xl p-6 text-center">
              Rawalpindi
            </div>

            <div className="border rounded-2xl p-6 text-center">
              Airport Transfers
            </div>

            <div className="border rounded-2xl p-6 text-center">
              One-Way Intercity Travel
            </div>

            <div className="border rounded-2xl p-6 text-center">
              Monthly Rentals
            </div>

            <div className="border rounded-2xl p-6 text-center">
              Corporate Transport
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          TRUST SECTION
      ========================================== */}
      <section className="bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">

          <h2 className="text-4xl font-bold text-slate-900 mb-8">
            Built Around Trust
          </h2>

          <p className="text-lg text-slate-600 leading-9 max-w-4xl mx-auto">
            Trust is at the center of everything we do. We review vehicle
            availability, monitor customer feedback, and maintain communication
            throughout the booking process to create a more dependable rental
            experience.
          </p>

        </div>
      </section>

      {/* =========================================
          BUSINESS INFO
      ========================================== */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-24">

          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
            Business Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="border rounded-2xl p-6">
              Chauffeur-Driven Car Rental
            </div>

            <div className="border rounded-2xl p-6">
              Islamabad Headquarters
            </div>

            <div className="border rounded-2xl p-6">
              Pakistan Based Operations
            </div>

            <div className="border rounded-2xl p-6">
              WhatsApp & Email Support
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          WHO IT'S FOR
      ========================================== */}
      <section className="bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-24">

          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
            Who Uses RentKA
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="border rounded-2xl p-6 bg-white">
              First-time car renters
            </div>

            <div className="border rounded-2xl p-6 bg-white">
              Families and travelers
            </div>

            <div className="border rounded-2xl p-6 bg-white">
              International visitors
            </div>

            <div className="border rounded-2xl p-6 bg-white">
              Business & corporate customers
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          CTA
      ========================================== */}
      <section className="bg-[var(--rentka-blue)] text-white">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to rent with confidence?
          </h2>

          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Browse verified vehicles, compare options, and let RentKA help
            simplify your rental experience.
          </p>

          <a
            href="/"
            className="inline-flex items-center justify-center bg-[var(--rentka-green)] hover:bg-[var(--rentka-green-hover)] px-8 py-4 rounded-xl font-semibold transition"
          >
            Browse Available Cars
          </a>

        </div>
      </section>

    </main>
  );
}
