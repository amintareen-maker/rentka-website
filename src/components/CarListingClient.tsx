"use client";

import { useState } from "react";
import CarDetailsModal from "@/components/CarDetailsModal";

export default function CarListingClient({
  cars,
  service,
  city,
}: any) {
  const [selectedCar, setSelectedCar] = useState<any>(null);

  return (
    <>
      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cars.map((car: any) => {
          const price =
            service === "withDriver"
              ? car.pricing?.withDriver?.withinCity?.daily
              : car.pricing?.selfDrive?.withinCity?.daily;

          return (
            <div
              key={car.id}
              className="border rounded-xl p-5 flex gap-4 hover:shadow-md transition"
            >
              {car.imageURL && (
                <img
                  src={car.imageURL}
                  alt={car.name}
                  className="w-28 h-20 object-contain rounded-md bg-slate-100"
                />
              )}

              <div className="flex-1">
                <h2 className="font-semibold text-lg">
                  {car.name || car.model}
                </h2>

                <p className="text-sm text-slate-500">
                  {car.vendor?.name ?? "Verified Rental Partner"}
                </p>

                {price && (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-bold text-[var(--rentka-green)] text-base">
                      PKR {price}
                    </span>
                    <span className="text-slate-500"> / day</span>
                  </p>
                )}
              </div>

              {/* ✅ THIS IS THE MAGIC */}
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedCar(car)}
                  className="text-sm bg-[var(--rentka-green)] text-white px-3 py-1.5 rounded-md hover:bg-[var(--rentka-green-hover)] transition"
                >
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ MODAL */}
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