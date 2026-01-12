// app/contact/page.tsx

export const metadata = {
  title: "Contact Us",
  description: "Contact RentKA for car rental inquiries, support, and assistance.",
};

export default function ContactPage() {
  return (
    <main className="pt-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">
          Contact Us
        </h1>

        <p className="mb-6 text-slate-700">
          Have questions or need assistance? Our team is here to help.
        </p>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Email
            </h2>
            <p className="text-slate-700">
              support@rentka.com
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Phone / WhatsApp
            </h2>
            <p className="text-slate-700">
              +92-XXX-XXXXXXX
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Response Time
            </h2>
            <p className="text-slate-700">
              We usually respond within 24 hours.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            For booking-related requests, please use the{" "}
            <strong>Contact Us</strong> option on the website so our team can
            assist you faster.
          </p>
        </div>
      </div>
    </main>
  );
}
