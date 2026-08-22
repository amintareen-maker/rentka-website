"use client";

import type { deleteInventory } from "../actions";

type Props = {
  action: typeof deleteInventory;
  modelYearLabel: string;
  vehicle: string;
  vendor: string;
  zoneLabel: string;
};

export default function DeleteInventoryButton(props: Props) {
  return <button type="submit" formAction={props.action} formNoValidate className="rounded-lg border border-red-600 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2" onClick={(event) => {
    const confirmed = window.confirm([
      "Delete this inventory record?", "", `Zone: ${props.zoneLabel}`, `Vehicle: ${props.vehicle}`,
      `Model year: ${props.modelYearLabel || "Model year not set"}`, `Vendor: ${props.vendor}`, "",
      "This deletes only this zone inventory record and cannot be undone.",
    ].join("\n"));
    if (!confirmed) event.preventDefault();
  }}>Delete inventory</button>;
}
