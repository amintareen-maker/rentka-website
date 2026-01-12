"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export type HeroBannerData = {
  title: string;
  subtitle: string;
  ctaText: string;
  images: string[];
  autoScrollInterval?: number;
  active: boolean;
};

export function useHeroBanner(id: string = "hero") {
  const [banner, setBanner] = useState<HeroBannerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "banners", id);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setBanner(snap.data() as HeroBannerData);
      } else {
        setBanner(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  return { banner, loading };
}
