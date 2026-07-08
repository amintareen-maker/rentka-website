import { Metadata } from "next";
import { notFound } from "next/navigation";

import { intercityRoutes } from "@/data/intercityRoutes";
import IntercityRoutePage from "@/components/intercity/IntercityRoutePage";

type Props = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  return intercityRoutes
    .filter((route) => route.active)
    .map((route) => ({
      slug: route.slug,
    }));
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const route = intercityRoutes.find(
    (r) => r.slug === params.slug && r.active
  );

  if (!route) {
    return {
      title: "Route Not Found | RentKA",
    };
  }

  const title = `${route.from} to ${route.to} Car Rental | One Way Drop | RentKA`;

  const description = `Book a one-way car rental from ${route.from} to ${route.to} with RentKA. Professional chauffeur, fuel included, transparent pricing, and instant WhatsApp booking.`;

  const url = `https://www.rentka.co/one-way-drop/${route.slug}`;

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

export default function Page({ params }: Props) {
  const route = intercityRoutes.find(
    (r) => r.slug === params.slug && r.active
  );

  if (!route) {
    notFound();
  }

  return <IntercityRoutePage route={route} />;
}