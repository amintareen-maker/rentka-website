import { DOCUMENT_REVIEW_STATES, type DocumentReviewState, type PartnerApplication, type PartnerDocument, type PartnerDocumentHistoryEntry, type PartnerDocumentOwnerType } from "./types.ts";
import { resolveCurrentPartnerApplicationDocument } from "./document-retrieval-core.ts";
import type { AuditActor } from "../dispatch/types.ts";

type MutableDocumentApplication=Pick<PartnerApplication,"documents"|"drivers"|"vehicles"|"documentHistory">;
export type DocumentReviewChange={documentId:string;state:DocumentReviewState;note?:string};
export type DocumentOwnerExpectation={ownerType:PartnerDocumentOwnerType;ownerIndex?:number};

function replaceAtOwner(application:MutableDocumentApplication,documentId:string,replacement:PartnerDocument,owner:DocumentOwnerExpectation){
 const replace=(documents:PartnerDocument[]|undefined)=>{let found=false;const next=(documents??[]).map(document=>{if(document.id!==documentId)return document;found=true;return replacement});if(!found)throw new Error("Document association changed. Refresh and try again.");return next};
 if(owner.ownerType==="application")return{documents:replace(application.documents),drivers:application.drivers,vehicles:application.vehicles};
 if(owner.ownerIndex===undefined)throw new Error("Document owner is invalid.");
 if(owner.ownerType==="driver")return{documents:application.documents,drivers:application.drivers.map((driver,index)=>index===owner.ownerIndex?{...driver,documents:replace(driver.documents)}:driver),vehicles:application.vehicles};
 return{documents:application.documents,drivers:application.drivers,vehicles:application.vehicles.map((vehicle,index)=>index===owner.ownerIndex?{...vehicle,documents:replace(vehicle.documents)}:vehicle)};
}

export function applyDocumentReviewChanges(application:MutableDocumentApplication,changes:DocumentReviewChange[],reviewedAt:string){
 const ids=new Set<string>();for(const change of changes){if(ids.has(change.documentId))throw new Error("Duplicate document review.");ids.add(change.documentId);if(!DOCUMENT_REVIEW_STATES.includes(change.state))throw new Error("Invalid document state.");if(!resolveCurrentPartnerApplicationDocument(application,change.documentId))throw new Error("Document not found.")}
 const byId=new Map(changes.map(change=>[change.documentId,change]));const update=(documents:PartnerDocument[]|undefined)=>(documents??[]).map(document=>{const change=byId.get(document.id);return change?{...document,reviewState:change.state,reviewedAt,...(change.note?{reviewNote:change.note}:{reviewNote:undefined})}:document});
 return{documents:update(application.documents),drivers:application.drivers.map(driver=>({...driver,documents:update(driver.documents)})),vehicles:application.vehicles.map(vehicle=>({...vehicle,documents:update(vehicle.documents)}))};
}

export function replacePartnerDocument(application:MutableDocumentApplication,documentId:string,replacement:PartnerDocument,expectedOwner:DocumentOwnerExpectation,metadata:{replacedAt:string;replacedBy:AuditActor;reason?:string}){
 const reference=resolveCurrentPartnerApplicationDocument(application,documentId);if(!reference)throw new Error("Document not found.");
 if(reference.ownerType!==expectedOwner.ownerType||reference.ownerIndex!==expectedOwner.ownerIndex)throw new Error("Document owner does not match.");
 if(reference.document.kind!==replacement.kind)throw new Error("Replacement document type does not match.");
 const current=replaceAtOwner(application,documentId,replacement,expectedOwner),history:PartnerDocumentHistoryEntry={...reference.document,ownerType:reference.ownerType,ownerIndex:reference.ownerIndex,replacedAt:metadata.replacedAt,replacedBy:metadata.replacedBy,replacedByDocumentId:replacement.id,...(metadata.reason?{replacementReason:metadata.reason}:{})};
 return{...current,documentHistory:[...(application.documentHistory??[]),history]};
}
