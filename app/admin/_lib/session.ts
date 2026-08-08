import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "rentka_admin_session";
export const ADMIN_SESSION_MAX_AGE = 10 * 60 * 60;

function adminPassword() {
  return process.env.RENTKA_ADMIN_PASSWORD;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function passwordIsValid(candidate: string) {
  const configured = adminPassword();
  if (!configured) return false;
  return timingSafeEqual(digest(candidate), digest(configured));
}

function signature(payload: string, password: string) {
  return createHmac("sha256", password).update(payload).digest("base64url");
}

export function createAdminSessionToken() {
  const password = adminPassword();
  if (!password) throw new Error("Admin access is not configured.");

  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE;
  const payload = `v1.${expiresAt}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${signature(payload, password)}`;
}

export function adminSessionTokenIsValid(token: string | undefined) {
  const password = adminPassword();
  if (!password || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = parts.slice(0, 3).join(".");
  const suppliedSignature = Buffer.from(parts[3], "base64url");
  const expectedSignature = Buffer.from(signature(payload, password), "base64url");
  return suppliedSignature.length === expectedSignature.length && timingSafeEqual(suppliedSignature, expectedSignature);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return adminSessionTokenIsValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
