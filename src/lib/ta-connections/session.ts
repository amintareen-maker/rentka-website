import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const TA_SESSION_COOKIE = "rentka_ta_connections_session";
export const TA_SESSION_MAX_AGE = 8 * 60 * 60;

const digest = (value: string) => createHash("sha256").update(value).digest();
const secret = () => process.env.TA_CONNECTIONS_SESSION_SECRET;

export function taPasswordIsValid(candidate: string) {
  const configured = process.env.TA_CONNECTIONS_PORTAL_PASSWORD;
  if (!configured) return false;
  return timingSafeEqual(digest(candidate), digest(configured));
}

const sign = (payload: string) => {
  const configured = secret();
  if (!configured) throw new Error("TA Connections session is not configured.");
  return createHmac("sha256", configured).update(payload).digest("base64url");
};

export function createTaSessionToken() {
  if (!process.env.TA_CONNECTIONS_PORTAL_PASSWORD || !secret()) throw new Error("TA Connections session is not configured.");
  const payload = `v1.${Math.floor(Date.now() / 1000) + TA_SESSION_MAX_AGE}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function taSessionTokenIsValid(token?: string) {
  if (!token || !secret() || !process.env.TA_CONNECTIONS_PORTAL_PASSWORD) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1" || Number(parts[1]) <= Math.floor(Date.now() / 1000)) return false;
  const supplied = Buffer.from(parts[3], "base64url");
  const expected = Buffer.from(sign(parts.slice(0, 3).join(".")), "base64url");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function hasTaSession() {
  return taSessionTokenIsValid((await cookies()).get(TA_SESSION_COOKIE)?.value);
}

export function signTaPayload(payload: string) { return sign(payload); }
