"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Car } from "@/lib/useCars";
import LeadModal from "@/components/LeadModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { track } from "@vercel/analytics";

const trackEvent = (eventName: string, data: any = {}) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, data);
  }
};

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
  
  const [selectedPackage, setSelectedPackage] = useState<{
    pricingType: "withinCity" | "outsideCity";
    duration: "daily" | "weekly" | "monthly";
    price: number;
  } | null>(null);

  const [packageError, setPackageError] = useState(false);
  
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
  useEffect(() => {
  if (open && car) {
    trackEvent("car_detail_view", {
      car_name: car.name,
      car_id: car.id,
      city: city,
      service: service,
    });
  }
}, [open, car]);

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
  
  const withinCity = pricing?.withinCity;
  const outsideCity = pricing?.outsideCity; 

  const hasPricing =
    pricing?.withinCity || pricing?.outsideCity;

    const handleBack = () => {
  // If lead modal is open → go back to car details
  if (leadOpen) {
    setLeadOpen(false);
    return;
  }

  // If package selected → reset selection
  if (selectedPackage) {
    setSelectedPackage(null);
    return;
  }

  // Otherwise → close modal
  onClose();
};
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">

              {/* BACK BUTTON */}
              <button
                onClick={handleBack}
                className="text-slate-700 hover:text-[var(--rentka-blue)] text-lg"
              >
                ←
              </button>

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
            </div>

            {/* CLOSE BUTTON */}
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
              <div className="relative aspect-[4/3] bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
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
                {modelYearDisplay && ` · : ${modelYearDisplay}`}
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
                    onClick={() => {
  trackEvent("change_service", {
    from: selectedService,
    to: "selfDrive",
    car_name: car.name,
  });

  setSelectedService("selfDrive");
}}
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
                    onClick={() => {
  trackEvent("change_service", {
    from: selectedService,
    to: "withDriver",
    car_name: car.name,
  });

  setSelectedService("withDriver");
}}
                  >
                    With Driver
                  </button>
                )}
              </div>

              {/* Pricing */}
              {/* Pricing */}
            <div
              id="pricing-section"
              className={`rounded-lg p-3 text-sm space-y-3 text-slate-900 transition ${
                packageError
                  ? "bg-red-50 border-2 border-red-500"
                  : "bg-slate-100"
              }`}
            >

              <div className="border-b border-slate-200 pb-2 mb-2">
                <p className="text-sm font-semibold text-slate-900">
                  Choose Your Rental Package
                </p>

                {!selectedPackage && !packageError && (
                  <p className="text-xs text-slate-600 mt-1">
                    Please select an option to proceed
                  </p>
                )}

                {packageError && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚠ Please select a package before continuing
                  </p>
                )}
                </div>

                {withinCity && (
                  <div className="border-b border-slate-200 pb-3 space-y-2">
                    <p className="font-semibold text-slate-900">Within City</p>

    {withinCity?.daily && (
      <button
          onClick={() => {
  trackEvent("select_package", {
    car_name: car.name,
    pricing_type: "withinCity",
    duration: "daily",
    price: withinCity.daily,
  });

  setSelectedPackage({
    pricingType: "withinCity",
    duration: "daily",
    price: withinCity.daily!,
  });

  setPackageError(false);
}}

        className={`flex justify-between items-center w-full px-4 py-3 rounded-lg border transition ${
          selectedPackage?.pricingType === "withinCity" &&
          selectedPackage?.duration === "daily"
            ? "border-[var(--rentka-green)] bg-[var(--rentka-green)] text-white"
            : "border-slate-300 hover:border-[var(--rentka-green)]"
        }`}
      >
        <>
          <span className="font-medium">Daily</span>
          <span className="font-semibold">
            PKR {withinCity.daily.toLocaleString()}
          </span>
        </>
      </button>
    )}

    {withinCity?.weekly && (
      <button
        onClick={() => {
  trackEvent("select_package", {
    car_name: car.name,
    pricing_type: "withinCity",
    duration: "weekly",
    price: withinCity.weekly,
  });

  setSelectedPackage({
    pricingType: "withinCity",
    duration: "weekly",
    price: withinCity.weekly!,
  });

  setPackageError(false);
}}
        
        className={`flex justify-between items-center w-full px-4 py-3 rounded-lg border transition ${
          selectedPackage?.pricingType === "withinCity" &&
          selectedPackage?.duration === "weekly"
            ? "border-[var(--rentka-green)] bg-[var(--rentka-green)] text-white"
  : "border-slate-300 hover:border-[var(--rentka-green)]"
        }`}
      >
        <>
          <span className="font-medium">Weekly</span>
          <span className="font-semibold">
            PKR {withinCity.weekly.toLocaleString()}
          </span>
        </>
        </button>
    )}

    {withinCity?.monthly && (
      <button
        onClick={() => {
  trackEvent("select_package", {
    car_name: car.name,
    pricing_type: "withinCity",
    duration: "monthly",
    price: withinCity.monthly,
  });

  setSelectedPackage({
    pricingType: "withinCity",
    duration: "monthly",
    price: withinCity.monthly!,
  });

  setPackageError(false);
}}
      
        className={`flex justify-between items-center w-full px-4 py-3 rounded-lg border transition ${
          selectedPackage?.pricingType === "withinCity" &&
          selectedPackage?.duration === "monthly"
            ? "border-[var(--rentka-green)] bg-[var(--rentka-green)] text-white"
            : "border-slate-300 hover:border-[var(--rentka-green)]"
        }`}
      >
        <>
          <span className="font-medium">Monthly</span>
          <span className="font-semibold">
            PKR {withinCity.monthly.toLocaleString()}
          </span>
        </>
      </button>
    )}
  </div>
  )}
  {outsideCity && (
  <div className="pt-4 mt-3 border-t border-slate-200 space-y-2">
    <p className="font-semibold text-slate-900">Outside City</p>

    {outsideCity?.daily && (
      <button
        onClick={() => {
  trackEvent("select_package", {
    car_name: car.name,
    pricing_type: "outsideCity",
    duration: "daily",
    price: outsideCity.daily,
  });

  setSelectedPackage({
    pricingType: "outsideCity",
    duration: "daily",
    price: outsideCity.daily!,
  });

  setPackageError(false);
}}
        
        className={`flex justify-between items-center w-full px-4 py-3 rounded-lg border transition ${
          selectedPackage?.pricingType === "outsideCity" &&
          selectedPackage?.duration === "daily"
            ? "border-[var(--rentka-green)] bg-[var(--rentka-green)] text-white"
            : "border-slate-300 hover:border-[var(--rentka-green)]"
        }`}
      >
        <>
          <span className="font-medium">Daily</span>
          <span className="font-semibold">
            PKR {outsideCity.daily.toLocaleString()}
          </span>
        </>
      </button>
    )}

    {outsideCity?.weekly && (
      <button
        onClick={() => {
  trackEvent("select_package", {
    car_name: car.name,
    pricing_type: "outsideCity",
    duration: "weekly",
    price: outsideCity.weekly,
  });

  setSelectedPackage({
    pricingType: "outsideCity",
    duration: "weekly",
    price: outsideCity.weekly!,
  });

  setPackageError(false);
}}
        
        className={`flex justify-between items-center w-full px-4 py-3 rounded-lg border transition ${
          selectedPackage?.pricingType === "outsideCity" &&
          selectedPackage?.duration === "weekly"
            ? "border-[var(--rentka-green)] bg-[var(--rentka-green)] text-white"
            : "border-slate-300 hover:border-[var(--rentka-green)]"
        }`}
      >
        <>
          <span className="font-medium">Weekly</span>
          <span className="font-semibold">
            PKR {outsideCity.weekly.toLocaleString()}
          </span>
        </>
      </button>
    )}

    {outsideCity?.monthly && (
      <button
        onClick={() => {
  trackEvent("select_package", {
    car_name: car.name,
    pricing_type: "outsideCity",
    duration: "monthly",
    price: outsideCity.monthly,
  });

  setSelectedPackage({
    pricingType: "outsideCity",
    duration: "monthly",
    price: outsideCity.monthly!,
  });

  setPackageError(false);
}}
        
        className={`flex justify-between items-center w-full px-4 py-3 rounded-lg border transition ${  
          selectedPackage?.pricingType === "outsideCity" &&
          selectedPackage?.duration === "monthly"
            ? "border-[var(--rentka-green)] bg-[var(--rentka-green)] text-white"
            : "border-slate-300 hover:border-[var(--rentka-green)]"
        }`}
      >
        <>
          <span className="font-medium">Monthly</span>
          <span className="font-semibold">
            PKR {outsideCity.monthly.toLocaleString()}
          </span>
        </>
      </button>
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
              {selectedPackage && (
  <div className="mt-3 text-sm text-slate-700">
    Selected:{" "}
    <span className="font-semibold">
      {selectedPackage.pricingType === "withinCity"
        ? "Within City"
        : "Outside City"}{" "}
      • {selectedPackage.duration} • PKR{" "}
      {selectedPackage.price.toLocaleString()}
    </span>
  </div>
)}
              {/* CTA */}
              <button
                className="w-full mt-5 bg-[var(--rentka-green)] text-white py-2 rounded-lg transition hover:opacity-90"
                onClick={() => {
  if (!selectedPackage) {
    setPackageError(true);

    document
      .getElementById("pricing-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

    return;
  }

  setPackageError(false);

  trackEvent("booking_intent", {
    car_name: car.name,
    car_id: car.id,
    city: city,
    service: selectedService,
    price: selectedPackage.price,
    duration: selectedPackage.duration,
    pricing_type: selectedPackage.pricingType,
  });

  setLeadOpen(true);
}}
              >
                Continue Booking
              </button>
              {selectedService === "withDriver" && (
                <p className="text-xs text-slate-600 mt-2">
                  Driver service includes up to 12 hours per day.
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
            price: selectedPackage?.price ?? null,
            pricingType: selectedPackage?.pricingType ?? null,
            duration: selectedPackage?.duration ?? null,
          }}
      />
    </>
  );
}
