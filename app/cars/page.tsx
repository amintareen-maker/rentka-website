"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import CarCard from "@/components/CarCard";
import LeadModal from "@/components/LeadModal";
import CarDetailsModal from "@/components/CarDetailsModal";

import { Car } from "@/lib/useCars";

const COUNTRIES = ["PK", "BH"];

type ServiceType = "selfDrive" | "withDriver" | undefined;

export default function CarsPage() {
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  const [country, setCountry] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [service, setService] = useState<string>("all"); // filter only

  // 🔹 FINAL service chosen by user (modal authority)
  const [finalService, setFinalService] = useState<ServiceType>(undefined);

  // 🔹 Lead modal
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  // 🔹 Details modal
  const [detailsCar, setDetailsCar] = useState<Car | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 🔴 Validation flags
  const countryMissing = country === "all";
  const cityMissing = !countryMissing && city === "all";

  /* -----------------------------
     Load all cars
  ------------------------------ */
  useEffect(() => {
    const fetchAllCars = async () => {
      try {
        let cars: Car[] = [];

        for (const c of COUNTRIES) {
          const ref = collection(db, "countries", c, "cars");
          const snap = await getDocs(ref);

          snap.forEach((doc) => {
            cars.push({
              ...(doc.data() as Car),
              id: doc.id,
              country: c,
            });
          });
        }

        setAllCars(cars);
      } catch (error) {
        console.error("Failed to load cars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCars();
  }, []);

  /* -----------------------------
     Cities by country
  ------------------------------ */
  const cities = useMemo(() => {
    if (country === "all") return [];

    const citySet = new Set<string>();
    allCars
      .filter((c) => c.country === country)
      .forEach((c) => c.cityList?.forEach((ct) => citySet.add(ct)));

    return Array.from(citySet);
  }, [country, allCars]);

  /* -----------------------------
     Filtered cars
  ------------------------------ */
  const filteredCars = useMemo(() => {
    if (countryMissing || cityMissing) return [];

    return allCars.filter((car) => {
      if (car.country !== country) return false;
      if (!car.cityList?.includes(city)) return false;

      if (service === "selfDrive" && !car.supports?.withoutDriver) return false;
      if (service === "withDriver" && !car.supports?.withDriver) return false;

      return true;
    });
  }, [allCars, country, city, service, countryMissing, cityMissing]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Browse Cars</h1>

      {/* ---------------- Filters ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Country */}
        <div>
          <select
            className={`w-full rounded-lg px-3 py-2 border ${
              countryMissing ? "border-red-500" : "border-slate-300"
            }`}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("all");
            }}
          >
            <option value="all">Select Country *</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {countryMissing && (
            <p className="text-sm text-red-600 mt-1">
              Please select a country to continue
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <select
            className={`w-full rounded-lg px-3 py-2 border ${
              cityMissing ? "border-red-500" : "border-slate-300"
            }`}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={country === "all"}
          >
            <option value="all">
              {country === "all" ? "Select country first" : "Select City *"}
            </option>
            {cities.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>

          {cityMissing && (
            <p className="text-sm text-red-600 mt-1">
              Please select a city to see available cars
            </p>
          )}
        </div>

        {/* Service (filter only) */}
        <select
          className="border border-slate-300 rounded-lg px-3 py-2"
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          <option value="all">All Services</option>
          <option value="selfDrive">Self Drive</option>
          <option value="withDriver">With Driver</option>
        </select>
      </div>

      {/* Guidance */}
      {(countryMissing || cityMissing) && (
        <div className="mb-6 text-slate-600">
          <strong>Select location to view cars.</strong> Country and city are
          required to show accurate availability and pricing.
        </div>
      )}

      {loading && <p className="text-slate-500">Loading cars...</p>}

      {!loading && !countryMissing && !cityMissing && filteredCars.length === 0 && (
        <p className="text-slate-500">No cars match your selection.</p>
      )}

      {/* ---------------- Cars Grid ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.map((car) => (
          <CarCard
            key={`${car.country}_${car.id}`}
            car={car}
            onViewDetails={(selected) => {
              setDetailsCar(selected);
              setShowDetailsModal(true);
            }}
          />
        ))}
      </div>

      {/* ---------------- Car Details Modal ---------------- */}
      <CarDetailsModal
        open={showDetailsModal}
        car={detailsCar}
        service={
          service === "selfDrive" || service === "withDriver"
            ? service
            : "selfDrive"
        }
        onClose={() => setShowDetailsModal(false)}
      />

      {/* ---------------- Lead Modal ---------------- */}
      <LeadModal
        open={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        context={{
          carName: selectedCar?.name,
          country,
          city,
          service: finalService,
          modelYear: selectedCar?.modelYear,
          modelYearLabel: selectedCar?.modelYearLabel,
        }}
      />
    </section>
  );
}
