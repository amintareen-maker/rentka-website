import type { Metadata } from "next";
import { Suspense } from "react";
import CarsPageClient from "./CarsPageClient";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: { absolute: "Cars Available with Driver in Islamabad | RentKA" },
  description:
    "Browse cars with professional drivers available through RentKA in Islamabad and Rawalpindi, with clear pricing and booking options.",
  alternates: {
    canonical: "https://www.rentka.co/cars",
  },
  openGraph: {
    title: "Cars Available with Driver in Islamabad | RentKA",
    description:
      "Browse cars with professional drivers available through RentKA in Islamabad and Rawalpindi, with clear pricing and booking options.",
    url: "https://www.rentka.co/cars",
    images: [{ url: "/hero-car.png", alt: "Cars available with professional drivers" }],
  },
};

export default function CarsPage() {
  const breadcrumbItems = [{ name: "Home", href: "/" }, { name: "Cars", href: "/cars" }];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbItems)) }}
      />
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <h1 className="sr-only">Cars with Professional Drivers in Islamabad and Rawalpindi</h1>
      <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading cars...
        </div>
      }
      >
        <CarsPageClient />
      </Suspense>
    </>
  );
}
