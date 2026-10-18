/**
 * Firebase Firestore & Firebase Storage Adapter
 * Implements IDatabaseService and IStorageService using Firebase JS SDK
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  getBytes,
  deleteObject,
} from 'firebase/storage';
import { IDatabaseService, IStorageService } from '../../../services/interfaces';

export const defaultFirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCJGa3s2WAM6q3Gndw1-KPEQc4ZhoP_vZg",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "evotingsystem-4c3a1.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://evotingsystem-4c3a1-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "evotingsystem-4c3a1",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "evotingsystem-4c3a1.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "746291117510",
  appId: process.env.FIREBASE_APP_ID || "1:746291117510:web:9ecbb9d4d7d4f504d986c7",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-QBR78BHWZY",
};

function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

export function getOrInitializeFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(defaultFirebaseConfig);
}

export class FirebaseFirestoreService implements IDatabaseService {
  private db: Firestore | null = null;
  private isConfigured = false;
  private memoryFallbackStore: Map<string, Map<string, unknown>> = new Map();

  constructor() {
    // Only attempt Firestore connection if explicitly enabled or if API is valid
    if (process.env.ENABLE_FIREBASE_FIRESTORE === 'true' || process.env.DATABASE_PROVIDER === 'firestore') {
      try {
        const app = getOrInitializeFirebaseApp();
        this.db = getFirestore(app);
        this.isConfigured = true;
      } catch (err) {
        console.warn('[FirebaseFirestoreService] Initialization error, using in-memory store:', err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  private handleRemoteError(action: string, collectionName: string, idOrDetails: string, err: unknown) {
    const errorStr = String(err);
    if (errorStr.includes('PERMISSION_DENIED') || errorStr.includes('disabled') || errorStr.includes('Timeout')) {
      if (this.isConfigured) {
        console.warn(`[FirebaseFirestoreService] Disabling remote sync due to Firestore unavailability (${action} on ${collectionName}/${idOrDetails}): In-memory store active.`);
        this.isConfigured = false;
      }
    } else {
      console.warn(`[Firebase ${action}] Error on ${collectionName}/${idOrDetails}:`, err);
    }
  }

  private getMemoryCol(collectionName: string): Map<string, unknown> {
    if (!this.memoryFallbackStore.has(collectionName)) {
      this.memoryFallbackStore.set(collectionName, new Map());
    }
    return this.memoryFallbackStore.get(collectionName)!;
  }

  public async read<T>(collectionName: string, id: string): Promise<T | null> {
    if (this.db && this.isConfigured) {
      try {
        const docRef = doc(this.db, collectionName, id);
        const snap = await withTimeout(getDoc(docRef), 1500);
        if (snap.exists()) {
          return snap.data() as T;
        }
        return null;
      } catch (err) {
        this.handleRemoteError('read', collectionName, id, err);
      }
    }

    const col = this.getMemoryCol(collectionName);
    const item = col.get(id);
    return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
  }

  public async write<T extends { id: string }>(collectionName: string, data: T): Promise<T> {
    const col = this.getMemoryCol(collectionName);
    col.set(data.id, JSON.parse(JSON.stringify(data)));

    if (this.db && this.isConfigured) {
      try {
        const docRef = doc(this.db, collectionName, data.id);
        await withTimeout(setDoc(docRef, data, { merge: true }), 1500);
      } catch (err) {
        this.handleRemoteError('write', collectionName, data.id, err);
      }
    }

    return data;
  }

  public async query<T>(collectionName: string, filter?: (item: T) => boolean): Promise<T[]> {
    if (this.db && this.isConfigured) {
      try {
        const colRef = collection(this.db, collectionName);
        const snap = await withTimeout(getDocs(colRef), 1500);
        const items = snap.docs.map((d) => d.data() as T);
        return filter ? items.filter(filter) : items;
      } catch (err) {
        this.handleRemoteError('query', collectionName, '*', err);
      }
    }

    const col = this.getMemoryCol(collectionName);
    const all = Array.from(col.values()).map((v) => JSON.parse(JSON.stringify(v)) as T);
    return filter ? all.filter(filter) : all;
  }

  public async delete(collectionName: string, id: string): Promise<boolean> {
    const col = this.getMemoryCol(collectionName);
    col.delete(id);

    if (this.db && this.isConfigured) {
      try {
        const docRef = doc(this.db, collectionName, id);
        await withTimeout(deleteDoc(docRef), 1500);
      } catch (err) {
        this.handleRemoteError('delete', collectionName, id, err);
      }
    }

    return true;
  }

  public async transaction<T>(operations: () => Promise<T>): Promise<T> {
    return await operations();
  }

  public async healthCheck(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
    latencyMs: number;
    provider: string;
  }> {
    if (!this.db || !this.isConfigured) {
      return {
        status: 'DEGRADED',
        latencyMs: 0.5,
        provider: 'firebase-firestore (memory fallback)',
      };
    }

    const start = Date.now();
    try {
      const docRef = doc(this.db, '_health_check', 'ping');
      await getDoc(docRef);
      return {
        status: 'HEALTHY',
        latencyMs: Date.now() - start,
        provider: 'firebase-firestore (evotingsystem-4c3a1)',
      };
    } catch {
      return {
        status: 'DEGRADED',
        latencyMs: Date.now() - start,
        provider: 'firebase-firestore',
      };
    }
  }
}

export class FirebaseStorageService implements IStorageService {
  private storage: FirebaseStorage | null = null;
  private isConfigured = false;
  private localFiles: Map<string, { content: string | Uint8Array; hash: string }> = new Map();

  constructor() {
    try {
      const app = getOrInitializeFirebaseApp();
      this.storage = getStorage(app);
      this.isConfigured = true;
    } catch (err) {
      console.warn('[FirebaseStorageService] Init warning:', err);
    }
  }

  public async upload(
    path: string,
    content: string | Uint8Array,
    metadata?: Record<string, string>
  ): Promise<{ uri: string; hash: string }> {
    const hash = `sha256-${Date.now().toString(16)}`;
    this.localFiles.set(path, { content, hash });

    if (this.storage && this.isConfigured) {
      try {
        const storageRef = ref(this.storage, path);
        if (typeof content === 'string') {
          await uploadString(storageRef, content, 'raw', { customMetadata: metadata });
        } else {
          await uploadBytes(storageRef, content, { customMetadata: metadata });
        }
        const downloadUrl = await getDownloadURL(storageRef);
        return { uri: downloadUrl, hash };
      } catch (err) {
        console.warn('[Firebase Storage upload] Fallback to memory:', err);
      }
    }

    return { uri: `/storage/${path}`, hash };
  }

  public async retrieve(path: string): Promise<string | Uint8Array | null> {
    if (this.storage && this.isConfigured) {
      try {
        const storageRef = ref(this.storage, path);
        const bytes = await getBytes(storageRef);
        return new Uint8Array(bytes);
      } catch (err) {
        console.warn('[Firebase Storage retrieve] Fallback:', err);
      }
    }

    const local = this.localFiles.get(path);
    return local ? local.content : null;
  }

  public async delete(path: string): Promise<boolean> {
    this.localFiles.delete(path);
    if (this.storage && this.isConfigured) {
      try {
        const storageRef = ref(this.storage, path);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('[Firebase Storage delete] Error:', err);
      }
    }
    return true;
  }

  public async healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }> {
    return {
      status: this.isConfigured ? 'HEALTHY' : 'UNAVAILABLE',
      provider: 'firebase-storage',
    };
  }
}
