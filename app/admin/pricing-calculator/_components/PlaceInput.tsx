"use client";
import { useEffect,useRef,useState } from "react";
import type { ResolvedPlace } from "../_lib/types";
import { input } from "./Controls";

const browserKey=process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY??"";
let mapsPromise:Promise<google.maps.PlacesLibrary>|undefined;
function loadPlaces(){
 if(!browserKey)return Promise.reject(new Error("MISSING_BROWSER_KEY"));
 if(mapsPromise)return mapsPromise;
 const scope=globalThis as unknown as {google?:{maps?:typeof google.maps&{__ib__?:()=>void}}};
 const googleRoot=scope.google??(scope.google={});
 const maps:typeof google.maps&{__ib__?:()=>void}=googleRoot.maps??(googleRoot.maps={} as typeof google.maps);
 const libraries=new Set<string>();
 let loader:Promise<void>|undefined;
 const loadScript=()=>loader??(loader=new Promise<void>((resolve,reject)=>{
  const script=document.createElement("script");
  const params=new URLSearchParams({key:browserKey,v:"weekly",loading:"async",callback:"google.maps.__ib__"});
  params.set("libraries",[...libraries].join(","));
  maps.__ib__=resolve;
  script.id="rentka-calculator-maps";
  script.src=`https://maps.googleapis.com/maps/api/js?${params}`;
  script.async=true;
  script.onerror=()=>reject(new Error("MAPS_LOAD_FAILED"));
  document.head.appendChild(script);
 }));
 if(typeof maps.importLibrary!=="function")maps.importLibrary=((libraryName:string)=>{libraries.add(libraryName);return loadScript().then(()=>maps.importLibrary(libraryName))}) as typeof maps.importLibrary;
 mapsPromise=maps.importLibrary("places").then((library)=>library as google.maps.PlacesLibrary);
 return mapsPromise;
}

interface Suggestion { text:string; prediction:google.maps.places.PlacePrediction; }
export function PlaceInput({id,value,place,onTextChange,onSelect,placeholder}:{id?:string;value:string;place?:ResolvedPlace;onTextChange:(value:string)=>void;onSelect:(place:ResolvedPlace)=>void;placeholder?:string}){
 const [suggestions,setSuggestions]=useState<Suggestion[]>([]);const [status,setStatus]=useState<"idle"|"loading"|"unavailable"|"error">(browserKey?"idle":"unavailable");const tokenRef=useRef<google.maps.places.AutocompleteSessionToken|undefined>(undefined);const requestRef=useRef(0);
 useEffect(()=>{const trimmed=value.trim();if(!browserKey||trimmed.length<2||place){setSuggestions([]);return}const requestId=++requestRef.current;const timer=window.setTimeout(async()=>{setStatus("loading");try{const library=await loadPlaces();if(!tokenRef.current)tokenRef.current=new library.AutocompleteSessionToken();const request={input:trimmed,sessionToken:tokenRef.current,region:"pk",language:"en",locationBias:{center:{lat:33.6844,lng:73.0479},radius:50000},includedRegionCodes:["pk"]} as google.maps.places.AutocompleteRequest;const response=await library.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);if(requestId!==requestRef.current)return;setSuggestions(response.suggestions.flatMap((suggestion)=>suggestion.placePrediction?[{text:suggestion.placePrediction.text.toString(),prediction:suggestion.placePrediction}]:[]));setStatus("idle")}catch{if(requestId===requestRef.current){setSuggestions([]);setStatus("error")}}},350);return()=>window.clearTimeout(timer)},[value,place]);
 const choose=async(suggestion:Suggestion)=>{try{const selected=suggestion.prediction.toPlace();await selected.fetchFields({fields:["id","displayName","formattedAddress","location"]});if(!selected.id||!selected.location)throw new Error("UNRESOLVED_PLACE");onSelect({placeId:selected.id,displayName:selected.displayName??suggestion.text,formattedAddress:selected.formattedAddress??suggestion.text,lat:selected.location.lat(),lng:selected.location.lng()});setSuggestions([]);tokenRef.current=undefined;setStatus("idle")}catch{setStatus("error")}};
 return <div className="relative"><input id={id} className={input} value={value} placeholder={placeholder} autoComplete="off" onChange={(event)=>{onTextChange(event.target.value);setSuggestions([])}} aria-describedby={status!=="idle"?`${id}-status`:undefined}/>{place&&<span className="mt-1 block text-xs font-medium text-green-700">Resolved: {place.formattedAddress}</span>}{status==="unavailable"&&<span id={`${id}-status`} className="mt-1 block text-xs text-amber-700">Autocomplete unavailable — manual entry remains enabled.</span>}{status==="loading"&&<span id={`${id}-status`} className="mt-1 block text-xs text-slate-500">Searching places…</span>}{status==="error"&&<span id={`${id}-status`} className="mt-1 block text-xs text-red-700">Places search unavailable. Check the browser key, APIs, billing, and referrer restrictions.</span>}{suggestions.length>0&&<ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">{suggestions.map((suggestion)=><li key={`${suggestion.prediction.placeId}-${suggestion.text}`}><button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={()=>void choose(suggestion)}>{suggestion.text}</button></li>)}</ul>}</div>
}
export const googleAutocompleteConfigured=Boolean(browserKey);
