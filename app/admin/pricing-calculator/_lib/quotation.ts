import { money,percent } from "./pricing";
import type { CalculatorState,PricingResult,TripPackage,VehiclePreset,VendorExpenseResponsibility } from "./types";

const clean=(value:string)=>value.trim();
const displayLocation=(value:string,displayName?:string)=>{
 const preferred=clean(displayName??"");
 const isRoad=(part:string)=>/\b(road|rd|street|st|avenue|ave|highway|motorway)\b/i.test(part);
 const parts=value.split(",").map(clean).filter(Boolean).filter((part)=>!/^\d{4,6}$/.test(part)&&part.toLowerCase()!=="pakistan"&&!isRoad(part));
 if(preferred&&!isRoad(preferred)){const locality=parts.find((part)=>part.toLowerCase()!==preferred.toLowerCase());return[preferred,locality].filter(Boolean).join(", ")}
 return parts.slice(0,2).join(", ");
};
const location=(text:string,place?:{displayName:string})=>displayLocation(text,place?.displayName);
const readableDate=(value:string)=>{if(!value)return"";const [year,month,day]=value.split("-").map(Number);if(!year||!month||!day)return value;return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(year,month-1,day))};
const readableTime=(value:string)=>{if(!value)return"";const [hour,minute]=value.split(":").map(Number);if(!Number.isFinite(hour)||!Number.isFinite(minute))return value;return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(2000,0,1,hour,minute))};
const readableDuration=(minutes:number)=>{const rounded=Math.max(0,Math.round(minutes));const hours=Math.floor(rounded/60);const mins=rounded%60;return `Approx. ${[hours&&`${hours} hour${hours===1?"":"s"}`,mins&&`${mins} minute${mins===1?"":"s"}`].filter(Boolean).join(" ")||"0 minutes"}`};
const tripLocations=(state:CalculatorState,pkg:TripPackage)=>{
 const pickup=location(state.trip.pickup,state.trip.pickupPlace);
 const stops=pkg.stops.filter((stop)=>stop.enabled&&clean(stop.name)).map((stop)=>location(stop.name,stop.place));
 const uniqueStops=stops.filter((stop,index)=>stop&&stops.indexOf(stop)===index&&stop!==pickup);
 const destination=location(state.trip.destination??"",state.trip.destinationPlace);
 const finalDrop=location(state.trip.finalDrop,state.trip.finalDropPlace);
 const route=[pickup,...uniqueStops,destination].filter((item,index,items)=>Boolean(item)&&items.indexOf(item)===index);
 if(finalDrop&&route.at(-1)!==finalDrop)route.push(finalDrop);
 else if(finalDrop&&finalDrop===pickup&&route.length>1)route.push(finalDrop);
 return{pickup,stops:uniqueStops,finalDrop,destination:destination||(uniqueStops.at(-1)??finalDrop),route};
};
const detailLines=(state:CalculatorState,pkg:TripPackage,result:PricingResult,timeLabel:string)=>{const trip=tripLocations(state,pkg);return[
 readableDate(state.trip.date)&&`📅 *Date:* ${readableDate(state.trip.date)}`,
 readableTime(state.trip.pickupTime)&&`🕘 *${timeLabel}:* ${readableTime(state.trip.pickupTime)}`,
 trip.pickup&&`📍 *Pickup:* ${trip.pickup}`,
 trip.destination&&`🏞️ *Destination:* ${trip.destination}`,
 trip.finalDrop&&`🏁 *Final Drop:* ${trip.finalDrop}`,
 result.route.bookingMinutes>0&&`⏱️ *${timeLabel==="Reporting Time"?"Estimated Duty":"Estimated Duration"}:* ${readableDuration(result.route.bookingMinutes)}`,
 trip.route.length>1&&`\n📍 *${timeLabel==="Reporting Time"?"Route":"Planned Route"}:*\n${trip.route.join(" → ")}`,
].filter(Boolean).join("\n")};

export function customerQuotation(state:CalculatorState,pkg:TripPackage,result:PricingResult){return`🚐 *RentKA Trip Quotation — ${state.trip.vehicleName}*

${detailLines(state,pkg,result,"Pickup Time")}

💰 *Complete Package: ${money(result.finalPrice)}*

*Package Includes:*
• 🚐 Vehicle with professional driver
• ⛽ Fuel for the confirmed route
• 🛣️ Toll charges
• 📍 Travel according to the confirmed itinerary
• 🏁 Final drop at the confirmed location

*Not Included:*
• 🎟️ Entry/attraction tickets
• 🍽️ Meals
• 🅿️ Parking charges, if applicable
• ➕ Additional or unplanned travel

📌 *Please Note:*
The quoted price is based on the itinerary above. Additional stops, significant waiting time, route changes or changes to the travel plan may result in additional charges.

*RentKA*
_Car rentals. Made simple._
0302 0589999
rentka.co`}

const responsibilityText:Record<VendorExpenseResponsibility,string>={unspecified:"Not specified — confirm before sending",included:"Included in vendor rate",rentka:"Paid separately by RentKA",customer:"Paid by customer","not-applicable":"Not applicable"};
export function vendorBooking(state:CalculatorState,pkg:TripPackage,result:PricingResult,vehicle:VehiclePreset){const responsibility=pkg.vendorExpenseResponsibility;const expense=(key:"fuel"|"toll"|"parking")=>responsibilityText[responsibility?.[key]??"unspecified"];return`🚐 *RentKA — Vendor Booking Request*

${detailLines(state,pkg,result,"Reporting Time")}
${state.trip.vehicleName?`\n🚐 *Vehicle:* ${state.trip.vehicleName}\n`:""}
💰 *Agreed Vehicle Rent: ${money(vehicle.vendorRent)}*

*Booking Requirements:*
• 👨‍✈️ Professional driver
• 🚐 Clean and properly maintained vehicle
• ⏰ Vehicle must report on time

*Trip Expenses:*
• ⛽ Fuel: ${expense("fuel")}
• 🛣️ Toll: ${expense("toll")}
• 🅿️ Parking: ${expense("parking")}

💵 *Vehicle Rent Payable to Vendor: ${money(vehicle.vendorRent)}*

📌 *Please confirm vehicle availability, driver and agreed rate for this booking.*

*RentKA*`}

export function internalCosting(state:CalculatorState,pkg:TripPackage,result:PricingResult,vehicle:VehiclePreset){return`🔒 *RENTKA INTERNAL COSTING — DO NOT SEND TO CUSTOMER/VENDOR*

*Trip:* ${pkg.name}
*Vehicle:* ${state.trip.vehicleName}
${detailLines(state,pkg,result,"Pickup Time")}

*Cost Breakdown:*
${result.internalLines.map((line)=>`• ${line.label}: ${money(line.amount)}`).join("\n")}
• Operational KM: ${result.route.totalKm.toFixed(1)} km
• Total fuel: ${result.fuelLitres.toFixed(2)} L

*Pricing Summary:*
• Vendor vehicle rent: ${money(vehicle.vendorRent)}
• Total internal cost: ${money(result.internalCost)}
• Minimum price: ${money(result.minimumPrice)}
• Suggested price: ${money(result.suggestedPrice)}
• Final selling price: ${money(result.finalPrice)}
• Adjustment: ${money(result.adjustmentImpact)}
• Gross profit: ${money(result.grossProfit)}
• Gross margin (profit ÷ selling price): ${percent(result.margin)}
• Markup (profit ÷ cost): ${percent(result.markup)}`}
