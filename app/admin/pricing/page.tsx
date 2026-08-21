import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";

export const metadata: Metadata = { title: "Pricing & Operations | RentKA Admin", robots: { index: false, follow: false, noarchive: true } };

const cards = [
  { title: "Islamabad / Rawalpindi", description: "Manage existing cars, vendors, availability, within-city and outstation rates.", href: "/admin/pricing/inventory?zone=twin_cities", action: "Manage Cars & Rates" },
  { title: "Lahore", description: "Prepare private Lahore vendors and inventory before the public launch.", href: "/admin/pricing/inventory?zone=lahore", action: "Manage Cars & Rates" },
  { title: "Airport Pricing", description: "Open the existing Islamabad Airport pricing configuration.", href: "/admin/airport-pricing", action: "Manage Airport Rates" },
  { title: "Internal Trip Calculator", description: "Open the existing custom trip pricing calculator.", href: "/admin/pricing-calculator", action: "Calculate Custom Trip" },
];

export default async function PricingOperationsPage() {
  if (!(await hasAdminSession())) redirect("/admin/pricing-calculator");
  return <main className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-6xl">
    <div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[#5BAE4A]">RentKA Admin</p><h1 className="mt-2 text-3xl font-black text-[#0F2B46] md:text-4xl">Pricing &amp; Operations</h1><p className="mt-2 max-w-3xl text-slate-600">Choose the operating context before changing inventory or rates. Lahore remains private until a later launch stage.</p></div>
    <div className="grid gap-5 md:grid-cols-2">{cards.map((card) => <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#5BAE4A] hover:shadow-md"><h2 className="text-xl font-black text-[#0F2B46]">{card.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{card.description}</p><span className="mt-5 inline-flex rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white">{card.action}</span></Link>)}</div>
  </div></main>;
}
