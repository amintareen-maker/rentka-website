"use client";

import Image from "next/image";
import { Car } from "@/lib/useCars";

type Props = {
  car: Car;
  onViewDetails: (car: Car) => void;
  disabled?: boolean;
};

export default function CarCard({ car, onViewDetails, disabled }: Props) {
  /* -----------------------------
     Model year display
  ------------------------------ */
  const modelYearDisplay =
    car.modelYearLabel ?? car.modelYear;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col">
      <div className="relative h-40 mb-3 bg-slate-100 rounded-lg">
        {car.imageURL && (
          <Image
            src={car.imageURL}
            alt={car.name}
            fill
            className="object-contain"
          />
        )}
      </div>

      {/* Car Name */}
      <h3 className="font-semibold text-slate-900">
        {car.name}
      </h3>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm text-slate-600">
          {car.category}
        </span>

        {modelYearDisplay && (
          <span
            title="Model Year"
            className="cursor-help text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700"
          >
            {modelYearDisplay}
          </span>
        )}
      </div>

      {/* CTA */}
      <button
        disabled={disabled}
        onClick={() => onViewDetails(car)}
        className={`mt-auto w-full rounded-lg py-2 text-sm font-medium transition
          ${
            disabled
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
      >
        View Details
      </button>

      {disabled && (
        <p className="mt-2 text-xs text-red-600 text-center font-medium">
          Select city & service to continue
        </p>
      )}
    </div>
  );
}
