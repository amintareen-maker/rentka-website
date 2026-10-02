"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import LahoreBookingClient from "@/components/lahore/LahoreBookingClient";
import type { LahoreBookingInventory } from "@/lib/normal-rental/inventory-core";
import { PUBLIC_NORMAL_RENTAL_ZONES, getNormalRentalBookingContext, normalRentalZoneForCity, type NormalRentalCityId } from "@/lib/normal-rental/zones";
import { trackDataLayer as trackEvent } from "@/lib/tracking";

type Props = { initialInventory: Partial<Record<NormalRentalCityId, LahoreBookingInventory[]>>; children?: ReactNode };

export default function HomePageClient({ initialInventory, children }: Props) {
  const [city, setCity] = useState<NormalRentalCityId>("islamabad");
  const [inventory, setInventory] = useState(initialInventory.islamabad ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stepsVisible, setStepsVisible] = useState(false);
  const pending = useRef<AbortController | undefined>(undefined);
  const context = getNormalRentalBookingContext(normalRentalZoneForCity(city)!, city);
  useEffect(() => {
    const onScroll = () => { const rect = document.getElementById("how-rentka-works")?.getBoundingClientRect(); if (rect && rect.top < window.innerHeight - 120) setStepsVisible(true); };
    window.addEventListener("scroll", onScroll); onScroll();
    return () => { window.removeEventListener("scroll", onScroll); pending.current?.abort(); };
  }, []);
  async function selectCity(selectedCity: NormalRentalCityId) {
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setCity(selectedCity); setInventory(initialInventory[selectedCity] ?? []); setLoading(true); setError("");
    trackEvent("select_city", { city: selectedCity, zone_id: normalRentalZoneForCity(selectedCity), country: "PK" });
    try {
      const response = await fetch(`/api/normal-rental-inventory?city=${selectedCity}`, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load current cars. Please try again.");
      const data = await response.json() as { inventory: LahoreBookingInventory[] };
      if (!controller.signal.aborted) setInventory(data.inventory);
    } catch (caught) {
      if (!controller.signal.aborted) { setInventory([]); setError(caught instanceof Error ? caught.message : "Unable to load cars."); }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }
  return <>
    <section id="filters" className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 text-center"><h2 className="text-2xl font-bold text-[var(--rentka-green)] md:text-3xl">Choose Your City &amp; Service</h2><p className="mt-2 text-[var(--rentka-blue)]">All bookings include a driver. Select your location to see available cars.</p></div>
        <div className="grid gap-5 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-3 md:p-8">
          <label className="text-sm font-semibold text-[var(--rentka-blue)]">Country<select value="PK" disabled className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3"><option value="PK">Pakistan</option></select></label>
          <label className="text-sm font-semibold text-[var(--rentka-blue)]">City/Area<select value={city} onChange={(event) => void selectCity(event.target.value as NormalRentalCityId)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[var(--rentka-green)]">{PUBLIC_NORMAL_RENTAL_ZONES.map((zone) => <option key={zone.id} value={zone.defaultCityId}>{zone.label}</option>)}</select></label>
          <label className="text-sm font-semibold text-[var(--rentka-blue)]">Service<select value="withDriver" disabled className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3"><option value="withDriver">With Driver</option></select></label>
        </div>
      </div>
    </section>
    <section aria-label="Available vehicles" aria-busy={loading} className="bg-white py-16"><div className="mx-auto max-w-7xl px-6">
      {loading ? <p role="status" className="py-12 text-center">Loading current cars and prices…</p> : error ? <div role="alert" className="py-12 text-center"><p>{error}</p><button onClick={() => void selectCity(city)} className="mt-4 rounded-lg bg-[var(--rentka-green)] px-5 py-3 text-white">Try again</button></div> : <LahoreBookingClient key={city} inventory={inventory} context={context} variant="prelaunch" source="homepage" />}
    </div></section>
    <section aria-labelledby="locations-heading" className="border-y border-slate-200 bg-slate-50 py-12"><div className="mx-auto max-w-7xl px-6"><h2 id="locations-heading" className="text-3xl font-bold text-[var(--rentka-blue)]">Our Locations</h2><p className="mt-3 text-slate-600">Explore city guides and travel services in our active markets.</p><nav aria-label="Locations and services" className="mt-6 grid gap-3 sm:grid-cols-3">{PUBLIC_NORMAL_RENTAL_ZONES.flatMap((zone) => zone.cityIds).map((cityId) => <Link key={cityId} href={`/rent-a-car-${cityId}`} className="rounded-xl border bg-white p-4 font-semibold capitalize text-[var(--rentka-blue)]">Car rental in {cityId}</Link>)}<Link href="/airport-transfer" className="rounded-xl border bg-white p-4 font-semibold">Airport Transfer</Link><Link href="/one-way-drop" className="rounded-xl border bg-white p-4 font-semibold">One-Way Drop</Link><Link href="/travel-guides" className="rounded-xl border bg-white p-4 font-semibold">Travel Guides</Link></nav></div></section>
      {/* HOW RENTKA WORKS */}
      <section
        id="how-rentka-works"
        className="bg-slate-50 py-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2
            className={`text-3xl font-bold text-slate-900 mb-4 transition-all duration-700 ${
              stepsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            How RentKA Works
          </h2>

          <p
            className={`text-slate-800 mb-14 transition-all duration-700 delay-100 ${
              stepsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            A considered rental experience, Dedicated support throughout your ride.
             Simple, fast, and reliable car rental with driver in Islamabad, Rawalpindi and Lahore.
          </p>
          

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            {[
              {
                title: "Browse Verified Cars",
                text: "Carefully selected vehicles from trusted partners.",
              },
              {
                title: "We Confirm Availability",
                text: "Our team personally coordinates with the rental provider.",
              },
              {
                title: "Finalize & Drive",
                text: "Proceed with confidence once details are confirmed.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className={`p-6 transition-all duration-700 ${
                  stepsVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${200 + index * 150}ms` }}
              >
                <h3 className="font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-700">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {children}

      {/* BOTTOM CTA */}
      <section className="bg-[var(--rentka-blue)] text-white py-16 md:py-24 overflow-visible">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-20">
          <h2 className="text-3xl font-bold tracking-tight !text-white mb-4">
            A more considered way to rent a car
          </h2>
          <p className="text-white/90 mb-8">
            Browse verified vehicles and let us handle the rest.
          </p>
          <button
  onClick={() => {
    trackEvent("browse_cars_click", {
      location: "bottom_cta",
    });

    document
      .getElementById("filters")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }}
            className="bg-[var(--rentka-green)] text-white px-8 py-3 rounded-lg font-medium hover:bg-[var(--rentka-green-hover)] transition"
          >
            Browse Cars
          </button>
        </div>
      </section>

    </>;
}
