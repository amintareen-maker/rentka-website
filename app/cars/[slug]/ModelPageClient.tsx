"use client";

import { useParams } from "next/navigation";
import { useCars, Car } from "@/lib/useCars";
import CarDetailsModal from "@/components/CarDetailsModal";
import { useState } from "react";

export default function ModelPage() {
  const params = useParams();

  // ✅ use slug instead of model
  const slug = decodeURIComponent(params.slug as string);

  // ✅ convert slug → model name
  const model = slug.replace(/-/g, " ");

  // ⚠️ temp defaults
  const country = "PK";
  const city = "islamabad";
  const service: "selfDrive" | "withDriver" = "selfDrive";

  const { cars, loading } = useCars({ country, city, service });

  const modelCars = cars.filter(
  (c) =>
    c.model &&
    c.model.toLowerCase() === model.toLowerCase()
);

  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-6 capitalize">
          {model}
        </h1>

        {loading && <p>Loading cars…</p>}

        {!loading && modelCars.length === 0 && (
          <p>No cars available for this model.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modelCars.map((car) => (
            <button
              key={car.id}
              onClick={() => setSelectedCar(car)}
              className="text-left border rounded-xl p-4 hover:shadow-md"
            >
              <p className="font-semibold">{car.name}</p>

              {car.vendorId && (
                <p className="text-sm text-slate-600">
                  Vendor: {car.vendorId}
                </p>
              )}

              {car.pricing?.selfDrive?.withinCity?.daily && (
                <p className="text-green-700 font-medium mt-2">
                  PKR {car.pricing.selfDrive.withinCity.daily} / day
                </p>
              )}
            </button>
          ))}
        </div>
      </section>

      <CarDetailsModal
        open={Boolean(selectedCar)}
        car={selectedCar}
        service={service}
        city={city}
        onClose={() => setSelectedCar(null)}
      />
    </>
  );
}