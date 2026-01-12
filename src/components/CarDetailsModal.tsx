"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Car } from "@/lib/useCars";
import LeadModal from "@/components/LeadModal";

type ServiceType = "selfDrive" | "withDriver";

type Props = {
  open: boolean;
  car: Car | null;
  service: ServiceType;
  city?: string;
  onClose: () => void;
};

export default function CarDetailsModal({
  open,
  car,
  service,
  city,
  onClose,
}: Props) {
  /* -----------------------------
     STATE
  ------------------------------ */
  const [selectedService, setSelectedService] =
    useState<ServiceType>(service);

  const [leadOpen, setLeadOpen] = useState(false);

  /* -----------------------------
     Sync service from parent
  ------------------------------ */
  useEffect(() => {
    setSelectedService(service);
  }, [service]);

  /* -----------------------------
     Support flags
  ------------------------------ */
  const supportsSelfDrive = car?.supports?.withoutDriver !== false;
  const supportsWithDriver = car?.supports?.withDriver !== false;

  /* -----------------------------
     Auto-fallback if unsupported
  ------------------------------ */
  useEffect(() => {
    if (!car) return;

    if (
      selectedService === "selfDrive" &&
      !supportsSelfDrive &&
      supportsWithDriver
    ) {
      setSelectedService("withDriver");
    }

    if (
      selectedService === "withDriver" &&
      !supportsWithDriver &&
      supportsSelfDrive
    ) {
      setSelectedService("selfDrive");
    }
  }, [car, selectedService, supportsSelfDrive, supportsWithDriver]);

  /* -----------------------------
     Render guard
  ------------------------------ */
  if (!open || !car) return null;

  /* -----------------------------
     Model year
  ------------------------------ */
  const modelYearDisplay =
    car.modelYearLabel ??
    (car.modelYear ? car.modelYear.toString() : null);

  /* -----------------------------
     Pricing
  ------------------------------ */
  const pricing =
    selectedService === "selfDrive"
      ? car.pricing?.selfDrive
      : car.pricing?.withDriver;

  const hasPricing =
    pricing?.withinCity || pricing?.outsideCity;

  /* -----------------------------
     Render
  ------------------------------ */
  return (
    <>
      {/* MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Content */}
        <div className="relative bg-white w-full max-w-3xl mx-4 rounded-xl shadow-lg p-6 z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {car.name}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="relative h-56 bg-slate-100 rounded-lg">
              {car.imageURL && (
                <Image
                  src={car.imageURL}
                  alt={car.name}
                  fill
                  className="object-contain"
                />
              )}
            </div>

            {/* Details */}
            <div>
              <p className="text-slate-700 mb-3">
                {car.category} · {car.transmission ?? "Automatic"}
                {modelYearDisplay && ` · Model: ${modelYearDisplay}`}
                {car.seatingCapacity && ` · ${car.seatingCapacity} seats`}
              </p>

              {/* Service Switch */}
              <div className="flex gap-2 mb-4">
                {supportsSelfDrive && (
                  <button
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                      selectedService === "selfDrive"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-300 text-slate-800"
                    }`}
                    onClick={() => setSelectedService("selfDrive")}
                  >
                    Self Drive
                  </button>
                )}

                {supportsWithDriver && (
                  <button
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                      selectedService === "withDriver"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-300 text-slate-800"
                    }`}
                    onClick={() => setSelectedService("withDriver")}
                  >
                    With Driver
                  </button>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-3 text-slate-800">
                {!hasPricing && (
                  <p className="text-slate-700">
                    Pricing available on request.
                  </p>
                )}

                {pricing?.withinCity && (
                  <div className="border-b border-slate-200 pb-2">
                    <p className="font-semibold text-slate-900">
                      Within City
                    </p>
                    {pricing.withinCity.daily && (
                      <p>
                        Daily: PKR{" "}
                        {pricing.withinCity.daily.toLocaleString()}
                      </p>
                    )}
                    {pricing.withinCity.weekly && (
                      <p>
                        Weekly: PKR{" "}
                        {pricing.withinCity.weekly.toLocaleString()}
                      </p>
                    )}
                    {pricing.withinCity.monthly && (
                      <p>
                        Monthly: PKR{" "}
                        {pricing.withinCity.monthly.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {pricing?.outsideCity && (
                  <div>
                    <p className="font-semibold text-slate-900">
                      Outside City
                    </p>
                    {pricing.outsideCity.daily && (
                      <p>
                        Daily: PKR{" "}
                        {pricing.outsideCity.daily.toLocaleString()}
                      </p>
                    )}
                    {pricing.outsideCity.weekly && (
                      <p>
                        Weekly: PKR{" "}
                        {pricing.outsideCity.weekly.toLocaleString()}
                      </p>
                    )}
                    {pricing.outsideCity.monthly && (
                      <p>
                        Monthly: PKR{" "}
                        {pricing.outsideCity.monthly.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                className="w-full mt-5 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                onClick={() => setLeadOpen(true)}
              >
                Request a Call
              </button>

              <p className="text-xs text-slate-600 mt-2">
                Final pricing & availability confirmed by RentKA team.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LEAD MODAL */}
      <LeadModal
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        context={{
          carName: car.name,
          modelYear: car.modelYear,
          modelYearLabel: car.modelYearLabel,
          country: car.country,
          city,
          service: selectedService,
        }}
      />
    </>
  );
}
