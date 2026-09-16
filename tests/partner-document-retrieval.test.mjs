import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { collectPartnerApplicationDocumentReferences,protectedDocumentReadFailure,resolvePartnerApplicationDocument } from "../src/lib/partner-applications/document-retrieval-core.ts";

const document=(id,kind)=>({id,kind,storagePath:`partner-applications/staged/${id}/${kind}/object-file.jpg`,originalName:"file.jpg",contentType:"image/jpeg",size:10,reviewState:"pending",uploadedAt:"now"});
const root=document("root-cnic","cnic_front"),driverDocs=[document("driver-cnic-front","cnic_front"),document("driver-cnic-back","cnic_back"),document("driver-licence-front","licence_front"),document("driver-licence-back","licence_back")],vehicleDocs=[document("vehicle-registration","vehicle_registration"),document("vehicle-photo","vehicle_photo")];
const vendor={documents:[],drivers:[{documents:driverDocs},{documents:[document("driver-two-cnic","cnic_front")]}],vehicles:[{documents:vehicleDocs},{documents:[document("vehicle-two-photo","vehicle_photo")]}]};
const ownerDriver={documents:[root,...driverDocs.slice(1)],drivers:[],vehicles:[{documents:vehicleDocs}]};

test("working vehicle document shape remains readable",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"vehicle-registration")?.ownerType,"vehicle"));
test("failing nested Driver document shape becomes readable",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"driver-cnic-front")?.ownerType,"driver"));
test("CNIC front works",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"driver-cnic-front")?.document.kind,"cnic_front"));
test("CNIC back works",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"driver-cnic-back")?.document.kind,"cnic_back"));
test("licence front works",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"driver-licence-front")?.document.kind,"licence_front"));
test("licence back works",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"driver-licence-back")?.document.kind,"licence_back"));
test("vehicle registration works",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"vehicle-registration")?.document.kind,"vehicle_registration"));
test("vehicle photo works",()=>assert.equal(resolvePartnerApplicationDocument(vendor,"vehicle-photo")?.document.kind,"vehicle_photo"));
test("wrong application ID resolves no document",()=>assert.equal(resolvePartnerApplicationDocument(null,"driver-cnic-front"),undefined));
test("document from another application is rejected",()=>assert.equal(resolvePartnerApplicationDocument(ownerDriver,"driver-cnic-front"),undefined));
test("missing storage object maps to a controlled 404",()=>assert.deepEqual(protectedDocumentReadFailure({code:404,message:"raw provider detail"}),{status:404,message:"Document file not found."}));
test("unauthenticated request is rejected before document lookup",()=>{const route=readFileSync(new URL("../app/api/admin/partner-applications/documents/route.ts",import.meta.url),"utf8");assert.ok(route.indexOf("hasAdminSession")<route.indexOf("getPartnerApplication(id)"));assert.match(route,/Unauthorized/);assert.match(route,/status:401/)});
test("vendor and fleet application documents resolve across root Driver and Vehicle arrays",()=>assert.deepEqual(new Set(collectPartnerApplicationDocumentReferences(vendor).map(reference=>reference.ownerType)),new Set(["driver","vehicle"])));
test("owner-driver application documents remain readable",()=>assert.equal(resolvePartnerApplicationDocument(ownerDriver,"root-cnic")?.ownerType,"application"));
test("multi-Driver and multi-Vehicle associations remain exact",()=>{const references=collectPartnerApplicationDocumentReferences(vendor);assert.deepEqual(references.find(reference=>reference.document.id==="driver-two-cnic"),{document:vendor.drivers[1].documents[0],ownerType:"driver",ownerIndex:1});assert.deepEqual(references.find(reference=>reference.document.id==="vehicle-two-photo"),{document:vendor.vehicles[1].documents[0],ownerType:"vehicle",ownerIndex:1})});

test("secure route exposes no public URL and uses the normalized resolver",()=>{const route=readFileSync(new URL("../app/api/admin/partner-applications/documents/route.ts",import.meta.url),"utf8");assert.match(route,/resolvePartnerApplicationDocument/);assert.match(route,/private, no-store/);assert.doesNotMatch(route,/getDownloadURL|makePublic/)})
