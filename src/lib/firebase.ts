// C:\Users\eZhire\rentka-website\src\lib\firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase Web Configuration
 * Safe for client-side usage
 * READ-ONLY usage for website
 */
const firebaseConfig = {
  apiKey: "AIzaSyC9ROzeBrh7X4RnhQQ5Ta84ziiwyHdGgEo",
  authDomain: "carconnectapp-be6a1.firebaseapp.com",
  projectId: "carconnectapp-be6a1",
  storageBucket: "carconnectapp-be6a1.firebasestorage.app",
  messagingSenderId: "392849171116",
  appId: "1:392849171116:web:12101de67cc51dba38b509",
};

/**
 * Prevent re-initialization on hot reload
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Firestore (READ-ONLY)
 */
export const db = getFirestore(app);

/**
 * Firebase Storage (READ-ONLY for images)
 */
export const storage = getStorage(app);

export default app;
