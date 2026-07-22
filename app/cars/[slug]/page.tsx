import type { Metadata } from "next";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

type Car = {
  id: string;
  name?: string;
  model?: string;
  imageURL?: string;
  vendorId?: string;

  cityList?: string[];

  supports?: {
    withoutDriver?: boolean;
    withDriver?: boolean;
  };

  pricing?: {
    selfDrive?: {
      withinCity?: {
        daily?: number;
      };
    };
    withDriver?: {
      withinCity?: {
        daily?: number;
      };
    };
  };
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ FIXED

  console.log("SLUG:", slug);

  // ⚠️ TEMP DEFAULTS (we improve later)
  const country = "PK";
  const city = "islamabad";

  // 🔥 Fetch cars from Firebase
  const snapshot = await getDocs(
    collection(db, "countries", country, "cars")
  );

  const cars: Car[] = [];

  snapshot.forEach((doc) => {
  const data = doc.data() as Car;
  
  console.log("MODEL:", data.model);
  console.log("CITY:", data.cityList);
  console.log("SUPPORT:", data.supports);

  const normalize = (str?: string) =>
  (str || "").toLowerCase().replace(/\s+/g, "-");

  // 🔥 MODEL MATCH
  if (!data.model || normalize(data.model) !== normalize(slug)) return;

  // 🔥 CITY FILTER (CRITICAL)
  if (city && (!data.cityList || !data.cityList.includes(city))) return;

  // simulate service = withDriver (for now)
const service = "withDriver";

if (
  service === "withDriver" &&
  data.supports?.withDriver === false
) return;

  cars.push({
    ...data,
    id: doc.id,
  });
});

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      
      {/* ✅ SEO HEADING */}
      <h1 className="text-3xl font-bold mb-6 capitalize">
        {slug.replace(/-/g, " ")} for rent in Islamabad
      </h1>

      {cars.length === 0 && (
        <p>No cars available for this model.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cars.map((car) => (
          <div
            key={car.id}
            className="border rounded-xl p-4"
          >
            <p className="font-semibold">{car.name}</p>

            {car.vendorId && (
              <p className="text-sm text-slate-600">
                Vendor: {car.vendorId}
              </p>
            )}

            {car.pricing?.withDriver?.withinCity?.daily && (
              <p className="text-green-700 font-medium mt-2">
                PKR {car.pricing.withDriver.withinCity.daily} / day
              </p>
            )}
          </div>
        ))}
      </div>

    </section>
  );
}
