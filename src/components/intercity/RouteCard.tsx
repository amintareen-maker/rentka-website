import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Fuel,
  MapPinned,
  ShieldCheck,
  Car,
} from "lucide-react";

import { IntercityRoute } from "@/data/intercityRoutes";

type Props = {
  route: IntercityRoute;
};

export default function RouteCard({ route }: Props) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#5BAE4A] hover:shadow-xl">

      {/* Header */}

      <div className="bg-gradient-to-r from-[#0F2B46] to-[#143b5f] p-6">

        <span className="inline-flex rounded-full bg-[#5BAE4A] px-3 py-1 text-xs font-semibold text-white">
          One Way Drop
        </span>

        <h3 className="mt-5 text-2xl font-bold text-white">
          {route.from}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-slate-300">

          <ArrowRight size={18} />

          <span>{route.to}</span>

        </div>

      </div>

      {/* Body */}

      <div className="p-6">

        <div className="rounded-2xl bg-slate-50 p-5">

          <p className="text-sm text-slate-500">
            Starting From
          </p>

          <h3 className="mt-2 text-4xl font-bold text-[#5BAE4A]">
            PKR {route.vehicles.corolla.price?.toLocaleString()}
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Toyota Corolla
          </p>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-5">

          <div className="flex gap-3">

            <MapPinned
              className="text-[#5BAE4A]"
              size={22}
            />

            <div>

              <p className="text-xs uppercase text-slate-500">
                Distance
              </p>

              <p className="font-semibold">
                {route.distanceKm} km
              </p>

            </div>

          </div>

          <div className="flex gap-3">

            <Clock3
              className="text-[#5BAE4A]"
              size={22}
            />

            <div>

              <p className="text-xs uppercase text-slate-500">
                Duration
              </p>

              <p className="font-semibold">
                {route.duration}
              </p>

            </div>

          </div>

        </div>

        <div className="my-8 border-t border-slate-200" />

        <div className="space-y-4">

          <div className="flex items-center gap-3">

            <Fuel
              size={18}
              className="text-[#5BAE4A]"
            />

            <span>Fuel Included</span>

          </div>

          <div className="flex items-center gap-3">

            <ShieldCheck
              size={18}
              className="text-[#5BAE4A]"
            />

            <span>Professional Driver</span>

          </div>

          <div className="flex items-center gap-3">

            <Car
              size={18}
              className="text-[#5BAE4A]"
            />

            <span>Air Conditioned Vehicle</span>

          </div>

        </div>

        <Link
          href={`/one-way-drop/${route.slug}`}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5BAE4A] py-4 font-semibold text-white transition hover:opacity-90"
        >
          View Route

          <ArrowRight size={18} />

        </Link>

      </div>

    </div>
  );
}