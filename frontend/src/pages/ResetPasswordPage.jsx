import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    // Extract token from URL hash fragment (#token=...) to avoid HTTP Referer leakage
    let extractedToken = '';
    const hash = window.location.hash;
    if (hash && hash.includes('token=')) {
      const hashQuery = hash.startsWith('#') ? hash.substring(1) : hash;
      const params = new URLSearchParams(hashQuery);
      extractedToken = params.get('token') || '';
    }

    // Fallback to query params (?token=...) if hash is absent
    if (!extractedToken) {
      const searchParams = new URLSearchParams(window.location.search);
      extractedToken = searchParams.get('token') || '';
    }

    if (extractedToken) {
      setToken(extractedToken);
      // Immediately sanitize address bar to prevent browser history or referrer capture
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      setTokenMissing(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing or invalid reset token. Please request a new recovery link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsLoading(true);

    try {
      await axiosClient.post('/auth/reset-password', {
        token: token.trim(),
        newPassword: newPassword.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. The token may be expired or already used.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="rounded-3xl border border-slate-800 bg-[#0E1322] shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0E1322] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Set New Password</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticate token and update BCrypt account credentials
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {tokenMissing && !success && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 text-xs text-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm">Reset Token Not Detected</h3>
                  <p className="text-amber-300/80 mt-1 leading-relaxed">
                    This password reset link is missing a valid cryptographic token. Please click the full recovery link provided in your notification or request a new reset link.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-amber-500/20">
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  Request a new password reset link &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {success ? (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/30 p-6 text-center space-y-4 animate-fadeIn">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Password Updated Successfully</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your credentials have been securely updated. All prior active JWT sessions have been invalidated.
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <span>Proceed to Login</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!tokenMissing && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Manual token input if needed */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Verification Token
                    </label>
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste 64-character token if not auto-filled"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>Updating Password...</span>
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4" />
                          <span>Update Password &amp; Invalidate Prior Sessions</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="pt-4 border-t border-slate-800 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Return to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
