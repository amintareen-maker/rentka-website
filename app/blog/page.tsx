import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { articles } from "./data";
import {
  ArrowRight,
  Bookmark,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "RentKA Journal | Car Rental & Travel Guides in Pakistan",
  description:
    "Practical car rental, airport transfer and road-trip guides for Islamabad, Rawalpindi and Pakistan from RentKA.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "RentKA Journal | Car Rental & Travel Guides in Pakistan",
    description:
      "Helpful car rental and travel guidance for smoother journeys across Pakistan.",
    url: "/blog",
    type: "website",
  },
};

const categories = [
  "All articles",
  "Car rental guides",
  "Islamabad & Rawalpindi",
  "Airport transfers",
  "Road trips",
  "Travel planning",
];


export default function BlogPage() {
  return (
    <main className="overflow-hidden bg-white">
      <section className="relative isolate border-b border-slate-200 bg-[#F7FAFC]">
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5BAE4A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#347A2A] shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                RentKA Journal
              </div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[var(--rentka-blue)] sm:text-5xl lg:text-6xl">
                Better journeys start with better planning.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Straightforward car rental and travel guides for Islamabad,
                Rawalpindi and the roads ahead. Make your next journey more
                comfortable, confident and easy to plan.
              </p>

              <form action="/blog" role="search" className="mt-8 max-w-xl">
                <label htmlFor="blog-search" className="sr-only">
                  Search RentKA Journal
                </label>
                <div className="flex rounded-2xl bg-white p-1.5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 transition focus-within:ring-2 focus-within:ring-[#5BAE4A]">
                  <Search className="ml-3 h-5 w-5 shrink-0 self-center text-slate-400" aria-hidden="true" />
                  <input
                    id="blog-search"
                    name="q"
                    type="search"
                    placeholder="Search travel and rental guides"
                    className="min-w-0 flex-1 border-0 px-3 py-3 text-sm outline-none sm:text-base"
                  />
                  <button type="submit" className="rounded-xl bg-[var(--rentka-blue)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#183d60] sm:px-5">
                    Search
                  </button>
                </div>
              </form>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#5BAE4A]/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] bg-[var(--rentka-blue)] p-2 shadow-2xl shadow-slate-300/70">
                <Image src="/hero-4.webp" alt="A scenic road journey in Pakistan" width={900} height={620} priority className="h-[300px] w-full rounded-[1.6rem] object-cover sm:h-[360px]" />
                <div className="absolute bottom-6 left-6 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F4E6] text-[#347A2A]"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Start local</p><p className="font-bold text-[var(--rentka-blue)]">Islamabad & Rawalpindi</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-label="Article categories">
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
          {categories.map((category, index) => (
            <a key={category} href={index === 0 ? "#latest" : `#${category.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold transition ${index === 0 ? "border-[var(--rentka-blue)] bg-[var(--rentka-blue)] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-[#5BAE4A] hover:text-[#347A2A]"}`}>
              {category}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-6"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#347A2A]">Featured guide</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--rentka-blue)] sm:text-4xl">Plan a better rental experience</h2></div><span className="hidden text-sm font-medium text-slate-500 sm:block">New guides coming soon</span></div>
        <article className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_1.05fr]">
          <div className="relative min-h-72 bg-[#0F2B46]"><Image src="/hero-3.webp" alt="RentKA vehicle ready for a journey" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-85" /><div className="absolute inset-0 bg-gradient-to-t from-[#0F2B46]/60 to-transparent" /><span className="absolute left-6 top-6 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--rentka-blue)]">Coming soon</span></div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12"><div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
  <span className="text-[#347A2A]">
    {articles[0].category}
  </span>

  <span aria-hidden="true">•</span>

  <span className="inline-flex items-center gap-1">
    <Clock3 className="h-4 w-4" aria-hidden="true" />
    {articles[0].readTime}
  </span>
</div>

<h3 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-[var(--rentka-blue)]">
  {articles[0].title}
</h3>

<p className="mt-5 leading-7 text-slate-600">
  {articles[0].description}
</p>

<Link
  href={`/blog/${articles[0].slug}`}
  className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#347A2A] hover:gap-3 transition-all"
>
  Read article
  <ArrowRight className="h-4 w-4" aria-hidden="true" />
</Link></div>
        </article>
      </section>

      <section id="latest" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-10"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#347A2A]">Explore the journal</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--rentka-blue)] sm:text-4xl">Latest articles</h2><p className="mt-3 max-w-2xl text-slate-600">Useful, locally relevant guidance for every stage of your journey.</p></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => <article key={article.slug} className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="flex items-start justify-between gap-4"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${article.accent}`}>{article.category}</span><Bookmark className="h-5 w-5 text-slate-300" aria-hidden="true" /></div><Link
  href={`/blog/${article.slug}`}
  className="mt-7 block text-xl font-bold leading-snug text-[var(--rentka-blue)] hover:text-[var(--rentka-green)] transition"
>
  {article.title}
</Link><p className="mt-3 text-sm leading-6 text-slate-600">{article.description}</p><div className="mt-auto flex items-center justify-between pt-6 text-sm font-semibold"><span className="inline-flex items-center gap-1.5 text-slate-500"><Clock3 className="h-4 w-4" aria-hidden="true" />{article.readTime}</span><Link
  href={`/blog/${article.slug}`}
  className="inline-flex items-center gap-1 text-[#347A2A] font-bold"
>
  Read article <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></Link></div></article>)}
        </div></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="grid gap-8 rounded-[2rem] bg-[var(--rentka-blue)] p-8 text-white md:grid-cols-[1.2fr_0.8fr] md:p-12"><div><div className="inline-flex items-center gap-2 text-sm font-bold text-[#9AD08F]"><CarFront className="h-5 w-5" aria-hidden="true" />Need a car now?</div><h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Find a reliable ride for your next journey.</h2><p className="mt-4 max-w-xl leading-7 text-slate-300">Browse RentKA&apos;s verified car options for airport transfers, city travel, family trips and more.</p></div><div className="flex items-center md:justify-end"><Link href="/cars?city=islamabad&service=with-driver&country=PK" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rentka-green)] px-6 py-4 font-bold text-white transition hover:bg-[var(--rentka-green-hover)] md:w-auto">Browse available cars <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link></div></div></section>

      <section className="border-y border-slate-200 bg-[#F7FAFC]"><div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6"><CheckCircle2 className="mx-auto h-8 w-8 text-[#5BAE4A]" aria-hidden="true" /><p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-[#347A2A]">Journal updates</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--rentka-blue)] sm:text-4xl">Helpful travel guidance, when it&apos;s ready.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">Our newsletter is coming soon. We&apos;ll share practical rental advice, trip-planning ideas and new RentKA guides.</p><div className="mx-auto mt-8 flex max-w-md rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"><input type="email" placeholder="Your email address" aria-label="Your email address" disabled className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm text-slate-500 outline-none" /><button type="button" disabled className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500">Coming soon</button></div></div></section>
    </main>
  );
}
