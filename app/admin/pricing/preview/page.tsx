import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../../_lib/session";
import { resolveNormalRentalInventory } from "@/lib/normal-rental/inventory-resolver";
import { getNormalRentalBookingContext } from "@/lib/normal-rental/zones";
import LahorePreviewClient from "./PreviewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Private Lahore Rental Preview | RentKA Admin",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function LahorePreviewPage() {
  if (!(await hasAdminSession())) redirect("/admin/pricing-calculator");
  const context = getNormalRentalBookingContext("lahore");
  const inventory = await resolveNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", service: "withDriver" });
  return <main className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-6xl">
    <Link href="/admin/pricing/inventory?zone=lahore" className="text-sm font-bold text-[#0F2B46] underline">← Lahore inventory</Link>
    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Authenticated private preview. Lahore is not publicly launched, and analytics are suppressed on this page.</div>
    <header className="py-8"><p className="text-sm font-bold uppercase tracking-widest text-[#5BAE4A]">Private customer-flow test</p><h1 className="mt-2 text-4xl font-black text-[#0F2B46]">Rent a Car in Lahore</h1><p className="mt-3 text-slate-600">Active, vendor-validated Lahore inventory only.</p></header>
    <LahorePreviewClient inventory={inventory} context={context}/>
  </div></main>;
}
