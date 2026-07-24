import Link from "next/link";

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: new URL(item.href, "https://www.rentka.co").toString() } : {}),
    })),
  };
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="hover:text-[#0F2B46] hover:underline">
                {item.name}
              </Link>
            ) : (
              <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
