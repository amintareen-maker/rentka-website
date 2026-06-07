import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import CarListingClient from "@/components/CarListingClient";
import { doc, getDoc } from "firebase/firestore";
import Script from "next/script";

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
    title: `${carName} with Driver Rental in ${city} | Price & Booking | RentKA`,
    description: `Book ${carName} with driver in ${city}. Compare prices from verified vendors, airport transfers, city rides, Murree trips and instant WhatsApp booking with RentKA.`,
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

// ✅ STEP 1: FILTER FIRST (NO API CALLS)
const filteredCars = snapshot.docs.filter((docItem) => {
  const data = docItem.data() as Car;

  if (!data.model || normalize(data.model) !== normalize(slug)) return false;

  if (
    !data.cityList ||
    !data.cityList.some(
      (c) => c.toLowerCase() === city.toLowerCase()
    )
  )
    return false;

  if (
    selectedService === "withDriver" &&
    data.supports?.withDriver === false
  )
    return false;

  if (
    selectedService === "selfDrive" &&
    data.supports?.withoutDriver === false
  )
    return false;

  return true;
});

// 🚀 STEP 2: FETCH VENDORS IN PARALLEL (FAST)
const carsWithVendors = await Promise.all(
  filteredCars.map(async (docItem) => {
    const data = docItem.data() as Car;

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

    return {
      ...data,
      id: docItem.id,
      vendor: vendorData || undefined,
    };
  })
);

// ✅ FINAL RESULT
cars.push(...carsWithVendors);

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

const carSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: `${carName} with Driver Rental in ${city}`,
  provider: {
    "@type": "Organization",
    name: "RentKA",
    url: "https://www.rentka.co",
  },
  areaServed: city,
  offers: {
    "@type": "Offer",
    price: minPrice ?? "",
    priceCurrency: "PKR",
  },
};

  return (
    <>
  <Script
  id="car-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(carSchema),
  }}
/>
    
    <main className="max-w-6xl mx-auto px-6 py-12">

      {/* 🔥 SEO HEADING */}
      <h1 className="text-3xl md:text-4xl font-bold mb-4 capitalize">
        const cityName = city.charAt(0).toUpperCase() + city.slice(1);
        {carName} with Driver in {city} – Price & Booking | RentKA
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
<div className="mt-16">
  <h3 className="text-xl font-semibold mb-4">
    Frequently Asked Questions
  </h3>

  <div className="space-y-4 text-sm text-slate-700">
    <div>
      <p className="font-medium">
        What is the price of {carName} with driver in {city}?
      </p>
      <p>
        Prices typically start from Rs {minPrice ?? "varies"}/day depending on vendor, duration, and availability.
      </p>
    </div>

    <div>
      <p className="font-medium">
        Can I book instantly on RentKA?
      </p>
      <p>
        Yes, you can submit your booking request online and confirm details via WhatsApp with our team.
      </p>
    </div>

    <div>
      <p className="font-medium">
        Are there any hidden charges?
      </p>
      <p>
        No, RentKA works with verified vendors and ensures transparent pricing before confirmation.
      </p>
    </div>
  </div>
</div>

<Script
  id="faq-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the price of ${carName} with driver in ${city}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Prices start from Rs ${minPrice ?? "varies"} per day depending on vendor and availability.`,
          },
        },
        {
          "@type": "Question",
          name: "Can I book online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, bookings can be made online and confirmed via WhatsApp.",
          },
        },
        {
          "@type": "Question",
          name: "Are there any hidden charges?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. RentKA works with verified vendors and provides transparent pricing before booking confirmation.",
          },
        },
      ],
    }),
  }}
/>

  
    </main>
</>
);
}