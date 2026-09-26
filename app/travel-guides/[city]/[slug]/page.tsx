import type { Metadata } from "next";
import { notFound } from "next/navigation";

import GuideArticle from "@/components/travel-guides/GuideArticle";
import { getPublishedGuide, guidePath } from "@/lib/travel-guides";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string; slug: string }> }): Promise<Metadata> {
  const { city, slug } = await params;
  const guide = getPublishedGuide(city, slug);
  if (!guide) return { title: "Travel Guide Not Found | RentKA", robots: { index: false, follow: false } };
  const url = `${SITE_URL}${guidePath(guide)}`;
  return {
    title: { absolute: guide.seoTitle },
    description: guide.metaDescription,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title: guide.seoTitle, description: guide.metaDescription, url, type: "article", siteName: "RentKA", locale: "en_PK", publishedTime: guide.datePublished, modifiedTime: guide.dateModified ?? guide.datePublished, images: [{ url: guide.featuredImage, alt: guide.featuredImageAlt }] },
    twitter: { card: "summary_large_image", title: guide.seoTitle, description: guide.metaDescription, images: [guide.featuredImage] },
  };
}

export default async function TravelGuideArticlePage({ params }: { params: Promise<{ city: string; slug: string }> }) {
  const { city, slug } = await params;
  const guide = getPublishedGuide(city, slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} />;
}
