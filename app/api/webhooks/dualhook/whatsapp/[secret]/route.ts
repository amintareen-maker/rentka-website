import { NextResponse } from "next/server";
import { getDualhookWhatsAppConfig } from "@/lib/messaging/dualhook-whatsapp-config";
import { parseDualhookWebhookPayload,verifyDualhookWebhookChallenge } from "@/lib/messaging/dualhook-whatsapp-webhook";
import { persistDualhookWebhookEvents } from "@/lib/messaging/dualhook-whatsapp-webhook-repository";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{secret:string}>};
async function authorizedPath(context:Context){const config=getDualhookWhatsAppConfig();const {secret}=await context.params;return Boolean(config.pathSecret&&secret===config.pathSecret)}
export async function GET(request:Request,context:Context){const config=getDualhookWhatsAppConfig();if(!await authorizedPath(context))return new NextResponse("Forbidden",{status:403});const url=new URL(request.url),challenge=url.searchParams.get("hub.challenge");if(!verifyDualhookWebhookChallenge({mode:url.searchParams.get("hub.mode"),token:url.searchParams.get("hub.verify_token"),challenge,expectedToken:config.verifyToken}))return new NextResponse("Forbidden",{status:403});return new NextResponse(challenge,{status:200,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}})}
export async function POST(request:Request,context:Context){if(!await authorizedPath(context))return NextResponse.json({ok:false,error:"Forbidden"},{status:403});const config=getDualhookWhatsAppConfig(),rawBody=await request.text();let payload:unknown;try{payload=JSON.parse(rawBody)}catch{return NextResponse.json({ok:false,error:"Malformed webhook payload."},{status:400})}const events=parseDualhookWebhookPayload(payload,{wabaId:config.wabaId,phoneNumberId:config.phoneNumberId},rawBody);if(!events.length)return NextResponse.json({ok:false,error:"Invalid webhook envelope."},{status:400});try{return NextResponse.json({ok:true,...await persistDualhookWebhookEvents(events)},{status:200})}catch(error){console.error("Dualhook webhook persistence failed.",error instanceof Error?error.message:"Unknown error");return NextResponse.json({ok:false,error:"Webhook persistence failed."},{status:500})}}
