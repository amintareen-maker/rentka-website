// app/cancellation-policy/page.tsx

export const metadata = {
  title: "Cancellation & Refund Policy",
  description: "Cancellation and refund policy for RentKA car rental services.",
  alternates: { canonical: "https://rentka.co/cancellation-policy" },
};

export default function CancellationPolicyPage() {
  return (
    <main className="pt-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">
          Cancellation & Refund Policy
        </h1>

        <p className="mb-4 text-slate-700">
          We aim to keep our cancellation policy fair and transparent for both customers and vehicle partners.
          This policy explains how booking cancellations, refunds, and booking modifications are handled on the RentKA platform.

          <strong> RentKA</strong>.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Booking Cancellations
        </h2>
        <p className="mb-4 text-slate-700">
          Customers may cancel a booking by contacting RentKA support via WhatsApp, phone, or email.
          Cancellation eligibility depends on the time remaining before the scheduled pickup time.
          More than 24 hours before pickup
          Customers may cancel the booking and receive a full refund, minus any applicable payment processing fees.
          12 to 24 hours before pickup
          Customers may receive a partial refund depending on vendor allocation and operational costs.
          Less than 12 hours before pickup
          Bookings cancelled within 12 hours of the scheduled pickup time are generally non-refundable due to vendor allocation and operational commitments.

        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Same-Day / Urgent Bookings
        </h2>
        <p className="mb-4 text-slate-700">
          Bookings made for pickup within 12 hours are considered urgent bookings because vehicles are allocated immediately.
          Free cancellation is allowed within 30 minutes of booking, provided that a vehicle has not yet been confirmed or assigned.
          Once a vehicle or vendor has been confirmed, urgent bookings become non-refundable.
          A one-time reschedule may be allowed with at least 6 hours’ notice, subject to vehicle availability.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          No-Show Policy
        </h2>
        <p className="mb-4 text-slate-700">
          If the customer does not appear at the agreed pickup location and time without prior notice, the booking will be treated as a no-show.
          No-shows are non-refundable.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Delays
        </h2>
        <p className="mb-4 text-slate-700">
          Drivers may wait up to 30 minutes from the scheduled pickup time unless otherwise agreed during booking.
          Waiting beyond this period may result in additional waiting charges or booking cancellation, depending on driver availability.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Booking Modifications
        </h2>
        <p className="mb-4 text-slate-700">
          Requests to modify booking details such as pickup time, pickup location, drop location, or vehicle category are subject to vendor availability.
          Changes may result in price adjustments depending on the updated trip details.
        </p>


        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Refund Processing

        </h2>
        <p className="text-slate-700">
          Approved refunds are typically processed within 3–7 working days, depending on the payment method used.
          Refund timelines may vary depending on bank processing times.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Vendor Responsibility
        </h2>
        <p className="text-slate-700">
          RentKA operates as a booking and coordination platform connecting customers with independent vehicle service providers (“Vendors”).
          While RentKA facilitates booking coordination and customer support, the operational service including vehicle availability, driver conduct, and trip execution is handled by the assigned vendor.
        </p>


        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Contact
        </h2>
        <p className="text-slate-700">
          For cancellation requests or refund inquiries, please contact RentKA support.
          Email: support@rentka.co
          You may also reach our team through the Contact Us page on the website.
        </p>
      </div>
    </main>
  );
}
