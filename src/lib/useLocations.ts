"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Country = {
  code: string;
  name: string;
};

export type City = {
  id: string;
  name: string;
  supports: {
    serviceWithoutDriver?: boolean;
    serviceWithDriver?: boolean;
  };
};

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "countries"));
      const result: Country[] = [];

      snap.forEach((doc) => {
        const d = doc.data();
        if (d.active) {
          result.push({
            code: doc.id,
            name: d.name ?? doc.id,
          });
        }
      });

      setCountries(result);
    };

    fetch();
  }, []);

  return countries;
}

export function useCities(country?: string) {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (!country) {
      setCities([]);
      return;
    }

    const fetch = async () => {
      const snap = await getDocs(
        collection(db, "countries", country, "cities")
      );

      const result: City[] = [];

      snap.forEach((doc) => {
        const d = doc.data();
        if (d.active) {
          result.push({
            id: doc.id,
            name: d.name ?? doc.id,
            supports: d.supports ?? {},
          });
        }
      });

      setCities(result);
    };

    fetch();
  }, [country]);

  return cities;
}
