import "react-datepicker/dist/react-datepicker.css";
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
        {/* Meta Pixel */}
<Script id="meta-pixel" strategy="afterInteractive">
  {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;
    n.push=n;
    n.loaded=!0;
    n.version='2.0';
    n.queue=[];
    t=b.createElement(e);
    t.async=!0;
    t.src=v;
    s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s);
    }(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '2103048110620467');
    fbq('track', 'PageView');
  `}
</Script>
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
      "@id": "https://rentka.co/#organization",
      name: "RentKA",
      legalName: "RentKA (SMC-PRIVATE) Limited",
      url: "https://rentka.co",
      logo: {
        "@type": "ImageObject",
        url: "https://rentka.co/logo.png",
      },
      telephone: "+923020589999",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+923020589999",
        contactType: "customer service",
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
      sameAs: [
        "https://www.facebook.com/RentKACarRental",
        "https://www.instagram.com/rentka.co",
        "https://www.linkedin.com/company/rentka",
        "https://x.com/RentKACarRental",
        "https://www.youtube.com/@RentKACarRental",
      ],
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
      "@id": "https://rentka.co/#car-rental",
      name: "RentKA",
      legalName: "RentKA (SMC-PRIVATE) Limited",
      url: "https://rentka.co",
      image: "https://rentka.co/logo.png",
      logo: "https://rentka.co/logo.png",
      telephone: "+923020589999",
      priceRange: "PKR",
      parentOrganization: {
        "@id": "https://rentka.co/#organization",
      },
      areaServed: [
        {
          "@type": "City",
          name: "Islamabad",
        },
        {
          "@type": "City",
          name: "Rawalpindi",
        },
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Islamabad",
        addressCountry: "PK",
      },
      hasMap: "https://www.google.com/maps/place/Rentka/@33.715213,73.0645139,17z/data=!3m1!4b1!4m6!3m5!1s0x293c5f8a2e952d73:0x934b9c0b3c707405!8m2!3d33.715213!4d73.0670888!16s%2Fg%2F11nhgw876j",
      knowsLanguage: ["English", "Urdu"],
      description: "RentKA provides chauffeur-driven car rental, airport transfer, intercity travel, corporate transport and outstation travel services in Islamabad and Rawalpindi.",
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
      "@id": "https://rentka.co/#website",
      name: "RentKA",
      url: "https://rentka.co",
      publisher: {
        "@id": "https://rentka.co/#organization",
      },
    }),
  }}
/>
      </head>

      <body className="antialiased bg-white text-slate-900 flex min-h-screen flex-col pt-10">
        <noscript>
  <img
    height="1"
    width="1"
    style={{ display: "none" }}
    src="https://www.facebook.com/tr?id=2103048110620467&ev=PageView&noscript=1"
    alt=""
  />
</noscript>
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
