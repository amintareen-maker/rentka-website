"use client";

export default function AboutPage() {
  return (
    <main className="bg-white pt-16">
      {/* pt-16 = header height fix */}

      {/* =============================
          HERO
      ============================== */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-semibold mb-4 text-slate-900">
            A simpler, more trustworthy way to rent a car
          </h1>
          <p className="text-slate-700 text-lg">
            RentKA exists to remove confusion, uncertainty, and vendor hassle
            from car rentals — especially for first-time renters.
          </p>
        </div>
      </section>

      {/* =============================
          THE PROBLEM
      ============================== */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-semibold mb-8 text-center text-slate-900">
            Why renting a car feels stressful
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 max-w-4xl mx-auto">
            <div>• Prices change from vendor to vendor</div>
            <div>• Car condition is often unclear</div>
            <div>• Availability is not always reliable</div>
            <div>• First-time renters don’t know who to trust</div>
          </div>
        </div>
      </section>

      {/* =============================
          OUR APPROACH
      ============================== */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-semibold mb-12 text-center text-slate-900">
            How RentKA is different
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border rounded-xl p-6">
              <h3 className="font-medium mb-2 text-slate-900">
                Verified Cars
              </h3>
              <p className="text-slate-700">
                We list only vehicles from trusted and reviewed partners.
              </p>
            </div>

            <div className="border rounded-xl p-6">
              <h3 className="font-medium mb-2 text-slate-900">
                Human Confirmation
              </h3>
              <p className="text-slate-700">
                Availability is confirmed manually before you proceed.
              </p>
            </div>

            <div className="border rounded-xl p-6">
              <h3 className="font-medium mb-2 text-slate-900">
                Clear Pricing
              </h3>
              <p className="text-slate-700">
                What you see is what you pay — no surprises.
              </p>
            </div>

            <div className="border rounded-xl p-6">
              <h3 className="font-medium mb-2 text-slate-900">
                No Vendor Hassle
              </h3>
              <p className="text-slate-700">
                We coordinate with rental partners so you don’t have to.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =============================
          TRUST
      ============================== */}
      <section className="bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold mb-6 text-slate-900">
            Trust comes first
          </h2>
          <p className="text-slate-700 max-w-3xl mx-auto">
            RentKA is built around trust and transparency. Every car is reviewed,
            partners are vetted, and bookings are confirmed by real people —
            not automated guesses. We believe renting a car should feel
            confident, not risky.
          </p>
        </div>
      </section>

      {/* =============================
          WHO IT’S FOR
      ============================== */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold mb-6 text-slate-900">
            Who RentKA is for
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto text-slate-800">
            <div>• First-time car renters</div>
            <div>• Families needing short-term mobility</div>
            <div>• Tourists and visiting professionals</div>
            <div>• Business and corporate users</div>
          </div>
        </div>
      </section>

      {/* =============================
          CTA
      ============================== */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Rent a car without the uncertainty
          </h2>
          <p className="text-slate-200 mb-8">
            Browse verified vehicles and let us handle the rest.
          </p>
          <a
            href="/"
            className="inline-block bg-white text-slate-900 px-8 py-3 rounded-lg font-medium"
          >
            Browse Cars
          </a>
        </div>
      </section>
    </main>
  );
}
