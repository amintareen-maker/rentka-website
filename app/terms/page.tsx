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
        Service Overview
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA is a car rental marketplace that connects customers with
          third-party car rental vendors. Vehicles may be available for
          self-drive or with driver, depending on availability and location.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Booking & Requests
        </h2>
        <p className="mb-4 text-slate-700">
          Submitting a request on our website does not guarantee availability.
          Our team or partner vendors will contact you to confirm details,
          pricing, and availability.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Pricing & Payments
        </h2>
        <p className="mb-4 text-slate-700">
          All prices, deposits, and payment terms are confirmed during booking
          confirmation. RentKA may earn a service margin from partner vendors Or customers if visible.
          Full rental amount must be paid in advance to confirm booking.
          Fuel charges are not included in rental price and will be settled at the end of the ride based on usage.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Rental Duration
        </h2>
        <p className="mb-4 text-slate-700">
          Each booking includes 10 hours of service.
          If the ride exceeds 10 hours, extra hour charges apply as follows:
          • Hatchback – Rs 500 per hour
          • Sedan – Rs 700 per hour
          • SUV – Rs 1,000 per hour
          Extra charges are calculated at the end of the ride.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Pickup Time Changes
        </h2>
        <p className="mb-4 text-slate-700">
          Customers may request a pickup time change at least 3 hours prior to scheduled pickup time, subject to availability.
          Last-minute changes may not be accommodated.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        User Responsibility
        </h2>
        <p className="mb-4 text-slate-700">
          Customers must provide accurate information. Any misuse, false
          information, or violation of rental terms may result in cancellation.
          Customer must take picture of fuel bar or Odo Meter when car arrives. 
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Booking Extension
        </h2>
        <p className="mb-4 text-slate-700">
          Customers may request a same-day extension of booking.
          Extension is subject to vehicle availability and additional charges.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Limitation of Liability & Accident
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA is not liable for indirect damages, losses, or disputes arising
          between customers and vendors.
          In case of accident or vehicle damage during service:
          Vendor and assigned driver are responsible as per applicable law and insurance coverage.
          Customer is not liable for driving-related damages.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Traffic Fines
        </h2>
        <p className="text-slate-700">
          Any traffic violations or fines incurred during the ride are the responsibility of the assigned driver.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Cancellation & Refund
        </h2>
        <p className="text-slate-700">
          Refund and cancellation terms apply as per RentKA Refund & Cancellation Policy.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Changes to Terms
        </h2>
        <p className="text-slate-700">
          We may update these terms at any time. Continued use of the website
          means acceptance of updated terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
        Emergency & Support
        </h2>
        <p className="text-slate-700">
          In case of any issue during the ride, customers may immediately contact RentKA support for assistance.
        </p>
      </div>
    </main>
  );
}
