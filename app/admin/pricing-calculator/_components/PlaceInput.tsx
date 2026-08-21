"use client";

import { useId, useRef, useState } from "react";
import { Autocomplete } from "@react-google-maps/api";
import type { ResolvedPlace } from "../_lib/types";
import { input } from "./Controls";
import { googleAutocompleteConfigured, useGooglePlacesLoader } from "./GooglePlacesProvider";

function reportDevelopmentError(reason: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[RentKA Places] ${reason}`, error instanceof Error ? error : undefined);
  }
}

type SearchStatus = "idle" | "loading" | "unavailable" | "error";

const autocompleteOptions: google.maps.places.AutocompleteOptions = {
  componentRestrictions: { country: "pk" },
  fields: ["formatted_address", "name", "place_id", "geometry"],
};

interface PlaceInputProps {
  id?: string;
  value: string;
  place?: ResolvedPlace;
  onTextChange: (value: string) => void;
  onSelect: (place: ResolvedPlace) => void;
  placeholder?: string;
  selectionRequired?: boolean;
}

export function PlaceInput({ id, value, place, onTextChange, onSelect, placeholder, selectionRequired = false }: PlaceInputProps) {
  const mapsLoader = useGooglePlacesLoader();
  const generatedId = useId();
  const statusId = `${id ?? generatedId}-status`;
  const [placeError, setPlaceError] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchStatus: SearchStatus = mapsLoader.status === "missing"
    ? "unavailable"
    : mapsLoader.status === "error" || placeError
      ? "error"
      : mapsLoader.status === "loading"
        ? "loading"
        : "idle";

  const handlePlaceChanged = () => {
    const selected = autocompleteRef.current?.getPlace();
    const location = selected?.geometry?.location;
    if (!selected || !location) {
      const error = new Error("PLACE_LOCATION_MISSING");
      setPlaceError(true);
      reportDevelopmentError("Selected place details could not be resolved.", error);
      return;
    }

    const formattedAddress = selected.formatted_address ?? selected.name ?? value;
    onSelect({
      placeId: selected.place_id ?? "",
      displayName: selected.name ?? formattedAddress,
      formattedAddress,
      lat: location.lat(),
      lng: location.lng(),
    });
    setPlaceError(false);
  };

  const textInput = (
    <input
      id={id}
      className={input}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      required={selectionRequired}
      onChange={(event) => {
        onTextChange(event.target.value);
        setPlaceError(false);
      }}
      aria-describedby={searchStatus !== "idle" ? statusId : undefined}
    />
  );

  return (
    <div className="relative">
      {mapsLoader.status === "ready" ? (
        <Autocomplete
          onLoad={(instance) => { autocompleteRef.current = instance; }}
          onUnmount={() => { autocompleteRef.current = null; }}
          onPlaceChanged={handlePlaceChanged}
          options={autocompleteOptions}
        >
          {textInput}
        </Autocomplete>
      ) : textInput}
      {place && <span className="mt-1 block text-xs font-medium text-green-700">Resolved: {place.formattedAddress}</span>}
      {searchStatus === "unavailable" && <span id={statusId} className="mt-1 block text-xs text-amber-700">{selectionRequired ? "Google location selection is required, but autocomplete is unavailable." : "Autocomplete unavailable — manual entry remains enabled."}</span>}
      {searchStatus === "loading" && <span id={statusId} className="mt-1 block text-xs text-slate-500">Loading Places autocomplete…</span>}
      {searchStatus === "error" && <span id={statusId} className="mt-1 block text-xs text-red-700">Places search unavailable. Check the browser key, APIs, billing, and referrer restrictions.</span>}
    </div>
  );
}

export { googleAutocompleteConfigured };
