import type { OperationalSourceType } from "./booking-types";

type AutomaticSourceType = Exclude<OperationalSourceType, "manual">;
type IntakeResult = { bookingId: string; duplicate: boolean; id: string };

export async function isolateAutomaticIntake(
  sourceType: AutomaticSourceType,
  sourceDocumentId: string,
  normalize: (type: AutomaticSourceType, documentId: string) => Promise<IntakeResult>,
  report: (message: string, context: Record<string, unknown>) => void = console.error,
): Promise<IntakeResult | null> {
  try {
    return await normalize(sourceType, sourceDocumentId);
  } catch (error) {
    report("Automatic dispatch intake failed; Admin Import remains available.", {
      sourceType,
      sourceDocumentId,
      error: error instanceof Error ? error.message : "Unknown intake error",
    });
    return null;
  }
}
