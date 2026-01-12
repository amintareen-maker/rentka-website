"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* -----------------------------
   Types
------------------------------ */

export type Car = {
  id: string;
  name: string;
  category: string;
  imageURL: string;
  country: string;
  cityList?: string[];
  transmission?: string;
  fuelType?: string;
  seatingCapacity?: string;
  depositAmount?: number;
  modelYear?: number;
  modelYearLabel?: string;

  pricing?: {
    selfDrive?: {
      withinCity?: {
        daily?: number;
        weekly?: number;
        monthly?: number;
      };
      outsideCity?: {
        daily?: number;
        weekly?: number;
        monthly?: number;
      };
    };
    withDriver?: {
      withinCity?: {
        daily?: number;
        weekly?: number;
        monthly?: number;
      };
      outsideCity?: {
        daily?: number;
        weekly?: number;
        monthly?: number;
      };
    };
  };

  supports?: {
    withoutDriver?: boolean;
    withDriver?: boolean;
    withinCity?: boolean;
    outsideCity?: boolean;
  };
};

export type UseCarsParams = {
  country: string;
  city?: string;
  service?: "selfDrive" | "withDriver";
};

/* -----------------------------
   Hook
------------------------------ */

export function useCars({ country, city, service }: UseCarsParams) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!country) {
      setCars([]);
      setLoading(false);
      return;
    }

    const fetchCars = async () => {
      try {
        setLoading(true);

        const ref = collection(db, "countries", country, "cars");
        const snap = await getDocs(ref);

        const results: Car[] = [];

        snap.forEach((doc) => {
          const data = doc.data() as Omit<Car, "id" | "country">;

          // City filter
          if (city && data.cityList && !data.cityList.includes(city)) return;

          // Service filter
          if (service === "selfDrive" && data.supports?.withoutDriver === false)
            return;

          if (service === "withDriver" && data.supports?.withDriver === false)
            return;

          results.push({
            ...data,
            id: doc.id,
            country,
          });
        });

        setCars(results);
      } catch (error) {
        console.error("Failed to load cars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [country, city, service]);

  return { cars, loading };
}
