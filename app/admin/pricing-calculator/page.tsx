import type { Metadata } from "next";
import PricingCalculator from "./_components/PricingCalculator";
import LoginForm from "./_components/LoginForm";
import { hasAdminSession } from "../_lib/session";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Internal Trip Pricing Calculator",
  description: "Private RentKA manual trip pricing calculator.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function PricingCalculatorPage() {
  if (!(await hasAdminSession())) return <LoginForm />;

  return (
    <div className="relative">
      <form action={logout} className="absolute right-4 top-3 z-10">
        <button type="submit" className="rounded-md border border-white/30 px-3 py-1.5 text-sm text-white hover:bg-white/10">
          Log out
        </button>
      </form>
      <PricingCalculator serverRoutesConfigured={Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY)} />
    </div>
  );
}
