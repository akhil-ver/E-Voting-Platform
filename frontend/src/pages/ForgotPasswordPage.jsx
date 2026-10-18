import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      });
      setSuccessMessage(
        res.data ||
        'If an account matches the information provided and has an eligible recovery method, password reset instructions will be sent.'
      );
    } catch (err) {
      setError(err.message || 'Failed to submit recovery request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="rounded-3xl border border-slate-800 bg-[#0E1322] shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0E1322] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Reset Account Access</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Secure cryptographic recovery for citizen voters &amp; administrators
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Security Notice */}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-xs text-cyan-300 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white block">Enumeration-Defended Verification</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                For privacy and anti-reconnaissance protection, confirmation responses are timing-balanced and standardized. Reset tokens are single-use, hashed via SHA-256 in database storage, and expire after 20 minutes.
              </p>
            </div>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-5 text-xs text-emerald-200 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm">Recovery Request Processed</h3>
                  <p className="text-emerald-300/90 mt-1 leading-relaxed">
                    {successMessage}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Received your reset link?</span>
                <Link
                  to="/login"
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  Return to Login &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Election ID or Registered Recovery Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. ADMIN-001 or admin@sovereign.democracy"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter your assigned Election ID or the registered recovery email.
                </p>
              </div>

              {/* Sample Quick-fill options */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Demonstration Accounts with Seeded Recovery:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIdentifier('ADMIN-001')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
                  >
                    ADMIN-001 (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('VOT-MUM-1001')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 transition-colors"
                  >
                    VOT-MUM-1001 (Voter)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('admin@sovereign.democracy')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 transition-colors"
                  >
                    admin@sovereign.democracy
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Generating Recovery Link...</span>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Send Password Reset Instructions</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Navigation footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </Link>

            <Link
              to="/register"
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Need to register as a voter?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
