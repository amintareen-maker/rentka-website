import assert from "node:assert/strict";import test from "node:test";
import { applicantConfirmedValue, extractDocumentFields } from "../src/lib/partner-applications/extraction.ts";
import { normalizeCnic, normalizeLicence, normalizeRegistration, normalizeVendorName } from "../src/lib/partner-applications/normalization.ts";
test("normalizes sensitive matching identifiers inside onboarding only",()=>{assert.equal(normalizeCnic("61101-1234567-1"),"6110112345671");assert.equal(normalizeLicence(" isl- 123/abc "),"ISL123ABC");assert.equal(normalizeRegistration("ICT - 123"),"ICT123");assert.equal(normalizeVendorName("North Rent A Car Pvt Ltd"),"north")});
test("successful local extraction returns editable suggestions",()=>{const x=extractDocumentFields("Licence No: ISL-12345 Issue Date: 01/02/2022 Expiry Date: 01/02/2027","licence_front");assert.equal(x.status,"extracted");assert.equal(x.fields.licenceNumber.value,"ISL-12345");assert.equal(x.fields.licenceExpiryDate.value,"2027-02-01")});
test("low confidence or unavailable extraction is not authoritative",()=>{const x=extractDocumentFields("blurry unreadable scan","cnic_front");assert.equal(x.status,"unavailable");assert.deepEqual(x.fields,{})});
test("applicant correction always wins over extraction",()=>assert.equal(applicantConfirmedValue("CORRECT-9","WRONG-1",true),"CORRECT-9"));
test("manual fallback works when extraction is not accepted",()=>assert.equal(applicantConfirmedValue("","WRONG-1",false),""));
test("extraction metadata has no verification state",()=>{const x=extractDocumentFields("CNIC 61101-1234567-1","cnic_front");assert.equal("reviewState" in x,false);assert.equal("verified" in x,false)});
