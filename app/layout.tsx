import Script from "next/script";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";
import WhatsAppWidget from "@/components/WhatsAppWidget";

export const metadata = {
  title: {
    default: "RentKA | Affordable Car Rental with Driver",
    template: "%s | RentKA",
  },
  description:
    "Find reliable rental cars with clear pricing and flexible options, Affordable car rental with professional driver in Islamabad and Rawalpindi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="beforeInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TFQKL6VZ');
          `}
        </Script>

        {/* Organization Schema */}
<Script
  id="organization-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "RentKA",
      url: "https://www.rentka.co",
      logo: "https://www.rentka.co/logo.png",
      telephone: "+923020589999",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+923020589999",
        contactType: "customer service",
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
      sameAs: [
        "https://www.linkedin.com/company/rentka/"
      ]
    }),
  }}
/>

        {/* Car Rental Business Schema */}
<Script
  id="localbusiness-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CarRental",
      name: "RentKA",
      image: "https://www.rentka.co/logo.png",
      url: "https://www.rentka.co",
      telephone: "+923020589999",
      areaServed: [
        "Islamabad",
        "Rawalpindi"
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "PK"
      }
    }),
  }}
/>

{/* Website Schema */}
<Script
  id="website-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "RentKA",
      url: "https://www.rentka.co",
      potentialAction: {
        "@type": "SearchAction",
        target:
          "https://www.rentka.co/cars?city={city}",
        "query-input":
          "required name=city",
      },
    }),
  }}
/>
      </head>

      <body className="antialiased bg-white text-slate-900 flex min-h-screen flex-col pt-10">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TFQKL6VZ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Microsoft Clarity */}
        <Script
          src="https://www.clarity.ms/tag/wjs72cq7ak"
          strategy="afterInteractive"
        />

        <Header />

        <WhatsAppWidget />

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                © {new Date().getFullYear()} RentKA. All rights reserved.
              </p>

              <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/terms" className="text-slate-600 hover:text-slate-900">
                  Terms
                </Link>
                <Link href="/privacy" className="text-slate-600 hover:text-slate-900">
                  Privacy
                </Link>
                <Link href="/cancellation-policy" className="text-slate-600 hover:text-slate-900">
                  Cancellation Policy
                </Link>
                <Link href="/contact" className="text-slate-600 hover:text-slate-900">
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}