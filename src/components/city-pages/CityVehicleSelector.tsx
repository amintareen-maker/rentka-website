"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ArrowRight, CarFront, LoaderCircle, Users } from "lucide-react";

import CarDetailsModal from "@/components/CarDetailsModal";
import ModelListingsBottomSheet from "@/components/ModelListingsBottomSheet";
import { db } from "@/lib/firebase";
import type { Car } from "@/lib/useCars";

type ModelOption = {
  model: string;
  imageURL?: string;
  category?: string;
  seatingCapacity?: string;
  minPrice?: number;
  inventoryCity: "rawalpindi" | "islamabad";
  useCase: string;
};

const priorityModels = [
  {
    label: "Suzuki Alto",
    aliases: ["suzukialto", "alto"],
    useCase: "Economical city travel",
  },
  {
    label: "Toyota Corolla",
    aliases: ["toyotacorolla", "corolla"],
    useCase: "Comfortable everyday travel",
  },
  {
    label: "Honda Civic",
    aliases: ["hondacivic", "civic"],
    useCase: "Executive and business travel",
  },
  {
    label: "Honda BR-V",
    aliases: ["hondabrv", "brv"],
    useCase: "Family travel with luggage",
  },
  {
    label: "Toyota Prado",
    aliases: ["toyotaprado", "prado"],
    useCase: "Premium and outstation travel",
  },
  {
    label: "Toyota Hiace",
    aliases: ["toyotahiace", "hiace"],
    useCase: "Groups and larger families",
  },
];

function normalizeModel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function trackModelSelection(option: ModelOption, city: "rawalpindi" | "islamabad") {
  if (typeof window === "undefined") return;

  const eventData = {
    model: option.model,
    city,
    service: "withDriver",
    price: option.minPrice || 0,
  };

  const trackedWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: string, eventName: string, data: Record<string, unknown>) => void;
    fbq?: (command: string, eventName: string, data: Record<string, unknown>) => void;
  };

  trackedWindow.dataLayer = trackedWindow.dataLayer || [];
  trackedWindow.dataLayer.push({
    event: "select_model",
    ...eventData,
  });
  trackedWindow.gtag?.("event", "select_model", eventData);
  trackedWindow.fbq?.("track", "ViewContent", {
    content_name: option.model,
    content_category: "Vehicle",
    content_type: "CarModel",
    ...eventData,
    currency: "PKR",
    page_location: window.location.href,
  });
}

type VehicleSelectorProps = {
  city?: "rawalpindi" | "islamabad";
};

export default function CityVehicleSelector({
  city = "rawalpindi",
}: VehicleSelectorProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedInventoryCity, setSelectedInventoryCity] = useState(city);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  useEffect(() => {
    async function loadCars() {
      try {
        const snapshot = await getDocs(collection(db, "countries", "PK", "cars"));
        const availableCars: Car[] = [];

        snapshot.forEach((carDocument) => {
          const car = carDocument.data() as Omit<Car, "id" | "country">;
          if (car.active === false || car.supports?.withDriver === false) return;

          const cities = (car.cityList || []).map((city) => city.toLowerCase());
          if (!cities.includes("rawalpindi") && !cities.includes("islamabad")) return;

          availableCars.push({
            ...car,
            id: carDocument.id,
            country: "PK",
          });
        });

        setCars(availableCars);
      } catch {
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, []);

  const modelOptions = useMemo(() => {
    const grouped = new Map<string, Car[]>();

    cars.forEach((car) => {
      const model = car.model?.trim() || car.name?.trim();
      if (!model) return;
      const modelKey = normalizeModel(model);
      const matchingPriority = priorityModels.find((priority) =>
        priority.aliases.includes(modelKey),
      );
      if (!matchingPriority) return;

      const existing = grouped.get(matchingPriority.label) || [];
      existing.push(car);
      grouped.set(matchingPriority.label, existing);
    });

    return priorityModels.flatMap((priority) => {
      const matchingCars = grouped.get(priority.label);
      if (!matchingCars?.length) return [];

      const pricedCars = matchingCars
        .map((car) => ({
          car,
          price: car.pricing?.withDriver?.withinCity?.daily,
        }))
        .filter(
          (entry): entry is { car: Car; price: number } =>
            typeof entry.price === "number" && entry.price > 0,
        )
        .sort((a, b) => a.price - b.price);

      const representative = pricedCars[0]?.car || matchingCars[0];
      const exactRawalpindiCity = representative.cityList?.find(
        (city) => city.toLowerCase() === "rawalpindi",
      );
      const exactIslamabadCity = representative.cityList?.find(
        (city) => city.toLowerCase() === "islamabad",
      );

      return [
        {
          model: representative.model?.trim() || priority.label,
          imageURL: representative.imageURL,
          category: representative.category,
          seatingCapacity: representative.seatingCapacity,
          minPrice: pricedCars[0]?.price,
          inventoryCity:
            city === "islamabad"
              ? exactIslamabadCity
                ? "islamabad"
                : "rawalpindi"
              : exactRawalpindiCity
                ? "rawalpindi"
                : "islamabad",
          useCase: priority.useCase,
        } satisfies ModelOption,
      ];
    });
  }, [cars, city]);

  function selectModel(option: ModelOption) {
    trackModelSelection(option, city);
    setSelectedModel(option.model);
    setSelectedInventoryCity(option.inventoryCity);
  }

  return (
    <>
      <section id="cars" className="scroll-mt-24">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--rentka-green)]">
              Live vehicle options
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--rentka-blue)] md:text-4xl">
              Choose a Car With Driver
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Compare starting daily prices from current RentKA listings.
              Availability and the final trip price are confirmed before booking.
            </p>
          </div>
          <Link
            href={`/cars?city=${city}&service=with-driver&country=PK`}
            className="inline-flex w-fit items-center gap-2 rounded-lg font-bold text-[var(--rentka-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rentka-green)]"
          >
            Browse all available cars
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {loading && (
          <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 font-semibold text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin text-[var(--rentka-green)]" aria-hidden="true" />
              Loading current cars and prices...
            </div>
          </div>
        )}

        {!loading && modelOptions.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modelOptions.map((option) => (
              <article
                key={option.model}
                className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus-within:shadow-xl"
              >
                <div className="relative h-52 border-b border-slate-100 bg-white">
                  {option.imageURL ? (
                    <Image
                      src={option.imageURL}
                      alt={`${option.model} chauffeur-driven rental in ${city === "islamabad" ? "Islamabad" : "Rawalpindi"}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400">
                      <CarFront className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--rentka-green)]/10 px-3 py-1 text-xs font-bold text-[var(--rentka-green)]">
                      With Driver
                    </span>
                    {option.seatingCapacity && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {option.seatingCapacity}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-2xl font-extrabold text-[var(--rentka-blue)]">
                    {option.model}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {option.useCase}
                  </p>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Starting from
                    </p>
                    {option.minPrice ? (
                      <p className="mt-1 text-2xl font-extrabold text-[var(--rentka-blue)]">
                        PKR {option.minPrice.toLocaleString()}
                        <span className="ml-1 text-sm font-semibold text-slate-500">/ day</span>
                      </p>
                    ) : (
                      <p className="mt-1 font-bold text-slate-700">
                        View current pricing
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => selectModel(option)}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rentka-green)] px-5 py-3.5 font-bold text-white transition hover:bg-[var(--rentka-green-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rentka-green)] focus-visible:ring-offset-2"
                  >
                    View Prices &amp; Select
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && (loadFailed || modelOptions.length === 0) && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="text-xl font-extrabold text-[var(--rentka-blue)]">
              View current {city === "islamabad" ? "Islamabad" : "Rawalpindi"} availability
            </h3>
            <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
              Live vehicle listings could not be displayed here. Continue to
              the car selection page to see current options and pricing.
            </p>
            <Link
              href={`/cars?city=${city}&service=with-driver&country=PK`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--rentka-green)] px-6 py-3 font-bold text-white hover:bg-[var(--rentka-green-hover)]"
            >
              View Cars &amp; Prices
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <ModelListingsBottomSheet
        open={Boolean(selectedModel) && !selectedCar}
        model={selectedModel}
        country="PK"
        city={selectedInventoryCity}
        service="withDriver"
        onClose={() => setSelectedModel(null)}
        onSelectCar={(car) => {
          setSelectedCar(car);
        }}
      />

      <CarDetailsModal
        open={Boolean(selectedCar)}
        car={selectedCar}
        service="withDriver"
        city={selectedInventoryCity}
        onClose={() => {
          setSelectedCar(null);
        }}
      />
    </>
  );
}
