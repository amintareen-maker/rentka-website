"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";

const browserKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
const placesLibraries: Libraries = ["places"];

type GooglePlacesStatus = "missing" | "loading" | "ready" | "error";
interface GooglePlacesContextValue {
  status: GooglePlacesStatus;
  error?: Error;
}

const GooglePlacesContext = createContext<GooglePlacesContextValue>({
  status: browserKey ? "loading" : "missing",
});

function reportDevelopmentError(reason: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[RentKA Places] ${reason}`, error instanceof Error ? error : undefined);
  }
}

function MissingGooglePlacesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    reportDevelopmentError("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing from the client build.");
  }, []);

  return <GooglePlacesContext.Provider value={{ status: "missing" }}>{children}</GooglePlacesContext.Provider>;
}

function ConfiguredGooglePlacesProvider({ children }: { children: React.ReactNode }) {
  const [authError, setAuthError] = useState<Error>();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: browserKey,
    libraries: placesLibraries,
  });

  useEffect(() => {
    const scope = window as typeof window & { gm_authFailure?: () => void };
    const previous = scope.gm_authFailure;
    scope.gm_authFailure = () => {
      const error = new Error("GOOGLE_MAPS_AUTH_FAILURE");
      setAuthError(error);
      reportDevelopmentError("Google Maps rejected the browser key. Check billing, API enablement, and HTTP referrer restrictions.", error);
      previous?.();
    };
    return () => {
      scope.gm_authFailure = previous;
    };
  }, []);

  useEffect(() => {
    if (loadError) reportDevelopmentError("Google Maps JavaScript API script failed to load.", loadError);
  }, [loadError]);

  const value = useMemo<GooglePlacesContextValue>(() => {
    const error = authError ?? loadError;
    if (error) return { status: "error", error };
    return { status: isLoaded ? "ready" : "loading" };
  }, [authError, isLoaded, loadError]);

  return <GooglePlacesContext.Provider value={value}>{children}</GooglePlacesContext.Provider>;
}

export function GooglePlacesProvider({ children }: { children: React.ReactNode }) {
  if (!browserKey) return <MissingGooglePlacesProvider>{children}</MissingGooglePlacesProvider>;
  return <ConfiguredGooglePlacesProvider>{children}</ConfiguredGooglePlacesProvider>;
}

export function useGooglePlacesLoader() {
  return useContext(GooglePlacesContext);
}

export const googleAutocompleteConfigured = Boolean(browserKey);
