import type { CalculatorState,SavedQuotation } from "./types";
const KEY="rentka-central-pricing-v4";
const compatible=(value:unknown):value is SavedQuotation=>{if(!value||typeof value!=="object")return false;const item=value as Partial<SavedQuotation>;return item.version===4&&!!item.state&&Array.isArray(item.state.packages)&&item.state.packages.every((pkg)=>typeof pkg.routeStatus==="string")};
export function readSaved():SavedQuotation[]{try{const value:unknown=JSON.parse(localStorage.getItem(KEY)??"[]");return Array.isArray(value)?value.filter(compatible):[]}catch{return[]}}
export function persist(name:string,state:CalculatorState):SavedQuotation[]{const items=readSaved();const next:SavedQuotation[]=[{id:crypto.randomUUID(),name:name.trim()||"Untitled quotation",savedAt:new Date().toISOString(),version:4,state},...items];localStorage.setItem(KEY,JSON.stringify(next));return next}
export function removeSaved(id:string){const next=readSaved().filter((item)=>item.id!==id);localStorage.setItem(KEY,JSON.stringify(next));return next}
