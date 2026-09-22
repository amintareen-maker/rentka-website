import { NextResponse } from "next/server";
import { hasAdminSession } from "@/../app/admin/_lib/session";
import { getDispatchDriver, getDispatchVehicle } from "@/lib/dispatch/repository";
import { readProtectedDocument } from "@/lib/partner-applications/documents";
import { protectedDocumentReadFailure } from "@/lib/partner-applications/document-retrieval-core";

export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url), type = url.searchParams.get("type"), resourceId = url.searchParams.get("resource"), documentId = url.searchParams.get("document");
  if ((type !== "driver" && type !== "vehicle") || !resourceId || !documentId) return NextResponse.json({ error: "Missing document reference" }, { status: 400 });
  const resource = type === "driver" ? await getDispatchDriver(resourceId) : await getDispatchVehicle(resourceId), document = resource?.documents?.find((item) => item.id === documentId);
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  try {
    const file = await readProtectedDocument(document.storagePath);
    return new NextResponse(new Uint8Array(file.buffer), { headers: { "Content-Type": file.contentType, "Content-Disposition": `inline; filename="${file.name.replace(/\"/g, "")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    const failure = protectedDocumentReadFailure(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
