// C:\Users\eZhire\rentka-website\src\lib/useBanner.ts

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Banner = {
  imageUrl: string;
  countries?: string[];
  cities?: string[];
  order?: number;
};

type BannerParams = {
  country?: string;
  city?: string;
};

export function useBanner({ country, city }: BannerParams) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const q = query(
          collection(db, "banners"),
          where("active", "==", true),
          orderBy("order", "asc")
        );

        const snap = await getDocs(q);

        let globalBanner: string | null = null;
        let countryBanner: string | null = null;
        let cityBanner: string | null = null;

        snap.forEach((doc) => {
          const data = doc.data() as Banner;

          // City banner
          if (city && data.cities?.includes(city)) {
            cityBanner = data.imageUrl;
          }

          // Country banner
          if (country && data.countries?.includes(country)) {
            countryBanner = data.imageUrl;
          }

          // Global banner
          if (!data.countries && !data.cities) {
            globalBanner = data.imageUrl;
          }
        });

        setBannerUrl(cityBanner || countryBanner || globalBanner);
      } catch (error) {
        console.error("Failed to load banner:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [country, city]);

  return { bannerUrl, loading };
}
