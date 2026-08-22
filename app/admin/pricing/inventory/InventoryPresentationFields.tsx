"use client";

import { useState } from "react";

const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5BAE4A] focus:ring-2 focus:ring-[#5BAE4A]/20";

export default function InventoryPresentationFields({ showAsSeparateCard = false, publicLabel = "" }: { showAsSeparateCard?: boolean; publicLabel?: string }) {
  const [separate, setSeparate] = useState(showAsSeparateCard);
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <label className="flex items-start gap-3 text-sm font-bold text-slate-800">
      <input name="showAsSeparateCard" type="checkbox" defaultChecked={showAsSeparateCard} onChange={(event) => setSeparate(event.target.checked)} className="mt-0.5"/>
      <span>Show as separate vehicle card<span className="mt-1 block text-xs font-normal leading-5 text-slate-500">When enabled, this inventory option will appear as its own vehicle card instead of being grouped with other options for the same model.</span></span>
    </label>
    {separate && <label className="mt-4 block text-sm font-semibold text-slate-700">Public vehicle label<input name="publicLabel" className={input} maxLength={120} placeholder="e.g. Honda Civic 2022+ New Shape" defaultValue={publicLabel}/><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">Customer-facing name for this specific vehicle option. Leave blank to automatically use the vehicle model and model year.</span></label>}
  </div>;
}
