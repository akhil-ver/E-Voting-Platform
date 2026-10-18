// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// Backed by Vite environment variables with project credentials
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCJGa3s2WAM6q3Gndw1-KPEQc4ZhoP_vZg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "evotingsystem-4c3a1.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://evotingsystem-4c3a1-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "evotingsystem-4c3a1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "evotingsystem-4c3a1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "746291117510",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:746291117510:web:9ecbb9d4d7d4f504d986c7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QBR78BHWZY"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics is optional and non-blocking
  });
}

export default app;
