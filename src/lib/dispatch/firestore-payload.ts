/**
 * Firestore rejects JavaScript `undefined`, including inside nested maps and
 * arrays. Remove omitted optional values while preserving Firestore sentinels,
 * timestamps, dates, and other non-plain objects unchanged.
 */
export function firestoreSafePayload<T>(value: T): T {
  return sanitize(value) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map(sanitize);
  }
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, sanitize(item)])
  );
}

export function payloadContainsUndefined(value: unknown): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(payloadContainsUndefined);
  if (!isPlainObject(value)) return false;
  return Object.values(value).some(payloadContainsUndefined);
}
