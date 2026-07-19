import Link from "next/link";
import { ArrowRight, Bookmark, Clock3 } from "lucide-react";

import { articles } from "../data";

type ArticleGridProps = {
  limit?: number;
  showHeading?: boolean;
  category?: string;
};

export default function ArticleGrid({
  limit,
  showHeading = true,
  category,
}: ArticleGridProps) {
  const displayedArticles = articles
    .filter(
      (article) =>
        !category ||
        article.category.toLocaleLowerCase().includes(category.toLocaleLowerCase()),
    )
    .slice(0, limit);

  return (
    <>
      {showHeading && (
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#347A2A]">
            Explore the journal
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--rentka-blue)] sm:text-4xl">
            Latest articles
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Useful, locally relevant guidance for every stage of your journey.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {displayedArticles.map((article) => (
          <article
            key={article.slug}
            className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${article.accent}`}>
                {article.category}
              </span>
              <Bookmark className="h-5 w-5 text-slate-300" aria-hidden="true" />
            </div>

            <Link
              href={`/blog/${article.slug}`}
              className="mt-7 block text-xl font-bold leading-snug text-[var(--rentka-blue)] transition hover:text-[var(--rentka-green)]"
            >
              {article.title}
            </Link>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {article.description}
            </p>

            <div className="mt-auto flex items-center justify-between pt-6 text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {article.readTime}
              </span>
              <Link
                href={`/blog/${article.slug}`}
                className="inline-flex items-center gap-1 font-bold text-[#347A2A]"
              >
                Read article
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
