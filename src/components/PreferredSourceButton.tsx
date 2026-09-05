"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

import { trackDataLayer } from "@/lib/tracking";

type PreferredSourceButtonProps = {
  contentType: string;
  placement?: string;
};

const googleButtonAttributes = {
  "google-add-preferred-source-btn": "",
  "data-theme": "light",
};

export default function PreferredSourceButton({
  contentType,
  placement = "article_footer",
}: PreferredSourceButtonProps) {
  const pathname = usePathname();

  return (
    <section
      className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8"
      aria-labelledby="preferred-source-heading"
    >
      <Script src="https://news.google.com/swg/js/v1/publisher.js" strategy="afterInteractive" />
      <div className="max-w-2xl">
        <h2 id="preferred-source-heading" className="text-2xl font-bold text-[#0F2B46]">
          Follow RentKA on Google
        </h2>
        <p className="mt-3 leading-7 text-slate-600">
          Add RentKA as a preferred source for useful Pakistan travel and car rental guides.
        </p>
        <div
          className="mt-5 min-h-10"
          onClickCapture={() =>
            trackDataLayer("preferred_source_click", {
              page_path: pathname,
              placement,
              content_type: contentType,
            })
          }
        >
          <div {...googleButtonAttributes} />
        </div>
      </div>
    </section>
  );
}