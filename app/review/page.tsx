import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewContent from "./ReviewContent";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10">Loading...</p>}>
      <ReviewContent />
    </Suspense>
  );
}
