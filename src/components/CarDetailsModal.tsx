"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Car } from "@/lib/useCars";
import LeadModal from "@/components/LeadModal";
import { track } from "@vercel/analytics";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ServiceType = "selfDrive" | "withDriver";

type Vendor = {
  name?: string;
  logoUrl?: string;
};

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
  const [showCharges, setShowCharges] = useState(false);
  
  const [selectedService, setSelectedService] =
    useState<ServiceType>(service);

  const [leadOpen, setLeadOpen] = useState(false);

  // ✅ Vendor state
  const [vendor, setVendor] = useState<Vendor | null>(null);

  /* -----------------------------
     Sync service from parent
  ------------------------------ */
  useEffect(() => {
    setSelectedService(service);
  }, [service]);

  /* -----------------------------
     Load vendor (FIX APPLIED HERE ONLY)
  ------------------------------ */
  useEffect(() => {
    if (!open || !car?.vendorId) {
      setVendor(null);
      return;
    }

    const vendorId = car.vendorId; // ✅ FIX: narrow type once

    const loadVendor = async () => {
      try {
        const ref = doc(
          db,
          "countries",
          car.country,
          "vendors",
          vendorId
        );
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setVendor(snap.data() as Vendor);
        }
      } catch {
        setVendor(null);
      }
    };

    loadVendor();
  }, [open, car]);

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
      <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto py-6">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
          onClick={onClose}
        />

        {/* Content */}
        <div className="relative bg-white w-full max-w-3xl mx-4 rounded-xl shadow-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {car.name}
              </h2>

              {/* Vendor */}
              <div className="flex items-center gap-2 mt-1">
                {vendor?.logoUrl ? (
                  <img
                    src={vendor.logoUrl}
                    alt={vendor.name}
                    className="h-6 w-10 object-contain border rounded bg-white"
                  />
                ) : (
                  <div className="h-6 w-10 bg-slate-100 rounded" />
                )}
                <span className="text-sm font-medium text-slate-800">
                  {vendor?.name ?? "Verified Partner"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-700 hover:text-[var(--rentka-blue)]"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Image */}
              <div className="relative aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                {car.imageURL && (
                  <Image
                    src={car.imageURL}
                    alt={car.name}
                    fill
                    className="object-contain p-2"
                  />
                )}
              </div>
              
              {/* Additional Charges - Desktop Only , for mobile its separate incase you want to change*/}
              {selectedService === "withDriver" && (
                <div className="hidden md:block bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 space-y-1">
                  <p className="text-sm font-medium text-[var(--rentka-green)]">  
                    Additional Charges Policy
                  </p>

                  <p>• Airport pickup & drop-off charges apply separately.</p>
                  <p>• Decoration for weddings or events is permitted; however, a post-event cleaning and service fee will apply.</p>
                  <p>• Fuel is billed separately unless stated otherwise.</p>
                  <p>• Extra hours beyond the included duration are chargeable.</p>
                  <p>• Toll tax & parking (if applicable) are payable by customer.</p>
                </div>
                )}
            </div>

            {/* Details */}
            <div>
              <p className="text-slate-800 mb-3">
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
                        ? "bg-[var(--rentka-blue)] text-white border-[var(--rentka-green)]"
                        : "border-slate-300 text-slate-800 hover:border-[var(--rentka-green)]"
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
                        ? "bg-[var(--rentka-blue)] text-white border-[var(--rentka-green)]"
                        : "border-slate-300 text-slate-800 hover:border-[var(--rentka-green)]"
                    }`}
                    onClick={() => setSelectedService("withDriver")}
                  >
                    With Driver
                  </button>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-slate-100 rounded-lg p-3 text-sm space-y-3 text-slate-900">
                {!hasPricing && (
                  <p className="text-slate-800">
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

              {/* Mobile Charges Accordion */}
              {selectedService === "withDriver" && (
                <div className="md:hidden mt-4">
                  <button
                    onClick={() => setShowCharges(!showCharges)}
                    className="w-full text-left border border-amber-300 rounded-lg p-3 text-sm font-medium text-amber-700 flex justify-between items-center hover:bg-amber-50 transition"
                  >
                    <span>View Additional Charges</span>
                    <span className="text-xs">{showCharges ? "▲" : "▼"}</span>
                  </button>

                  {showCharges && (
                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 space-y-1">
                      <p>• Airport pickup & drop-off charges apply separately.</p>
                      <p>• Decoration for weddings or events is permitted; however, a post-event cleaning and service fee will apply.</p>
                      <p>• Fuel is billed separately unless stated otherwise.</p>
                      <p>• Extra hours beyond the included duration are chargeable.</p>
                      <p>• Toll tax & parking (if applicable) are payable by customer.</p>
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                className="w-full mt-5 bg-[var(--rentka-green)] text-white py-2 rounded-lg hover:opacity-90 transition"
                onClick={() => {
                  track("request_call_clicked", {
                    car_id: car.id,
                    service: selectedService,
                    country: car.country,
                    city,
                  });

                  setLeadOpen(true);
                }}
              >
                Request a Call
              </button>

              {selectedService === "withDriver" && (
                <p className="text-xs text-slate-600 mt-2">
                  Driver service includes up to 10 hours per day.
                  Availability will be confirmed by the RentKA team after request submission.
                </p>
              )}
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
          vendorName: vendor?.name ?? null,
          vendorId: car.vendorId ?? null,
        }}
      />
    </>
  );
}
