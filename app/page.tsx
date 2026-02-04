import HeroBanner from "@/components/HeroBanner";
import HomePageClient from "@/components/HomePageClient";

export const metadata = {
  title: "Verified Car Rentals in Your City | RentKA",
  description:
    "Find verified rental cars from trusted local partners. Self-drive or with driver. No upfront payment required.",
};

export default function Page() {
  return (
    <>
      <HeroBanner />
      <HomePageClient />
    </>
  );
}
