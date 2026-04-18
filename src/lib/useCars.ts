"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* -----------------------------
   Types
------------------------------ */

export type Car = {
  id: string;
  active?: boolean;
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
  model?: string;
  vendorId?: string;


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
  initialCars?: Car[];
};

/* -----------------------------
   Hook
------------------------------ */

export function useCars(
  { country, city, service, initialCars }: UseCarsParams
): { cars: Car[]; loading: boolean } {

  const [cars, setCars] = useState<Car[]>(initialCars || []);
  const [loading, setLoading] = useState(
    !initialCars || initialCars.length === 0
  );

  useEffect(() => {
    if (!country) {
      setCars([]);
      setLoading(false);
      return;
    }

    // If we already have initial cars and no filters selected, skip fetching
    if (initialCars && !city && !service) {
    setLoading(false);
    return;
    }

    const fetchCars = async () => {
      try {
        setLoading(true);

        const ref = collection(db, "countries", country, "cars");

        let q;

        // 🔥 PERFORMANCE RULE
        // If city OR service not selected → limit to 20 cars
        if (!city || !service) {
          q = query(ref, limit(10));
        } else {
          // If both selected → fetch full collection
          q = ref;
        }

        const snap = await getDocs(q);

        const results: Car[] = [];

        snap.forEach((doc) => {
          const data = doc.data() as Omit<Car, "id" | "country">;

          if (data.active === false) return;

          // City filter
          if (city && data.cityList && !data.cityList.includes(city)) return;

          // Service filter
          if (
            service === "selfDrive" &&
            data.supports?.withoutDriver === false
          )
            return;

          if (
            service === "withDriver" &&
            data.supports?.withDriver === false
          )
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