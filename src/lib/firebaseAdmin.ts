import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function getAdminDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Missing Firebase Admin environment variables");
  const adminApp = getApps().length === 0 ? initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      }) : getApps()[0];
  return getFirestore(adminApp);
}
