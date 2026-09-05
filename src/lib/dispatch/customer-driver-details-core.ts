import type { OperationalBooking } from "./booking-types";
import { normalizeDispatchPhone } from "./validation.ts";
import type { CustomerDriverDetailsProjection, CustomerDriverDetailsRecord, CustomerDriverDetailsState } from "./customer-driver-details-types";

const SUPPORT_PHONE="0302 058 9999",SUPPORT_WHATSAPP="923020589999";
const required=(value:string|undefined,label:string,missing:string[])=>{const clean=value?.trim();if(clean)return clean;missing.push(label);return`MISSING ${label.toUpperCase()} - confirm with RentKA`};
const dateLabel=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)?new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`)):value;
const timeLabel=(value:string)=>{const match=/^(\d{2}):(\d{2})$/.exec(value);if(!match)return value;const hour=Number(match[1]);return`${hour%12||12}:${match[2]} ${hour<12?"AM":"PM"}`};
export const pickupInstant=(date:string,time:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))return null;const value=new Date(`${date}T${time}:00+05:00`);return Number.isNaN(value.getTime())?null:value};
export function resolveCustomerDriverDetailsState(record:CustomerDriverDetailsRecord|undefined,updated:boolean,now=new Date()):CustomerDriverDetailsState{
 if(record?.sharedAt)return"shared";
 if(record?.scheduledAt){const due=new Date(record.scheduledAt).getTime(),delta=now.getTime()-due;if(delta<0)return"scheduled";if(delta<=15*60*1000)return"ready_to_share";return"overdue"}
 return updated?"updated_details_required":"not_scheduled";
}
export function resolveScheduleAt(booking:OperationalBooking,mode:string,custom:string|undefined){
 const pickup=pickupInstant(booking.itinerary.travelDate,booking.itinerary.pickupTime);if(!pickup)throw new Error("A valid pickup date and time are required before scheduling.");
 if(mode==="1"||mode==="2"||mode==="3")return new Date(pickup.getTime()-Number(mode)*60*60*1000).toISOString();
 if(mode==="custom"){const match=custom&&/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(custom);if(!match)throw new Error("Select a valid custom notification date and time.");const[y,m,d,h,minute]=match.slice(1).map(Number),check=new Date(Date.UTC(y,m-1,d,h,minute));if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d||check.getUTCHours()!==h||check.getUTCMinutes()!==minute)throw new Error("Select a valid custom notification date and time.");const value=new Date(`${custom}:00+05:00`);if(value.getTime()>pickup.getTime())throw new Error("Customer details cannot be scheduled after pickup.");return value.toISOString()}
 throw new Error("Select a valid notification schedule.");
}
export function createCustomerDriverDetailsProjection(booking:OperationalBooking,records:CustomerDriverDetailsRecord[]=[],now=new Date()):CustomerDriverDetailsProjection|null{
 if(booking.lifecycle!=="active"||booking.assignment?.status!=="assigned")return null;
 const assignment=booking.assignment,missingFields:string[]=[];
 const customerName=required(booking.customer.name,"customer name",missingFields),customerPhone=required(booking.customer.phone,"customer phone",missingFields);
 const driverName=required(assignment.driverSnapshot.name,"driver name",missingFields),driverPhone=required(assignment.driverSnapshot.mobileNumber||assignment.driverSnapshot.whatsappNumber,"driver phone",missingFields);
 const make=required(assignment.vehicleSnapshot.make,"vehicle make",missingFields),model=required(assignment.vehicleSnapshot.model,"vehicle model",missingFields),registration=required(assignment.vehicleSnapshot.registrationNumber,"vehicle registration",missingFields);
 const travelDate=required(booking.itinerary.travelDate,"pickup date",missingFields),pickupTime=required(booking.itinerary.pickupTime,"pickup time",missingFields),customerWhatsappNumber=normalizeDispatchPhone(customerPhone);
 if(!customerWhatsappNumber&&!missingFields.includes("customer phone"))missingFields.push("customer WhatsApp");
 const year=assignment.vehicleSnapshot.modelYear?` ${assignment.vehicleSnapshot.modelYear}`:"",vehicleLabel=`${make} ${model}${year} - ${registration}`;
 const message=["RentKA - Driver & Vehicle Details","","Your driver and vehicle have been assigned for your upcoming RentKA booking.",`Booking ID: ${booking.bookingId}`,`Driver: ${driverName}`,`Driver Phone: ${driverPhone}`,`Vehicle: ${vehicleLabel}`,`Pickup: ${dateLabel(travelDate)} at ${timeLabel(pickupTime)}`,"",`RentKA Support: ${SUPPORT_PHONE} | WhatsApp +${SUPPORT_WHATSAPP}`].join("\n");
 const current=records.find(item=>item.assignmentId===assignment.id),previousShared=records.find(item=>item.assignmentId!==assignment.id&&!!item.sharedAt),updatedDetailsRequired=!!previousShared&&!current?.sharedAt,state=resolveCustomerDriverDetailsState(current,updatedDetailsRequired,now),pickup=pickupInstant(booking.itinerary.travelDate,booking.itinerary.pickupTime);
 return{bookingOperationalId:booking.id,bookingId:booking.bookingId,assignmentId:assignment.id,driverId:assignment.assignedDriverId,vehicleId:assignment.assignedVehicleId,customerName,...(customerWhatsappNumber?{customerWhatsappNumber,whatsappUrl:`https://wa.me/${customerWhatsappNumber}?text=${encodeURIComponent(message)}`}:{}),driverName,vehicleLabel,message,missingFields,pickupAt:pickup?.toISOString()??"",state,...(current?.scheduledAt?{scheduledAt:current.scheduledAt}:{}),updatedDetailsRequired,...(previousShared?{previousSharedAssignmentId:previousShared.assignmentId}:{})};
}

