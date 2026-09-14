import DispatchAdminNav from "../_components/DispatchAdminNav";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";

export const metadata: Metadata = { title: "WhatsApp Campaigns | RentKA Admin", robots: { index: false, follow: false, noarchive: true, nosnippet: true } };
export const dynamic = "force-dynamic";
export default async function CampaignLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/admin/pricing-calculator");
  return <main className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-7xl"><DispatchAdminNav current="whatsapp-campaigns" /><nav aria-label="Campaign administration" className="mb-6 flex flex-wrap gap-4 font-bold text-[#0F2B46]"><Link href="/admin/whatsapp-campaigns">Campaigns / Audiences</Link><Link href="/admin/whatsapp-campaigns/contacts">Contacts / CSV Import</Link></nav><p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Campaign sending requires a file review, typed confirmation, and the server live-send gate. Importing or previewing never sends messages.</p>{children}</div></main>;
}
