/**
 * Layer 1: Authentication & Identity Gateway Component
 * Implements:
 * 1. Login options for citizen users and a single administrator (ADMIN-001)
 * 2. Single Admin Account: Only one administrator with exclusive control
 * 3. User Sign-Up: Register using Election ID + last 4 digits of Aadhaar number; create password upon verification
 * 4. User Login: Log in using Election ID + password created during registration (no need to register again)
 * 5. Duplicate Prevention: Prevents duplicate registrations and verifies against authorized records
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Vote,
  SlidersHorizontal,
  Lock,
  Key,
  UserCheck,
  UserPlus,
  ArrowRight,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building2,
  Fingerprint,
  Download,
  Copy,
  Check,
  FileCheck,
  ExternalLink,
  Shield,
  Layers,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from './AuthContext';
import { UserRole } from '../../types';
import { AuthPanelRole } from './AuthTypes';

interface AuthGateProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  initialVoterId?: string;
  initialAadhaarLast4?: string;
  initialMode?: 'LOGIN' | 'SIGNUP';
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onSuccess,
  isModal = false,
  onClose,
  initialVoterId,
  initialAadhaarLast4,
  initialMode,
}) => {
  const { login, signup, loginDemoUser, isLoading } = useAuth();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode || 'LOGIN');
  const [selectedRole, setSelectedRole] = useState<AuthPanelRole>('VOTER');

  // Voter / User Login Form State
  const [voterLoginId, setVoterLoginId] = useState<string>(initialVoterId || 'VOT-MUM-1001');
  const [voterLoginPassword, setVoterLoginPassword] = useState<string>('pass123');

  // Single Admin Login Form State
  const [adminUsername, setAdminUsername] = useState<string>('ADMIN-001');
  const [adminPassword, setAdminPassword] = useState<string>('admin123');

  // Voter Sign-Up Form State (Requirement 3: Election ID + Aadhaar Last 4 + Password)
  const [signupVoterId, setSignupVoterId] = useState<string>(initialVoterId || 'VOT-MUM-1005');
  const [signupAadhaarLast4, setSignupAadhaarLast4] = useState<string>(initialAadhaarLast4 || '1095');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');

  // Pre-verification feedback for sign-up
  const [isVerifyingRecord, setIsVerifyingRecord] = useState<boolean>(false);
  const [verifiedRecord, setVerifiedRecord] = useState<{
    name: string;
    fatherName: string;
    motherName: string;
    hometown: string;
    constituencyName: string;
    hasRegisteredAccount: boolean;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real-time lookup of voter record to display details and check eligibility
  const verifyVoterRecordDetails = async (vId: string, aLast4: string) => {
    if (!vId.trim() || aLast4.trim().length !== 4) {
      setErrorMessage('Please enter both your Full Election ID and the 4-digit Aadhaar number.');
      return;
    }

    setIsVerifyingRecord(true);
    setErrorMessage(null);
    setVerifiedRecord(null);

    try {
      const res = await fetch(`/api/admin/voters?area=ALL&search=${encodeURIComponent(vId.trim())}`);
      if (!res.ok) throw new Error('Could not query electoral records');
      const data = await res.json();
      const match = (data.voters || []).find(
        (v: { voterId: string }) => v.voterId.toLowerCase().trim() === vId.trim().toLowerCase()
      );

      if (!match) {
        setErrorMessage(
          `Election ID '${vId}' not found in authorized voter records. Only citizens enrolled by the administrator can register.`
        );
        return;
      }

      if (match.aadhaarLast4 !== aLast4.trim() && !match.nationalIdMasked.endsWith(aLast4.trim())) {
        setErrorMessage(
          `Aadhaar verification failed: Last 4 digits (${aLast4}) do not match records on file for ${match.name}.`
        );
        return;
      }

      if (match.hasRegisteredAccount) {
        setErrorMessage(
          `Duplicate Registration Rejected: An account has already been registered for Election ID '${match.voterId}'. Please log in directly.`
        );
        return;
      }

      setVerifiedRecord({
        name: match.name,
        fatherName: match.fatherName,
        motherName: match.motherName,
        hometown: match.hometown,
        constituencyName: match.constituencyName,
        hasRegisteredAccount: match.hasRegisteredAccount,
      });
      setSuccessMessage(
        `✓ Record verified! ${match.name} (${match.hometown}). Father: ${match.fatherName}, Mother: ${match.motherName}. Please create your password below.`
      );
    } catch {
      // Local fallback
      setSuccessMessage(`Record format valid. Proceed to create your password.`);
    } finally {
      setIsVerifyingRecord(false);
    }
  };

  useEffect(() => {
    if (initialVoterId) {
      setVoterLoginId(initialVoterId);
      setSignupVoterId(initialVoterId);
    }
    if (initialAadhaarLast4) {
      setSignupAadhaarLast4(initialAadhaarLast4);
    }
    if (initialMode) {
      setAuthMode(initialMode);
    }
    if (initialMode === 'SIGNUP' && initialVoterId && initialAadhaarLast4) {
      verifyVoterRecordDetails(initialVoterId, initialAadhaarLast4);
    }
  }, [initialVoterId, initialAadhaarLast4, initialMode]);

  const handleVerifyVoterRecord = () => {
    verifyVoterRecordDetails(signupVoterId, signupAadhaarLast4);
  };

  // Voter / User Login Submit
  const handleVoterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!voterLoginId.trim()) {
      setErrorMessage('Please enter your Election ID.');
      return;
    }
    if (!voterLoginPassword) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    const res = await login(voterLoginId.trim(), voterLoginPassword.trim(), 'VOTER');
    if (res.success) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify your Election ID and password.');
    }
  };

  // Single Administrator Login Submit
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!adminUsername.trim()) {
      setErrorMessage('Please enter the Administrator ID (ADMIN-001 or admin).');
      return;
    }

    const res = await login(adminUsername.trim(), adminPassword.trim(), 'ADMIN');
    if (res.success) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      setErrorMessage(res.error || 'Access denied: System allows only one designated administrator.');
    }
  };

  // Voter Sign-Up Submit (Requirement 3: Verify & Set Password)
  const handleVoterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupVoterId.trim()) {
      setErrorMessage('Full Election ID is required for voter registration.');
      return;
    }
    if (!signupAadhaarLast4.trim() || signupAadhaarLast4.trim().length !== 4) {
      setErrorMessage('Aadhaar must be exactly the last 4 numeric digits.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    const res = await signup({
      voterId: signupVoterId.trim().toUpperCase(),
      aadhaarLast4: signupAadhaarLast4.trim(),
      password: signupPassword.trim(),
      role: 'VOTER',
    });

    if (res.success && res.user) {
      setSuccessMessage(
        `Account successfully registered for ${res.user.name}! Your password is saved. You can now log in anytime using your Election ID and password.`
      );
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Registration failed. Please check your credentials against official records.');
    }
  };

  const handleDemoLaunch = async (personaKey: 'voter' | 'admin' | 'guest') => {
    setErrorMessage(null);
    await loginDemoUser(personaKey);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  return (
    <div className={`w-full ${isModal ? 'p-0' : 'min-h-[85vh] flex items-center justify-center p-4'}`}>
      <div className="w-full max-w-5xl rounded-3xl border border-slate-800 bg-[#0E1322] shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0E1322] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.25)]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Smart E-Voting Identity Portal
                  </h1>
                  <span className="rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                    Layer 1: Secure Access
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Citizen Voter Authentication & Single Administrator Command Console
                </p>
              </div>
            </div>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            )}
          </div>

          {/* Mode Switcher: Sign In vs Sign Up */}
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
              <button
                type="button"
                id="auth-mode-login-btn"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'LOGIN'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Sign In (Existing Users / Admin)</span>
              </button>

              <button
                type="button"
                id="auth-mode-signup-btn"
                onClick={() => {
                  setAuthMode('SIGNUP');
                  setSelectedRole('VOTER');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'SIGNUP'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Create New Account (New Voters)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLaunch('guest')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-all cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Explore as Public Observer (Read-Only)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Feedback Banners */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 text-xs text-emerald-200 flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN (VOTER OR SINGLE ADMIN) */}
          {authMode === 'LOGIN' && (
            <div className="space-y-6">
              {/* Role Selection Tabs: Citizen Voter vs Single Admin */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Select Login Domain
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Voter Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('VOTER');
                      setErrorMessage(null);
                    }}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'VOTER'
                        ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/30 shadow-[0_0_15px_rgba(79,209,255,0.15)]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Vote className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">Citizen Voter Login</span>
                        <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                          Option 1
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Log in using your <strong>Election ID</strong> and the password you created during sign-up.
                      </p>
                    </div>
                  </button>

                  {/* Single Admin Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('ADMIN');
                      setErrorMessage(null);
                    }}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'ADMIN'
                        ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">Single Administrator Login</span>
                        <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          Option 2 (ADMIN-001)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Sole administrator account with exclusive permissions to add cities, areas, and voter records.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Login Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
                  {selectedRole === 'VOTER' ? (
                    /* CITIZEN VOTER LOGIN */
                    <form onSubmit={handleVoterLogin} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-300">
                            Full Election ID (Voter ID) *
                          </label>
                          <span className="text-[10px] text-cyan-400 font-mono">From Electoral Roll</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={voterLoginId}
                          onChange={(e) => setVoterLoginId(e.target.value)}
                          placeholder="e.g. VOT-MUM-1001 or VOT-2026-8821"
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none uppercase"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-300">
                            Account Password *
                          </label>
                          <span className="text-[10px] text-slate-400">Default for tests: pass123</span>
                        </div>
                        <input
                          type="password"
                          required
                          value={voterLoginPassword}
                          onChange={(e) => setVoterLoginPassword(e.target.value)}
                          placeholder="Enter your registered password"
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-400 flex items-start gap-2.5">
                        <Fingerprint className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          Once logged in, your <strong>ECDSA P-256 Web Crypto keys</strong> activate locally in browser to securely sign encrypted ballots.
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span>Verifying Credentials...</span>
                        ) : (
                          <>
                            <span>Log In with Election ID</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>

                      <div className="pt-2 text-center text-xs text-slate-400">
                        <span>New user or no password yet? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('SIGNUP');
                            setSignupVoterId(voterLoginId);
                          }}
                          className="text-cyan-400 font-bold hover:underline cursor-pointer"
                        >
                          Sign Up / Create Account with Aadhaar
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* SINGLE ADMIN LOGIN */
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-emerald-300 flex items-start gap-2">
                        <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Single Admin Rule:</strong> The system allows strictly <strong>one administrator</strong> (ID: <code>ADMIN-001</code>). Only the administrator can add new cities, add voter records, and manage elections.
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Administrator ID or Username *
                        </label>
                        <input
                          type="text"
                          required
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="ADMIN-001 or admin"
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-300 placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-300">
                            Administrator Password *
                          </label>
                          <span className="text-[10px] text-slate-400">Default: admin123</span>
                        </div>
                        <input
                          type="password"
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span>Authenticating Sole Administrator...</span>
                        ) : (
                          <>
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Log In as Sole Administrator</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Right Side: Demo Quick-Access */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>Quick-Fill Sample Credentials</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Quick Mumbai Voter */}
                    <div
                      onClick={() => {
                        setSelectedRole('VOTER');
                        setVoterLoginId('VOT-MUM-1001');
                        setVoterLoginPassword('pass123');
                      }}
                      className="cursor-pointer rounded-2xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 p-3.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">Sarah Connor (Mumbai)</span>
                        <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded font-mono">
                          VOT-MUM-1001
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Password: <strong className="text-slate-200">pass123</strong> • Aadhaar: <strong className="text-slate-200">8821</strong>
                      </p>
                    </div>

                    {/* Quick Delhi Voter */}
                    <div
                      onClick={() => {
                        setSelectedRole('VOTER');
                        setVoterLoginId('VOT-DEL-2001');
                        setVoterLoginPassword('pass123');
                      }}
                      className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 p-3.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">Aarav Verma (Delhi)</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          VOT-DEL-2001
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Password: <strong className="text-slate-200">pass123</strong> • Aadhaar: <strong className="text-slate-200">1017</strong>
                      </p>
                    </div>

                    {/* Quick Single Admin */}
                    <div
                      onClick={() => {
                        setSelectedRole('ADMIN');
                        setAdminUsername('ADMIN-001');
                        setAdminPassword('admin123');
                      }}
                      className="cursor-pointer rounded-2xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 p-3.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">Sole Election Administrator</span>
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-mono">
                          ADMIN-001
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Password: <strong className="text-slate-200">admin123</strong> • Full Admin Permissions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: SIGNUP / NEW VOTER REGISTRATION (REQUIREMENT 3 & 7) */}
          {authMode === 'SIGNUP' && (
            <div className="rounded-3xl border border-cyan-500/30 bg-slate-950/70 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-white">New Voter Account Creation & Verification</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your <strong>Election ID</strong> and the <strong>last 4 digits of your Aadhaar number</strong> to verify your record, then create your personal password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Already registered? Sign in instead →
                </button>
              </div>

              <form onSubmit={handleVoterSignup} className="space-y-6">
                {/* Step 1: Verification Against Official Records */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-[11px]">
                      1
                    </span>
                    <span>Voter Verification Against Authorized Records</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Election ID (from Area Roster) *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupVoterId}
                        onChange={(e) => {
                          setSignupVoterId(e.target.value);
                          setVerifiedRecord(null);
                        }}
                        placeholder="e.g. VOT-MUM-1004"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Last 4 Digits of Aadhaar Number *
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-500 select-none">
                          •••• ••••
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={signupAadhaarLast4}
                          onChange={(e) => {
                            setSignupAadhaarLast4(e.target.value.replace(/\D/g, ''));
                            setVerifiedRecord(null);
                          }}
                          placeholder="e.g. 1068"
                          className="w-28 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-center tracking-widest text-amber-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyVoterRecord}
                          disabled={isVerifyingRecord}
                          className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingRecord ? <span>Checking...</span> : <span>Verify Record</span>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verified Record Card Preview */}
                  {verifiedRecord && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Authorized Citizen Record Verified on Official Roll</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Voter Name</span>
                          <span className="font-bold text-white">{verifiedRecord.name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Father's Name</span>
                          <span className="font-medium text-slate-200">{verifiedRecord.fatherName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Mother's Name</span>
                          <span className="font-medium text-slate-200">{verifiedRecord.motherName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">City / Area</span>
                          <span className="font-medium text-cyan-300">{verifiedRecord.hometown}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Password Creation */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-[11px]">
                      2
                    </span>
                    <span>Create Your Account Password</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="At least 4 characters"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Sign-Up */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Verifying & Activating Account...</span>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        <span>Activate Account & Log In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Once created, you will not need to register again. You can log in using your Election ID and password anytime.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
