import Image from "next/image";
import Link from "next/link";

import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { buildGuideArticleSchema, GUIDE_CITIES, guidePath, type TravelGuide } from "@/lib/travel-guides";

export default function GuideArticle({ guide }: { guide: TravelGuide }) {
  const city = GUIDE_CITIES[guide.city];
  const path = guidePath(guide);
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Travel Guides", href: "/travel-guides" },
    { name: city.name, href: city.href },
    { name: guide.title, href: path },
  ];

  return (
    <main className="bg-slate-50 pb-16">
      <JsonLd id="guide-article-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildGuideArticleSchema(guide)) }} />
      <JsonLd id="guide-breadcrumb-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }} />

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="relative aspect-[16/9] w-full">
          <Image src={guide.featuredImage} alt={guide.featuredImageAlt} fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
        </div>
        <div className="p-6 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-wider text-[#347A2A]">{city.name} travel guide</p>
          <h1 className="mt-3 text-3xl font-black text-[#0F2B46] sm:text-5xl">{guide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{guide.summary}</p>
          <p className="mt-4 text-sm text-slate-500">Published {guide.datePublished}{guide.readTime ? ` · ${guide.readTime}` : ""}</p>

          <div className="prose prose-slate mt-10 max-w-none">
            {guide.sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
          </div>

          <aside className="mt-12 rounded-2xl bg-[#E9F4E6] p-6" aria-labelledby="guide-rentka-options">
            <h2 id="guide-rentka-options" className="text-xl font-bold text-[#0F2B46]">Plan the journey with RentKA</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {guide.commercialLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-xl bg-white p-4 transition hover:shadow">
                  <span className="font-bold text-[#347A2A]">{link.label} →</span>
                  <span className="mt-1 block text-sm text-slate-600">{link.description}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
