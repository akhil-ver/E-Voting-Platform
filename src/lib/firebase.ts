/**
 * Client-side Firebase Configuration & Analytics Initializer
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyCJGa3s2WAM6q3Gndw1-KPEQc4ZhoP_vZg",
  authDomain: "evotingsystem-4c3a1.firebaseapp.com",
  databaseURL: "https://evotingsystem-4c3a1-default-rtdb.firebaseio.com",
  projectId: "evotingsystem-4c3a1",
  storageBucket: "evotingsystem-4c3a1.firebasestorage.app",
  messagingSenderId: "746291117510",
  appId: "1:746291117510:web:9ecbb9d4d7d4f504d986c7",
  measurementId: "G-QBR78BHWZY",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export async function initAnalytics() {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
}
