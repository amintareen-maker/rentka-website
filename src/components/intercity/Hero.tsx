"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeftRight,
  Car,
  MapPin,
  Route,
} from "lucide-react";

import { intercityRoutes } from "@/data/intercityRoutes";
import IntercityBookingModal from "./IntercityBookingModal";

export default function Hero() {
  const cities = useMemo(() => {
    const set = new Set<string>();

    intercityRoutes.forEach((route) => {
      set.add(route.from);
      set.add(route.to);
    });

    return [...set].sort();
  }, []);

  const [from, setFrom] = useState("Islamabad");
  const [to, setTo] = useState("Lahore");

  const [tripType, setTripType] = useState<
    "one-way" | "round-trip"
  >("one-way");

  const [vehicle, setVehicle] =
    useState("Toyota Corolla");

    const [bookingOpen, setBookingOpen] =
  useState(false);

  useEffect(() => {
    if (from === to) {
      const nextCity = cities.find(
        (city) => city !== from
      );

      if (nextCity) {
        setTo(nextCity);
      }
    }
  }, [from, to, cities]);

  const selectedRoute = intercityRoutes.find(
    (route) =>
      route.from === from &&
      route.to === to &&
      route.active
  );

  function swapCities() {
    const pickup = from;

    setFrom(to);

    setTo(pickup);
  }

  const oneWayPrice =
    selectedRoute?.vehicles.corolla.price;


  return (
    <>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2B46] via-[#123554] to-[#0F2B46]">

      <div className="absolute inset-0 opacity-10">

        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#5BAE4A]" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white" />

      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20">

        <div className="grid items-center gap-16 lg:grid-cols-2">

          <div>

            <span className="inline-flex rounded-full bg-[#5BAE4A]/20 px-4 py-2 text-sm font-semibold text-[#8DE27F]">

              One Way Drop • Fuel Included • Driver Included

            </span>

            <h1 className="mt-8 text-5xl font-bold leading-tight text-white lg:text-6xl">

              Book Intercity Travel
              <br />

              <span className="text-[#5BAE4A]">

                Instantly

              </span>

            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">

              Choose your route, instantly view the
              one-way fare and book within minutes.

              Round trips are quoted separately.

            </p>

            <div className="mt-10 flex flex-wrap gap-8">

              <div>

                <h3 className="text-4xl font-bold text-[#5BAE4A]">
                  {intercityRoutes.length}+
                </h3>

                <p className="mt-2 text-slate-300">
                  Fixed Routes
                </p>

              </div>

              <div>

                <h3 className="text-4xl font-bold text-[#5BAE4A]">
                  24/7
                </h3>

                <p className="mt-2 text-slate-300">
                  Support
                </p>

              </div>

              <div>

                <h3 className="text-4xl font-bold text-[#5BAE4A]">
                  100%
                </h3>

                <p className="mt-2 text-slate-300">
                  Driver Included
                </p>

              </div>

            </div>

          </div>

                    {/* Booking Widget */}

          <div className="rounded-[32px] bg-white p-8 shadow-2xl">

            <div className="mb-8">

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Route Finder
              </span>

              <h2 className="mt-5 text-3xl font-bold text-[#0F2B46]">
                Find Your Fare
              </h2>

              <p className="mt-3 text-slate-600">
                Select your journey and instantly view pricing.
              </p>

            </div>

            {/* Pickup */}

            <div>

              <label className="mb-2 flex items-center gap-2 font-medium text-slate-700">

                <MapPin size={18} />

                Pickup City

              </label>

              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-4 outline-none transition focus:border-[#5BAE4A]"
              >
                {cities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>

            </div>

            {/* Swap */}

            <div className="my-5 flex justify-center">

              <button
                type="button"
                onClick={swapCities}
                className="rounded-full border bg-slate-50 p-3 transition hover:bg-[#5BAE4A] hover:text-white"
              >
                <ArrowLeftRight size={22} />
              </button>

            </div>

            {/* Destination */}

            <div>

              <label className="mb-2 flex items-center gap-2 font-medium text-slate-700">

                <Route size={18} />

                Destination

              </label>

              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-4 outline-none transition focus:border-[#5BAE4A]"
              >
                {cities
                  .filter((city) => city !== from)
                  .map((city) => (
                    <option key={city}>
                      {city}
                    </option>
                  ))}
              </select>

            </div>

            {/* Trip Type */}

            <div className="mt-8">

              <label className="block font-medium text-slate-700">

                Trip Type

              </label>

              <div className="mt-3 grid grid-cols-2 gap-4">

                <button
                  type="button"
                  onClick={() =>
                    setTripType("one-way")
                  }
                  className={`rounded-xl border py-4 font-semibold transition ${
                    tripType === "one-way"
                      ? "border-[#5BAE4A] bg-[#5BAE4A] text-white"
                      : "border-slate-300"
                  }`}
                >
                  One Way
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTripType("round-trip")
                  }
                  className={`rounded-xl border py-4 font-semibold transition ${
                    tripType === "round-trip"
                      ? "border-[#5BAE4A] bg-[#5BAE4A] text-white"
                      : "border-slate-300"
                  }`}
                >
                  Round Trip
                </button>

              </div>

            </div>

            {/* Vehicle */}

            <div className="mt-8">

              <label className="mb-2 flex items-center gap-2 font-medium text-slate-700">

                <Car size={18} />

                Vehicle

              </label>

              <select
                value={vehicle}
                onChange={(e) =>
                  setVehicle(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 p-4 outline-none transition focus:border-[#5BAE4A]"
              >
                <option>
                  Toyota Corolla
                </option>
              </select>

            </div>
                        {/* Result */}

            <div className="mt-10 rounded-3xl bg-slate-50 p-6">

              {selectedRoute ? (
                <>

                  <div className="grid gap-6 md:grid-cols-3">

                    <div>

                      <p className="text-sm text-slate-500">
                        Distance
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-[#0F2B46]">
                        {selectedRoute.distanceKm} km
                      </h3>

                    </div>

                    <div>

                      <p className="text-sm text-slate-500">
                        Estimated Time
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-[#0F2B46]">
                        {selectedRoute.duration}
                      </h3>

                    </div>

                    <div>

                      <p className="text-sm text-slate-500">
                        Vehicle
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-[#0F2B46]">
                        Toyota Corolla
                      </h3>

                    </div>

                  </div>

                  <div className="my-8 border-t border-slate-200" />

                  {tripType === "one-way" ? (
                    <>
                      <p className="text-sm text-slate-500">
                        Starting From
                      </p>

                      <h2 className="mt-2 text-5xl font-bold text-[#5BAE4A]">
                        PKR {oneWayPrice?.toLocaleString()}
                      </h2>

                      <p className="mt-3 text-sm text-slate-600">
                        ✔ Fuel Included &nbsp;&nbsp; • &nbsp;&nbsp;
                        ✔ Professional Driver Included
                      </p>

                      <button
                        type="button"
                        onClick={() => setBookingOpen(true)}
                        className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#5BAE4A] py-4 text-lg font-semibold text-white transition hover:opacity-90"
                        >
                        Book Now
                        </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500">
                        Round Trip Pricing
                      </p>

                      <h2 className="mt-2 text-4xl font-bold text-[#0F2B46]">
                        Custom Quote
                      </h2>

                      <p className="mt-3 text-sm text-slate-600">
                        Pricing depends on waiting time, return date,
                        additional stops and trip duration.
                      </p>

                      <button
  type="button"
  onClick={() => setBookingOpen(true)}
  className="
    mt-5
    inline-flex
    items-center
    justify-center
    rounded-xl
    bg-[#5BAE4A]
    px-6
    py-3
    font-semibold
    text-white
    shadow-md
    transition-all
    duration-200
    hover:bg-[#4b9b3d]
    hover:shadow-lg
    active:scale-95
  "
>
  Get WhatsApp Quote
</button>
                    </>
                  )}
                </>
              ) : (
                <div className="rounded-2xl bg-yellow-50 p-6">

                  <h3 className="text-xl font-bold text-yellow-800">
                    Route Not Listed Yet
                  </h3>

                  <p className="mt-3 text-yellow-700">
                    We can still arrange this journey.
                    Contact us on WhatsApp for a custom quotation.
                  </p>

                  <button
                    type="button"
                    onClick={() => setBookingOpen(true)}
                  >
                    Request Quote
                  </button>

                </div>
              )}

            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-slate-600">

              <div>✅ Fuel Included</div>

              <div>✅ Driver Included</div>

              <div>✅ Fixed One Way Pricing</div>

              <div>✅ 24/7 WhatsApp Support</div>

            </div>

          </div>

        </div>

            </div>

    </section>

    <IntercityBookingModal
      open={bookingOpen}
      onClose={() => setBookingOpen(false)}
      route={{
        from,
        to,
        slug: selectedRoute?.slug ?? "",
      }}
      vehicle={vehicle}
      price={
        tripType === "one-way"
          ? oneWayPrice ?? null
          : null
      }
      tripType={tripType}
    />

  </>
);
}