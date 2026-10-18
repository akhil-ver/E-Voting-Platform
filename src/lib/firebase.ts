/**
 * Client-side Firebase Configuration & Analytics Initializer
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyBcRm2Wm2upczEgTAZxInU4kKg-5FU6VXg",
  authDomain: "evotingsystem-99e8a.firebaseapp.com",
  projectId: "evotingsystem-99e8a",
  storageBucket: "evotingsystem-99e8a.firebasestorage.app",
  messagingSenderId: "955499184767",
  appId: "1:955499184767:web:5587f943527f80f485f54a",
  measurementId: "G-F0PCZVN7M1",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export async function initAnalytics() {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
}
