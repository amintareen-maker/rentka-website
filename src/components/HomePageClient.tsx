"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useCars, Car } from "@/lib/useCars";
import { useCountries, useCities } from "@/lib/useLocations";
import ModelListingsBottomSheet from "@/components/ModelListingsBottomSheet";
import CarDetailsModal from "@/components/CarDetailsModal";

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
     URL STATE
  ------------------------------ */
  const pathname = usePathname();

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
     HOW RENTKA WORKS ANIMATION
  ------------------------------ */
  const [stepsVisible, setStepsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("how-rentka-works");
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 120) {
        setStepsVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

    const supportsSelf =
      selectedCity.supports?.serviceWithoutDriver;
    const supportsDriver =
      selectedCity.supports?.serviceWithDriver;

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

  /* -----------------------------
     PRICE EXTRACTION
  ------------------------------ */
  const extractDailyPrice = (data: Car): number | undefined => {
    if (data.supports?.withoutDriver) {
      const p = data.pricing?.selfDrive?.withinCity?.daily;
      if (typeof p === "number") return p;
    }

    if (data.supports?.withDriver) {
      const p = data.pricing?.withDriver?.withinCity?.daily;
      if (typeof p === "number") return p;
    }

    return undefined;
  };

  /* -----------------------------
     DERIVE MODELS
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
     BLOCKED ACTION
  ------------------------------ */
 const handleBlockedAction = () => {
  setShakeKey((k) => k + 1);
  setFilterError({
    city: !city,
    service: !service,
  });

  document
    .getElementById("filters")
    ?.scrollIntoView({ behavior: "smooth" });
};

  const canBrowseModels = Boolean(city && service);

  /* -----------------------------
     STEP 2 STATE
  ------------------------------ */
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<string | null>(null);

  const [selectedCar, setSelectedCar] =
    useState<Car | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  /* -----------------------------
     OPEN FROM URL
  ------------------------------ */
  useEffect(() => {
    if (!city || !service) return;

    const match = pathname.match(/^\/cars\/(.+)$/);
    if (!match) return;

    const slug = decodeURIComponent(match[1]).replace(/-/g, " ");

    const found = models.find(
      (m) => m.model.toLowerCase() === slug.toLowerCase()
    );

    if (found) {
      setSelectedModel(found.model);
      setModelOpen(true);
    }
  }, [pathname, models, city, service]);

  return (
    <>
      {/* FILTERS */}
      <section
        id="filters"
        className="bg-slate-50 border-b border-slate-200 pt-6 md:pt-0"
      >
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
                  className={`w-full rounded-lg px-4 py-3 border ${
                    filterError.city
                      ? "border-red-500 ring-1 ring-red-500 shake"
                      : "border-slate-400"
                  }`}
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  className={`w-full rounded-lg px-4 py-3 border ${
                    filterError.service
                      ? "border-red-500 ring-1 ring-red-500 shake"
                      : "border-slate-400"
                  }`}
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
            </div>

            {(filterError.city || filterError.service) && (
              <p className="mt-3 text-sm text-red-600">
                Please select city and service to proceed
              </p>
            )}
          </div>
        </div>
      </section>

      {/* MODELS GRID */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          {!loading && models.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {models.map((m) => (
                <button
                  key={m.model}
                  onClick={() =>
                    canBrowseModels
                      ? (() => {
                          const slug = m.model
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                          window.history.pushState({}, "", `/cars/${slug}`);
                          setSelectedModel(m.model);
                          setModelOpen(true);
                        })()
                      : handleBlockedAction()
                  }
                  className="text-left rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition p-4"
                >
                  <div className="aspect-[4/3] bg-slate-100 rounded-lg mb-4 overflow-hidden">
                    {m.imageURL && (
                      <img
                        src={m.imageURL}
                        alt={m.model}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-900">
                    {m.model}
                  </h3>

                  {typeof m.minPrice === "number" && (
                    <p className="text-sm text-slate-700 mt-1">
                      Starting from{" "}
                      <span className="font-semibold">
                        PKR {m.minPrice}
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
            A considered rental experience, supported by human verification.
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

      {/* BOTTOM CTA */}
<section className="bg-slate-950 text-white py-24 overflow-visible">
  <div className="max-w-4xl mx-auto px-6 text-center relative z-20">
    <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
      A more considered way to rent a car
    </h2>
    <p className="text-white/90 mb-8">
      Browse verified vehicles and let us handle the rest.
    </p>
    <button
      onClick={() =>
        document
          .getElementById("filters")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
      }
      className="bg-white text-slate-900 px-8 py-3 rounded-lg font-medium"
    >
      Browse Cars
    </button>
  </div>
</section>

      {/* STEP 2 */}
      <ModelListingsBottomSheet
        open={modelOpen}
        model={selectedModel}
        country={country}
        city={city}
        service={service}
        onClose={() => {
          setModelOpen(false);
          window.history.pushState({}, "", "/");
        }}
        onSelectCar={(car) => {
          setSelectedCar(car);
          setModelOpen(false);
          setDetailsOpen(true);
        }}
      />

      {/* STEP 3 */}
      <CarDetailsModal
        open={detailsOpen}
        car={selectedCar}
        service={service!}
        city={city}
        onClose={() => setDetailsOpen(false)}
      />

      <style jsx>{`
        .shake {
          animation: shake 0.35s ease-in-out;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
