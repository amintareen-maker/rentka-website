import "react-datepicker/dist/react-datepicker.css";
import Script from "next/script";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";
import WhatsAppWidget from "@/components/WhatsAppWidget";

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://rentka.co"),
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
              <div className="text-sm text-slate-600">
                <p>© {new Date().getFullYear()} RENTKA (SMC-PRIVATE) LIMITED. All rights reserved.</p>
                <p className="mt-1">
                  <a href="tel:+923020589999" className="hover:text-slate-900 hover:underline">0302 058 9999</a>
                </p>
              </div>

              <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/rent-a-car-islamabad" className="text-slate-600 hover:text-slate-900">
                  Islamabad Car Rental
                </Link>
                <Link href="/rent-a-car-rawalpindi" className="text-slate-600 hover:text-slate-900">
                  Rawalpindi Car Rental
                </Link>
                <Link href="/airport-car-rental-islamabad" className="text-slate-600 hover:text-slate-900">
                  Airport Transfer
                </Link>
                <Link href="/one-way-drop" className="text-slate-600 hover:text-slate-900">
                  One-Way Drop
                </Link>
                <Link href="/blog" className="text-slate-600 hover:text-slate-900">
                  Blog
                </Link>
                <Link href="/about" className="text-slate-600 hover:text-slate-900">
                  About
                </Link>
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
