import "server-only";

import { isolateAutomaticIntake } from "./automatic-intake-core";
import { normalizeExistingSource } from "./booking-repository";
import type { OperationalSourceType } from "./booking-types";

export function attemptAutomaticOperationalIntake(
  sourceType: Exclude<OperationalSourceType, "manual">,
  sourceDocumentId: string,
) {
  return isolateAutomaticIntake(sourceType, sourceDocumentId, normalizeExistingSource);
}
