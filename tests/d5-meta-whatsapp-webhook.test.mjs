import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseMetaWhatsAppStatusEvents,verifyMetaWebhookChallenge,verifyMetaWebhookSignature } from "../src/lib/messaging/meta-whatsapp-webhook.ts";

const secret="test-app-secret-not-production";
const status=(value,id="wamid.TEST",timestamp="1788000000")=>({
 object:"whatsapp_business_account",
 entry:[{id:"1669817960844204",changes:[{
  field:"messages",
  value:{metadata:{phone_number_id:"995770263630038"},statuses:[
   {id,status:value,timestamp,recipient_id:"923001234567",...(value==="failed"?{errors:[{code:131000,title:"Test failure"}]}:{})}
  ]},
 }]}],
});

test("valid GET verification requires subscribe, exact token and challenge",()=>assert.equal(verifyMetaWebhookChallenge({mode:"subscribe",token:"correct",challenge:"12345",expectedToken:"correct"}),true));
test("invalid verify token is rejected",()=>assert.equal(verifyMetaWebhookChallenge({mode:"subscribe",token:"wrong",challenge:"12345",expectedToken:"correct"}),false));
test("missing verification parameters are rejected",()=>{assert.equal(verifyMetaWebhookChallenge({mode:null,token:null,challenge:null,expectedToken:"correct"}),false);assert.equal(verifyMetaWebhookChallenge({mode:"subscribe",token:"correct",challenge:"1",expectedToken:undefined}),false)});
test("valid POST signature is accepted",()=>{const body=JSON.stringify(status("sent")),signature=`sha256=${createHmac("sha256",secret).update(body).digest("hex")}`;assert.equal(verifyMetaWebhookSignature(body,signature,secret),true)});
test("invalid or missing POST signatures are rejected",()=>{const body=JSON.stringify(status("sent"));assert.equal(verifyMetaWebhookSignature(body,"sha256="+"0".repeat(64),secret),false);assert.equal(verifyMetaWebhookSignature(body,null,secret),false);assert.equal(verifyMetaWebhookSignature(body,"sha256="+"0".repeat(64),undefined),false)});
for(const current of ["sent","delivered","read","failed"])test(`${current} status is normalized with minimal identifiers`,()=>{const events=parseMetaWhatsAppStatusEvents(status(current));assert.equal(events.length,1);assert.equal(events[0].status,current);assert.equal(events[0].messageId,"wamid.TEST");assert.equal(events[0].phoneNumberId,"995770263630038");assert.equal(events[0].wabaId,"1669817960844204");if(current==="failed")assert.equal(events[0].errorCode,"131000")});
test("duplicate webhook statuses deduplicate deterministically",()=>{const payload=status("delivered"),item=payload.entry[0].changes[0].value.statuses[0];payload.entry[0].changes[0].value.statuses.push({...item});const events=parseMetaWhatsAppStatusEvents(payload);assert.equal(events.length,1);assert.match(events[0].eventId,/^[a-f0-9]{64}$/)});
test("unknown event types and statuses are safely ignored",()=>{assert.deepEqual(parseMetaWhatsAppStatusEvents({object:"whatsapp_business_account",entry:[{changes:[{field:"account_update",value:{}}]}]}),[]);assert.deepEqual(parseMetaWhatsAppStatusEvents(status("deleted")),[])});
test("malformed payloads are safely ignored by parser",()=>{for(const value of [null,undefined,"bad",{},[],{object:"whatsapp_business_account",entry:"bad"}])assert.deepEqual(parseMetaWhatsAppStatusEvents(value),[])});
test("route uses raw body, signature verification, safe malformed handling and GET plain text",()=>{const source=readFileSync(new URL("../app/api/webhooks/meta/whatsapp/route.ts",import.meta.url),"utf8");for(const marker of ["request.text()","x-hub-signature-256","verifyMetaWebhookSignature","JSON.parse(rawBody)","Malformed webhook payload","text/plain","hub.verify_token","hub.challenge"])assert.ok(source.includes(marker),marker);assert.equal(source.includes("console.log"),false)});
test("persistence is transactionally idempotent and stores no raw payload or secrets",()=>{const source=readFileSync(new URL("../src/lib/messaging/meta-whatsapp-webhook-repository.ts",import.meta.url),"utf8");for(const marker of ["runTransaction","eventSnap.exists","metaWhatsAppWebhookEvents","metaWhatsAppMessages","metaMessageId","occurredAt","receivedAt"])assert.ok(source.includes(marker),marker);for(const forbidden of ["rawBody","accessToken","appSecret","webhookVerifyToken","payload:"])assert.equal(source.includes(forbidden),false,forbidden)});
test("all D5 environment placeholders are server-only and no values are hardcoded",()=>{const source=readFileSync(new URL("../src/lib/messaging/meta-whatsapp-config.ts",import.meta.url),"utf8");for(const name of ["META_WHATSAPP_APP_SECRET","META_WHATSAPP_WEBHOOK_VERIFY_TOKEN","META_WHATSAPP_GRAPH_API_VERSION","META_WHATSAPP_ACCESS_TOKEN","META_WHATSAPP_PHONE_NUMBER_ID","META_WHATSAPP_WABA_ID","META_WHATSAPP_BUSINESS_PORTFOLIO_ID","META_WHATSAPP_APP_ID","RENTKA_PUBLIC_BASE_URL"])assert.ok(source.includes(`process.env.${name}`),name);assert.ok(source.includes('import "server-only"'))});
