import { hasAdminSession } from "../../../../admin/_lib/session";
import { campaignSender } from "@/lib/whatsapp-campaigns/sender";

// A separate request allows Pause to interrupt the next recipient even while a
// server action is processing a chunk. It never initiates provider execution.
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin || !(await hasAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { audienceId, action } = await request.json();
    if (typeof audienceId !== "string" || !["pause", "cancel"].includes(action)) return Response.json({ error: "Invalid action" }, { status: 400 });
    return Response.json({ state: await campaignSender().control(audienceId, action) });
  } catch { return Response.json({ error: "Unable to update audience. Refresh its results and retry." }, { status: 400 }); }
}
