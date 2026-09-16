export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
export const ALLOWED_DOCUMENT_KINDS = new Set([
  "cnic_front",
  "cnic_back",
  "licence_front",
  "licence_back",
  "vehicle_registration",
  "vehicle_photo",
  "business_document",
]);

export class PartnerUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartnerUploadValidationError";
  }
}

export const safeDocumentName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "document";

function signatureMatches(buffer: Buffer, type: string) {
  if (type === "application/pdf")
    return buffer.subarray(0, 5).toString() === "%PDF-";
  if (type === "image/png")
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/jpeg")
    return (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer.at(-2) === 0xff &&
      buffer.at(-1) === 0xd9
    );
  return false;
}

export async function prepareDocumentUpload(
  file: File,
  kind: string,
  identity: { stagedUploadId: string; objectId: string },
) {
  if (file.type === "image/heic" || file.type === "image/heif")
    throw new PartnerUploadValidationError(
      "HEIC/HEIF photos are not supported. Choose a JPG or PNG image.",
    );
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type))
    throw new PartnerUploadValidationError(
      "Upload a JPG, PNG or PDF document.",
    );
  if (file.size < 1 || file.size > MAX_DOCUMENT_BYTES)
    throw new PartnerUploadValidationError(
      "Each document must be no larger than 8 MB.",
    );
  if (!ALLOWED_DOCUMENT_KINDS.has(kind))
    throw new PartnerUploadValidationError("Invalid document type.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!signatureMatches(buffer, file.type))
    throw new PartnerUploadValidationError(
      "The document content does not match its file type.",
    );
  const originalName = safeDocumentName(file.name);
  return {
    buffer,
    originalName,
    storagePath: `partner-applications/staged/${identity.stagedUploadId}/${kind}/${identity.objectId}-${originalName}`,
  };
}

export function publicUploadFailure(error: unknown) {
  return error instanceof PartnerUploadValidationError
    ? { message: error.message, status: 400 }
    : {
        message: "Upload couldn’t be completed. Please try again.",
        status: 500,
      };
}

export function uploadDiagnosticCode(error: unknown) {
  if (error instanceof PartnerUploadValidationError) return "validation_rejected";
  if (
    error instanceof Error &&
    error.message.includes("FIREBASE_STORAGE_BUCKET")
  )
    return "storage_bucket_not_configured";
  return "storage_or_staging_failure";
}
