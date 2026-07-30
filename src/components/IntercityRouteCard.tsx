import Link from "next/link";
import { IntercityRoute } from "@/data/intercityRoutes";

interface Props {
  route: IntercityRoute;
}

export default function IntercityRouteCard({ route }: Props) {
  const corolla = route.vehicles.corolla;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-green-700 bg-green-100 px-3 py-1 rounded-full">
            One Way Drop
          </span>

          <span className="text-xs text-gray-500">
            {route.distanceKm} km
          </span>
        </div>

        <h3 className="text-xl font-bold text-[#0F2B46] mb-2">
          {route.from} → {route.to}
        </h3>

        <p className="text-gray-600 mb-4">
          Estimated travel time: {route.duration}
        </p>

        <div className="border rounded-xl p-4 bg-gray-50 mb-5">
          <p className="text-sm text-gray-500">
            Starting From
          </p>

          <p className="text-3xl font-bold text-[#5BAE4A]">
            PKR {corolla.price?.toLocaleString()}
          </p>

          <p className="text-sm text-gray-600 mt-2">
            Toyota Corolla
          </p>
        </div>

        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ Professional Driver</li>
          <li>✅ Fuel Included</li>
          <li>✅ Air Conditioned Vehicle</li>
          <li>✅ Door-to-Door Pickup</li>
          <li>✅ Fixed One-Way Price</li>
        </ul>
      </div>

      <div className="mt-6">
        <Link
          href={`/one-way-drop/${route.slug}`}
          className="block w-full text-center rounded-xl bg-[#5BAE4A] hover:bg-[#4b9a3d] text-white font-semibold py-3 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
