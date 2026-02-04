"use client";

import { useState, useEffect, useMemo } from "react";
import { useCars, Car } from "@/lib/useCars";
import { useCountries, useCities } from "@/lib/useLocations";

/* =============================
   TYPES (MODEL CARD)
============================== */
type CarModel = {
  model: string;
  imageURL?: string;
  category?: string;
  count: number;
  minPrice?: number;
};

export default function HomePageClient() {
  /* -----------------------------
     FILTER STATE (UNCHANGED)
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
     AUTO-SELECT SERVICE (UNCHANGED)
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
     CARS (SOURCE OF TRUTH)
  ------------------------------ */
  const { cars, loading } = useCars({ country, city, service });

  /* -----------------------------
     PRICE EXTRACTION (MATCH APP)
  ------------------------------ */
  const extractDailyPrice = (data: Car): number | undefined => {
    const supports = data.supports ?? {};
    const pricing = data.pricing ?? {};

    if (supports.withoutDriver) {
      const p = pricing.selfDrive?.withinCity?.daily;
      if (typeof p === "number") return p;
    }

    if (supports.withDriver) {
      const p = pricing.withDriver?.withinCity?.daily;
      if (typeof p === "number") return p;
    }

    return undefined;
  };

  /* -----------------------------
     DERIVE MODELS (KEY STEP)
     === WEB VERSION OF CarModelsScreen ===
  ------------------------------ */
  const models: CarModel[] = useMemo(() => {
    const map: Record<string, CarModel> = {};

    cars.forEach((car) => {
      if (!car.model) return;

      const price = extractDailyPrice(car);

      if (!map[car.model]) {
        map[car.model] = {
          model: car.model,
          imageURL: car.imageURL,
          category: car.category,
          count: 0,
          minPrice:
            typeof price === "number" ? price : undefined,
        };
      }

      map[car.model].count += 1;

      if (
        typeof price === "number" &&
        (map[car.model].minPrice === undefined ||
          price < map[car.model].minPrice!)
      ) {
        map[car.model].minPrice = price;
      }
    });

    return Object.values(map);
  }, [cars]);

  /* -----------------------------
     BLOCKED ACTION (UNCHANGED)
  ------------------------------ */
  const handleBlockedAction = () => {
    setShakeKey((k) => k + 1);
    setFilterError({
      city: !city,
      service: !service,
    });
  };

  const canBrowseModels = Boolean(city && service);

  return (
    <>
      {/* =============================
          FILTERS (UNCHANGED)
      ============================== */}
      <section className="bg-slate-50 border-b border-slate-200 pt-6 md:pt-0">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Find the right car for your trip
            </h2>
            <p className="text-slate-700">
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
                <select className="w-full rounded-lg border border-slate-400 px-4 py-3">
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
                  className="w-full rounded-lg border border-slate-400 px-4 py-3"
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
                  className="w-full rounded-lg border border-slate-400 px-4 py-3"
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

              {/* RESET */}
              <div className="hidden md:block">
                <button
                  onClick={() => {
                    setCity(undefined);
                    setService(undefined);
                    setFilterError({});
                  }}
                  className="w-full rounded-lg border border-slate-400 px-4 py-3"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================
          MODELS GRID (STEP 1)
      ============================== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          {loading && (
            <div className="text-center text-slate-600">
              Loading cars…
            </div>
          )}

          {!loading && models.length === 0 && (
            <div className="text-center text-slate-600">
              No cars available
            </div>
          )}

          {!loading && models.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {models.map((m) => (
                <button
                  key={m.model}
                  onClick={() =>
                    canBrowseModels
                      ? console.log("OPEN MODEL:", m.model)
                      : handleBlockedAction()
                  }
                  className="text-left rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition p-4"
                >
                  <div className="aspect-[4/3] bg-slate-100 rounded-lg mb-4 overflow-hidden">
                    {m.imageURL ? (
                      <img
                        src={m.imageURL}
                        alt={m.model}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <h3 className="font-semibold text-slate-900">
                    {m.model}
                  </h3>

                  {typeof m.minPrice === "number" && (
                    <p className="text-sm text-slate-700 mt-1">
                      Starting from PKR{" "}
                      <span className="font-semibold">
                        {m.minPrice}
                      </span>
                      /day
                    </p>
                  )}

                  <p className="text-sm text-slate-500 mt-1">
                    {m.count} option(s)
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
