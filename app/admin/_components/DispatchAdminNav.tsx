import Link from "next/link";

export default function DispatchAdminNav({ current }: { current: "vendors" | "vehicles" | "drivers" | "dispatch" | "partner-applications" | "whatsapp-campaigns" }) {
  return <nav className="mb-6 flex flex-wrap items-center gap-2" aria-label="Admin resources">
    <Link href="/admin/pricing" className="mr-2 text-sm font-bold text-[#0F2B46] underline">← Admin</Link>
    {(["vendors", "vehicles", "drivers", "dispatch", "partner-applications", "whatsapp-campaigns"] as const).map((item) => <Link key={item} href={`/admin/${item}`} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${current === item ? "bg-[#0F2B46] text-white" : "bg-white text-[#0F2B46]"}`}>{item === "whatsapp-campaigns" ? "WhatsApp Campaigns" : item.replace("partner-applications","applications")}</Link>)}
  </nav>;
}
