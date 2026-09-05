"use server";
import { redirect } from "next/navigation";
import { transitionTrip } from "@/lib/dispatch/trip-operations-repository";
import type { TripStatus } from "@/lib/dispatch/trip-operations-types";
export async function driverTripTransitionAction(form:FormData):Promise<never>{const token=String(form.get("token")??""),bookingOperationalId=String(form.get("bookingOperationalId")??""),assignmentId=String(form.get("assignmentId")??""),requestedStatus=String(form.get("requestedStatus")??"") as TripStatus;let message:string;try{const result=await transitionTrip({bookingOperationalId,assignmentId,requestedStatus,source:"driver_secure_page",token});message=result.duplicate?"Trip status was already updated.":"Trip status updated."}catch(error){redirect(`/driver/trip/${encodeURIComponent(token)}?error=${encodeURIComponent(error instanceof Error?error.message:"Unable to update trip.")}`)}redirect(`/driver/trip/${encodeURIComponent(token)}?message=${encodeURIComponent(message)}`)}

