import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Source } from "./types";

function signature(payload: string) {
  const secret = process.env.RENTKA_ADMIN_PASSWORD;
  if (!secret) throw new Error("Admin access is not configured.");
  return createHmac("sha256", secret).update(`campaign-import:${payload}`).digest("hex");
}
function digest(csv: string, source: Source, context = "") { return createHash("sha256").update(JSON.stringify([source, csv, context])).digest("hex"); }
export function issueReview(csv: string, source: Source, context = "") {
  const payload = `${Date.now() + 30 * 60_000}.${randomUUID()}.${digest(csv, source, context)}`;
  return `${payload}.${signature(payload)}`;
}
export function verifyReview(csv: string, source: Source, token: string, context = "") {
  const [expires, nonce, hash, supplied, ...extra] = token.split(".");
  if (extra.length || !supplied || !/^[a-f0-9]{64}$/.test(supplied) || Number(expires) < Date.now() || !Number.isFinite(Number(expires)) || hash !== digest(csv, source, context)) throw new Error("Preview expired or CSV changed. Preview again.");
  const expected = signature(`${expires}.${nonce}.${hash}`);
  if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) throw new Error("Invalid import review.");
  return createHash("sha256").update(token).digest("hex");
}
