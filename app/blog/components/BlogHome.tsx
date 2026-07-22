"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  CarFront,
  ChevronDown,
  Clock3,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";

import { articles } from "../data";
import type { Article } from "../types";

const PAGE_SIZE = 9;
const featuredSlugs = [
  "how-to-rent-a-car-in-islamabad-rawalpindi",
  "airport-car-rental-islamabad-guide",
  "one-way-car-rental-islamabad-guide",
];

const categoryGroups = [
  { id: "all", label: "All Articles" },
  { id: "car-rental", label: "Car Rental Guides" },
  { id: "intercity", label: "Intercity Travel" },
  { id: "northern", label: "Northern Areas" },
  { id: "airport", label: "Airport Transfers" },
  { id: "business", label: "Corporate & Monthly" },
  { id: "vehicle", label: "Vehicle Guides" },
];

function matchesCategory(article: Article, group: string) {
  const category = article.category.toLowerCase();
  if (group === "all") return true;
  if (group === "car-rental") {
    return [
      "car rental guide",
      "one-way travel guide",
      "wedding transportation guide",
      "premium travel guide",
      "chauffeur service guide",
      "family travel guide",
      "tourist transportation guide",
    ].includes(category);
  }
  if (group === "intercity") {
    return ["intercity travel guide", "road trip guide", "one-way travel guide"].includes(category);
  }
  if (group === "northern") {
    return [
      "northern areas travel guide",
      "azad kashmir travel guide",
      "hill station travel guide",
      "travel guide",
    ].includes(category);
  }
  if (group === "airport") return category === "airport transfer guide";
  if (group === "business") {
    return ["corporate travel guide", "long-term rental guide"].includes(category);
  }
  return category === "vehicle rental guide";
}

function ArticleImage({
  article,
  sizes,
  priority = false,
}: {
  article: Article;
  sizes: string;
  priority?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div
        role="img"
        aria-label={article.title + " image unavailable"}
        className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F2B46] px-4 text-center text-white"
      >
        <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#9AD08F]">
          RentKA Journal
        </span>
        <span className="mt-2 text-xs font-semibold text-slate-300">
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    <Image
      src={article.image}
      alt={article.title + " travel guide"}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setImageFailed(true)}
      className="object-cover transition duration-500 group-hover:scale-[1.03]"
    />
  );
}

function FeaturedCard({ article, large = false }: { article: Article; large?: boolean }) {
  const cardClass = large
    ? "group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl lg:grid lg:grid-cols-[1.08fr_0.92fr]"
    : "group grid grid-cols-[0.82fr_1.18fr] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[190px]";
  const imageClass = large
    ? "relative block min-h-64 overflow-hidden bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5BAE4A]/40 lg:min-h-[390px]"
    : "relative block min-h-44 overflow-hidden bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5BAE4A]/40";

  return (
    <article className={cardClass}>
      <Link
        href={"/blog/" + article.slug}
        className={imageClass}
        aria-label={"Read " + article.title}
      >
        <ArticleImage
          article={article}
          priority={large}
          sizes={large ? "(max-width: 1024px) 100vw, 42vw" : "(max-width: 640px) 40vw, 240px"}
        />
      </Link>
      <div className={large ? "flex flex-col justify-center p-7 sm:p-9" : "flex min-w-0 flex-col justify-center p-5 sm:p-6"}>
        <span className={"w-fit rounded-full px-3 py-1.5 text-xs font-bold " + article.accent}>
          {article.category}
        </span>
        <h3 className={large ? "mt-5 text-2xl font-extrabold leading-tight text-[#0F2B46] sm:text-3xl" : "mt-3 text-lg font-extrabold leading-snug text-[#0F2B46] sm:text-xl"}>
          <Link
            href={"/blog/" + article.slug}
            className="rounded-sm transition hover:text-[#347A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]"
          >
            {article.title}
          </Link>
        </h3>
        {large && <p className="mt-4 text-base leading-7 text-slate-600">{article.description}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {article.readTime}
          </span>
          <Link
            href={"/blog/" + article.slug}
            className="inline-flex items-center gap-1 rounded-sm font-bold text-[#347A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]"
          >
            Read Article
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-within:shadow-xl">
      <Link
        href={"/blog/" + article.slug}
        className="relative block aspect-[16/9] overflow-hidden bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#5BAE4A]"
        aria-label={"Read " + article.title}
      >
        <ArticleImage
          article={article}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <span className={"w-fit rounded-full px-3 py-1.5 text-xs font-bold " + article.accent}>
          {article.category}
        </span>
        <h3 className="mt-5 text-xl font-extrabold leading-snug text-[#0F2B46]">
          <Link
            href={"/blog/" + article.slug}
            className="rounded-sm transition hover:text-[#347A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 text-base leading-7 text-slate-600">{article.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {article.readTime}
          </span>
          <Link
            href={"/blog/" + article.slug}
            className="inline-flex items-center gap-1 rounded-sm font-bold text-[#347A2A] transition hover:text-[#0F2B46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]"
          >
            Read Article
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function GuideLinks({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Article[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
      <h2 className="text-xl font-extrabold text-[#0F2B46]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <ul className="mt-5 divide-y divide-slate-100">
        {items.slice(0, 6).map((article) => (
          <li key={article.slug}>
            <Link
              href={"/blog/" + article.slug}
              className="group/link flex items-center justify-between gap-4 rounded-lg py-3 text-sm font-bold leading-5 text-slate-700 transition hover:text-[#347A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]"
            >
              <span>{article.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#5BAE4A] transition group-hover/link:translate-x-1" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function BlogHome() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const featuredArticles = featuredSlugs
    .map((slug) => articles.find((article) => article.slug === slug))
    .filter((article): article is Article => Boolean(article));

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const isDefaultView = category === "all" && !normalizedQuery;

    return articles.filter((article) => {
      if (isDefaultView && featuredSlugs.includes(article.slug)) return false;
      if (!matchesCategory(article, category)) return false;
      if (!normalizedQuery) return true;
      return [article.title, article.description, article.category, article.keywords.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [category, query]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);

  const curatedSections = [
    {
      title: "Popular Intercity Routes",
      description: "Plan comfortable chauffeur-driven journeys between Islamabad and major cities.",
      items: articles.filter((article) =>
        ["Intercity Travel Guide", "Road Trip Guide", "One-Way Travel Guide"].includes(article.category),
      ),
    },
    {
      title: "Northern Pakistan Travel Guides",
      description: "Practical route advice for mountain destinations, valleys and hill stations.",
      items: articles.filter((article) =>
        ["Northern Areas Travel Guide", "Azad Kashmir Travel Guide", "Hill Station Travel Guide", "Travel Guide"].includes(article.category),
      ),
    },
    {
      title: "Car Rental Services in Islamabad",
      description: "Find the right chauffeur-driven service for work, family travel and special occasions.",
      items: articles.filter((article) =>
        ["Corporate Travel Guide", "Long-Term Rental Guide", "Wedding Transportation Guide", "Premium Travel Guide", "Chauffeur Service Guide", "Family Travel Guide"].includes(article.category),
      ),
    },
    {
      title: "Vehicle Rental Guides",
      description: "Compare popular RentKA vehicle options before making your booking.",
      items: articles.filter((article) => article.category === "Vehicle Rental Guide"),
    },
  ];

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVisibleCount(PAGE_SIZE);
    document.getElementById("latest-guides")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="overflow-x-clip bg-white">
      <section className="border-b border-slate-200 bg-[#F7FAFC]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5BAE4A]/25 bg-white px-4 py-2 text-sm font-bold text-[#347A2A] shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              RentKA Journal
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0F2B46] sm:text-5xl lg:text-6xl">
              Car Rental &amp; Travel Guides for Pakistan
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Helpful guidance for chauffeur-driven car rentals in Islamabad
              and Rawalpindi, airport transfers, intercity journeys and
              unforgettable trips across northern Pakistan.
            </p>
            <p className="mt-3 text-sm font-bold text-[#347A2A]">Car rentals. Made simple.</p>
            <form onSubmit={handleSearch} role="search" className="mt-8 max-w-xl">
              <label htmlFor="blog-search" className="sr-only">Search RentKA travel guides</label>
              <div className="flex min-w-0 rounded-2xl bg-white p-1.5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-[#5BAE4A]">
                <Search className="ml-3 h-5 w-5 shrink-0 self-center text-slate-400" aria-hidden="true" />
                <input
                  id="blog-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search routes, vehicles or services"
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-base outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F2B46] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#183d60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] focus-visible:ring-offset-2 sm:px-5"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/60">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-[#E9F4E6]">
                <Image
                  src="/blog/blog-cover1.webp"
                  alt="RentKA chauffeur-driven car rental and travel guides"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  priority
                  className="object-contain"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-[#5BAE4A]" aria-hidden="true" />
              Islamabad, Rawalpindi and journeys across Pakistan
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Filter articles by topic" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2.5">
            {categoryGroups.map((group) => {
              const selected = category === group.id;
              const buttonClass = selected
                ? "rounded-full border border-[#0F2B46] bg-[#0F2B46] px-4 py-2.5 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] focus-visible:ring-offset-2"
                : "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-[#5BAE4A] hover:text-[#347A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] focus-visible:ring-offset-2";
              return (
                <button
                  key={group.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setCategory(group.id);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={buttonClass}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#347A2A]">Start here</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F2B46] sm:text-4xl">
            Featured Car Rental Guides
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Essential guidance for booking, airport pickups and one-way travel
            with a professional chauffeur.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          {featuredArticles[0] && <FeaturedCard article={featuredArticles[0]} large />}
          <div className="grid gap-5">
            {featuredArticles.slice(1).map((article) => (
              <FeaturedCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section id="latest-guides" className="scroll-mt-24 bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#347A2A]">Explore the journal</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F2B46] sm:text-4xl">
                {query || category !== "all" ? "Matching Guides" : "Latest Articles"}
              </h2>
              <p className="mt-3 text-base text-slate-600" aria-live="polite">
                {articles.length} articles available
              </p>
            </div>
            {(query || category !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setVisibleCount(PAGE_SIZE);
                }}
                className="w-fit rounded-lg text-sm font-bold text-[#347A2A] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]"
              >
                Clear filters
              </button>
            )}
          </div>

          {visibleArticles.length > 0 ? (
            <>
              <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleArticles.map((article) => <ArticleCard key={article.slug} article={article} />)}
              </div>
              {visibleCount < filteredArticles.length && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#0F2B46] bg-white px-6 py-3.5 font-bold text-[#0F2B46] transition hover:bg-[#0F2B46] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] focus-visible:ring-offset-2"
                  >
                    Load More Articles
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-9 rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <Search className="mx-auto h-7 w-7 text-[#5BAE4A]" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-extrabold text-[#0F2B46]">No matching guides found</h3>
              <p className="mt-2 text-slate-600">Try another search term or clear the selected category.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#347A2A]">Browse by travel need</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F2B46] sm:text-4xl">
            Find the Right Guide for Your Journey
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {curatedSections.map((section) => <GuideLinks key={section.title} {...section} />)}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-[#0F2B46] p-8 text-white shadow-xl md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-12">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-[#9AD08F]">
              <CarFront className="h-5 w-5" aria-hidden="true" />
              Chauffeur-driven travel
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Planning your journey?</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
              Get a transparent quotation for chauffeur-driven airport
              transfers, intercity travel, corporate transport and family trips.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <a
              href="https://wa.me/923020589999?text=Hi%20RentKA,%20I%20would%20like%20a%20car%20rental%20quotation."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5BAE4A] px-6 py-4 font-bold text-white transition hover:bg-[#4E9C3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2B46] md:w-auto"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Get Quote on WhatsApp
            </a>
            <Link
              href="/one-way-drop"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:w-auto"
            >
              View One-Way Routes
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
