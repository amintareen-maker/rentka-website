"use client";

import Link from "next/link";

const trackEvent = (eventName: string, data: any = {}) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, data);
  }
};

export default function HomeCTA() {
  return (
    <div className="pt-8 flex flex-wrap gap-4">
      
      <Link
        href="/rent-a-car-islamabad"
        className="inline-block bg-slate-900 text-white px-6 py-3 rounded-md hover:bg-slate-700 transition"
        onClick={() => {
          trackEvent("home_cta_click", {
            cta: "islamabad_page",
            location: "seo_section",
          });
        }}
      >
        Explore Car Rental in Islamabad
      </Link>

      <Link
        href="/rent-a-car-rawalpindi"
        className="inline-block border border-slate-900 text-slate-900 px-6 py-3 rounded-md hover:bg-slate-100 transition"
        onClick={() => {
          trackEvent("home_cta_click", {
            cta: "rawalpindi_page",
            location: "seo_section",
          });
        }}
      >
        Explore Car Rental in Rawalpindi
      </Link>

      <Link
        href="/airport-car-rental-islamabad"
        className="inline-block border border-emerald-700 text-emerald-700 px-6 py-3 rounded-md hover:bg-emerald-50 transition"
        onClick={() => {
          trackEvent("home_cta_click", {
            cta: "airport_page",
            location: "seo_section",
          });
        }}
      >
        Explore Airport Transfers
      </Link>

    </div>
  );
}