"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";
import { applyOperationalCustomerDiscount, approvePaymentOverride, cancelOperationalBooking, createManualOperationalBooking, normalizeExistingSource, recordOperationalPayment, reviewVendorPayout } from "@/lib/dispatch/booking-repository";
import { majorToMinor, parseCustomerDiscount, parseImport, parseManualBooking } from "@/lib/dispatch/booking-validation";
import { assertMinor } from "@/lib/dispatch/booking-core";
import { getDispatchVehicle } from "@/lib/dispatch/vehicles";

const auth=async()=>{if(!(await hasAdminSession()))throw new Error("Unauthorized")};
const value=(form:FormData,key:string)=>String(form.get(key)??"").trim();
const finish=(message:string):never=>{revalidatePath("/admin/dispatch");redirect(`/admin/dispatch?message=${encodeURIComponent(message)}`)};
const fail=(error:unknown):never=>redirect(`/admin/dispatch?error=${encodeURIComponent(error instanceof Error?error.message:"Unable to complete action.")}`);

async function mutateThenRedirect(work:()=>Promise<string>):Promise<never>{
 let message:string;
 try{await auth();message=await work()}catch(error){return fail(error)}
 return finish(message);
}

export async function createManualBookingAction(form:FormData):Promise<{ok:boolean;message:string}>{
 try{
  await auth();const parsed=parseManualBooking(form);let categoryOrModel:string,vehicleSnapshot:Record<string,unknown>;
  if(parsed.vehicleSelection==="custom"){categoryOrModel=parsed.customVehicle!;vehicleSnapshot={type:"custom",label:categoryOrModel}}
  else{const id=parsed.vehicleSelection.slice("dispatch:".length),vehicle=await getDispatchVehicle(id);if(!vehicle||!vehicle.active||vehicle.status==="inactive"||!vehicle.zoneIds.includes(parsed.zoneId))throw new Error("Selected vehicle is no longer available for this zone.");categoryOrModel=`${vehicle.make} ${vehicle.model}`;vehicleSnapshot={type:"dispatch_vehicle",vehicleId:vehicle.id,label:categoryOrModel,category:vehicle.category,make:vehicle.make,model:vehicle.model,...(vehicle.modelYear?{modelYear:vehicle.modelYear}:{})}}
  const result=await createManualOperationalBooking({...parsed,categoryOrModel,vehicleSnapshot});revalidatePath("/admin/dispatch");return{ok:true,message:`Manual booking ${result.bookingId} created`};
 }catch(error){return{ok:false,message:error instanceof Error?error.message:"Unable to create manual booking."}}
}

export async function importBookingAction(form:FormData):Promise<never>{return mutateThenRedirect(async()=>{const input=parseImport(form);const result=await normalizeExistingSource(input.type as Exclude<typeof input.type,"manual">,input.documentId);return result.duplicate?`${result.bookingId} was already in the queue`:`${result.bookingId} imported`})}
export async function recordPaymentAction(form:FormData):Promise<never>{return mutateThenRedirect(async()=>{const amountMinor=majorToMinor(value(form,"amount"),"Payment amount");assertMinor(amountMinor,"Payment amount");await recordOperationalPayment(value(form,"bookingDocumentId"),{amountMinor,...(value(form,"method")?{method:value(form,"method")}:{ }),...(value(form,"reference")?{reference:value(form,"reference")}:{ }),...(value(form,"note")?{note:value(form,"note")}:{ })});return"Payment recorded"})}
export async function applyCustomerDiscountAction(form:FormData):Promise<never>{return mutateThenRedirect(async()=>{const input=parseCustomerDiscount(form);await applyOperationalCustomerDiscount(input.bookingDocumentId,{amountMinor:input.amountMinor,reason:input.reason});return"Customer discount applied"})}
export async function reviewPayoutAction(form:FormData):Promise<never>{return mutateThenRedirect(async()=>{const vendorPayoutMinor=majorToMinor(value(form,"vendorPayout"),"Vendor payout",true);await reviewVendorPayout(value(form,"bookingDocumentId"),{vendorPayoutMinor,...(value(form,"payoutNotes")?{notes:value(form,"payoutNotes")}:{})});return"Vendor payout reviewed"})}
export async function overridePaymentAction(form:FormData):Promise<never>{return mutateThenRedirect(async()=>{const reason=value(form,"overrideReason");if(reason.length<8)throw new Error("Override reason is required and must be specific.");await approvePaymentOverride(value(form,"bookingDocumentId"),reason);return"Dispatch-before-payment override approved"})}
export async function cancelBookingAction(form:FormData):Promise<never>{return mutateThenRedirect(async()=>{const reason=value(form,"cancellationReason");if(reason.length<3)throw new Error("Cancellation reason is required.");await cancelOperationalBooking(value(form,"bookingDocumentId"),reason,value(form,"cancellationType")==="not_proceeding");return"Booking marked as not proceeding"})}
