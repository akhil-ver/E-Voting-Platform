import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Key,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const RegisterPage = () => {
  const { register, verifyRecord, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill from query parameters if user clicked "Sign Up" on a table row
  const queryParams = new URLSearchParams(location.search);
  const initialVoterId = queryParams.get('voterId') || 'VOT-MUM-1002';
  const initialAadhaar = queryParams.get('aadhaar') || '2034';

  const [electionId, setElectionId] = useState(initialVoterId);
  const [aadhaarLast4, setAadhaarLast4] = useState(initialAadhaar);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedRecord, setVerifiedRecord] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleVerify = async (vId = electionId, aLast4 = aadhaarLast4) => {
    if (!vId.trim() || aLast4.trim().length !== 4) {
      setError('Please provide both the full Election ID and the 4-digit Aadhaar number.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerifiedRecord(null);

    try {
      const res = await verifyRecord(vId.trim().toUpperCase(), aLast4.trim());
      if (res.success && res.data) {
        setVerifiedRecord(res.data);
      } else {
        throw new Error(res.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your Election ID and Aadhaar.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (initialVoterId && initialAadhaar) {
      handleVerify(initialVoterId, initialAadhaar);
    }
  }, [initialVoterId, initialAadhaar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      const res = await register(electionId.trim().toUpperCase(), aadhaarLast4.trim(), password.trim());
      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => {
          navigate('/areas');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="rounded-3xl border border-slate-800 bg-[#0E1322] shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0E1322] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Voter Account Registration</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Layer 1: Verify your authorized electoral roll record and create your password
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 text-xs text-emerald-200 flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Verification Against Authorized Records */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
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
                    value={electionId}
                    onChange={(e) => {
                      setElectionId(e.target.value);
                      setVerifiedRecord(null);
                    }}
                    placeholder="e.g. VOT-MUM-1002"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Last 4 Digits of Aadhaar *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-500 select-none">
                      •••• ••••
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={aadhaarLast4}
                      onChange={(e) => {
                        setAadhaarLast4(e.target.value.replace(/\D/g, ''));
                        setVerifiedRecord(null);
                      }}
                      placeholder="e.g. 2034"
                      className="w-24 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-center tracking-widest text-amber-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerify(electionId, aadhaarLast4)}
                      disabled={isVerifying}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying ? <span>Checking...</span> : <span>Verify</span>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Verified Details Card */}
              {verifiedRecord && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Citizen Record Verified on Authorized Electoral Roll</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Voter Name</span>
                      <span className="font-bold text-white">{verifiedRecord.fullName}</span>
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
                      <span className="font-bold text-cyan-300">{verifiedRecord.areaName}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-4 border-t border-emerald-500/20 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Assigned Recovery Email</span>
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          {verifiedRecord.email || (verifiedRecord.fullName ? `${verifiedRecord.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}${aadhaarLast4}@gmail.com` : '')}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                        Official Roll Email
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Password Creation */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-[11px]">
                    2
                  </span>
                  <span>Create Your Account Password</span>
                </div>
                {aadhaarLast4 && aadhaarLast4.length === 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(aadhaarLast4);
                      setConfirmPassword(aadhaarLast4);
                    }}
                    className="text-[11px] font-mono font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Key className="h-3 w-3 text-amber-400" />
                    <span>Use Last 4 Digits of Aadhaar ({aadhaarLast4})</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={aadhaarLast4 ? `At least 4 digits (e.g. ${aadhaarLast4})` : 'At least 4 characters'}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Registering &amp; Securing Account...</span>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  <span>Activate Account &amp; Proceed to Login</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-cyan-400 hover:underline">
              Sign in with your Election ID &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
