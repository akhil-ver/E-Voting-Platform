/**
 * Authentication Context & Provider
 * Manages multi-role identity sessions, cryptographic key loading, and demo personas
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { AuthUser, AuthPanelRole } from './AuthTypes';
import { generateVoterKeyPair } from '../../crypto/signatures';
import { storeClientKey, clearClientKey } from '../../crypto/key-management';

export const DEMO_PERSONAS: Record<'voter' | 'panel' | 'admin' | 'auditor' | 'guest', AuthUser> = {
  voter: {
    id: 'usr-voter-sarah',
    name: 'Sarah Connor',
    email: 'sarah.connor@electorate.gov',
    role: 'VOTER',
    roleTitle: 'Registered Sovereign Citizen',
    voterId: 'VOT-2026-8821',
    jurisdiction: 'Mumbai South',
    hometown: 'Mumbai',
    electionId: 'elec-mum-01',
    publicKeyFingerprint: '0x8F3A...11B9',
    clearanceLevel: 'CITIZEN_VOTER_VERIFIED',
    department: 'Constituency Electoral Roll',
    isDemoUser: true,
    loginTime: new Date().toISOString(),
    avatarSeed: 'sarah',
  },
  panel: {
    id: 'usr-panel-elena',
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@election-commission.gov',
    role: 'ADMIN',
    roleTitle: 'Chief Election Commissioner & Returning Officer',
    voterId: 'EC-OFFICIAL-01',
    jurisdiction: 'National Electoral Commission Headquarters',
    publicKeyFingerprint: '0x3C19...E842',
    clearanceLevel: 'COMMISSIONER_CLEARANCE_TIER_3',
    thresholdKeyIndex: 1,
    department: 'Central Electoral Commission',
    isDemoUser: true,
    loginTime: new Date().toISOString(),
    avatarSeed: 'elena',
  },
  admin: {
    id: 'usr-admin-alex',
    name: 'Alex Vance',
    email: 'alex.vance@cybersecurity.gov',
    role: 'ADMIN',
    roleTitle: 'Chief Information Security Officer (CISO)',
    voterId: 'SEC-ROOT-99',
    jurisdiction: 'Cryptographic Infrastructure Command',
    publicKeyFingerprint: '0x7D4E...99A1',
    clearanceLevel: 'CISO_ROOT_SECURITY_OPERATOR',
    thresholdKeyIndex: 2,
    department: 'Infrastructure & Threat Defense',
    isDemoUser: true,
    loginTime: new Date().toISOString(),
    avatarSeed: 'alex',
  },
  auditor: {
    id: 'usr-auditor-marcus',
    name: 'Marcus Chen',
    email: 'marcus.chen@un-electionwatch.org',
    role: 'AUDITOR',
    roleTitle: 'Lead Cryptographic Auditor & UN Observer',
    voterId: 'OBS-UN-404',
    jurisdiction: 'International Electoral Monitoring Mission',
    publicKeyFingerprint: '0x992B...44F0',
    clearanceLevel: 'INDEPENDENT_AUDITOR_CLEARANCE',
    thresholdKeyIndex: 3,
    department: 'Global Democratic Integrity Foundation',
    isDemoUser: true,
    loginTime: new Date().toISOString(),
    avatarSeed: 'marcus',
  },
  guest: {
    id: 'usr-guest-public',
    name: 'Public Guest Observer',
    email: 'observer@public.net',
    role: 'OBSERVER',
    roleTitle: 'Civic Watchdog & Public Observer',
    voterId: 'PUB-GUEST-00',
    jurisdiction: 'Public Realm (Read-Only)',
    publicKeyFingerprint: '0x0000...GUEST',
    clearanceLevel: 'PUBLIC_READ_ONLY',
    department: 'Public Transparency Portal',
    isDemoUser: true,
    loginTime: new Date().toISOString(),
    avatarSeed: 'guest',
  },
};

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  login: (
    identifier: string,
    passwordOrPin: string,
    role: UserRole,
    customData?: Partial<AuthUser>
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (formData: {
    name?: string;
    email?: string;
    role: UserRole;
    jurisdiction?: string;
    hometown?: string;
    electionId?: string;
    voterId?: string;
    nationalId?: string;
    nationalIdMasked?: string;
    aadhaarLast4?: string;
    password?: string;
    department?: string;
  }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  loginDemoUser: (personaKey: 'voter' | 'panel' | 'admin' | 'auditor' | 'guest') => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'smart_evoting_auth_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
        setIsAuthenticated(true);
      } else {
        // Default to active test voter persona for immediate usability
        setUser(DEMO_PERSONAS.voter);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_PERSONAS.voter));
      }
    } catch {
      setUser(DEMO_PERSONAS.voter);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistSession = (authUser: AuthUser) => {
    setUser(authUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      if (authUser.publicKeyJwk) {
        storeClientKey({
          keyPairId: authUser.id,
          fingerprint: authUser.publicKeyFingerprint || '0x0000...0000',
          createdAt: authUser.loginTime,
          publicKeyJwk: authUser.publicKeyJwk,
          privateKeyJwk: authUser.privateKeyJwk,
        });
      }
    } catch (err) {
      console.warn('Failed to save auth session to localStorage', err);
    }
  };

  const login = async (
    identifier: string,
    passwordOrPin: string,
    role: UserRole,
    customData?: Partial<AuthUser>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanId = identifier.trim();
      const cleanPass = passwordOrPin.trim();

      if (!cleanId) {
        return { success: false, error: 'Please enter your Election ID, Admin Badge ID, or Email.' };
      }

      // Generate client keypair for cryptographic ballot signing
      const keypair = await generateVoterKeyPair();

      // 1. Single Administrator Login
      if (role === 'ADMIN' || cleanId.toLowerCase() === 'admin' || cleanId.toLowerCase() === 'admin-001') {
        try {
          const res = await fetch('/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            return { success: false, error: data.error || 'Access denied: System allows only one designated administrator.' };
          }

          const adminUser: AuthUser = {
            id: data.admin?.id || 'usr-admin-single-root',
            name: data.admin?.name || 'Election Commission Administrator',
            email: data.admin?.email || 'admin@e-voting.gov',
            role: 'ADMIN',
            roleTitle: data.admin?.roleTitle || 'Sole Central Election Administrator',
            voterId: data.admin?.adminId || 'ADMIN-001',
            jurisdiction: data.admin?.jurisdiction || 'National Electoral Command (10+ Cities)',
            department: data.admin?.department || 'Central Electoral Directorate',
            publicKeyFingerprint: keypair.publicKeyFingerprint,
            publicKeyJwk: keypair.publicKeyJwk,
            privateKeyJwk: keypair.privateKeyJwk,
            clearanceLevel: 'SOLE_CENTRAL_ADMINISTRATOR',
            isDemoUser: false,
            loginTime: new Date().toISOString(),
            avatarSeed: 'admin',
          };

          persistSession(adminUser);
          setShowAuthModal(false);
          return { success: true };
        } catch {
          // Fallback to local single admin check if offline
          if (cleanId.toLowerCase() === 'admin' || cleanId.toLowerCase() === 'admin-001') {
            if (cleanPass && cleanPass !== 'admin123') {
              return { success: false, error: 'Incorrect administrator password.' };
            }
            const adminUser: AuthUser = {
              id: 'usr-admin-single-root',
              name: 'Election Commission Administrator',
              email: 'admin@e-voting.gov',
              role: 'ADMIN',
              roleTitle: 'Sole Central Election Administrator',
              voterId: 'ADMIN-001',
              jurisdiction: 'National Electoral Command (10+ Cities)',
              department: 'Central Electoral Directorate',
              publicKeyFingerprint: keypair.publicKeyFingerprint,
              publicKeyJwk: keypair.publicKeyJwk,
              privateKeyJwk: keypair.privateKeyJwk,
              clearanceLevel: 'SOLE_CENTRAL_ADMINISTRATOR',
              isDemoUser: false,
              loginTime: new Date().toISOString(),
              avatarSeed: 'admin',
            };
            persistSession(adminUser);
            setShowAuthModal(false);
            return { success: true };
          }
          return { success: false, error: 'Access denied: System allows only one designated administrator.' };
        }
      }

      // 2. Citizen Voter Login (Election ID + Password)
      try {
        const res = await fetch('/api/auth/voter/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voterId: cleanId, password: cleanPass }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Voter authentication failed.' };
        }

        const voter = data.voter;
        const voterUser: AuthUser = {
          id: voter.id || `usr-${Date.now().toString(36)}`,
          name: voter.name,
          email: voter.email || `${cleanId.toLowerCase()}@e-voting.gov`,
          role: 'VOTER',
          roleTitle: 'Verified Sovereign Citizen',
          voterId: voter.voterId,
          fatherName: voter.fatherName,
          motherName: voter.motherName,
          aadhaarLast4: voter.aadhaarLast4,
          hometown: voter.hometown,
          jurisdiction: voter.constituencyName,
          electionId: voter.electionId,
          publicKeyFingerprint: keypair.publicKeyFingerprint,
          publicKeyJwk: keypair.publicKeyJwk,
          privateKeyJwk: keypair.privateKeyJwk,
          clearanceLevel: 'CITIZEN_VOTER_VERIFIED',
          department: 'Constituency Electoral Roll',
          isDemoUser: false,
          loginTime: new Date().toISOString(),
          avatarSeed: voter.name,
        };

        persistSession(voterUser);
        setShowAuthModal(false);
        return { success: true };
      } catch {
        // Fallback for voter demo if server temporarily unavailable
        const newUser: AuthUser = {
          id: `usr-${Date.now().toString(36)}`,
          name: customData?.name || cleanId.split('@')[0] || 'Authenticated Citizen',
          email: cleanId.includes('@') ? cleanId : `${cleanId.toLowerCase()}@e-voting.gov`,
          role: 'VOTER',
          roleTitle: 'Registered Sovereign Citizen',
          voterId: cleanId,
          jurisdiction: customData?.jurisdiction || 'Mumbai South',
          hometown: customData?.hometown || 'Mumbai',
          publicKeyFingerprint: keypair.publicKeyFingerprint,
          publicKeyJwk: keypair.publicKeyJwk,
          privateKeyJwk: keypair.privateKeyJwk,
          clearanceLevel: 'CITIZEN_STANDARD',
          department: 'Constituency Electoral Roll',
          isDemoUser: false,
          loginTime: new Date().toISOString(),
          avatarSeed: cleanId,
          ...customData,
        };
        persistSession(newUser);
        setShowAuthModal(false);
        return { success: true };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (formData: {
    name?: string;
    email?: string;
    role: UserRole;
    jurisdiction?: string;
    hometown?: string;
    electionId?: string;
    voterId?: string;
    nationalId?: string;
    nationalIdMasked?: string;
    aadhaarLast4?: string;
    password?: string;
    department?: string;
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    setIsLoading(true);
    try {
      const targetVoterId = (formData.voterId || formData.nationalId || '').trim();
      const targetAadhaar = (formData.aadhaarLast4 || (formData.nationalIdMasked ? formData.nationalIdMasked.replace(/\D/g, '').slice(-4) : '')).trim();
      const targetPass = (formData.password || '').trim();

      if (!targetVoterId) {
        return { success: false, error: 'Full Election ID is required for registration.' };
      }
      if (!targetAadhaar || targetAadhaar.length !== 4) {
        return { success: false, error: 'Last 4 digits of Aadhaar number are required.' };
      }
      if (!targetPass || targetPass.length < 4) {
        return { success: false, error: 'Please create a password of at least 4 characters.' };
      }

      // Generate real Web Crypto ECDSA Keypair for voter
      const keypair = await generateVoterKeyPair();

      // Call Backend Verification & Registration Endpoint
      const res = await fetch('/api/auth/voter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId: formData.electionId,
          voterId: targetVoterId,
          aadhaarLast4: targetAadhaar,
          password: targetPass,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      const voter = data.voter;
      const newUser: AuthUser = {
        id: voter.id || `usr-reg-${Date.now().toString(36)}`,
        name: voter.name,
        email: voter.email || `${targetVoterId.toLowerCase()}@e-voting.gov`,
        role: 'VOTER',
        roleTitle: 'Registered Sovereign Citizen',
        voterId: voter.voterId,
        fatherName: voter.fatherName,
        motherName: voter.motherName,
        aadhaarLast4: voter.aadhaarLast4,
        hometown: voter.hometown,
        electionId: voter.electionId,
        jurisdiction: voter.constituencyName,
        publicKeyFingerprint: keypair.publicKeyFingerprint,
        publicKeyJwk: keypair.publicKeyJwk,
        privateKeyJwk: keypair.privateKeyJwk,
        clearanceLevel: 'CITIZEN_VOTER_REGISTERED',
        department: 'Civic Electorate Roll',
        isDemoUser: false,
        loginTime: new Date().toISOString(),
        avatarSeed: voter.name,
      };

      persistSession(newUser);
      setShowAuthModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('voter-auth-updated', {
            detail: { voter: newUser, action: 'SIGNUP' },
          })
        );
      }

      return { success: true, user: newUser };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemoUser = async (personaKey: 'voter' | 'panel' | 'admin' | 'auditor' | 'guest') => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const persona = { ...DEMO_PERSONAS[personaKey], loginTime: new Date().toISOString() };
      
      // Also generate keys if voter
      if (persona.role === 'VOTER' && !persona.publicKeyJwk) {
        const keys = await generateVoterKeyPair();
        persona.publicKeyJwk = keys.publicKeyJwk;
        persona.privateKeyJwk = keys.privateKeyJwk;
        persona.publicKeyFingerprint = keys.publicKeyFingerprint;
      }

      persistSession(persona);
      setShowAuthModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      clearClientKey();
    } catch (err) {
      console.warn(err);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: AuthUser = {
      ...user,
      role: newRole === 'ADMIN' ? 'ADMIN' : 'VOTER',
      roleTitle: newRole === 'ADMIN' ? 'Election Administrator' : 'Registered Citizen Voter',
    };
    persistSession(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        showAuthModal,
        setShowAuthModal,
        login,
        signup,
        loginDemoUser,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
