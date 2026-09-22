import type { AirportDefinition, AirportId, AirportPlace } from "./types";

export const ISLAMABAD_AIRPORT: AirportPlace = { placeId:"islamabad-international-airport",displayName:"Islamabad International Airport",formattedAddress:"Islamabad International Airport, Islamabad, Pakistan",lat:33.5490,lng:72.8257 };
export const LAHORE_AIRPORT: AirportPlace = { placeId:"allama-iqbal-international-airport",displayName:"Allama Iqbal International Airport",formattedAddress:"Allama Iqbal International Airport, Lahore, Pakistan",lat:31.5216,lng:74.4036 };

export const AIRPORTS:Record<AirportId,AirportDefinition>={
  islamabad:{airportId:"islamabad",city:"Islamabad",airportName:ISLAMABAD_AIRPORT.displayName,airportCode:"ISB",bookingCode:"ISB",slug:"islamabad",pagePath:"/airport-car-rental-islamabad",serviceArea:"Islamabad and Rawalpindi",fleetZoneId:"twin_cities",active:true,bookingEnabled:true,place:ISLAMABAD_AIRPORT},
  lahore:{airportId:"lahore",city:"Lahore",airportName:LAHORE_AIRPORT.displayName,airportCode:"LHE",bookingCode:"LHE",slug:"lahore",pagePath:"/airport-car-rental-lahore",serviceArea:"Lahore",fleetZoneId:"lahore",active:true,bookingEnabled:true,place:LAHORE_AIRPORT},
};
export const AIRPORT_IDS=Object.keys(AIRPORTS) as AirportId[];
export const isAirportId=(value:unknown):value is AirportId=>typeof value==="string"&&value in AIRPORTS;
export const getAirportDefinition=(airportId:AirportId)=>AIRPORTS[airportId];