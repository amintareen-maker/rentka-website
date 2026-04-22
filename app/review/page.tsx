"use client";

import { Suspense } from "react";
import ReviewContent from "./ReviewContent";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10">Loading...</p>}>
      <ReviewContent />
    </Suspense>
  );
}