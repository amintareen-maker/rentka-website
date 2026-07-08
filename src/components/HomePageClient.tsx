"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
const trackEvent = (eventName: string, data: any = {}) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, data);
  }
};
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
  const router = useRouter();

  /* -----------------------------
     FILTER STATE
  ------------------------------ */
  const [country] = useState<string>("PK");
  const [city, setCity] = useState<string>("islamabad");
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
  if (!city) return;

  const timer = setTimeout(() => {
    if (!service) {
      setChatOpen(true);
    }
  }, 6000);

  return () => clearTimeout(timer);
}, [city, service]);

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
  const extractDailyPrice = (
  data: Car,
  service?: "selfDrive" | "withDriver"
): number | undefined => {

  if (!service) return undefined;

  if (service === "selfDrive") {
    return data.pricing?.selfDrive?.withinCity?.daily;
  }

  if (service === "withDriver") {
    return data.pricing?.withDriver?.withinCity?.daily;
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

      const price = extractDailyPrice(car, service);

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


  /* -----------------------------
     OPEN FROM URL
  ------------------------------ */
  // BACK BUTTON HANDLING
useEffect(() => {
  const handleBack = () => {
    const path = window.location.pathname;

    if (path === "/") {
      setSelectedCar(null);
      setModelOpen(false);
      return;
    }

    if (/^\/cars\/[^/]+\/[^/]+\/[^/]+$/.test(path)) {
      setSelectedCar(null);
      setModelOpen(true);
    }
  };

  window.addEventListener("popstate", handleBack);
  return () => window.removeEventListener("popstate", handleBack);
}, []);


// URL → MODAL SYNC (SEPARATE HOOK)
useEffect(() => {
  if (!city || !service) return;

  const match = pathname.match(/^\/cars\/([^/]+)\/([^/]+)\/([^/]+)$/);
  
  if (!match) return;

  const urlCity = match[2];
  const urlService = match[3];

  if (urlCity !== city) return;

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
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--rentka-green)] mb-2">
  Choose Your City & Service
</h2>

<p className="text-[var(--rentka-blue)]">
  All bookings include a driver. Select your location to see available cars.
</p>
          </div>

          <div className="rounded-2xl bg-white p-5 md:p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
              <div>
                <label className="block text-sm font-semibold text-[var(--rentka-blue) mb-2">
                  Country
                </label>
                <select className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--rentka-green)] focus:border-[var(--rentka-green)]">
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
              <label className="block text-sm font-semibold text-[var(--rentka-blue) mb-2">
                City/Area
              </label>
                <select
                  key={`city-${shakeKey}`}
                  value={city ?? ""}
                  onChange={(e) => {
                    const selectedCity = e.target.value;

                    trackEvent("select_city", {
                      city: selectedCity,
                    });

                    setCity(selectedCity);
                    setService(undefined);
                    setFilterError((p) => ({ ...p, city: false }));
                  }}
                  className={`w-full rounded-lg px-4 py-3 border ${
                  filterError.city
                    ? "border-red-500 ring-1 ring-red-500 shake"
                    : "border-slate-300 focus:border-[var(--rentka-green)]"
                } focus:outline-none focus:ring-2 focus:ring-[var(--rentka-green)]`}
                >
                  <option value="islamabad">
  Islamabad / Rawalpindi
</option>
                  
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--rentka-blue) mb-2">
                  Service
                </label>
                <select
                  key={`service-${shakeKey}`}
                  value={service ?? ""}
                  onChange={(e) => {
                  const selectedService =
                    (e.target.value as "selfDrive" | "withDriver") || undefined;

                  trackEvent("select_service", {
                    service: selectedService,
                    city: city,
                  });

                  setService(selectedService);
                  setFilterError((p) => ({ ...p, service: false }));
                }}
                                  className={`w-full rounded-lg px-4 py-3 border ${
                                  filterError.service
                                    ? "border-red-500 ring-1 ring-red-500 shake"
                                    : "border-slate-300 focus:border-[var(--rentka-green)]"
                                } focus:outline-none focus:ring-2 focus:ring-[var(--rentka-green)]`}
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
                          <div className="text-center mt-6 mb-2">
                </div>
                        </div>
                      </section>

                      {/* MODELS GRID */}
                      <section className="bg-white py-16">
                        <div className="mx-auto max-w-7xl px-6">
                          {!loading && models.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                              {models.map((m) => {
                  const slug = m.model.toLowerCase().replace(/\s+/g, "-");

                  const serviceSlug =
                    service === "withDriver" ? "with-driver" : "self-drive";

                  const url = `/cars/${slug}/${city}/${serviceSlug}`;

                  return (
                    <Link
                      key={m.model}
                      href={url}
                      prefetch={true}
                      onClick={(e) => {
                        if (!canBrowseModels) {
                          e.preventDefault();
                          handleBlockedAction();
                          return;
                        }

                        e.preventDefault();

                        // Google Analytics
                        trackEvent("select_model", {
                          model: m.model,
                          city,
                          service,
                          price: m.minPrice || 0,
                        });

                        // Meta Pixel
                        if (typeof window !== "undefined" && (window as any).fbq) {
                          (window as any).fbq("track", "ViewContent", {
                            content_name: m.model,
                            content_category: "Vehicle",
                            content_type: "CarModel",
                            city,
                            service,
                            value: m.minPrice || 0,
                            currency: "PKR",
                            page_location: window.location.href,
                          });
                        }

                        window.history.pushState({}, "", url);

                        setSelectedModel(m.model);
                        setModelOpen(true);
                      }}
                      className="block text-left rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-[var(--rentka-blue)] transition p-4"
                    >
                      <div className="aspect-[8/10] bg-white rounded-lg mb-4 overflow-hidden flex items-center justify-center border border-slate-200">
                        {m.imageURL && (
                          <img
                            src={m.imageURL}
                            alt={m.model}
                            className="max-w-full max-h-full object-contain p-2"
                          />
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 group-hover:text-[var(--rentka-blue)] transition">
                        {m.model}
                      </h3>

                      {typeof m.minPrice === "number" && (
                        <p className="text-sm text-slate-600 mt-1">
                          Starting from{" "}
                          <span className="font-bold text-[var(--rentka-green)]">
                            PKR {m.minPrice}
                          </span>
                          <span className="text-slate-500"> /day (Driver Included)</span>
                        </p>
                      )}

                      <p className="text-sm text-slate-500 mt-1">
                        {m.count} option(s)
                      </p>
                    </Link>
                  );
                })}
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
             Simple, fast, and reliable car rental with driver in Islamabad.
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
          setSelectedCar(car);   // 👈 THIS WAS MISSING
          setModelOpen(false);
        }}
        />
      {/* STEP 3 */}
      <CarDetailsModal
        open={Boolean(selectedCar)}
        car={selectedCar}
        service={service as "selfDrive" | "withDriver"}
        city={city}
        onClose={() => {
          setSelectedCar(null);   // close details
          setModelOpen(true);     // 👈 GO BACK TO LIST
        }}
      />
      
      {/* ✅ LOADING OVERLAY */}
      {loading && city && service && (
      <div className="fixed inset-0 z-[60] bg-white/70 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          
          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-slate-300 border-t-[var(--rentka-green)] rounded-full animate-spin" />

          {/* Text */}
          <p className="text-sm text-slate-700 font-medium">
            Loading available cars...
          </p>
        </div>
      </div>
    )}
      
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
