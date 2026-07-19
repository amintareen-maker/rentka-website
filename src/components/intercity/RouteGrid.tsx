import Link from "next/link";

import { ArrowRight } from "lucide-react";

import RouteCard from "./RouteCard";
import { intercityRoutes } from "@/data/intercityRoutes";

type RouteGridProps = {
  limit?: number;
  showViewAll?: boolean;
  showHeader?: boolean;
  heading?: string;
  description?: string;
};

export default function RouteGrid({
  limit,
  showViewAll = false,
  showHeader = true,
  heading = "Most Booked One Way Routes",
  description = "Fixed one-way pricing with professional drivers and fuel included. Choose one of our most popular intercity routes or use the Route Finder above to instantly check pricing.",
}: RouteGridProps) {
  const routes = intercityRoutes
    .filter((route) => route.active)
    .filter((route) => !limit || route.featured)
    .slice(0, limit);

  return (
    <section className="py-20 bg-slate-50">

      <div className="mx-auto max-w-7xl px-6">

        {showHeader && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Popular Routes
              </span>

              <h2 className="mt-5 text-4xl font-bold text-[#0F2B46]">
                {heading}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                {description}
              </p>

            </div>

            <Link
              href="#price-table"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0F2B46] px-6 py-3 font-semibold text-[#0F2B46] transition hover:bg-[#0F2B46] hover:text-white"
            >
              View Complete Price List

              <ArrowRight size={18} />

            </Link>

          </div>
        )}

        <div className={`${showHeader ? "mt-14" : ""} grid gap-8 md:grid-cols-2 xl:grid-cols-3`}>

          {routes.map((route) => (
            <RouteCard
              key={route.slug}
              route={route}
            />
          ))}

        </div>

        {showViewAll && (
          <div className="mt-10 text-center">
            <Link
              href="/one-way-drop"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0F2B46] px-6 py-3 font-semibold text-[#0F2B46] transition hover:bg-[#0F2B46] hover:text-white"
            >
              View All Routes <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {showHeader && (
          <div className="mt-16 rounded-3xl border border-dashed border-[#5BAE4A] bg-white p-8">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h3 className="text-2xl font-bold text-[#0F2B46]">
                Can't find your destination?
              </h3>

              <p className="mt-3 text-slate-600">
                We provide one-way and round-trip transportation across
                Pakistan. If your route isn't listed, request a custom
                quotation on WhatsApp.
              </p>

            </div>

            <a
              href="https://wa.me/923020589999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-[#5BAE4A] px-8 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Request Custom Quote
            </a>

          </div>

          </div>
        )}

      </div>

    </section>
  );
}
