// app/terms/page.tsx

export const metadata = {
  title: "Terms & Conditions",
  alternates: { canonical: "https://www.rentka.co/terms" },
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
          Role of RentKA
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA operates as a booking and coordination platform connecting customers with
          independent vehicle service providers (“Vendors”).
          RentKA does not own vehicles unless specifically stated and does not employ drivers of
          third-party vendors. RentKA acts only as a facilitator for booking coordination, communication,
          and payment processing between customers and Vendors.
          Operational responsibility for vehicle condition, driver conduct, and trip execution remains with
          the assigned Vendor.

        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Booking Confirmation
        </h2>
        <p className="mb-4 text-slate-700">
          A booking is considered confirmed only when written confirmation is provided to the customer
          via WhatsApp, SMS, or Email, any required advance payment is received, and vehicle/vendor
          availability is confirmed.
          RentKA reserves the right to decline or cancel bookings due to non-availability, safety concerns,
          incomplete customer documentation, or suspected fraudulent activity
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Pricing & Payments
        </h2>
        <p className="mb-4 text-slate-700">
          The final booking price may include vendor base rate, platform service fee, fuel cost where
          applicable, toll or parking charges, and extra hour or extra kilometer charges if usage exceeds
          the agreed booking.
          RentKA reserves the right to apply promotional discounts, adjust platform service fees, or
          modify pricing during peak dates, holidays, or seasonal demand.
          Payments must be made through approved payment methods such as bank transfer, online
          transfer, or other approved digital methods. Cash payments directly to drivers are discouraged
          unless specifically approved in advance.

        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Fuel Policy
        </h2>
        <p className="mb-4 text-slate-700">
          Fuel handling depends on the agreed booking model. This may be calculated on a per-kilometer
          basis or through a level-to-level fuel arrangement where the vehicle must be returned with the
          same fuel level.
          Customers are responsible for any additional fuel consumption beyond agreed limits or route
          extensions.

        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Customer Responsibilities
        </h2>
        <p className="mb-4 text-slate-700">
          Customers must provide valid identification such as CNIC when requested, provide accurate
          pickup and drop locations, be available at the agreed pickup time, treat the vehicle respectfully,
          and ensure all passengers follow traffic and safety regulations.
          Prohibited activities include smoking inside the vehicle unless permitted by the vendor, carrying
          illegal substances, exceeding the legal passenger capacity, or engaging in reckless or unsafe
          behavior.
          Any violation may result in immediate termination of the trip without refund.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Delays & Extensions
        </h2>
        <p className="mb-4 text-slate-700">
          Additional charges apply for waiting time beyond the agreed limit,
          booking extensions, or significant route changes. Availability for
          extensions is not guaranteed and remains subject to Vendor approval.If the customer delays pickup beyond the agreed time, extends the trip duration, or significantly
          changes the route, additional charges may apply based on the applicable rate card.
          Waiting beyond 30 minutes without prior notice may result in cancellation charges.

        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Cancellation & Refund
        </h2>
        <p className="mb-4 text-slate-700">
          Customer cancellations made more than 24 hours before the booking time are eligible for a full
          refund minus any processing fees if applicable.
          Cancellations made between 12 and 24 hours before pickup may receive a partial refund.
          Cancellations made less than 12 hours before pickup or no-shows are non-refundable.
          Refund processing timelines are typically 3–7 working days depending on the payment method.
          Peak events, weddings, and seasonal bookings may have stricter cancellation conditions.
          Same-Day / Urgent Bookings (Pickup Within 12 Hours)
          Bookings made for pickup within 12 hours are considered urgent due to immediate vendor
          allocation and operational blocking.
          Free cancellation is allowed within 30 minutes of booking provided that a vehicle has not yet
          been confirmed or allocated. Once the vehicle or vendor is confirmed, the booking becomes
          non-refundable.
          One-time rescheduling may be allowed with at least 6 hours’ notice, subject to vehicle
          availability.
          No-shows for urgent bookings are strictly non-refundable
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Replacement Policy
        </h2>
        <p className="mb-4 text-slate-700">
          In the event of vehicle breakdown, accident, or driver emergency, the vendor will attempt to
          arrange a replacement vehicle.
          If the replacement is of the same category there will be no additional charge. If the replacement
          is of a higher category there will be no extra cost to the customer. If the replacement is of a
          lower category, a price adjustment may apply.
          If a replacement cannot be arranged, the customer will receive a refund proportional to the
          unused portion of the service.

        </p>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Damage & Liability
        </h2>
        <p className="mb-4 text-slate-700">
          Customers are responsible for any intentional damage to the vehicle, interior damage including
          spills, burns, stains, excessive cleaning requirements, or damage caused by passengers.
          Charges will be assessed based on the actual repair or cleaning cost.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Traffic Fines & Violations
        </h2>
        <p className="mb-4 text-slate-700">
          If a traffic fine or penalty occurs due to customer instruction to violate traffic laws or due to
          passenger misconduct, the customer may be held financially responsible.
          The vendor remains responsible for violations caused by driver negligence.

        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Liability & Force Majeure
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA shall not be liable for traffic delays, accidents, mechanical
          failures, weather disruptions, government restrictions, political
          unrest, natural disasters, or events beyond its reasonable control.
          In the event of an accident, the vendor will handle insurance claims and legal procedures.
          RentKA may assist with coordination where possible.
          RentKA is not liable for road accidents, traffic delays, weather disruptions, government
          restrictions, political unrest, or natural disasters.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Limitation of Liability
        </h2>
        <p className="mb-4 text-slate-700">
          RentKA’s total liability, if any, shall not exceed the amount paid for the specific booking.
          RentKA is not responsible for loss of personal belongings, missed flights caused by traffic
          delays, vendor operational failures, or driver misconduct.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          No Direct Bypass
        </h2>
        <p className="mb-4 text-slate-700">
          Customers agree not to directly rebook vendors introduced through RentKA in order to avoid
          platform service fees. Future bookings with those vendors should be processed through the
          RentKA platform
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3 text-slate-900">
          Amendments
        </h2>
        <p className="text-slate-700">
          RentKA reserves the right to update these terms at any time. Updated terms will apply to new
          bookings after publication
        </p>
      </div>
    </main>
  );
}
