"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Car } from "@/lib/useCars";
import Image from "next/image";

type ServiceType = "selfDrive" | "withDriver";

type Vendor = {
  name?: string;
  logoUrl?: string;
};

type Props = {
  open: boolean;
  model: string | null;
  country: string;
  city?: string;
  service?: ServiceType;
  onClose: () => void;
  onSelectCar: (car: Car) => void;
};

export default function ModelListingsBottomSheet({
  open,
  model,
  country,
  city,
  service,
  onClose,
  onSelectCar,
}: Props) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔑 Vendor cache
  const [vendorCache, setVendorCache] = useState<
    Record<string, Vendor>
  >({});

  /* -----------------------------
     FETCH CARS (MODEL LEVEL)
     ⚠️ Dependency list is STABLE
  ------------------------------ */
  useEffect(() => {
    if (!open || !model || !city || !service) return;

    const fetchCars = async () => {
      setLoading(true);

      try {
        const ref = collection(db, "countries", country, "cars");
        const snap = await getDocs(ref);

        const results: Car[] = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Car, "id" | "country">;

          if (data.model !== model) return;
          if (data.cityList && !data.cityList.includes(city)) return;

          if (
            service === "selfDrive" &&
            data.supports?.withoutDriver === false
          )
            return;

          if (
            service === "withDriver" &&
            data.supports?.withDriver === false
          )
            return;

          results.push({
            ...data,
            id: docSnap.id,
            country,
          });
        });

        setCars(results);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [open, model, country, city, service]);

  /* -----------------------------
     FETCH VENDOR (CACHED)
  ------------------------------ */
  const loadVendor = async (vendorId?: string) => {
    if (!vendorId || vendorCache[vendorId]) return;

    const ref = doc(
      db,
      "countries",
      country,
      "vendors",
      vendorId
    );

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    setVendorCache((prev) => ({
      ...prev,
      [vendorId]: snap.data() as Vendor,
    }));
  };

  useEffect(() => {
    cars.forEach((c) => loadVendor(c.vendorId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars]);

  if (!open || !model) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="relative w-full max-w-4xl bg-white rounded-t-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-[var(--rentka-blue)]">
            {model}
          </h2>
          <button
            onClick={onClose}
            className="ml-auto text-slate-700 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="text-center text-slate-600">
            Loading options…
          </p>
        )}

        {!loading && cars.length === 0 && (
          <p className="text-center text-slate-600">
            No options available.
          </p>
        )}

        <div className="space-y-4">
          {cars.map((car) => {
            const price =
              service === "withDriver"
                ? car.pricing?.withDriver?.withinCity?.daily
                : car.pricing?.selfDrive?.withinCity?.daily;

            const vendor = car.vendorId
              ? vendorCache[car.vendorId]
              : undefined;

            return (
              <button
                key={car.id}
                onClick={() => onSelectCar(car)}
                className="w-full text-left border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-[var(--rentka-green)] transition bg-white"
              >
                <div className="flex gap-4">
                  {/* Car Image */}
                  <div className="relative w-28 h-20 bg-slate-100 rounded-lg overflow-hidden">
                    {car.imageURL && (
                      <Image
                        src={car.imageURL}
                        alt={car.name}
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {car.name}
                    </h3>

                    {car.modelYearLabel && (
                      <p className="text-sm text-slate-700">
                        {car.modelYearLabel}
                      </p>
                    )}

                    {/* ✅ Vendor */}
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

                    {price && (
                      <p className="mt-1 text-[var(--rentka-blue)] font-semibold">
                        PKR {price.toLocaleString()} / day
                      </p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <span className="text-sm font-medium text-[var(--rentka-green)]">
                        Details →
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
