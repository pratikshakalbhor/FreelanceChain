import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Ensure Project ID is never an empty segment
const PID = (process.env.REACT_APP_FIREBASE_PROJECT_ID || "").trim() || "freelancechain-5dfb1";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: PID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

// Debug check for missing configuration
if (!process.env.REACT_APP_FIREBASE_PROJECT_ID) {
  console.warn(`[Firebase] REACT_APP_FIREBASE_PROJECT_ID missing. Using Fallback: ${PID}`);
} else {
  console.log(`[Firebase] Initialized with Project ID: ${PID}`);
}

// Validate required config
const required = ["apiKey", "projectId", "appId"];
required.forEach(key => {
  if (!firebaseConfig[key]) {
    console.error(`[Firebase] Critical error: ${key} is missing from config!`);
  }
});

const app = initializeApp(firebaseConfig);

// Direct single-instance exports for both databases
export const rtdb = getDatabase(app);

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const firestore = db;
export default app;





