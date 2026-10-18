/**
 * AES-256 Ballot Encryption & Threshold Decryption Simulation
 * Uses Web Crypto AES-GCM for simulated ballot envelope encryption
 */
import { bufferToHex, hexToBuffer } from './hashing';

export interface EncryptedEnvelope {
  ciphertext: string;
  iv: string;
  tag?: string;
  algorithm: string;
}

export async function generateBallotEncryptionKey(): Promise<CryptoKey> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  throw new Error('Web Crypto API required for key generation');
}

export async function encryptBallot(
  ballotPlaintext: string,
  electionKeyHex?: string
): Promise<EncryptedEnvelope> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ballotPlaintext);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    let cryptoKey: CryptoKey;

    if (electionKeyHex) {
      const rawKey = hexToBuffer(electionKeyHex.padEnd(64, '0').slice(0, 64));
      cryptoKey = await window.crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
    } else {
      cryptoKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );
    }

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );

    return {
      ciphertext: bufferToHex(encryptedBuffer),
      iv: bufferToHex(iv.buffer),
      algorithm: 'AES-256-GCM',
    };
  }

  // Pure deterministic simulated encryption fallback for server-side mocks
  const ivSim = Array.from({ length: 12 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  const simulatedCiphertext = Buffer.from(ballotPlaintext).toString('base64');
  return {
    ciphertext: simulatedCiphertext,
    iv: ivSim,
    algorithm: 'AES-256-GCM-SIMULATED',
  };
}

export async function decryptBallot(
  envelope: EncryptedEnvelope,
  keyHex: string
): Promise<string> {
  if (envelope.algorithm === 'AES-256-GCM-SIMULATED') {
    return Buffer.from(envelope.ciphertext, 'base64').toString('utf-8');
  }

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const iv = hexToBuffer(envelope.iv);
    const ciphertext = hexToBuffer(envelope.ciphertext);
    const rawKey = hexToBuffer(keyHex.padEnd(64, '0').slice(0, 64));

    const cryptoKey = await window.crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  return Buffer.from(envelope.ciphertext, 'base64').toString('utf-8');
}
