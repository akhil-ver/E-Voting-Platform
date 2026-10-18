/**
 * Key Management Utilities
 * Privacy-preserving client key management and fingerprint formatting
 */
import { sha256 } from './hashing';

export function formatKeyFingerprint(hashHex: string): string {
  if (!hashHex) return '0x0000...0000';
  const clean = hashHex.startsWith('0x') ? hashHex.slice(2) : hashHex;
  return `0x${clean.slice(0, 6)}...${clean.slice(-4)}`.toUpperCase();
}

export async function computePublicKeyFingerprint(publicKeyJwk: JsonWebKey | string): Promise<string> {
  const serialized = typeof publicKeyJwk === 'string' ? publicKeyJwk : JSON.stringify(publicKeyJwk);
  const hash = await sha256(serialized);
  return formatKeyFingerprint(hash);
}

export interface VoterKeyStorage {
  keyPairId: string;
  fingerprint: string;
  createdAt: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk?: JsonWebKey; // only stored locally in sessionStorage/localStorage for demo, never sent to server
}

const STORAGE_KEY = 'smart_evoting_voter_key';

export function storeClientKey(key: VoterKeyStorage): void {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(key));
  }
}

export function loadClientKey(): VoterKeyStorage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearClientKey(): void {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}
