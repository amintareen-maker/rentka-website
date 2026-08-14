"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createTaSessionToken, TA_SESSION_COOKIE, TA_SESSION_MAX_AGE, taPasswordIsValid } from "@/lib/ta-connections/session";

export type LoginState = { error?: string };
export async function login(_state: LoginState, form: FormData): Promise<LoginState> {
  const password = form.get("password");
  if (typeof password !== "string" || !taPasswordIsValid(password)) return { error: "Incorrect password" };
  try {
    (await cookies()).set(TA_SESSION_COOKIE, createTaSessionToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: TA_SESSION_MAX_AGE });
  } catch { return { error: "TA Connections portal access is not configured." }; }
  redirect("/partner/ta-connections");
}
export async function logout() {
  (await cookies()).set(TA_SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  redirect("/partner/ta-connections");
}
