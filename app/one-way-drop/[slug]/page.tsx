import { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";

import { intercityRoutes } from "@/data/intercityRoutes";
import IntercityRoutePage from "@/components/intercity/IntercityRoutePage";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return intercityRoutes
    .filter((route) => route.active)
    .map((route) => ({
      slug: route.slug,
    }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const route = intercityRoutes.find(
    (r) => r.slug === slug && r.active
  );

  if (!route) {
    return {
      title: "Route Not Found | RentKA",
    };
  }

  const title = `${route.from} to ${route.to} Car Rental | One Way Drop | RentKA`;

  const description = `Book a one-way car rental from ${route.from} to ${route.to} with RentKA. Professional chauffeur, fuel included and transparent pricing.`;

  const url = `https://rentka.co/one-way-drop/${route.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "RentKA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const route = intercityRoutes.find(
    (r) => r.slug === slug && r.active
  );

  if (!route) {
    notFound();
  }

  const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: `${route.from} to ${route.to} Car Rental`,
      serviceType: "One Way Drop Service",
      provider: {
        "@type": "Organization",
        name: "RentKA",
        url: "https://rentka.co",
      },
      areaServed: "Pakistan",
      offers: {
        "@type": "Offer",
        price: route.vehicles.corolla.price,
        priceCurrency: "PKR",
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://rentka.co",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "One Way Drop",
          item: "https://rentka.co/one-way-drop",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${route.from} to ${route.to}`,
          item: `https://rentka.co/one-way-drop/${route.slug}`,
        },
      ],
    },
  ],
};

  return (
  <>
    <Script
      id="route-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />

    <IntercityRoutePage route={route} />
  </>
);
}
