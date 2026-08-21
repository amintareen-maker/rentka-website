export type TestLeadResponse = {
  ok: true;
  leadId: string;
  reviewLink: string;
  inventory: unknown;
  dailyRentalRate: number;
  estimatedRentalAmount: number;
};

export function parseTestLeadResponse(body: string, responseOk: boolean, status: number): TestLeadResponse {
  if (!body.trim()) {
    throw new Error(`The server returned an empty response (HTTP ${status}). The lead outcome is unknown; check Firestore before resubmitting.`);
  }

  let result: unknown;
  try {
    result = JSON.parse(body);
  } catch {
    throw new Error(`The server returned a non-JSON response (HTTP ${status}). The lead outcome is unknown; check Firestore before resubmitting.`);
  }

  const record = result && typeof result === "object" ? result as Record<string, unknown> : {};
  if (!responseOk || record.ok !== true) {
    const detail = typeof record.error === "string" && record.error.trim()
      ? record.error.trim()
      : `Unable to create test lead (HTTP ${status}).`;
    throw new Error(detail);
  }
  if (typeof record.leadId !== "string" || !record.leadId) {
    throw new Error("The server response did not include a lead ID. Check Firestore before resubmitting.");
  }
  return record as TestLeadResponse;
}
