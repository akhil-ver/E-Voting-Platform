import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Vote,
  MapPin,
  BarChart3,
  Search,
  SlidersHorizontal,
  LogOut,
  LogIn,
  UserPlus,
  Users,
  Activity,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isVoter, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0A0D16]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              <ShieldCheck className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  Sovereign Democracy
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-cyan-950/80 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                  Prototype
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Area-Wise Election & Electronic Voting Platform
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/areas"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/areas')
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>Areas & Voters</span>
            </Link>

            <Link
              to="/elections"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/elections')
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Vote className="h-3.5 w-3.5 text-emerald-400" />
              <span>Open Elections</span>
            </Link>

            <Link
              to="/results"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/results')
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
              <span>Results</span>
            </Link>

            <Link
              to="/verify"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/verify')
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Search className="h-3.5 w-3.5 text-amber-400" />
              <span>Verify Ballot</span>
            </Link>

            {isVoter && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-cyan-300 hover:bg-cyan-950/40'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>My Dashboard</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
                <span>Admin Hub</span>
              </Link>
            )}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="flex items-center gap-2">
            {/* Live Blockchain Node Status Pill */}
            <Link
              to="/verify"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono hover:border-emerald-500/40 hover:bg-slate-900 transition-all cursor-pointer"
              title="Hyperledger Besu / Ethereum blockchain node is connected and auditing ballots"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 font-bold">Besu Chain</span>
              <span className="text-slate-500">1337</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{user?.fullName || user?.username}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        isAdmin
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {user?.email || (isAdmin ? 'akhilv.verma07@gmail.com' : (user?.voterId || user?.username))}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log Out"
                  className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-rose-950/40 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all"
                >
                  <LogIn className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
