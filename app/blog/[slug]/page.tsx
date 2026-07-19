import Hero from "../components/Hero";
import ArticleContent from "../components/ArticleContent";
import { articles } from "../data";
import type { Metadata } from "next";
import Breadcrumbs from "../components/Breadcrumbs";
import { articleContents } from "../content";

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
      canonical: `/blog/${article.slug}`,
    },

    openGraph: {
      title: article.title,
      description: article.description,
      url: `/blog/${article.slug}`,
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
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-4xl font-bold">
          Article not found
        </h1>

        <p className="mt-4 text-slate-600">
          The requested article doesn't exist.
        </p>
      </main>
    );
  }

  const articleContent =
  articleContents[slug as keyof typeof articleContents];
  

if (!articleContent) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold">
        Article content not found
      </h1>

      <p className="mt-4 text-slate-600">
        The article exists, but its content has not been registered.
      </p>
    </main>
  );
}

  const jsonLd = {
  "@context": "https://schema.org",

  "@type": "Article",

  headline: article.title,

  description: article.description,

  image: `https://rentka.co${article.image}`,

  author: {
    "@type": "Organization",
    name: "RentKA",
  },

  publisher: {
    "@type": "Organization",

    name: "RentKA",

    logo: {
      "@type": "ImageObject",

      url: "https://rentka.co/logo.png",
    },
  },

  datePublished: article.date,

  dateModified: article.date,

  mainEntityOfPage: {
    "@type": "WebPage",

    "@id": `https://rentka.co/blog/${article.slug}`,
  },
};
    return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
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