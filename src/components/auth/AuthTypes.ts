/**
 * Authentication and Multi-Layer Identity System Types
 */
import { UserRole } from '../../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  voterId?: string;
  electionId?: string;
  fatherName?: string;
  motherName?: string;
  aadhaarLast4?: string;
  hometown?: string;
  jurisdiction?: string;
  publicKeyFingerprint?: string;
  publicKeyJwk?: JsonWebKey;
  privateKeyJwk?: JsonWebKey;
  clearanceLevel?: string;
  thresholdKeyIndex?: number;
  department?: string;
  isDemoUser?: boolean;
  loginTime: string;
  avatarSeed?: string;
}

export type AuthMode = 'LOGIN' | 'SIGNUP';
export type AuthPanelRole = 'VOTER' | 'ADMIN';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMode: AuthMode;
  selectedRoleTab: AuthPanelRole;
}
