import { Suspense } from "react";
import CarsPageClient from "./CarsPageClient";

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