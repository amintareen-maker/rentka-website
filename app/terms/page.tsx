// app/terms/page.tsx

export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <main className="pt-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 text-slate-900">
          Terms & Conditions
        </h1>

        {/* Download PDF Button */}
        <div className="mb-8">
          <a
            href="/rentka-terms-and-conditions.pdf"
            download
            className="inline-flex items-center px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
          >
            Download PDF Version
          </a>
        </div>

        <p className="mb-6 text-slate-700">
          By accessing RentKA’s website or confirming a booking, you agree to
          the following Terms & Conditions. If you do not agree, please do not
          proceed with booking.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Platform Role
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA operates as a booking and coordination platform that connects
          customers with independent third-party vehicle service providers
          ("Vendors"). RentKA does not own vehicles (unless explicitly stated)
          and does not employ third-party drivers. All operational control,
          vehicle condition, driver conduct, insurance, and legal compliance
          remain the responsibility of the assigned Vendor.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Booking Confirmation
        </h2>
        <p className="mb-4 text-slate-700">
          A booking is considered confirmed only after written confirmation
          (via WhatsApp, SMS, or email) and receipt of any required advance
          payment. RentKA reserves the right to decline or cancel a booking
          due to non-availability, safety concerns, incomplete documentation,
          pricing errors, or suspected misuse.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Pricing & Payments
        </h2>
        <p className="mb-4 text-slate-700">
          Final pricing is confirmed at the time of booking and may include
          rental charges, service fees, fuel (if applicable), tolls, parking,
          waiting time, extra hours, or additional distance charges. Full or
          partial advance payment may be required to secure the booking.
          Failure to complete payment may result in cancellation.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Fuel Policy
        </h2>
        <p className="mb-4 text-slate-700">
          Fuel handling (per kilometer or level-to-level) is defined during
          booking confirmation. Any additional fuel consumption or route
          deviation beyond the agreed terms is chargeable.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Customer Responsibilities
        </h2>
        <p className="mb-4 text-slate-700">
          Customers must provide accurate booking information and comply with
          applicable laws during service. Smoking (unless permitted), carrying
          illegal substances, overloading beyond legal limits, reckless conduct,
          or misuse of the vehicle is strictly prohibited and may result in
          immediate service termination without refund.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Delays & Extensions
        </h2>
        <p className="mb-4 text-slate-700">
          Additional charges apply for waiting time beyond the agreed limit,
          booking extensions, or significant route changes. Availability for
          extensions is not guaranteed and remains subject to Vendor approval.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Cancellation & Refund
        </h2>
        <p className="mb-4 text-slate-700">
          Cancellation eligibility and refund amounts depend on timing,
          booking type, and event category. Refund processing timelines may
          vary depending on the payment method used. Special event, seasonal,
          or wedding bookings may carry stricter cancellation terms.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Replacement Policy
        </h2>
        <p className="mb-4 text-slate-700">
          In case of vehicle breakdown, accident, or operational emergency,
          the Vendor will attempt to arrange a replacement vehicle of similar
          category. If replacement is not possible, a proportional refund may
          be issued at RentKA’s discretion.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Liability & Force Majeure
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA shall not be liable for traffic delays, accidents, mechanical
          failures, weather disruptions, government restrictions, political
          unrest, natural disasters, or events beyond its reasonable control.
          The assigned Vendor remains responsible for operational execution
          and insurance coverage.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Limitation of Liability
        </h2>
        <p className="mb-4 text-slate-700">
          To the maximum extent permitted by law, RentKA’s total liability,
          if any, shall not exceed the amount paid for the specific booking.
          RentKA is not responsible for indirect, incidental, or consequential
          losses.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          No Direct Bypass
        </h2>
        <p className="mb-4 text-slate-700">
          Customers agree not to directly engage or rebook Vendors introduced
          through RentKA in order to bypass platform fees. Future bookings
          must be processed through RentKA.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Amendments
        </h2>
        <p className="text-slate-700">
          RentKA reserves the right to update or modify these Terms &
          Conditions at any time. Continued use of the platform constitutes
          acceptance of the updated terms.
        </p>
      </div>
    </main>
  );
}