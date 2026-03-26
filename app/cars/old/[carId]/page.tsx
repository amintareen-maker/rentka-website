// C:\Users\eZhire\rentka-website\src\app\cars\[country]\[carId]\page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import LeadModal from "@/components/LeadModal";
import { Car } from "@/lib/useCars";

export default function CarDetailPage() {
  const params = useParams<{ country: string; carId: string }>();
  const { country, carId } = params;

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!country || !carId) return;

    const fetchCar = async () => {
      try {
        const ref = doc(db, "countries", country, "cars", carId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setCar({
            ...(snap.data() as Car),
            id: carId,
            country,
          });
        }
      } catch (e) {
        console.error("Failed to load car", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [country, carId]);

  if (loading) return <p className="p-6">Loading car details…</p>;
  if (!car) return <p className="p-6">Car not found.</p>;

  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative h-64 bg-slate-100 rounded-lg">
          {car.imageURL && (
            <Image src={car.imageURL} alt={car.name} fill className="object-contain" />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold mb-2">{car.name}</h1>
          <p className="text-slate-600 mb-4">
            {car.category} · {car.transmission} · {car.seatingCapacity} seats
          </p>

          <h2 className="font-semibold mb-2">Indicative Pricing</h2>

          {car.pricing?.selfDrive && (
            <pre className="bg-slate-50 p-2 rounded text-sm">
              {JSON.stringify(car.pricing.selfDrive, null, 2)}
            </pre>
          )}

          {car.pricing?.withDriver && (
            <pre className="bg-slate-50 p-2 rounded text-sm mt-3">
              {JSON.stringify(car.pricing.withDriver, null, 2)}
            </pre>
          )}

          <div className="mt-6">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
              onClick={() => setShowModal(true)}
            >
              Request a Call
            </button>
          </div>
        </div>
      </div>

      <LeadModal
        open={showModal}
        onClose={() => setShowModal(false)}
        context={{
          carName: car.name,
          country,
        }}
      />
    </section>
  );
}
