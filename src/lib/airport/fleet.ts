import "server-only";
import { resolveNormalRentalInventory } from "@/lib/normal-rental/inventory-resolver";
import type { AirportId } from "./types";
import { getAirportDefinition } from "./constants";

export type AirportFleetModel={modelKey:string;name:string;passengers:number};
const capacity=(value?:string)=>{const parsed=Number(String(value??"").match(/\d+/)?.[0]);return Number.isInteger(parsed)&&parsed>0?parsed:4};
export async function getAirportFleetModels(airportId:AirportId):Promise<AirportFleetModel[]>{const airport=getAirportDefinition(airportId),inventory=await resolveNormalRentalInventory({zoneId:airport.fleetZoneId,cityId:airport.fleetZoneId==="lahore"?"lahore":"islamabad",service:"withDriver"}),models=new Map<string,AirportFleetModel>();for(const item of inventory){const current=models.get(item.modelKey),passengers=capacity(item.seatingCapacity);if(!current)models.set(item.modelKey,{modelKey:item.modelKey,name:item.modelName,passengers});else if(passengers>current.passengers)current.passengers=passengers}return[...models.values()].sort((a,b)=>a.name.localeCompare(b.name))}
const LEGACY_MODEL_ALIASES:Record<string,string>={corolla:"toyota-corolla",civic:"honda-civic",brv:"honda-br-v",prado:"toyota-prado"};
export function airportRuleModelKey(rule:{id:string;modelKey?:string;name:string}){return rule.modelKey||LEGACY_MODEL_ALIASES[rule.id]||rule.name.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}