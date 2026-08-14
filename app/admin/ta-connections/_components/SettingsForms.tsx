"use client";

import { useActionState, useState } from "react";
import { loginToTaAdmin, saveAirportAction, saveRateSetAction, type AdminActionState } from "../actions";
import { TA_CONTRACT_DISTANCE_BANDS, TA_VEHICLE_CATEGORIES, type TaAirport } from "@/lib/ta-connections/types";
import { AirportPlaceSearch, type ResolvedAirportFields } from "./AirportPlaceSearch";

const initial: AdminActionState = {};
const labels = { ECONOMY_SEDAN: "Economy Sedan (1–4)", MPV: "MPV (1–6)", SUV: "SUV (1–6)", HIACE: "Hiace (up to 12)" } as const;
const input = "w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm";

function Result({ state }: { state: AdminActionState }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>;
  if (state.success) return <p role="status" className="text-sm font-medium text-green-700">{state.success}</p>;
  return null;
}

export function TaAdminLogin() {
  const [state, action, pending] = useActionState(loginToTaAdmin, initial);
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4"><section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-sm font-bold uppercase tracking-widest text-[#4d8f43]">RentKA Internal</p><h1 className="mt-2 text-2xl font-bold text-[#0F2B46]">TA Connections Admin</h1><form action={action} className="mt-6 space-y-4"><label className="block text-sm font-medium text-slate-700">Admin password<input name="password" type="password" autoComplete="current-password" required autoFocus className={`${input} mt-1`} /></label><Result state={state} /><button disabled={pending} className="w-full rounded-lg bg-[#0F2B46] px-4 py-2.5 font-semibold text-white disabled:opacity-60">{pending ? "Checking…" : "Access settings"}</button></form></section></main>;
}

export function AirportForm({ airport }: { airport?: TaAirport }) {
  const [state, action, pending] = useActionState(saveAirportAction, initial);
  const [resolved, setResolved] = useState<ResolvedAirportFields | undefined>(airport?.googlePlaceId && airport.location ? { name: airport.name, city: airport.city, country: airport.country, googlePlaceId: airport.googlePlaceId, formattedAddress: airport.formattedAddress ?? airport.name, latitude: airport.location.latitude, longitude: airport.location.longitude } : undefined);
  return <form action={action} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
    {airport && <input type="hidden" name="airportId" value={airport.id} />}
    <label className="text-sm md:col-span-2"><span className="mb-1 block font-semibold">Search airport</span><AirportPlaceSearch airport={airport} onResolved={setResolved} /></label>
    <input type="hidden" name="googlePlaceId" value={resolved?.googlePlaceId ?? ""} />
    <input type="hidden" name="formattedAddress" value={resolved?.formattedAddress ?? ""} />
    <input type="hidden" name="latitude" value={resolved?.latitude ?? ""} />
    <input type="hidden" name="longitude" value={resolved?.longitude ?? ""} />
    <label className="text-sm">Airport name<input key={`name-${resolved?.googlePlaceId}`} className={input} name="airportName" defaultValue={resolved?.name ?? airport?.name} required /></label>
    <label className="text-sm">IATA code<input className={input} name="iataCode" defaultValue={airport?.code} maxLength={3} required /></label>
    <label className="text-sm">City<input key={`city-${resolved?.googlePlaceId}`} className={input} name="city" defaultValue={resolved?.city || airport?.city} required /></label>
    <label className="text-sm">Country<input key={`country-${resolved?.googlePlaceId}`} className={input} name="country" defaultValue={resolved?.country || airport?.country || "Pakistan"} required /></label>
    <label className="text-sm">Currency<input className={input} name="currency" defaultValue={airport?.currency ?? "PKR"} maxLength={3} required /></label>
    <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-600"><span className="block font-medium">Google address</span>{resolved?.formattedAddress || "Select a Google airport result"}</div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={airport?.active ?? true} /> Active</label>
    <div className="flex items-center justify-end gap-3"><Result state={state} /><button disabled={pending || !resolved} className="rounded-md bg-[#0F2B46] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : airport ? "Update airport" : "Add airport"}</button></div>
  </form>;
}

export function RateSetForm({ airports, hasActiveContract }: { airports: TaAirport[]; hasActiveContract: boolean }) {
  const [state, action, pending] = useActionState(saveRateSetAction, initial);
  return <form action={action} onSubmit={(event) => { if (hasActiveContract && !window.confirm("Create a new contract version and supersede the currently active version for the selected airport?")) event.preventDefault(); }} className="space-y-5 rounded-xl border border-slate-200 bg-white p-4">
    <div className="grid gap-3 md:grid-cols-3">
      <label className="text-sm">Airport<select className={input} name="airportId" required><option value="">Select airport</option>{airports.filter((a) => a.active).map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}</select></label>
      <label className="text-sm">Effective from<input className={input} name="effectiveFrom" type="date" required /></label>
      <label className="text-sm">TA commission %<input className={input} name="commissionPercent" type="number" min="10" max="15" step="0.01" required /></label>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Vehicle category</th>{TA_CONTRACT_DISTANCE_BANDS.map((band) => <th className="p-2" key={band}>Up to {band} km</th>)}<th className="p-2">Per km over 50</th></tr></thead><tbody>{TA_VEHICLE_CATEGORIES.map((category) => <tr className="border-t border-slate-200" key={category}><th className="p-2 text-left">{labels[category]}</th>{TA_CONTRACT_DISTANCE_BANDS.map((band) => <td className="p-1" key={band}><input aria-label={`${labels[category]} up to ${band} km PKR`} className={input} name={`${category}_${band}`} inputMode="decimal" placeholder="PKR" required /></td>)}<td className="p-1"><input aria-label={`${labels[category]} per km over 50 PKR`} className={input} name={`${category}_over50`} inputMode="decimal" placeholder="PKR" required /></td></tr>)}</tbody></table></div>
    <div className="grid gap-3 md:grid-cols-3">
      <label className="text-sm">Waiting policy<textarea className={input} name="waitingPolicy" rows={3} required /></label>
      <label className="text-sm">Cancellation policy<textarea className={input} name="cancellationPolicy" rows={3} required /></label>
      <label className="text-sm">No-show policy<textarea className={input} name="noShowPolicy" rows={3} required /></label>
    </div>
    <p className="text-xs text-slate-500">Amounts are entered in PKR and stored as integer minor units. Over 50 km, the fixed 50 km rate is combined with the precise excess distance multiplied by this vehicle category&apos;s additional per-km rate.</p>
    <div className="flex items-center justify-end gap-3"><Result state={state} /><button disabled={pending || airports.every((a) => !a.active)} className="rounded-md bg-[#0F2B46] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Creating…" : "Create contract version"}</button></div>
  </form>;
}
