"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import LeadModal from "@/components/LeadModal";
import CarDetailsModal from "@/components/CarDetailsModal";

import { Car } from "@/lib/useCars";

const COUNTRIES = ["PK"];

type ServiceType = "withDriver" | undefined;

type VendorMap = Record<
  string,
  {
    name?: string;
    logoUrl?: string;
  }
>;

export default function CarsPage() {
  const searchParams = useSearchParams();

  /* -----------------------------
     URL PARAMS
  ------------------------------ */
  const defaultCountry =
    searchParams.get("country") || "PK";

  const defaultCity =
    searchParams.get("city")?.toLowerCase() ||
    "islamabad";

  const urlService =
    searchParams.get("service") ===
    "with-driver"
      ? "withDriver"
      : "withDriver";

  const [allCars, setAllCars] = useState<Car[]>(
    []
  );

  const [vendors, setVendors] =
    useState<VendorMap>({});

  const [loading, setLoading] =
    useState(true);

  /* -----------------------------
     PRESELECTED FILTERS
  ------------------------------ */
  const [country, setCountry] =
    useState<string>(defaultCountry);

  const [city, setCity] =
    useState<string>(defaultCity);

  const [service, setService] =
    useState<string>(urlService);

  /* -----------------------------
     FINAL SERVICE
  ------------------------------ */
  const [finalService, setFinalService] =
    useState<ServiceType>(undefined);

  /* -----------------------------
     MODALS
  ------------------------------ */
  const [selectedCar, setSelectedCar] =
    useState<Car | null>(null);

  const [showLeadModal, setShowLeadModal] =
    useState(false);

  const [detailsCar, setDetailsCar] =
    useState<Car | null>(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  /* -----------------------------
     VALIDATION
  ------------------------------ */
  const countryMissing = country === "all";

  const cityMissing =
    !countryMissing && city === "all";

  /* -----------------------------
     LOAD ALL CARS
  ------------------------------ */
  useEffect(() => {
    const fetchAllCars = async () => {
      try {
        let cars: Car[] = [];

        for (const c of COUNTRIES) {
          const ref = collection(
            db,
            "countries",
            c,
            "cars"
          );

          const snap = await getDocs(ref);

          snap.forEach((docSnap) => {
            cars.push({
              ...(docSnap.data() as Car),
              id: docSnap.id,
              country: c,
            });
          });
        }

        setAllCars(cars);
      } catch (error) {
        console.error(
          "Failed to load cars:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllCars();
  }, []);

  /* -----------------------------
     LOAD VENDORS
  ------------------------------ */
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorMap: VendorMap = {};

        for (const c of COUNTRIES) {
          const vendorsRef = collection(
            db,
            "countries",
            c,
            "vendors"
          );

          const vendorsSnap =
            await getDocs(vendorsRef);

          vendorsSnap.forEach((vendorDoc) => {
            const data = vendorDoc.data();

            vendorMap[vendorDoc.id] = {
              name: data.name || "Vendor",
              logoUrl:
                data.logoUrl || "",
            };
          });
        }

        setVendors(vendorMap);
      } catch (error) {
        console.error(
          "Failed to load vendors:",
          error
        );
      }
    };

    fetchVendors();
  }, []);

  /* -----------------------------
     CITIES BY COUNTRY
  ------------------------------ */
  const cities = useMemo(() => {
    if (country === "all") return [];

    const citySet = new Set<string>();

    allCars
      .filter((c) => c.country === country)
      .forEach((c) =>
        c.cityList?.forEach((ct) =>
          citySet.add(ct.toLowerCase())
        )
      );

    return Array.from(citySet).sort();
  }, [country, allCars]);

  /* -----------------------------
     AUTO SELECT CITY
  ------------------------------ */
  useEffect(() => {
    const cityParam =
      searchParams.get("city")?.toLowerCase();

    if (
      cityParam &&
      cities.includes(cityParam)
    ) {
      setCity(cityParam);
    }
  }, [cities, searchParams]);

  /* -----------------------------
     FILTERED CARS
  ------------------------------ */
  const filteredCars = useMemo(() => {
    if (countryMissing || cityMissing)
      return [];

    return allCars.filter((car) => {
      if (car.country !== country)
        return false;

      const normalizedCities =
        car.cityList?.map((c) =>
          c.toLowerCase()
        ) || [];

      if (
        !normalizedCities.includes(
          city.toLowerCase()
        )
      )
        return false;

      if (!car.supports?.withDriver)
        return false;

      return true;
    });
  }, [
    allCars,
    country,
    city,
    countryMissing,
    cityMissing,
  ]);

  /* -----------------------------
     GROUP BY MODEL
  ------------------------------ */
  const groupedCars = useMemo(() => {
    const grouped: Record<string, Car[]> = {};

    filteredCars.forEach((car) => {
      const model =
        car.model?.trim() ||
        car.name?.trim() ||
        "Other Cars";

      if (!grouped[model]) {
        grouped[model] = [];
      }

      grouped[model].push(car);
    });

    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as Record<string, Car[]>);
  }, [filteredCars]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">

      {/* HEADER */}
      <div className="mb-10">

        <h1 className="text-3xl md:text-4xl font-bold text-[var(--rentka-blue)]">
          Browse Rental Cars
        </h1>

        <p className="text-slate-600 mt-3 max-w-2xl leading-relaxed">
          Browse verified rental cars in
          Islamabad & Rawalpindi with
          professional drivers and transparent
          pricing — without unexpected
          last-minute price changes.
        </p>

      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">

        {/* COUNTRY */}
        <div>
          <select
            className="w-full rounded-xl px-4 py-3 border border-slate-300 bg-white"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("all");
            }}
          >
            {COUNTRIES.map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}
          </select>
        </div>

                {/* CITY */}
        <div>
          <select
            className="w-full rounded-xl px-4 py-3 border border-slate-300 bg-white"
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
          >
            <option value="all">
              Select City
            </option>

            {cities.map((ct) => {

              const cityLabel =
                ct.toLowerCase() === "islamabad"
                  ? "Islamabad / Rawalpindi"
                  : ct.charAt(0).toUpperCase() +
                    ct.slice(1);

              return (
                <option
                  key={ct}
                  value={ct}
                >
                  {cityLabel}
                </option>
              );
            })}
          </select>
        </div>

        {/* SERVICE */}
        <div>
          <select
            className="w-full rounded-xl px-4 py-3 border border-slate-300 bg-white"
            value={service}
            onChange={(e) =>
              setService(e.target.value)
            }
          >
            <option value="withDriver">
              With Driver
            </option>
          </select>
        </div>

      </div>

      {/* LOADING */}
      {loading && (
        <div className="py-10 text-slate-500">
          Loading cars...
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        filteredCars.length === 0 && (
          <div className="py-10 text-slate-500">
            No cars available for this
            selection.
          </div>
        )}

      {/* GROUPED CARS */}
      {!loading &&
        Object.entries(groupedCars).map(
          ([model, cars]) => {

            const lowestPrice = Math.min(
              ...cars.map(
                (car) =>
                  car.pricing?.withDriver
                    ?.withinCity?.daily || 0
              )
            );

            return (
              <div
                key={model}
                className="mb-16"
              >

                {/* MODEL HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">

                  <div>

                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--rentka-blue)]">
                      {model}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 mt-2">

                      <p className="text-slate-500">
                        {cars.length} vehicle
                        {cars.length > 1
                          ? "s"
                          : ""}{" "}
                        available
                      </p>

                      {lowestPrice > 0 && (
                        <div className="rounded-full bg-[var(--rentka-green)]/10 px-3 py-1 text-sm font-semibold text-[var(--rentka-green)]">
                          Starting from PKR{" "}
                          {lowestPrice.toLocaleString()}
                          /day
                        </div>
                      )}

                    </div>

                  </div>

                </div>

                {/* CAR GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                  {cars.map((car) => {

                    const price =
                      car.pricing?.withDriver
                        ?.withinCity?.daily;

                    const vendor =
                      vendors[
                        car.vendorId || ""
                      ];

                    const vendorName =
                      vendor?.name ||
                      "Verified Partner";

                    const vendorLogo =
                      vendor?.logoUrl;

                    return (
                      <div
                        key={`${car.country}_${car.id}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                      >

                        {/* IMAGE */}
                        {/* IMAGE */}
<div className="relative h-[240px] rounded-2xl overflow-hidden bg-slate-100 mb-5 border border-slate-100">

  {car.imageURL ? (
    <Image
      src={car.imageURL}
      alt={car.name || ""}
      fill
      className="object-contain p-4 hover:scale-105 transition duration-300"
      sizes="(max-width: 768px) 100vw, 33vw"
      priority={false}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
      No Image Available
    </div>
  )}

  {/* subtle gradient */}
  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

</div>
                        {/* INFO */}
                        <div className="space-y-3">

                          <div>

                            <h3 className="text-lg font-bold text-slate-900">
                              {car.name}
                            </h3>

                            <p className="text-sm text-slate-500">
                              {car.category ||
                                "Rental Car"}
                            </p>

                          </div>

                          {/* MODEL */}
                          {car.modelYearLabel && (
                            <div className="inline-flex rounded-full bg-[var(--rentka-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--rentka-green)]">
                              Model:{" "}
                              {car.modelYearLabel}
                            </div>
                          )}

                          {/* PRICE */}
                          {price && (
                            <div>

                              <p className="text-sm text-slate-500">
                                Starting From
                              </p>

                              <p className="text-2xl font-bold text-[var(--rentka-blue)]">
                                PKR{" "}
                                {price.toLocaleString()}
                              </p>

                              <p className="text-xs text-slate-500">
                                Per day with
                                driver
                              </p>

                            </div>
                          )}

                          {/* VENDOR */}
                          <div className="flex items-center gap-3 pt-2">

                            {vendorLogo ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200">

                                <Image
                                  src={vendorLogo}
                                  alt={vendorName}
                                  fill
                                  className="object-cover"
                                />

                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--rentka-blue)] text-white flex items-center justify-center text-sm font-bold">
                                {vendorName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div>

                              <p className="text-xs text-slate-500">
                                Rental Partner
                              </p>

                              <p className="text-sm font-semibold text-slate-800">
                                {vendorName}
                              </p>

                            </div>

                          </div>

                          {/* BUTTON */}
                          <button
                            onClick={() => {
                              setDetailsCar(car);
                              setShowDetailsModal(
                                true
                              );
                            }}
                            className="w-full mt-4 rounded-xl bg-[var(--rentka-blue)] px-4 py-3 text-white font-semibold hover:opacity-90 transition"
                          >
                            View Details
                          </button>

                        </div>

                      </div>
                    );
                  })}

                </div>

              </div>
            );
          }
        )}

      {/* DETAILS MODAL */}
      <CarDetailsModal
        open={showDetailsModal}
        car={detailsCar}
        service="withDriver"
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsCar(null);
        }}
      />

      {/* LEAD MODAL */}
      <LeadModal
        open={showLeadModal}
        onClose={() =>
          setShowLeadModal(false)
        }
        context={{
          carName: selectedCar?.name,
          country,
          city,
          service: finalService,
          modelYear:
            selectedCar?.modelYear,
          modelYearLabel:
            selectedCar?.modelYearLabel,
        }}
      />

    </section>
  );
}