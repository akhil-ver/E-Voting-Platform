import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Vote,
  SlidersHorizontal,
  Key,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('VOTER'); // 'VOTER' | 'ADMIN'
  const [username, setUsername] = useState('VOT-MUM-1001');
  const [password, setPassword] = useState('pass123');
  const [error, setError] = useState(null);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'ADMIN') {
      setUsername('ADMIN-001');
      setPassword('admin123');
    } else {
      setUsername('VOT-MUM-1001');
      setPassword('pass123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login(username.trim(), password.trim());
      if (res.success) {
        const from = location.state?.from?.pathname || (activeTab === 'ADMIN' ? '/admin' : '/dashboard');
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="rounded-3xl border border-slate-800 bg-[#0E1322] shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0E1322] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Identity Access Portal</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Citizen Voter Authentication &amp; Single Administrator Command Console
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Select Login Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voter Option */}
              <button
                type="button"
                onClick={() => handleTabSwitch('VOTER')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'VOTER'
                    ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Vote className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">Citizen Voter Login</span>
                    <span className="text-xs text-slate-400">Log in with your Election ID &amp; Password</span>
                  </div>
                </div>
              </button>

              {/* Single Admin Option */}
              <button
                type="button"
                onClick={() => handleTabSwitch('ADMIN')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'ADMIN'
                    ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">Single Administrator</span>
                    <span className="text-xs text-slate-400">Full central management authority</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form and Quick fill */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {activeTab === 'ADMIN' ? 'Administrator ID' : 'Full Election ID (from Area Roster)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={activeTab === 'ADMIN' ? 'ADMIN-001' : 'e.g. VOT-MUM-1001'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      <span>Authenticate &amp; Enter</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-slate-800 text-center">
                <span className="text-xs text-slate-400">Need to create an account? </span>
                <Link to="/register" className="text-xs font-bold text-cyan-400 hover:underline">
                  Register against your voter record &rarr;
                </Link>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Quick-Fill Sample Credentials</span>
              </div>

              <div
                onClick={() => {
                  setActiveTab('ADMIN');
                  setUsername('ADMIN-001');
                  setPassword('admin123');
                }}
                className="cursor-pointer rounded-2xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 p-3.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Sole Election Administrator</span>
                  <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    ADMIN-001
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Password: <strong className="text-slate-200">admin123</strong> • Full Admin Permissions
                </p>
              </div>

              <div
                onClick={() => {
                  setActiveTab('VOTER');
                  setUsername('VOT-MUM-1001');
                  setPassword('pass123');
                }}
                className="cursor-pointer rounded-2xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 p-3.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Aarav Verma (Mumbai)</span>
                  <span className="text-[10px] bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded font-mono">
                    VOT-MUM-1001
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Password: <strong className="text-slate-200">pass123</strong> • Registered Voter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
