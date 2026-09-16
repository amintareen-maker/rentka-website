import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MAX_DOCUMENT_BYTES,
  prepareDocumentUpload,
  publicUploadFailure,
  uploadDiagnosticCode,
} from "../src/lib/partner-applications/documents-core.ts";

const identity = (id="a") => ({stagedUploadId:`00000000-0000-4000-8000-00000000000${id}`,objectId:`10000000-0000-4000-8000-00000000000${id}`});
const file = (bytes,name,type) => new File([bytes],name,{type});
const jpeg = Buffer.from([0xff,0xd8,0x01,0x02,0xff,0xd9]);
const png = Buffer.from([137,80,78,71,13,10,26,10,0]);
const pdf = Buffer.from("%PDF-1.7\n%%EOF");

test("missing bucket configuration becomes a controlled public server error",()=>{const error=new Error("FIREBASE_STORAGE_BUCKET is not configured.");assert.deepEqual(publicUploadFailure(error),{message:"Upload couldn’t be completed. Please try again.",status:500});assert.equal(uploadDiagnosticCode(error),"storage_bucket_not_configured")});
test("valid JPG document preparation succeeds",async()=>{const result=await prepareDocumentUpload(file(jpeg,"front.jpg","image/jpeg"),"cnic_front",identity());assert.equal(result.buffer.equals(jpeg),true);assert.match(result.storagePath,/cnic_front/)});
test("valid PNG document preparation succeeds",async()=>{const result=await prepareDocumentUpload(file(png,"front.png","image/png"),"cnic_front",identity());assert.equal(result.buffer.equals(png),true);assert.match(result.storagePath,/\.png$/)});
test("valid PDF succeeds where the file picker allows PDF",async()=>{const result=await prepareDocumentUpload(file(pdf,"licence.pdf","application/pdf"),"licence_front",identity());assert.equal(result.buffer.equals(pdf),true);assert.match(result.storagePath,/licence_front/)});
test("file larger than 8 MB is rejected",async()=>{await assert.rejects(()=>prepareDocumentUpload(file(Buffer.alloc(MAX_DOCUMENT_BYTES+1),"large.jpg","image/jpeg"),"cnic_front",identity()),/no larger than 8 MB/)});
test("unsupported MIME and HEIC produce clear validation errors",async()=>{await assert.rejects(()=>prepareDocumentUpload(file(Buffer.from("x"),"file.txt","text/plain"),"cnic_front",identity()),/JPG, PNG or PDF/);await assert.rejects(()=>prepareDocumentUpload(file(Buffer.from("x"),"photo.heic","image\/heic"),"cnic_front",identity()),/HEIC\/HEIF photos are not supported/)});
test("CNIC front and back use separate non-colliding storage paths",async()=>{const front=await prepareDocumentUpload(file(jpeg,"cnic.jpg","image/jpeg"),"cnic_front",identity("1")),back=await prepareDocumentUpload(file(jpeg,"cnic.jpg","image/jpeg"),"cnic_back",identity("2"));assert.notEqual(front.storagePath,back.storagePath);assert.match(front.storagePath,/cnic_front/);assert.match(back.storagePath,/cnic_back/)});
test("upload retries cannot create duplicate application records",()=>{const route=readFileSync(new URL("../app/api/partner-applications/uploads/route.ts",import.meta.url),"utf8"),repository=readFileSync(new URL("../src/lib/partner-applications/repository.ts",import.meta.url),"utf8");assert.doesNotMatch(route,/createPartnerApplication|partnerApplications/);assert.match(repository,/claimStagedDocuments/)});
test("internal configuration details are never returned by the upload route",()=>{const route=readFileSync(new URL("../app/api/partner-applications/uploads/route.ts",import.meta.url),"utf8");assert.match(route,/publicUploadFailure/);assert.doesNotMatch(route,/error instanceof Error\?error\.message/);assert.equal(publicUploadFailure(new Error("secret internal detail")).message.includes("secret"),false)});
test("storage paths neutralize traversal and do not trust raw filenames",async()=>{const result=await prepareDocumentUpload(file(jpeg,"../../private/cnic front.jpg","image/jpeg"),"cnic_front",identity());assert.equal(result.originalName.includes("/"),false);assert.equal(result.storagePath.includes("../"),false);assert.match(result.storagePath,/partner-applications\/staged\/[^/]+\/cnic_front\/[^/]+-/)});
test("replacement targets the exact kind and applicant slot",()=>{const form=readFileSync(new URL("../app/join-rentka/PartnerApplicationForm.tsx",import.meta.url),"utf8");assert.match(form,/x\.kind===documentKind&&x\.slotKey===slotKey/);assert.match(form,/Upload failed — Try again/)});
test("failed upload cannot enter successful form state",()=>{const form=readFileSync(new URL("../app/join-rentka/PartnerApplicationForm.tsx",import.meta.url),"utf8");assert.match(form,/if\(!response\.ok\)throw new Error\(result\.error\)/);assert.match(form,/setUploads\(old=>\[\.\.\.old\.filter/);assert.match(form,/setUploadErrors\(old=>\(\{\.\.\.old,\[key\]:true\}\)\)/)});
