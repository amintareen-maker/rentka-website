import Link from "next/link";

type BreadcrumbsProps = {
  title: string;
};

export default function Breadcrumbs({
  title,
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b bg-white"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-4 text-sm">

        <Link
          href="/"
          className="text-slate-500 hover:text-[#5BAE4A]"
        >
          Home
        </Link>

        <span className="text-slate-400">
          /
        </span>

        <Link
          href="/blog"
          className="text-slate-500 hover:text-[#5BAE4A]"
        >
          Blog
        </Link>

        <span className="text-slate-400">
          /
        </span>

        <span className="font-semibold text-[#0F2B46]">
          {title}
        </span>

      </div>
    </nav>
  );
}
