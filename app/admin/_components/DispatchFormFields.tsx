import { NORMAL_RENTAL_ZONES } from "@/lib/normal-rental/zones";
import { CHECK_STATES, DISPATCH_PRIORITIES, DOCUMENTATION_STATES, DRIVER_STATUSES, VEHICLE_STATUSES } from "@/lib/dispatch/types";

export const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
export const label = "text-sm font-semibold text-slate-700";
export const textarea = `${input} min-h-20`;
export function Select({ name, value, options }: { name: string; value?: string; options: readonly string[] }) { return <select name={name} defaultValue={value} className={input}>{options.map((x) => <option key={x} value={x}>{x.replaceAll("_", " ")}</option>)}</select>; }
export function Zones({ selected = [] }: { selected?: readonly string[] }) { return <fieldset><legend className={label}>Operating zones</legend><div className="mt-2 flex flex-wrap gap-4">{Object.entries(NORMAL_RENTAL_ZONES).map(([id, zone]) => <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="zoneIds" value={id} defaultChecked={selected.includes(id)} />{zone.label}</label>)}</div></fieldset>; }
export function Active({ value = true }: { value?: boolean }) { return <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" name="active" defaultChecked={value}/> Active</label>; }
export const priorityOptions = DISPATCH_PRIORITIES;
export const vehicleStatusOptions = VEHICLE_STATUSES;
export const driverStatusOptions = DRIVER_STATUSES;
export const documentationOptions = DOCUMENTATION_STATES;
export const checkOptions = CHECK_STATES;
