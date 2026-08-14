import type { Metadata } from "next";
import { hasTaSession } from "@/lib/ta-connections/session";
import { listTaAirports } from "@/lib/ta-connections/repository";
import { BookingPortal, PortalLogin } from "./_components/Portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "TA Connections Airport Transportation", robots: { index: false, follow: false, noarchive: true, nosnippet: true } };
export default async function Page() {
  if (!(await hasTaSession())) return <PortalLogin />;
  const airports = (await listTaAirports()).filter((airport) => airport.active).map(({ id, code, name }) => ({ id, code, name }));
  return <BookingPortal airports={airports} />;
}
