// app/cancellation-policy/page.tsx

export const metadata = {
  title: "Cancellation & Refund Policy",
  description: "Cancellation and refund policy for RentKA car rental services.",
};

export default function CancellationPolicyPage() {
  return (
    <main className="pt-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">
          Cancellation & Refund Policy
        </h1>

        <p className="mb-4 text-slate-700">
          This policy explains how cancellations and refunds are handled on
          <strong> RentKA</strong>.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Booking Cancellations
        </h2>
        <p className="mb-4 text-slate-700">
          Cancellation policies vary depending on the car rental partner, vehicle
          type, and booking terms. Details will be shared with you at the time of
          booking confirmation.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Refunds
        </h2>
        <p className="mb-4 text-slate-700">
          Any applicable refunds will be processed according to the partner’s
          cancellation policy. RentKA does not guarantee refunds unless explicitly
          stated during confirmation.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          No-Show Policy
        </h2>
        <p className="mb-4 text-slate-700">
          Failure to appear at the agreed pickup time or location may result in a
          full or partial charge, depending on the partner’s terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Changes to Bookings
        </h2>
        <p className="mb-4 text-slate-700">
          Requests to modify booking details are subject to availability and
          partner approval.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900">
          Contact
        </h2>
        <p className="text-slate-700">
          For questions related to cancellations or refunds, please contact our
          support team through the Contact Us page.
        </p>
      </div>
    </main>
  );
}
