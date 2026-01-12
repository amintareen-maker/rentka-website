// app/terms/page.tsx

export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <main className="pt-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">
          Terms & Conditions
        </h1>

        <p className="mb-4 text-slate-700">
          Welcome to <strong>RentKA</strong>. By using our website or submitting a
          request, you agree to the following terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          1. Service Overview
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA is a car rental marketplace that connects customers with
          third-party car rental vendors. Vehicles may be available for
          self-drive or with driver, depending on availability and location.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          2. Booking & Requests
        </h2>
        <p className="mb-4 text-slate-700">
          Submitting a request on our website does not guarantee availability.
          Our team or partner vendors will contact you to confirm details,
          pricing, and availability.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          3. Pricing & Payments
        </h2>
        <p className="mb-4 text-slate-700">
          All prices, deposits, and payment terms are confirmed during booking
          confirmation. RentKA may earn a service margin from partner vendors.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          4. Vendor Responsibility
        </h2>
        <p className="mb-4 text-slate-700">
          Vehicles and drivers are provided by independent third-party vendors.
          RentKA is not responsible for mechanical issues, delays, or
          vendor-specific policies.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          5. User Responsibility
        </h2>
        <p className="mb-4 text-slate-700">
          Customers must provide accurate information. Any misuse, false
          information, or violation of rental terms may result in cancellation.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          6. Cancellations & Refunds
        </h2>
        <p className="mb-4 text-slate-700">
          Cancellation and refund policies vary by vendor and will be shared at
          the time of confirmation.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          7. Limitation of Liability
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA is not liable for indirect damages, losses, or disputes arising
          between customers and vendors.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          8. Changes to Terms
        </h2>
        <p className="text-slate-700">
          We may update these terms at any time. Continued use of the website
          means acceptance of updated terms.
        </p>
      </div>
    </main>
  );
}
