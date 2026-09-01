import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";

export const metadata: Metadata = { title: "RentKA Operations & Pricing | RentKA Admin", robots: { index: false, follow: false, noarchive: true } };

const cards = [
  { title: "Islamabad / Rawalpindi", description: "Manage existing cars, vendors, availability, within-city and outstation rates.", href: "/admin/pricing/inventory?zone=twin_cities", action: "Manage Cars & Rates" },
  { title: "Lahore", description: "Prepare private Lahore vendors and inventory before the public launch.", href: "/admin/pricing/inventory?zone=lahore", action: "Manage Cars & Rates" },
  { title: "Airport Pricing", description: "Open the existing Islamabad Airport pricing configuration.", href: "/admin/airport-pricing", action: "Manage Airport Rates" },
  { title: "Internal Trip Calculator", description: "Open the existing custom trip pricing calculator.", href: "/admin/pricing-calculator", action: "Calculate Custom Trip" },
];

export default async function PricingOperationsPage() {
  if (!(await hasAdminSession())) redirect("/admin/pricing-calculator");
  return <main className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-6xl">
    <div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[#5BAE4A]">RentKA Admin</p><h1 className="mt-2 text-3xl font-black text-[#0F2B46] md:text-4xl">RentKA Operations &amp; Pricing</h1><p className="mt-2 max-w-3xl text-slate-600">Manage live operations, fleet resources, inventory and pricing from one place.</p></div>
    <div className="grid gap-5 md:grid-cols-2">
      <Link href="/admin/dispatch" className="rounded-2xl border border-[#5BAE4A] bg-[#0F2B46] p-6 text-white shadow-sm transition hover:shadow-md md:col-span-2"><p className="text-xs font-bold uppercase tracking-widest text-green-300">Live operations</p><h2 className="mt-2 text-2xl font-black">Dispatch &amp; Bookings</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">Manage live bookings, payments, vendor payouts, smart matching and driver availability.</p><span className="mt-5 inline-flex rounded-lg bg-[#5BAE4A] px-4 py-2 text-sm font-bold text-white">Open Dispatch Queue</span></Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-[#0F2B46]">Fleet &amp; Drivers</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">Manage operational vendors, physical vehicles and drivers used by Dispatch.</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/admin/vendors" className="rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white">Vendors</Link><Link href="/admin/vehicles" className="rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white">Vehicles</Link><Link href="/admin/drivers" className="rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white">Drivers</Link></div></section>
      <Link href="/admin/partner-applications" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#5BAE4A] hover:shadow-md"><h2 className="text-xl font-black text-[#0F2B46]">Partner Applications</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">Review new Driver / Owner-Driver / Fleet Owner applications before they are approved into Dispatch.</p><span className="mt-5 inline-flex rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white">Review Applications</span></Link>
      {cards.map((card) => <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#5BAE4A] hover:shadow-md"><h2 className="text-xl font-black text-[#0F2B46]">{card.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{card.description}</p><span className="mt-5 inline-flex rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-bold text-white">{card.action}</span></Link>)}
    </div>
  </div></main>;
}
