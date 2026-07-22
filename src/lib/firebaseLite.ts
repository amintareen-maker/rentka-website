import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyC9ROzeBrh7X4RnhQQ5Ta84ziiwyHdGgEo",
  authDomain: "carconnectapp-be6a1.firebaseapp.com",
  projectId: "carconnectapp-be6a1",
  storageBucket: "carconnectapp-be6a1.firebasestorage.app",
  messagingSenderId: "392849171116",
  appId: "1:392849171116:web:12101de67cc51dba38b509",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// One-time server reads do not need the realtime Listen transport.
// Read failures are handled by the calling pages with an empty-state fallback.
setLogLevel("silent");
export const liteDb = getFirestore(app);
