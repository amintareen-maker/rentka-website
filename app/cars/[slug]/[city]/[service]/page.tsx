import { liteDb } from "@/lib/firebaseLite";
import { collection, getDocs } from "firebase/firestore/lite";
import CarListingClient from "@/components/CarListingClient";
import { doc, getDoc } from "firebase/firestore/lite";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import LahoreBookingClient from "@/components/lahore/LahoreBookingClient";
import { getEligibleLahoreModel, getEligibleLahoreModels, toPublicLahoreInventory } from "@/lib/normal-rental/public-inventory";
import { getNormalRentalBookingContext, NORMAL_RENTAL_ZONES } from "@/lib/normal-rental/zones";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import {
  ORGANIZATION_ID,
  VEHICLE_CITIES,
  VEHICLE_MODELS,
  VEHICLE_SERVICE,
  isValidVehicleRoute,
} from "@/lib/seo";

type Vendor = {
  name?: string;
  logoUrl?: string;
};

type VehiclePageProps = {
  params: Promise<{ slug: string; city: string; service: string }>;
};

// ✅ ADD THIS RIGHT HERE (below imports, above Page function)
export function generateStaticParams() {
  return VEHICLE_MODELS.flatMap((slug) =>
    VEHICLE_CITIES.map((city) => ({ slug, city, service: VEHICLE_SERVICE })),
  );
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { slug, city, service } = await params;

  if (city === "lahore") {
    if (!NORMAL_RENTAL_ZONES.lahore.publicEnabled || service !== VEHICLE_SERVICE) return { robots: { index: false, follow: false } };
    const model = await getEligibleLahoreModel(slug);
    if (!model) return { robots: { index: false, follow: false } };
    const url = `https://www.rentka.co/cars/${slug}/lahore/${service}`;
    const pageTitle = `${model.modelName} with Driver in Lahore | RentKA`;
    const pageDescription = `Rent ${model.modelName} with a professional driver in Lahore for city or Outstation travel. View current package prices and request availability with RentKA.`;
    return {
      title: { absolute: pageTitle }, description: pageDescription,
      alternates: { canonical: url }, robots: { index: true, follow: true },
      openGraph: { title: pageTitle, description: pageDescription, url, images: [{ url: model.inventory[0].imageURL || "/hero-car.png", alt: `${model.modelName} with driver in Lahore` }] },
    };
  }

  if (!isValidVehicleRoute(slug, city, service)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const carName = slug
    .split("-")
    .map((part) => part.toUpperCase() === "BR" ? "BR" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const url = `https://www.rentka.co/cars/${slug}/${city}/${service}`;


  return {
    title: { absolute: `${carName} with Driver in ${cityName} | RentKA` },
    description: `Book ${carName} with driver in ${cityName}. Compare current options for airport transfers, city travel, family journeys and outstation bookings with RentKA.`,
    alternates: { canonical: url },
    openGraph: { title: `${carName} with Driver in ${cityName} | RentKA`, description: `Book ${carName} with driver in ${cityName} through RentKA.`, url, images: [{ url: "/hero-car.png", alt: `${carName} with driver in ${cityName}` }] },
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
}: VehiclePageProps) {
 const { slug, city, service } = await params;

  if (city === "lahore") {
    if (!NORMAL_RENTAL_ZONES.lahore.publicEnabled || service !== VEHICLE_SERVICE) notFound();
    const [model, eligibleModels] = await Promise.all([getEligibleLahoreModel(slug), getEligibleLahoreModels()]);
    if (!model) notFound();
    const context = getNormalRentalBookingContext("lahore", "lahore");
    const url = `https://www.rentka.co/cars/${model.modelSlug}/lahore/${VEHICLE_SERVICE}`;
    const minimum = Math.min(...model.inventory.map((item) => item.pricing.withDriver.withinCity.daily ?? Infinity));
    const related = eligibleModels.filter((item) => item.modelSlug !== model.modelSlug).slice(0, 3);
    const breadcrumbItems = [
      { name: "Home", href: "/" }, { name: "Rent a Car Lahore", href: "/rent-a-car-lahore" },
      { name: `${model.modelName} With Driver`, href: `/cars/${model.modelSlug}/lahore/${VEHICLE_SERVICE}` },
    ];
    const faq = [
      { question: `What is the price of ${model.modelName} with driver in Lahore?`, answer: `Current Lahore rental prices start from PKR ${minimum.toLocaleString("en-PK")} per day, subject to your selected package, travel details and availability.` },
      { question: `Can I book ${model.modelName} for Outstation travel from Lahore?`, answer: "Yes. Choose Outstation in the booking form, select a Google-verified pickup and destination, and RentKA will confirm availability and final requirements." },
    ];
    const schemas = [
      breadcrumbJsonLd(breadcrumbItems),
      { "@context": "https://schema.org", "@type": "Service", name: `${model.modelName} with Driver in Lahore`, url, provider: { "@id": ORGANIZATION_ID }, areaServed: { "@type": "City", name: "Lahore" }, description: `With-driver ${model.modelName} rental for Within Lahore and Outstation travel.` },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ];
    return <>
      {schemas.map((schema, index) => <Script key={index} id={`lahore-car-schema-${index}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll("<", "\\u003c") }}/>) }
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={breadcrumbItems}/>
        <header className="mt-7 max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-[var(--rentka-green)]">Lahore · Driver included</p><h1 className="mt-2 text-3xl font-extrabold capitalize text-[var(--rentka-blue)] sm:text-4xl">{model.modelName} with Driver in Lahore</h1><p className="mt-4 leading-7 text-slate-600">Choose a current Within Lahore or Outstation package, add your trip details and request availability from RentKA. Prices currently start from PKR {minimum.toLocaleString("en-PK")} per day.</p></header>
        <section aria-labelledby="lahore-model-booking" className="mt-10"><h2 id="lahore-model-booking" className="mb-6 text-2xl font-extrabold text-[var(--rentka-blue)]">View Packages &amp; Request Booking</h2><LahoreBookingClient inventory={toPublicLahoreInventory(model.inventory)} context={{ cityLabel: context.cityLabel }} variant="prelaunch"/></section>
        <section className="mt-14 grid gap-5 sm:grid-cols-2" aria-labelledby="lahore-model-travel"><h2 id="lahore-model-travel" className="sr-only">Lahore travel options</h2><article className="rounded-2xl bg-slate-50 p-6"><h3 className="text-xl font-bold text-[var(--rentka-blue)]">Within Lahore</h3><p className="mt-3 leading-7 text-slate-600">Request pickup for daily travel, appointments, business meetings, weddings or family commitments across Lahore.</p></article><article className="rounded-2xl bg-[var(--rentka-blue)] p-6 text-white"><h3 className="text-xl font-bold">Outstation From Lahore</h3><p className="mt-3 leading-7 text-slate-200">Select your Lahore pickup and destination, then RentKA will check the car and route requirements before confirmation.</p></article></section>
        <section className="mt-14" aria-labelledby="lahore-model-faq"><h2 id="lahore-model-faq" className="text-2xl font-extrabold text-[var(--rentka-blue)]">Frequently Asked Questions</h2><div className="mt-5 space-y-5">{faq.map((item) => <article key={item.question}><h3 className="font-bold text-slate-900">{item.question}</h3><p className="mt-2 leading-7 text-slate-600">{item.answer}</p></article>)}</div></section>
        {related.length > 0 && <section className="mt-14" aria-labelledby="related-lahore-cars"><h2 id="related-lahore-cars" className="text-xl font-bold text-[var(--rentka-blue)]">More Cars Available in Lahore</h2><div className="mt-5 flex flex-wrap gap-3">{related.map((item) => <Link key={item.modelSlug} href={`/cars/${item.modelSlug}/lahore/${VEHICLE_SERVICE}`} className="rounded-xl bg-slate-100 px-4 py-3 font-semibold hover:bg-slate-200">{item.modelName} with driver</Link>)}</div></section>}
      </main>
    </>;
  }

  if (!isValidVehicleRoute(slug, city, service)) {
    notFound();
  }
  

  const country = "PK";

  
  const selectedService = "withDriver";

  const snapshot = await getDocs(
    collection(liteDb, "countries", country, "cars")
  ).catch(() => null);

  const normalize = (str?: string) =>
    (str || "").toLowerCase().replace(/\s+/g, "-");

  const cars: (Car & { vendor?: Vendor })[] = [];

// ✅ STEP 1: FILTER FIRST (NO API CALLS)
const filteredCars = (snapshot?.docs || []).filter((docItem) => {
  const data = docItem.data() as Car;

  if (!data.model || normalize(data.model) !== normalize(slug)) return false;

  // Islamabad & Rawalpindi share inventory

const requestedCity = city.toLowerCase();

const cityMatches =
  requestedCity === "islamabad" ||
  requestedCity === "rawalpindi"
    ? data.cityList?.some((c) => {
        const normalized = c.toLowerCase();

        return (
          normalized === "islamabad" ||
          normalized === "rawalpindi"
        );
      })
    : data.cityList?.some(
        (c) =>
          c.toLowerCase() === requestedCity
      );

if (!cityMatches) return false;

  if (
    selectedService === "withDriver" &&
    data.supports?.withDriver === false
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
          liteDb,
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
  const price = car.pricing?.withDriver?.withinCity?.daily;

  if (price && price > 0) {
    if (minPrice === null || price < minPrice) {
      minPrice = price;
    }
  }
});

const isDriver = service?.toLowerCase() === "with-driver";
const carName = slug ? slug.replace(/-/g, " ") : "Cars";
const cityName =
  city.charAt(0).toUpperCase() + city.slice(1);

const currentModelIndex = VEHICLE_MODELS.indexOf(slug as (typeof VEHICLE_MODELS)[number]);
const relatedModels = [1, 2, 3].map((offset) => {
  const relatedSlug = VEHICLE_MODELS[(currentModelIndex + offset) % VEHICLE_MODELS.length];
  return {
    slug: relatedSlug,
    name: relatedSlug
      .split("-")
      .map((part) => part.toUpperCase() === "BR" ? "BR" : part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  };
});

const carSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: `${carName} with Driver Rental in ${city}`,
   url: `https://www.rentka.co/cars/${slug}/${city}/${service}`,
  provider: {
    "@id": ORGANIZATION_ID,
  },
  areaServed: city,
  ...(typeof minPrice === "number" ? { offers: {
    "@type": "Offer",
    price: minPrice,
    priceCurrency: "PKR",
  } } : {}),
};

const modelGuidance: Record<string, { passengers: string; luggage: string; bestFor: string; bookingTip: string }> = {
  "toyota-corolla": { passengers: "up to four passengers", luggage: "two medium suitcases", bestFor: "airport transfers, business travel and intercity journeys", bookingTip: "Share your luggage count if four passengers are travelling." },
  "honda-civic": { passengers: "up to four passengers", luggage: "two medium suitcases", bestFor: "executive travel, meetings and motorway journeys", bookingTip: "Reserve early for corporate and wedding dates." },
  "toyota-prado": { passengers: "up to five passengers", luggage: "three to four medium bags", bestFor: "executive travel, weddings and northern-area journeys", bookingTip: "Confirm the exact variant and luggage requirements before payment." },
  "toyota-hiace": { passengers: "larger families and groups", luggage: "group luggage when capacity is planned carefully", bestFor: "airport groups, tours, weddings and corporate teams", bookingTip: "Provide the passenger and bag count so the seating layout can be confirmed." },
  "honda-br-v": { passengers: "families and small groups", luggage: "light luggage with all seats occupied", bestFor: "family travel, airport pickup and outstation trips", bookingTip: "For airport travel, confirm whether rear seating or luggage space matters more." },
  "toyota-hilux": { passengers: "small groups", luggage: "bulky luggage or equipment where suitable", bestFor: "site visits, rugged routes and practical outstation travel", bookingTip: "Describe the route and any equipment before requesting availability." },
  "honda-city": { passengers: "up to four passengers", luggage: "two medium suitcases", bestFor: "city appointments, airport transfers and economical intercity travel", bookingTip: "Share all stops when requesting a full-day quotation." },
  "suzuki-wagon-r": { passengers: "up to four passengers", luggage: "light city luggage", bestFor: "economical local travel and short scheduled journeys", bookingTip: "Choose a larger vehicle when travelling with several airport bags." },
  "toyota-yaris": { passengers: "up to four passengers", luggage: "two medium suitcases", bestFor: "city travel, airport transfers and business appointments", bookingTip: "Confirm the itinerary to compare daily and route-based pricing." },
  "suzuki-alto": { passengers: "up to three adults comfortably", luggage: "light hand luggage", bestFor: "budget-conscious city travel and short local bookings", bookingTip: "For long routes or substantial luggage, compare a sedan before booking." },
};
const guidance = modelGuidance[slug];

const breadcrumbItems = [
  { name: "Home", href: "/" },
  { name: "Cars", href: "/cars" },
  { name: `Rent a Car ${city.charAt(0).toUpperCase() + city.slice(1)}`, href: `/rent-a-car-${city}` },
  { name: `${carName} With Driver`, href: `/cars/${slug}/${city}/${service}` },
];
const breadcrumbSchema = breadcrumbJsonLd(breadcrumbItems);


  return (
    <>
  <Script
  id="car-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(carSchema),
  }}
/>
  <Script
  id="breadcrumb-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(breadcrumbSchema),
  }}
/>
    
    <main className="max-w-6xl mx-auto px-6 py-12">

      <Breadcrumbs items={breadcrumbItems} />

      {/* 🔥 SEO HEADING */}
      <h1 className="text-3xl md:text-4xl font-bold mb-4 capitalize">
        {carName} with Driver in {cityName}
      </h1>

      {/* 🔥 SEO PARAGRAPH */}
      <p className="text-slate-600 max-w-2xl mb-10">
        Looking to rent a {slug ? slug.replace(/-/g, " ") : "car"} in {city}? 
        Prices start from Rs {minPrice}/day (may vary by vendor and availability). 
        RentKA connects you with verified rental partners, allowing you to compare options, 
        choose what fits your requirement, and book easily with clear and transparent pricing. 
        Ideal for airport transfers, family trips, and daily city travel.
      </p>

      <section className="mb-12 grid gap-6 rounded-2xl bg-slate-50 p-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Who this vehicle suits</h2>
          <p className="mt-3 text-slate-600">
            This model generally suits {guidance.passengers} and works well for {guidance.bestFor}.
            Actual seating depends on the specific vehicle confirmed for your booking.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Luggage and booking guidance</h2>
          <p className="mt-3 text-slate-600">
            Allow for approximately {guidance.luggage}. {guidance.bookingTip}
          </p>
        </div>
      </section>

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
  <h2 className="text-lg font-semibold mb-4">
    Explore more options in {city}
  </h2>

  <div className="flex flex-wrap gap-3">
    {relatedModels.map((model) => {
      // avoid linking to same page
      if (model.slug === slug) return null;


      return (
        <Link
          key={model.slug}
          href={`/cars/${model.slug}/${city}/${service}`}
          className="text-sm px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 capitalize"
        >
          {model.name} {isDriver ? "with driver" : ""}
        </Link>
      );
    })}
  </div>
</div>


      {/* 🔥 TRUST SECTION */}
      <div className="mt-16 border-t pt-10">
        <h2 className="text-xl font-semibold mb-3">
          Why rent with RentKA?
        </h2>
        <ul className="text-slate-600 space-y-2 text-sm">
          <li>✔ Verified rental partners</li>
          <li>✔ Transparent pricing</li>
          <li>✔ Flexible booking options</li>
          <li>✔ Dedicated customer support</li>
        </ul>
      </div>
<div className="mt-16">
  <h2 className="text-xl font-semibold mb-4">
    Frequently Asked Questions
  </h2>

  <div className="space-y-4 text-sm text-slate-700">
    <div>
      <p className="font-medium">
        What is the price of {carName} with driver in {city}?
      </p>
      <p>
        {typeof minPrice === "number"
          ? `Prices currently start from Rs ${minPrice}/day, subject to vendor, duration and availability.`
          : "Pricing depends on the confirmed vehicle, itinerary, duration and availability. Request a quotation for your travel date."}
      </p>
    </div>

    <div>
      <p className="font-medium">
        Can I book online?
      </p>
      <p>
        Yes, bookings can be made online and confirmed via WhatsApp.
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
            text: typeof minPrice === "number"
              ? `Prices currently start from Rs ${minPrice} per day, subject to vendor and availability.`
              : "Pricing depends on the confirmed vehicle, itinerary, duration and availability. Request a quotation for your travel date.",
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
            text: "RentKA explains the applicable rental, fuel, toll, parking and overtime terms before booking confirmation.",
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
