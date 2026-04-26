import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import CarListingClient from "@/components/CarListingClient";
import { doc, getDoc } from "firebase/firestore";

type Vendor = {
  name?: string;
  logoUrl?: string;
};

type RelatedModel = {
  name: string;
  slug: string;
};

// ✅ ADD THIS RIGHT HERE (below imports, above Page function)
export async function generateMetadata({ params }: any) {
  const { slug, city, service } = await params;

  const carName = slug.replace(/-/g, " ");
  const isDriver = service === "with-driver";


  return {
    title: `${carName} ${isDriver ? "with driver" : "for rent"} in ${city} | RentKA`,
    description: `Rent ${carName} ${isDriver ? "with driver" : "for self drive"} in ${city}. Starting from affordable daily rates. Verified vendors, no hidden charges, and quick booking via WhatsApp.`,
  };
}

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
      withinCity?: { daily?: number };
    };
    withDriver?: {
      withinCity?: { daily?: number };
    };
  };
};

export default async function Page({
  params,
}: {
  params: Promise<{
    slug: string;
    city: string;
    service: string;
  }>;
}) {
 const { slug, city, service } = await params;
  

  const country = "PK";

  
  const selectedService =
  service?.toLowerCase() === "with-driver"
    ? "withDriver"
    : "selfDrive";

  const snapshot = await getDocs(
    collection(db, "countries", country, "cars")
  );

  const normalize = (str?: string) =>
    (str || "").toLowerCase().replace(/\s+/g, "-");

  const cars: (Car & { vendor?: Vendor })[] = [];

  for (const docItem of snapshot.docs) {
  const data = docItem.data() as Car;

  if (!data.model || normalize(data.model) !== normalize(slug)) continue;

  if (
    !data.cityList ||
    !data.cityList.some(
      (c) => c.toLowerCase() === city.toLowerCase()
    )
  )
    continue;

  if (
    selectedService === "withDriver" &&
    data.supports?.withDriver === false
  )
    continue;

  if (
    selectedService === "selfDrive" &&
    data.supports?.withoutDriver === false
  )
    continue;

  // 🔥 FETCH VENDOR
  let vendorData: Vendor | null = null;

  if (data.vendorId) {
    try {
      const vendorRef = doc(
        db,
        "countries",
        country,
        "vendors",
        data.vendorId
      );

      const vendorSnap = await getDoc(vendorRef);

      if (vendorSnap.exists()) {
        vendorData = vendorSnap.data() as Vendor;
      }
    } catch {
      vendorData = null;
    }
  }

  cars.push({
    ...data,
    id: docItem.id,
    vendor: vendorData || undefined,
  });
}

  let minPrice: number | null = null;

cars.forEach((car) => {
  const price =
    selectedService === "withDriver"
      ? car.pricing?.withDriver?.withinCity?.daily
      : car.pricing?.selfDrive?.withinCity?.daily;

  if (price && price > 0) {
    if (minPrice === null || price < minPrice) {
      minPrice = price;
    }
  }
});

const isDriver = service?.toLowerCase() === "with-driver";
const carName = slug ? slug.replace(/-/g, " ") : "Cars";

const relatedModels: RelatedModel[] = [
  { name: "Toyota Corolla", slug: "toyota-corolla" },
  { name: "Toyota Hiace", slug: "toyota-hiace" },
  { name: "Honda BR-V", slug: "honda-br-v" },
];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">

      {/* 🔥 SEO HEADING */}
      <h1 className="text-3xl md:text-4xl font-bold mb-4 capitalize">
        {carName} {isDriver ? "with driver" : "for rent"} in {city} – Price & Booking | RentKA
      </h1>

      {/* 🔥 SEO PARAGRAPH */}
      <p className="text-slate-600 max-w-2xl mb-10">
        Looking to rent a {slug ? slug.replace(/-/g, " ") : "car"} in {city}? 
        Prices start from Rs {minPrice}/day (may vary by vendor and availability). 
        RentKA connects you with verified rental partners, allowing you to compare options, 
        choose what fits your requirement, and book easily with clear and transparent pricing. 
        Ideal for airport transfers, family trips, and daily city travel.
      </p>

      {/* 🔥 EMPTY STATE */}
      {cars.length === 0 && (
        <div className="bg-slate-100 rounded-xl p-6 text-center">
          <p className="text-slate-700 font-medium">
            No cars available right now for this selection.
          </p>
        </div>
      )}

      {/* 🔥 LISTINGS */}
      <CarListingClient
        cars={cars}
        service={selectedService}
        city={city}
      />

      <div className="mt-12">
  <h3 className="text-lg font-semibold mb-4">
    Explore more options in {city}
  </h3>

  <div className="flex flex-wrap gap-3">
    {relatedModels.map((model: RelatedModel) => {
      // avoid linking to same page
      if (model.slug === slug) return null;


      return (
        <a
          key={model.slug}
          href={`/cars/${model.slug}/${city}/${service}`}
          className="text-sm px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 capitalize"
        >
          {model.name} {isDriver ? "with driver" : ""}
        </a>
      );
    })}
  </div>
</div>


      {/* 🔥 TRUST SECTION */}
      <div className="mt-16 border-t pt-10">
        <h3 className="text-xl font-semibold mb-3">
          Why rent with RentKA?
        </h3>
        <ul className="text-slate-600 space-y-2 text-sm">
          <li>✔ Verified rental partners</li>
          <li>✔ Transparent pricing</li>
          <li>✔ Flexible booking options</li>
          <li>✔ Dedicated customer support</li>
        </ul>
      </div>

    </main>
  );
}