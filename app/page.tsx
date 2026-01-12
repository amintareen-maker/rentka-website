"use client";

import { useState, useEffect } from "react";
import HeroBanner from "@/components/HeroBanner";
import { useCars, Car } from "@/lib/useCars";
import CarCard from "@/components/CarCard";
import CarDetailsModal from "@/components/CarDetailsModal";
import { useCountries, useCities } from "@/lib/useLocations";

export default function HomePage() {
  /* -----------------------------
     FILTER STATE
  ------------------------------ */
  const [country, setCountry] = useState<string>("PK");
  const [city, setCity] = useState<string | undefined>();
  const [service, setService] =
    useState<"selfDrive" | "withDriver" | undefined>();

  const [filterError, setFilterError] = useState<{
    city?: boolean;
    service?: boolean;
  }>({});

  const [shakeKey, setShakeKey] = useState(0);

  /* -----------------------------
     LOCATIONS
  ------------------------------ */
  const countries = useCountries();
  const cities = useCities(country);
  const selectedCity = cities.find((c) => c.id === city);

  const availableServices = {
    selfDrive: selectedCity?.supports?.serviceWithoutDriver,
    withDriver: selectedCity?.supports?.serviceWithDriver,
  };

  /* -----------------------------
     AUTO-SELECT SERVICE
  ------------------------------ */
  useEffect(() => {
    if (!selectedCity) {
      setService(undefined);
      return;
    }

    const supportsSelf = Boolean(
      selectedCity.supports?.serviceWithoutDriver
    );
    const supportsDriver = Boolean(
      selectedCity.supports?.serviceWithDriver
    );

    if (supportsSelf && !supportsDriver) {
      setService("selfDrive");
      setFilterError((prev) => ({ ...prev, service: false }));
    }

    if (!supportsSelf && supportsDriver) {
      setService("withDriver");
      setFilterError((prev) => ({ ...prev, service: false }));
    }
  }, [selectedCity]);

  /* -----------------------------
     CARS
  ------------------------------ */
  const { cars, loading } = useCars({ country, city, service });

  const categories = Array.from(
    new Set(cars.map((c) => c.category).filter(Boolean))
  );

  const carsByCategory: Record<string, Car[]> = {};
  categories.forEach((category) => {
    carsByCategory[category] = cars.filter(
      (c) => c.category === category
    );
  });

  /* -----------------------------
     MODAL
  ------------------------------ */
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<"selfDrive" | "withDriver">("selfDrive");

  const canViewDetails = Boolean(city && service);

  const handleBlockedAction = () => {
    setShakeKey((k) => k + 1);
    setFilterError({
      city: !city,
      service: !service,
    });
  };

  const handleViewDetails = (car: Car) => {
    setFilterError({});
    setSelectedCar(car);
    setSelectedService(service!);
    setDetailsOpen(true);
  };

  useEffect(() => {
    if (city && service) {
      setFilterError({});
    }
  }, [city, service]);

  return (
    <>
      <HeroBanner />

      {/* =============================
          FILTERS
      ============================== */}
      <section className="bg-emerald-50/40 border-b border-emerald-100 pt-6 md:pt-0">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Find the right car for your trip
            </h2>
            <p className="text-slate-800">
              Select your city and service to see available cars
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 md:p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
              {/* COUNTRY */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setCity(undefined);
                    setService(undefined);
                    setFilterError({});
                  }}
                  className="w-full rounded-lg border border-slate-400 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CITY */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  City
                </label>
                <select
                  key={`city-${shakeKey}`}
                  value={city ?? ""}
                  onChange={(e) => {
                    setCity(e.target.value || undefined);
                    setService(undefined);
                    setFilterError((p) => ({ ...p, city: false }));
                  }}
                  className="w-full rounded-lg px-4 py-3 border border-slate-400 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SERVICE */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Service
                </label>
                <select
                  key={`service-${shakeKey}`}
                  value={service ?? ""}
                  onChange={(e) => {
                    setService(
                      (e.target.value as
                        | "selfDrive"
                        | "withDriver") || undefined
                    );
                    setFilterError((p) => ({ ...p, service: false }));
                  }}
                  className="w-full rounded-lg px-4 py-3 border border-slate-400 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select service</option>
                  {availableServices.selfDrive && (
                    <option value="selfDrive">Self Drive</option>
                  )}
                  {availableServices.withDriver && (
                    <option value="withDriver">With Driver</option>
                  )}
                </select>
              </div>

              {/* RESET (DESKTOP) */}
              <div className="hidden md:block">
                <button
                  onClick={() => {
                    setCity(undefined);
                    setService(undefined);
                    setFilterError({});
                  }}
                  className="w-full rounded-lg border border-slate-400 px-4 py-3 font-medium text-slate-800 hover:bg-slate-100"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* MOBILE ACTIONS */}
            <div className="mt-6 flex flex-col gap-3 md:hidden">
              <button
                onClick={() =>
                  window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
                }
                className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 transition"
              >
                Show Cars
              </button>

              <button
                onClick={() => {
                  setCity(undefined);
                  setService(undefined);
                  setFilterError({});
                }}
                className="w-full rounded-lg border border-slate-400 px-4 py-3 font-medium text-slate-800"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =============================
          CARS
      ============================== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          {!loading &&
            categories.map((category) => {
              const list = carsByCategory[category];
              if (!list.length) return null;

              return (
                <div key={category} className="mb-16">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">
                    {category}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {list.map((car) => (
                      <CarCard
                        key={car.id}
                        car={car}
                        disabled={!canViewDetails}
                        onViewDetails={() => {
                          if (!canViewDetails) {
                            handleBlockedAction();
                            return;
                          }
                          handleViewDetails(car);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* =============================
          HOW RENTKA WORKS
      ============================== */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            How RentKA Works
          </h2>
          <p className="text-slate-800 mb-14">
            A considered rental experience, supported by human verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                Browse Verified Cars
              </h3>
              <p className="text-slate-700">
                Carefully selected vehicles from trusted partners.
              </p>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                We Confirm Availability
              </h3>
              <p className="text-slate-700">
                Our team personally coordinates with the rental provider.
              </p>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                Finalize & Drive
              </h3>
              <p className="text-slate-700">
                Proceed with confidence once details are confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =============================
          BOTTOM CTA
      ============================== */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            A more considered way to rent a car
          </h2>
          <p className="text-slate-200 mb-8">
            Browse verified vehicles and let us handle the rest.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="bg-white text-slate-900 px-8 py-3 rounded-lg font-medium"
          >
            Browse Cars
          </button>
        </div>
      </section>

      {/* MODAL — FIXED */}
      <CarDetailsModal
        open={detailsOpen}
        car={selectedCar}
        service={selectedService}
        city={city}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
