import { NextResponse } from "next/server";
import { hasAdminSession } from "../../../admin/_lib/session";
import { handleLahoreLead } from "@/lib/normal-rental/lahore-lead";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  return handleLahoreLead(request, "admin_lahore_preview");
}
