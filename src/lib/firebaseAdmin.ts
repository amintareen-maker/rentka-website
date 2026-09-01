import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Missing Firebase Admin environment variables");
  return getApps().length === 0 ? initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        ...(process.env.FIREBASE_STORAGE_BUCKET ? { storageBucket: process.env.FIREBASE_STORAGE_BUCKET } : {}),
      }) : getApps()[0];
}

export function getAdminDb() { return getFirestore(getAdminApp()); }
export function getAdminBucket() {
  if (!process.env.FIREBASE_STORAGE_BUCKET) throw new Error("FIREBASE_STORAGE_BUCKET is not configured.");
  return getStorage(getAdminApp()).bucket();
}
