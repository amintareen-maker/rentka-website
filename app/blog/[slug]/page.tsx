import Hero from "../components/Hero";
import ArticleContent from "../components/ArticleContent";
import { articles } from "../data";
import type { Metadata } from "next";
import Breadcrumbs from "../components/Breadcrumbs";
import { articleContents } from "../content";
import { notFound } from "next/navigation";
import { ORGANIZATION_ID } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import Link from "next/link";
import { intercityRoutes } from "@/data/intercityRoutes";
import PreferredSourceButton from "@/components/PreferredSourceButton";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {

  const { slug } = await params;

  const article = articles.find(
    (a) => a.slug === slug
  );

  if (!article) {
    return {
      title: "Article Not Found | RentKA",
    };
  }

  return {
    title: { absolute: article.seoTitle },
    description: article.metaDescription,

    alternates: {
      canonical: `https://www.rentka.co/blog/${article.slug}`,
    },

    openGraph: {
      title: article.seoTitle,
      description: article.metaDescription,
      url: `https://www.rentka.co/blog/${article.slug}`,
      type: "article",
      siteName: "RentKA",
      locale: "en_PK",
      publishedTime: article.date,
      modifiedTime: article.date,
      images: [{ url: article.image, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.metaDescription,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = articles.find(
    (a) => a.slug === slug
  );

  if (!article) {
    notFound();
  }

  const articleContent =
  articleContents[slug as keyof typeof articleContents];
  

if (!articleContent) {
  notFound();
}

  const jsonLd = {
  "@context": "https://schema.org",

  "@type": "BlogPosting",

  headline: article.title,

  url: `https://www.rentka.co/blog/${article.slug}`,
  description: article.metaDescription,

  image: `https://www.rentka.co${article.image}`,

  author: {
    "@id": ORGANIZATION_ID,
  },

  publisher: {
    "@id": ORGANIZATION_ID,
  },

  datePublished: article.date,

  dateModified: article.date,

  articleSection: article.category,

  keywords: article.keywords.join(", "),

  mainEntityOfPage: {
    "@type": "WebPage",

    "@id": `https://www.rentka.co/blog/${article.slug}`,
  },
};
  const faqEntities = articleContent.faq.flatMap((item) =>
    typeof item.question === "string" && typeof item.answer === "string"
      ? [{
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        }]
      : [],
  );
  const faqSchema = faqEntities.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqEntities }
    : null;
  const relatedArticles = articles
    .filter((candidate) => candidate.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);
  const routeSlug = article.slug.replace(/-car-rental-guide$/, "");
  const matchingRoute = intercityRoutes.find((route) => route.slug === routeSlug && route.active);
  const vehicleMatch = article.slug.match(/^(.+)-rental-islamabad-guide$/);
  const commercialLink = matchingRoute
    ? { href: `/one-way-drop/${matchingRoute.slug}`, label: `View ${matchingRoute.from} to ${matchingRoute.to} booking options` }
    : article.slug.includes("airport")
      ? { href: "/airport-car-rental-islamabad", label: "View Islamabad airport transfer options" }
      : article.slug.includes("one-way") || article.slug.startsWith("islamabad-to-")
        ? { href: "/one-way-drop", label: "Explore one-way intercity car rentals" }
        : vehicleMatch
          ? { href: `/cars/${vehicleMatch[1]}/islamabad/with-driver`, label: `View ${article.title.replace(" Guide", "")} booking options` }
          : article.slug.includes("rawalpindi")
            ? { href: "/rent-a-car-rawalpindi", label: "View car rental with driver in Rawalpindi" }
            : { href: "/rent-a-car-islamabad", label: "View car rental with driver in Islamabad" };
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: article.title, href: `/blog/${article.slug}` },
  ]);
    return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
    {faqSchema && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    )}

    <main className="bg-slate-50 min-h-screen">
      <Breadcrumbs
  title={article.title}
/>
      <Hero
  category={article.category}
  title={article.title}
  description={article.description}
  image={article.image}
  updated={article.date}
  readingTime={article.readTime}
/>

      {/* Content */}

      <section className="py-16">

        <div className="mx-auto grid max-w-6xl gap-14 px-4 lg:grid-cols-[260px_1fr]">

          {/* TOC */}

          <aside>

            <div className="sticky top-28 rounded-3xl bg-white p-6 shadow">

              <h3 className="font-bold">

                Table of Contents

              </h3>

              <ul className="mt-5 space-y-3 text-sm">
                <li>
  <a
    href="#introduction"
    className="text-slate-600 hover:text-[#5BAE4A]"
  >
    Introduction
  </a>
</li>
  {articleContent.sections.map((section) => (
    <li key={section.id}>
      <a
        href={`#${section.id}`}
        className="text-slate-600 hover:text-[#5BAE4A]"
      >
        {section.heading}
      </a>
    </li>
  ))}

  <li>
    <a
      href="#faq"
      className="text-slate-600 hover:text-[#5BAE4A]"
    >
      Frequently Asked Questions
    </a>
  </li>
</ul>

            </div>

          </aside>

          {/* Article */}

          <article className="min-w-0 rounded-3xl bg-white p-10 shadow">
<ArticleContent
  introduction={articleContent.introduction}
  sections={articleContent.sections}
  faq={articleContent.faq}
/>
            <PreferredSourceButton contentType="blog_article" />
            <div className="mt-10 rounded-2xl bg-[#E9F4E6] p-6">
              <p className="font-semibold text-[#0F2B46]">Ready to compare suitable vehicles and pricing?</p>
              <Link href={commercialLink.href} className="mt-3 inline-flex font-bold text-[#347A2A] hover:underline">
                {commercialLink.label} →
              </Link>
            </div>
            <section className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="related-articles">
              <h2 id="related-articles" className="text-2xl font-bold text-[#0F2B46]">Related car rental guides</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link key={related.slug} href={`/blog/${related.slug}`} className="rounded-2xl border border-slate-200 p-5 font-semibold text-[#0F2B46] transition hover:border-[#5BAE4A] hover:text-[#347A2A]">
                    {related.title}
                  </Link>
                ))}
              </div>
            </section>
</article>

        </div>

      </section>

        </main>
  </>
);
}
