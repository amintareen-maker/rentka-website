import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminBucket, getAdminDb } from "../firebaseAdmin";
import { extractDocumentFields, printableDocumentText } from "./extraction";
import type { PartnerDocument, StagedUpload } from "./types";
import { prepareDocumentUpload } from "./documents-core";
export {
  ALLOWED_DOCUMENT_KINDS,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
} from "./documents-core";

export const STAGING_COLLECTION="partnerApplicationUploads";
export const UPLOAD_TTL_MS=24*60*60*1000;
const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function stageDocument(file:File,kind:string){
 const token=randomBytes(32).toString("base64url"),id=randomUUID(),prepared=await prepareDocumentUpload(file,kind,{stagedUploadId:id,objectId:randomUUID()}),path=prepared.storagePath,now=new Date(),expires=new Date(now.getTime()+UPLOAD_TTL_MS),extraction=extractDocumentFields(printableDocumentText(prepared.buffer),kind,now);
 await getAdminBucket().file(path).save(prepared.buffer,{resumable:false,contentType:file.type,metadata:{cacheControl:"private, no-store",metadata:{stagedUploadId:id}}});
 const staged:StagedUpload={tokenHash:tokenHash(token),storagePath:path,originalName:prepared.originalName,contentType:file.type,size:file.size,kind,createdAt:now.toISOString(),expiresAt:expires.toISOString(),extraction};
 try{await getAdminDb().collection(STAGING_COLLECTION).doc(id).create({...staged,expiresAtTimestamp:Timestamp.fromDate(expires)});}catch(error){await getAdminBucket().file(path).delete({ignoreNotFound:true});throw error}
 return{id,token,kind,originalName:staged.originalName,extraction,expiresAt:staged.expiresAt};
}
export async function claimStagedDocuments(transaction:FirebaseFirestore.Transaction,tokens:string[],applicationDocumentId:string){
 const unique=[...new Set(tokens)];if(unique.length>30)throw new Error("Too many uploaded documents.");
 const refs=unique.map(value=>{const [id,token]=value.split(".");if(!/^[0-9a-f-]{36}$/.test(id)||!token)return null;return{ref:getAdminDb().collection(STAGING_COLLECTION).doc(id),token}});if(refs.some(x=>!x))throw new Error("One or more upload tokens are invalid.");
 const snaps=await Promise.all(refs.map(x=>transaction.get(x!.ref))),now=Date.now();
 return snaps.map((snap,index)=>{if(!snap.exists)throw new Error("An uploaded document has expired. Please upload it again.");const data=snap.data() as StagedUpload;if(data.attachedApplicationId||data.tokenHash!==tokenHash(refs[index]!.token)||new Date(data.expiresAt).getTime()<=now)throw new Error("An uploaded document is unavailable or expired.");transaction.update(snap.ref,{attachedApplicationId:applicationDocumentId,attachedAt:FieldValue.serverTimestamp(),expiresAtTimestamp:FieldValue.delete()});return{id:snap.id,kind:data.kind,storagePath:data.storagePath,originalName:data.originalName,contentType:data.contentType,size:data.size,reviewState:"pending",uploadedAt:data.createdAt,...(data.extraction?{extraction:data.extraction}:{})} satisfies PartnerDocument});
}
export async function cleanupExpiredStagedUploads(limit=50){const snap=await getAdminDb().collection(STAGING_COLLECTION).where("expiresAtTimestamp","<=",Timestamp.now()).limit(limit).get();let removed=0;for(const doc of snap.docs){const data=doc.data() as StagedUpload;if(data.attachedApplicationId)continue;await getAdminBucket().file(data.storagePath).delete({ignoreNotFound:true});await doc.ref.delete();removed++}return removed}
export async function readProtectedDocument(path:string){if(!path.startsWith("partner-applications/staged/"))throw new Error("Invalid protected document path.");const file=getAdminBucket().file(path);const[metadata]=await file.getMetadata();const[buffer]=await file.download();return{buffer,contentType:String(metadata.contentType||"application/octet-stream"),name:path.split("/").at(-1)||"document"}}
export async function writeAdminReplacementDocument(file:File,kind:string){
 const id=randomUUID(),now=new Date(),prepared=await prepareDocumentUpload(file,kind,{stagedUploadId:id,objectId:randomUUID()}),extraction=extractDocumentFields(printableDocumentText(prepared.buffer),kind,now);
 await getAdminBucket().file(prepared.storagePath).save(prepared.buffer,{resumable:false,contentType:file.type,metadata:{cacheControl:"private, no-store",metadata:{adminReplacement:"true"}}});
 return{id,document:{id,kind,storagePath:prepared.storagePath,originalName:prepared.originalName,contentType:file.type,size:file.size,reviewState:"pending" as const,uploadedAt:now.toISOString(),extraction}};
}
