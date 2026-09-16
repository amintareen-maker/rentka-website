import type { PartnerApplication, PartnerDocument, PartnerDocumentOwnerType } from "./types.ts";

export type PartnerDocumentReference={document:PartnerDocument;ownerType:PartnerDocumentOwnerType;ownerIndex?:number;historical?:boolean};
type DocumentApplication=Pick<PartnerApplication,"documents"|"drivers"|"vehicles"|"documentHistory">;

export function collectPartnerApplicationDocumentReferences(application:DocumentApplication|null|undefined):PartnerDocumentReference[]{
 if(!application)return[];
 return[
  ...(application.documents??[]).map(document=>({document,ownerType:"application" as const})),
  ...(application.drivers??[]).flatMap((driver,ownerIndex)=>(driver.documents??[]).map(document=>({document,ownerType:"driver" as const,ownerIndex}))),
  ...(application.vehicles??[]).flatMap((vehicle,ownerIndex)=>(vehicle.documents??[]).map(document=>({document,ownerType:"vehicle" as const,ownerIndex}))),
 ];
}

export function collectPartnerApplicationDocumentHistory(application:DocumentApplication|null|undefined):PartnerDocumentReference[]{return(application?.documentHistory??[]).map(document=>({document,ownerType:document.ownerType,ownerIndex:document.ownerIndex,historical:true}))}
export function resolveCurrentPartnerApplicationDocument(application:DocumentApplication|null|undefined,documentId:string){return collectPartnerApplicationDocumentReferences(application).find(reference=>reference.document.id===documentId)}
export function resolvePartnerApplicationDocument(application:DocumentApplication|null|undefined,documentId:string){return resolveCurrentPartnerApplicationDocument(application,documentId)??collectPartnerApplicationDocumentHistory(application).find(reference=>reference.document.id===documentId)}

export function protectedDocumentReadFailure(error:unknown){const value=error as{code?:unknown;statusCode?:unknown};const code=Number(value?.code??value?.statusCode);return code===404?{status:404,message:"Document file not found."}:{status:500,message:"Document could not be opened."}}
