import type { Metadata } from "next";
import { Suspense } from "react";
import CarsPageClient from "./CarsPageClient";

export const metadata: Metadata = {
  title: "Cars Available with Driver in Islamabad | RentKA",
  description:
    "Browse chauffeur-driven rental cars available through RentKA in Islamabad and Rawalpindi, with clear pricing and booking options.",
  alternates: {
    canonical: "https://rentka.co/cars",
  },
  openGraph: {
    title: "Cars Available with Driver in Islamabad | RentKA",
    description:
      "Browse chauffeur-driven rental cars available through RentKA in Islamabad and Rawalpindi, with clear pricing and booking options.",
    url: "https://rentka.co/cars",
  },
};

export default function CarsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading cars...
        </div>
      }
    >
      <CarsPageClient />
    </Suspense>
  );
}
