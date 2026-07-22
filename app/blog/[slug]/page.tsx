import Hero from "../components/Hero";
import ArticleContent from "../components/ArticleContent";
import { articles } from "../data";
import type { Metadata } from "next";
import Breadcrumbs from "../components/Breadcrumbs";
import { articleContents } from "../content";
import { notFound } from "next/navigation";
import { ORGANIZATION_ID } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";

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
    title: `${article.title} | RentKA`,
    description: article.description,

    alternates: {
      canonical: `https://rentka.co/blog/${article.slug}`,
    },

    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://rentka.co/blog/${article.slug}`,
      type: "article",
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

  description: article.description,

  image: `https://rentka.co${article.image}`,

  author: {
    "@id": ORGANIZATION_ID,
  },

  publisher: {
    "@id": ORGANIZATION_ID,
  },

  datePublished: article.date,

  dateModified: article.date,

  mainEntityOfPage: {
    "@type": "WebPage",

    "@id": `https://rentka.co/blog/${article.slug}`,
  },
};
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

          <article className="rounded-3xl bg-white p-10 shadow">
  <ArticleContent
  introduction={articleContent.introduction}
  sections={articleContent.sections}
  faq={articleContent.faq}
/>
</article>

        </div>

      </section>

        </main>
  </>
);
}
