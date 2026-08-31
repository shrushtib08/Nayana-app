// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if config is provided
const isConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined";

const app = initializeApp(isConfigured ? firebaseConfig : {
  apiKey: "temporary-placeholder-will-fail-safely",
  authDomain: "temporary",
  projectId: "temporary",
  storageBucket: "temporary",
  messagingSenderId: "temporary",
  appId: "temporary"
});

export const auth = getAuth(app);
export const isFirebaseConfigured = isConfigured;
