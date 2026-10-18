/**
 * Main Application Header Navigation Bar
 * Features multi-layer auth indicator, role-gating, Architecture Mode toggle, language selector, and system telemetry pill
 */
import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Vote,
  Search,
  BarChart3,
  SlidersHorizontal,
  FlaskConical,
  Eye,
  Globe,
  Layers,
  Activity,
  History,
  LogOut,
  User,
  Key,
  Building2,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../../types';
import { Language, TRANSLATIONS } from '../../lib/i18n';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  architectureMode: boolean;
  setArchitectureMode: (mode: boolean) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  metrics: {
    quorumSatisfied: boolean;
    activeValidators: number;
    blocksCount: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  architectureMode,
  setArchitectureMode,
  userRole,
  setUserRole,
  language,
  setLanguage,
  metrics,
}) => {
  const t = TRANSLATIONS[language];
  const { user, isAuthenticated, logout, setShowAuthModal, switchRole } = useAuth();

  const navItems = [
    { id: 'areas', label: 'Layer 1: Voter Roll', tag: 'L1', icon: Building2, activeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' },
    { id: 'voter', label: 'Layer 2: Cast Ballot', tag: 'L2', icon: Vote, activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]' },
    { id: 'results', label: 'Layer 3: Results', tag: 'L3', icon: BarChart3, activeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]' },
    { id: 'verify', label: 'Verify Receipt', tag: 'E2E-V', icon: Search, activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]' },
    { id: 'overview', label: 'Overview', tag: 'FLOW', icon: Activity, activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]' },
    { id: 'admin', label: 'Admin Hub', tag: 'ADMIN', icon: SlidersHorizontal, activeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.25)]' },
  ];

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'VOTER':
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0A0D16]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg p-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(79,209,255,0.25)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white sm:text-base text-sm">
                  {t.systemTitle}
                </span>
                <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                3-Layer Architecture • Sovereign Consensus • Zero-Knowledge
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'admin' && ['admin', 'security-lab', 'scenarios', 'transparency'].includes(activeTab));
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border ${
                  isActive
                    ? item.activeClass
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Architecture Toggle, Auth Profile Pill, Language & Telemetry */}
        <div className="flex items-center gap-2.5">
          {/* Architecture Mode Toggle */}
          <button
            id="toggle-architecture-mode"
            onClick={() => setArchitectureMode(!architectureMode)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              architectureMode
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
            title="Inspect 5-Layer Clean Architecture and Provider Matrix"
          >
            <Layers className={`h-3.5 w-3.5 ${architectureMode ? 'text-violet-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{t.architectureMode}</span>
          </button>

          {/* Authenticated Identity Pill or Sign In Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5">
              <button
                id="header-user-profile-btn"
                onClick={() => setShowAuthModal(true)}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs border font-medium transition-all hover:scale-[1.02] cursor-pointer ${getRoleBadgeStyle(
                  user.role
                )}`}
                title="Click to Switch Persona, Role, or Sign Out"
              >
                <div className="h-6 w-6 rounded-lg bg-slate-950/80 flex items-center justify-center font-bold text-[10px] text-white">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
                    <span>{user.name.split(' ')[0]}</span>
                    <span className="text-[9px] opacity-75 font-mono">({user.role})</span>
                  </div>
                  <div className="text-[9px] opacity-80 leading-tight">
                    {user.voterId || user.jurisdiction || 'Active Session'}
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              <button
                id="header-signout-btn"
                onClick={logout}
                className="rounded-lg bg-slate-900 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800"
                title="Sign Out to Login Gate"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="header-signin-btn"
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.3)] hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Login / Sign Up</span>
            </button>
          )}

          {/* Quick Role Switcher */}
          <div className="relative">
            <select
              id="role-switcher-select"
              aria-label="Active Security Role"
              value={userRole}
              onChange={(e) => {
                const newR = e.target.value as UserRole;
                setUserRole(newR);
                switchRole(newR);
              }}
              className="appearance-none rounded-lg bg-slate-900 px-2.5 py-1.5 pr-7 text-xs font-semibold text-cyan-400 border border-slate-800 hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="VOTER">{t.roleVoter || 'Citizen Voter'}</option>
              <option value="ADMIN">{t.roleAdmin || 'Election Admin'}</option>
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>

          {/* Language Selector */}
          <div className="relative hidden xl:block">
            <select
              id="language-switcher-select"
              aria-label="Language Selector"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none rounded-lg bg-slate-900 px-2 py-1.5 pr-6 text-xs text-slate-300 border border-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिंदी (HI)</option>
              <option value="ta">தமிழ் (TA)</option>
            </select>
            <Globe className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
          </div>

          {/* Quorum Pill */}
          <div className="hidden 2xl:flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Quorum 2/3</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 bg-slate-950/80 px-2 py-1.5 gap-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'admin' && ['admin', 'security-lab', 'scenarios', 'transparency'].includes(activeTab));
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs whitespace-nowrap ${
                isActive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

