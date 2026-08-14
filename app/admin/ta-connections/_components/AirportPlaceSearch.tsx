"use client";

import { useRef, useState } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { useGooglePlacesLoader } from "../../pricing-calculator/_components/GooglePlacesProvider";
import type { TaAirport } from "@/lib/ta-connections/types";

export interface ResolvedAirportFields {
  name: string;
  city: string;
  country: string;
  googlePlaceId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

const input = "w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm";
const options: google.maps.places.AutocompleteOptions = {
  componentRestrictions: { country: "pk" },
  fields: ["address_components", "formatted_address", "geometry", "name", "place_id", "types"],
  types: ["airport"],
};

const addressPart = (parts: google.maps.GeocoderAddressComponent[] | undefined, type: string) =>
  parts?.find((part) => part.types.includes(type))?.long_name ?? "";

export function AirportPlaceSearch({ airport, onResolved }: { airport?: TaAirport; onResolved: (value?: ResolvedAirportFields) => void }) {
  const loader = useGooglePlacesLoader();
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const [query, setQuery] = useState(airport?.formattedAddress ?? airport?.name ?? "");
  const [resolved, setResolved] = useState(Boolean(airport?.googlePlaceId && airport.location));
  const [error, setError] = useState("");

  const select = () => {
    const place = autocomplete.current?.getPlace();
    const location = place?.geometry?.location;
    if (!place?.place_id || !location) {
      setResolved(false); onResolved(undefined); setError("Select an airport from the Google suggestions."); return;
    }
    if (place.types?.length && !place.types.includes("airport")) {
      setResolved(false); onResolved(undefined); setError("The selected Google result is not identified as an airport."); return;
    }
    const parts = place.address_components;
    const city = addressPart(parts, "locality") || addressPart(parts, "administrative_area_level_2") || addressPart(parts, "administrative_area_level_1");
    const country = addressPart(parts, "country");
    const formattedAddress = place.formatted_address ?? place.name ?? query;
    const value = { name: place.name ?? formattedAddress, city, country, googlePlaceId: place.place_id, formattedAddress, latitude: location.lat(), longitude: location.lng() };
    setQuery(formattedAddress); setResolved(true); setError(""); onResolved(value);
  };

  const textInput = <input className={input} value={query} placeholder="Search airport, e.g. Islamabad International Airport" autoComplete="off" onChange={(event) => { setQuery(event.target.value); setResolved(false); setError(""); onResolved(undefined); }} />;
  return <div>
    {loader.status === "ready" ? <Autocomplete options={options} onLoad={(instance) => { autocomplete.current = instance; }} onUnmount={() => { autocomplete.current = null; }} onPlaceChanged={select}>{textInput}</Autocomplete> : textInput}
    {loader.status === "loading" && <p className="mt-1 text-xs text-slate-500">Loading Google Places…</p>}
    {loader.status === "missing" && <p className="mt-1 text-xs text-red-700">Google Places is unavailable because the browser Maps key is not configured.</p>}
    {loader.status === "error" && <p className="mt-1 text-xs text-red-700">Google Places failed to load. Check Maps API access, billing, and key restrictions.</p>}
    {resolved && <p className="mt-1 text-xs font-medium text-green-700">Resolved Google airport selected.</p>}
    {error && <p className="mt-1 text-xs text-red-700" role="alert">{error}</p>}
  </div>;
}
