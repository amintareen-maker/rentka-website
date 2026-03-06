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

export default function HomePageClient({ initialCars = [] }: { initialCars?: Car[] }) {
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

  /* ✅ ADDED CHAT STATE (nothing else changed) */
  const [chatOpen, setChatOpen] = useState(false);
  // SCROLL EFFECT
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

  // ✅ AUTO-OPEN CHAT AFTER 5 SECONDS (SEPARATE HOOK)
  useEffect(() => {
    const timer = setTimeout(() => {
      setChatOpen(true);
    }, 8000);

    return () => clearTimeout(timer);
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
  const { cars, loading } = useCars({ 
  country, 
  city, 
  service,
  initialCars 
});

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
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--rentka-blue)] mb-2">
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
                  className="text-left rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-[var(--rentka-blue)] transition p-4"
                >
                  <div className="aspect-[8/10] bg-slate-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                    {m.imageURL && (
                      <img
                        src={m.imageURL}
                        alt={m.model}
                        className="max-w-full max-h-full object-contain p-4"
                      />
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-900 group-hover:text-[var(--rentka-blue)] transition">
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
            A considered rental experience, Dedicated support throughout your ride.
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
      <section className="bg-[var(--rentka-blue)] text-white py-16 md:py-24 overflow-visible">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-20">
          <h2 className="text-3xl font-bold tracking-tight !text-white mb-4">
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
            className="bg-[var(--rentka-green)] text-white px-8 py-3 rounded-lg font-medium hover:bg-[var(--rentka-green-hover)] transition"
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
      
      {/* WHATSAPP CHAT WIDGET */}
      <div className="fixed bottom-24 right-6 z-50">

        {chatOpen && (
          <div className="bg-white w-72 rounded-2xl shadow-xl border border-slate-200 p-4 mb-3 animate-fade-in relative">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              👋 Need help?
            </p>
            <p className="text-sm text-slate-600 mb-3">
              We can help you find the right car quickly.
            </p>

            <a
              href="https://wa.me/923048919511?text=Hi%20RentKA,%20I%20need%20help%20finding%20a%20car."
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-[var(--rentka-green)] hover:bg-[var(--rentka-green-hover)] text-white py-2 rounded-lg font-medium transition"
            >
              Chat on WhatsApp
            </a>

            <button
              onClick={() => setChatOpen(false)}
              className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* WhatsApp Icon Trigger */}
        <button
          onClick={() => setChatOpen((prev) => !prev)}
          className="bg-[var(--rentka-green)] hover:bg-[var(--rentka-green-hover)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7"
          >
            <path d="M20.52 3.48A11.88 11.88 0 0012.03 0C5.4 0 .03 5.37.03 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62A11.94 11.94 0 0012.03 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.2-3.51-8.52zM12.03 21.82c-1.82 0-3.6-.49-5.16-1.41l-.37-.22-3.67.96.98-3.58-.24-.37a9.8 9.8 0 01-1.52-5.2c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.9 6.99c0 5.45-4.44 9.82-9.9 9.82zm5.43-7.36c-.3-.15-1.78-.88-2.05-.98-.27-.1-.46-.15-.65.15-.19.3-.75.98-.92 1.18-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.65-1.57-.89-2.15-.23-.56-.47-.49-.65-.5h-.55c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5s1.06 2.9 1.2 3.1c.15.2 2.08 3.18 5.05 4.46.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.78-.73 2.03-1.44.25-.71.25-1.32.17-1.44-.07-.12-.27-.2-.57-.35z" />
          </svg>
        </button>
      </div>

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
          @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
