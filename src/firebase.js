import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

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

// Validate required config
const required = ["apiKey", "projectId", "appId"];
required.forEach(key => {
  if (!firebaseConfig[key]) {
    console.warn(`[Firebase] Missing config for ${key}. Check .env`);
  }
});

// Singleton initialization (HMR safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Realtime Database
const rtdb = getDatabase(app);

// Firestore — use new persistent cache API (replaces deprecated enableIndexedDbPersistence)
// Falls back to memory cache if already initialized (HMR / multi-tab safe)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // Already initialized (e.g. HMR hot reload) — reuse existing instance
  db = getFirestore(app);
}

// Named exports
export { app as default, rtdb, db, db as firestore };