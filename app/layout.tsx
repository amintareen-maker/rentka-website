import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: {
    default: "RentKA | Verified Car Rentals Without the Hassle",
    template: "%s | RentKA",
  },
  description:
    "Find verified rental cars from trusted local partners. Self-drive or with driver.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-slate-900 flex min-h-screen flex-col">
        {/* Global Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Global Footer */}
        <footer className="border-t bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Left */}
              <p className="text-sm text-slate-600">
                © {new Date().getFullYear()} RentKA. All rights reserved.
              </p>

              {/* Right */}
              <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link
                  href="/terms"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Privacy
                </Link>
                <Link
                  href="/cancellation-policy"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Cancellation Policy
                </Link>
                <Link
                  href="/contact"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </footer>

        {/* Vercel Analytics (must be inside body) */}
        <Analytics />
      </body>
    </html>
  );
}
