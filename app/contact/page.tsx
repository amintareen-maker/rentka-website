import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact RentKA | Car Rental Islamabad",
  description:
    "Contact RentKA for chauffeur-driven car rental, airport transfers and intercity travel in Islamabad and Rawalpindi.",
  alternates: {
    canonical: "https://rentka.co/contact",
  },
  openGraph: {
    url: "https://rentka.co/contact",
  },
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
              <a href="mailto:support@rentka.co" className="hover:underline">
                support@rentka.co
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Phone / WhatsApp
            </h2>
            <p className="text-slate-700">
              <a href="tel:+923020589999" className="hover:underline">
                +92 302 0589999
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Website
            </h2>
            <p className="text-slate-700">
              <a href="https://rentka.co" className="hover:underline">
                https://rentka.co
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Office Address
            </h2>
            <p className="text-slate-700">
              Redco Plaza, 4th Floor, Suite 4, Blue Area, Islamabad, Pakistan
            </p>
            <p className="text-slate-700">
              <a
                href="https://www.google.com/maps/place/Rentka/@33.715213,73.0645139,17z/data=!3m1!4b1!4m6!3m5!1s0x293c5f8a2e952d73:0x934b9c0b3c707405!8m2!3d33.715213!4d73.0670888!16s%2Fg%2F11nhgw876j"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View on Google Maps
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Business Hours
            </h2>
            <p className="text-slate-700">
              24/7 booking support
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Connect with RentKA
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-slate-700">
            <a href="https://www.facebook.com/RentKACarRental" target="_blank" rel="noopener noreferrer" className="hover:underline">Facebook</a>
            <a href="https://www.instagram.com/rentka.co" target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a>
            <a href="https://www.linkedin.com/company/rentka" target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
            <a href="https://x.com/RentKACarRental" target="_blank" rel="noopener noreferrer" className="hover:underline">X</a>
            <a href="https://www.youtube.com/@RentKACarRental" target="_blank" rel="noopener noreferrer" className="hover:underline">YouTube</a>
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
