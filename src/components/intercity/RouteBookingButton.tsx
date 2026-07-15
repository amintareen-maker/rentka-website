"use client";

import { useState } from "react";
import IntercityBookingModal from "./IntercityBookingModal";

type Props = {
  route: {
    from: string;
    to: string;
    slug: string;
  };

  price: number | null;
};

export default function RouteBookingButton({
  route,
  price,
}: Props) {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setBookingOpen(true)}
        className="rounded-xl bg-[#5BAE4A] px-8 py-4 font-semibold text-white transition hover:opacity-90"
      >
        Book Now
      </button>

      <IntercityBookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        route={route}
        vehicle="Toyota Corolla"
        price={price}
        tripType="one-way"
      />
    </>
  );
}