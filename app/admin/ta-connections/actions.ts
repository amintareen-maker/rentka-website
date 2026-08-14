"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken, passwordIsValid } from "../_lib/session";
import { createVersionedRateSet, listTaAirports, saveTaAirport } from "@/lib/ta-connections/repository";
import { parseAirportForm, parseRateSetForm } from "@/lib/ta-connections/validation";

export type AdminActionState = { error?: string; success?: string };

export async function loginToTaAdmin(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const password = form.get("password");
  if (typeof password !== "string" || !passwordIsValid(password)) return { error: "Incorrect password" };
  (await cookies()).set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: ADMIN_SESSION_MAX_AGE });
  redirect("/admin/ta-connections");
}

async function authorized() {
  if (!(await hasAdminSession())) throw new Error("Unauthorized");
}

export async function saveAirportAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  try {
    await authorized();
    const parsed = parseAirportForm(form);
    if (!parsed.ok) return { error: parsed.error };
    await saveTaAirport(String(form.get("airportId") ?? "").trim() || undefined, parsed.value);
    revalidatePath("/admin/ta-connections");
    return { success: "Airport saved." };
  } catch (error) {
    return { error: error instanceof Error && error.message !== "Unauthorized" ? error.message : "Unable to save airport." };
  }
}

export async function saveRateSetAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  try {
    await authorized();
    const airports = await listTaAirports();
    const active = airports.filter((airport) => airport.active);
    const parsed = parseRateSetForm(form, new Set(active.map((airport) => airport.id)));
    if (!parsed.ok) return { error: parsed.error };
    const airport = active.find((item) => item.id === parsed.value.airportId);
    if (!airport) return { error: "Select a valid active airport." };
    await createVersionedRateSet(parsed.value, airport.currency);
    revalidatePath("/admin/ta-connections");
    return { success: "New active contract version created; any prior version was preserved and superseded." };
  } catch (error) {
    return { error: error instanceof Error && error.message !== "Unauthorized" ? error.message : "Unable to save contract version." };
  }
}
