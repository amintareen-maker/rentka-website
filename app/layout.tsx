import Script from "next/script";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";

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

      {/* ✅ Google Tag */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18044696705"
        strategy="beforeInteractive"
      />

      <Script id="google-tag" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          gtag('js', new Date());
          gtag('config', 'AW-18044696705');
          gtag('config', 'G-7DHBBGGMQ3');
        `}
      </Script>

      <body className="antialiased bg-white text-slate-900 flex min-h-screen flex-col">

        {/* ✅ Microsoft Clarity */}
        <Script
          src="https://www.clarity.ms/tag/wjs72cq7ak"
          strategy="afterInteractive"
        />

        <Header />

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                © {new Date().getFullYear()} RentKA. All rights reserved.
              </p>

              <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/terms" className="text-slate-600 hover:text-slate-900">Terms</Link>
                <Link href="/privacy" className="text-slate-600 hover:text-slate-900">Privacy</Link>
                <Link href="/cancellation-policy" className="text-slate-600 hover:text-slate-900">Cancellation Policy</Link>
                <Link href="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
              </nav>
            </div>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}