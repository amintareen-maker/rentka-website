"use client";

import { useState, useEffect } from "react";
import { useCars, Car } from "@/lib/useCars";
import CarCard from "@/components/CarCard";
import CarDetailsModal from "@/components/CarDetailsModal";
import { useCountries, useCities } from "@/lib/useLocations";

export default function HomePageClient() {
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
      

      {/* =============================
          FILTERS
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
                <select
                  className="w-full rounded-lg border border-slate-400 px-4 py-3 text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
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
          CARS
      ============================== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          {!loading &&
            categories.map((category) => (
              <div key={category} className="mb-16">
                <h2 className="text-xl font-semibold mb-6">{category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {carsByCategory[category].map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      disabled={!canViewDetails}
                      onViewDetails={() =>
                        canViewDetails
                          ? handleViewDetails(car)
                          : handleBlockedAction()
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* MODAL */}
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
