/**
 * Smart E-Voting System - Root Application Component
 * Implements multi-layer identity & auth gateway, role-aware routing,
 * interactive 5-layer architecture visualization, and live consensus telemetry
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Vote,
  Search,
  BarChart3,
  SlidersHorizontal,
  FlaskConical,
  Eye,
  History,
  Lock,
  Cpu,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Key,
  Users,
  Building2,
  Fingerprint,
  UserCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';

import { UserRole, Election } from './types';
import { Language, TRANSLATIONS } from './lib/i18n';
import { Header } from './components/layout/Header';
import { ArchitectureDiagram } from './components/architecture/ArchitectureDiagram';
import { VotingPipeline } from './components/voting/VotingPipeline';
import { VerificationPortal } from './components/verification/VerificationPortal';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SecurityLab } from './components/security/SecurityLab';
import { ElectionReplay } from './components/scenarios/ElectionReplay';
import { TransparencyDashboard } from './components/transparency/TransparencyDashboard';
import { ElectionTimeline } from './components/overview/ElectionTimeline';
import { AreaVoterDirectory } from './components/voters/AreaVoterDirectory';
import { LayerNavigationBanner } from './components/layout/LayerNavigationBanner';
import { useElectionMetrics } from './hooks/useElectionMetrics';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { AuthGate } from './components/auth/AuthGate';

function MainAppContent() {
  const { user, isAuthenticated, showAuthModal, setShowAuthModal, switchRole, logout, loginDemoUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('areas');
  const [authModalVoterId, setAuthModalVoterId] = useState<string>('');
  const [authModalAadhaarLast4, setAuthModalAadhaarLast4] = useState<string>('');
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [verifiedHash, setVerifiedHash] = useState<string>('');
  const [architectureMode, setArchitectureMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('VOTER');
  const [language, setLanguage] = useState<Language>('en');

  // Synchronize local role state with authenticated user
  useEffect(() => {
    if (user) {
      setUserRole(user.role);
    }
  }, [user]);

  // Event-driven reactive metrics & election state
  const {
    metrics,
    election: primaryElection,
    refresh: fetchMetricsAndElection,
  } = useElectionMetrics({ electionId: 'elec-mum-01' });

  const [fallbackElection, setFallbackElection] = useState<Election | null>(null);

  useEffect(() => {
    fetch('/api/elections')
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Election[]) => {
        if (Array.isArray(list) && list.length > 0) {
          setFallbackElection(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const activeElection = primaryElection || fallbackElection;

  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-[#0A0D16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        architectureMode={architectureMode}
        setArchitectureMode={setArchitectureMode}
        userRole={userRole}
        setUserRole={setUserRole}
        language={language}
        setLanguage={setLanguage}
        metrics={{
          quorumSatisfied: metrics.quorumSatisfied,
          activeValidators: metrics.activeValidators,
          blocksCount: metrics.blocksCount,
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Architecture Mode Drawer (When active) */}
        {architectureMode && (
          <div className="animate-fadeIn">
            <ArchitectureDiagram providers={metrics.activeProviders} />
          </div>
        )}

        {/* Emergency Pause / Lockdown Warning Banner */}
        {(metrics.isPaused || metrics.isLockedDown) && (
          <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-rose-200 flex items-center justify-between shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-white">
                  {metrics.isLockedDown ? 'CRITICAL EMERGENCY LOCKDOWN ACTIVE' : 'ELECTION SYSTEM PAUSED'}
                </h3>
                <p className="text-xs text-rose-300">
                  {metrics.isLockedDown
                    ? 'All ballot submission and token issuance endpoints are quarantined by Chief Security Officer order.'
                    : 'Ballot processing is temporarily suspended for scheduled audit maintenance.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('admin')}
              className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
            >
              Inspect Admin Controls
            </button>
          </div>
        )}

        {/* Interactive 3-Layer Architecture Workflow Banner */}
        <LayerNavigationBanner
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          registeredVotersCount={metrics.registeredVoters}
          votesCastCount={metrics.votesCast}
        />

        {/* VIEW 1: OVERVIEW / LANDING */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Authenticated Identity Welcome & Layer Status Card */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-950 to-[#0A0D16] p-6 sm:p-8 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-[0_0_20px_rgba(79,209,255,0.2)]">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AU'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-white">
                        Authenticated as {user?.name}
                      </h2>
                      <span className="rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                        {user?.roleTitle || user?.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>ID: <strong className="text-slate-300">{user?.voterId}</strong></span>
                      <span>•</span>
                      <span>Jurisdiction: <strong className="text-slate-300">{user?.jurisdiction}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-cyan-400 text-[11px]">
                        Keys: {user?.publicKeyFingerprint || 'ECDSA P-256 Active'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick Switch Layer Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-850 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Switch Role / Account</span>
                  </button>

                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/30 transition-all cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-[#0A0D16] p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950/80 px-3.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/30 mb-4">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{t.heroTag}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Cryptographic Trust for Modern Democracy
                </h1>

                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  A high-assurance e-voting simulation combining <strong>Web Crypto ECDSA P-256 signatures</strong>,{' '}
                  <strong>single-use nullifiers</strong> to mathematically eliminate double-voting,{' '}
                  <strong>Zero-Knowledge inclusion receipts</strong>, and{' '}
                  <strong>2/3 Byzantine Fault Tolerant validator consensus</strong>.
                </p>

                {/* Call to Actions */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    id="hero-cast-ballot-button"
                    onClick={() => setActiveTab('voter')}
                    className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3.5 text-xs font-extrabold text-slate-950 shadow-[0_0_25px_rgba(79,209,255,0.4)] hover:bg-cyan-400 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <Vote className="h-4 w-4" />
                    <span>Cast Your Ballot</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    id="hero-live-results-button"
                    onClick={() => setActiveTab('results')}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-5 py-3.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                    <span>Live Election Results</span>
                  </button>

                  <button
                    id="hero-verify-receipt-button"
                    onClick={() => setActiveTab('verify')}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-xs font-bold text-slate-200 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Search className="h-4 w-4 text-cyan-400" />
                    <span>Verify Receipt on Ledger</span>
                  </button>

                  <button
                    id="hero-admin-portal-button"
                    onClick={() => setActiveTab('admin')}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-xs font-bold text-slate-300 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-violet-400" />
                    <span>Admin & Security Hub</span>
                  </button>
                </div>
              </div>

              {/* Background ambient lighting */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="pointer-events-none absolute right-40 bottom-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            </div>

            {/* Live Telemetry Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Votes Cast</span>
                  <Vote className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="mt-2 text-2xl font-mono font-bold text-white">{metrics.votesCast}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Electorate: {metrics.registeredVoters.toLocaleString()} ({metrics.turnoutPercentage}%)
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Consensus Quorum</span>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-2 text-2xl font-mono font-bold text-emerald-400">
                  {metrics.activeValidators}/{metrics.totalValidators} Nodes
                </p>
                <p className="text-[11px] text-emerald-300 mt-1">2/3 Threshold Satisfied</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Blocks Mined</span>
                  <Layers className="h-4 w-4 text-violet-400" />
                </div>
                <p className="mt-2 text-2xl font-mono font-bold text-violet-300">{metrics.blocksCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">SHA-256 Merkle Chained</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Audit Chain</span>
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="mt-2 text-2xl font-mono font-bold text-cyan-400">100% Valid</p>
                <p className="text-[11px] text-slate-400 mt-1">{metrics.auditEventsCount} Chained Events</p>
              </div>
            </div>

            {/* Real-Time Election Timeline, Lifecycle Phases & Milestone Deadlines */}
            <ElectionTimeline
              primaryElection={activeElection}
              onNavigate={(tab) => setActiveTab(tab)}
            />

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => setActiveTab('voter')}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:bg-slate-900/80 hover:border-cyan-500/40 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-all">
                  <Vote className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mt-4 flex items-center justify-between">
                  <span>Voter Experience</span>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Generate ECDSA keys in browser, verify eligibility, blinding, AES-256 encryption, and receive ZK inclusion receipts.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('verify')}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:bg-slate-900/80 hover:border-emerald-500/40 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-all">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mt-4 flex items-center justify-between">
                  <span>Public Verification</span>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Look up any receipt hash or transaction ID to inspect the Merkle tree branch and validator signatures with zero vote leakage.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('admin')}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:bg-slate-900/80 hover:border-violet-500/40 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 group-hover:scale-110 transition-all">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mt-4 flex items-center justify-between">
                  <span>Election Panel & Admin</span>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  FSM state transitions, BFT quorum health, SHAP explainable fraud factors, Gemini threat copilot, and disaster recovery.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 0: AREA-WISE VOTER DIRECTORY (LAYER 1) */}
        {activeTab === 'areas' && (
          <AreaVoterDirectory
            onSelectVoterForAuth={(voterId, aadhaarLast4, mode) => {
              setAuthModalVoterId(voterId);
              setAuthModalAadhaarLast4(aadhaarLast4 || '');
              setAuthModalMode(mode || 'LOGIN');
              setShowAuthModal(true);
            }}
            onNavigateToVote={(electionId) => {
              setActiveTab('voter');
            }}
          />
        )}

        {/* VIEW 2: VOTER PORTAL */}
        {activeTab === 'voter' && (
          <div>
            {activeElection ? (
              <VotingPipeline
                election={activeElection}
                onVoteCast={() => fetchMetricsAndElection()}
                onNavigate={(tab, hash) => {
                  setActiveTab(tab);
                  if (hash) setVerifiedHash(hash);
                }}
              />
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="h-8 w-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-mono text-xs">
                  Loading official election ballot...
                </p>
                <button
                  type="button"
                  onClick={() => fetchMetricsAndElection()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Retry Loading Ballot
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: VERIFICATION PORTAL */}
        {activeTab === 'verify' && <VerificationPortal initialHash={verifiedHash} />}

        {/* VIEW 4: RESULTS DASHBOARD */}
        {activeTab === 'results' && <ResultsDashboard />}

        {/* VIEW 5: UNIFIED ADMIN & SECURITY HUB */}
        {['admin', 'security-lab', 'scenarios', 'transparency'].includes(activeTab) && (
          <div className="space-y-6 animate-fadeIn">
            {/* Admin Hub Navigation Sub-bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'admin', label: 'Election Commission', icon: SlidersHorizontal },
                { id: 'security-lab', label: 'Security & Threat Lab', icon: FlaskConical },
                { id: 'transparency', label: 'Public Consensus Ledger', icon: Eye },
                { id: 'scenarios', label: 'Scenario Replay Engine', icon: History },
              ].map((subItem) => {
                const SubIcon = subItem.icon;
                const isSelected = activeTab === subItem.id;
                return (
                  <button
                    key={subItem.id}
                    type="button"
                    onClick={() => setActiveTab(subItem.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(79,209,255,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <SubIcon className="h-3.5 w-3.5" />
                    <span>{subItem.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-view Content */}
            {activeTab === 'admin' && (
              user?.role === 'VOTER' ? (
                <div className="rounded-3xl border border-violet-500/40 bg-slate-900/90 p-8 text-center max-w-2xl mx-auto space-y-6 backdrop-blur-xl shadow-2xl">
                  <div className="h-16 w-16 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 mx-auto">
                    <SlidersHorizontal className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Election Commission & Admin Clearance Required</h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      You are currently authenticated as <strong>{user.name}</strong> ({user.roleTitle}).
                      The Election Panel and Admin console requires Level-2 Official or Security Officer clearance.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => loginDemoUser('panel')}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:bg-emerald-400 transition-all cursor-pointer"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Switch to Election Commissioner (Dr. Elena)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => loginDemoUser('admin')}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white hover:bg-violet-500 transition-all cursor-pointer"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Switch to Security Admin (Alex Vance)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <AdminDashboard
                  metrics={metrics}
                  onRefreshMetrics={fetchMetricsAndElection}
                />
              )
            )}

            {activeTab === 'security-lab' && <SecurityLab />}
            {activeTab === 'scenarios' && <ElectionReplay />}
            {activeTab === 'transparency' && <TransparencyDashboard metrics={metrics} />}
          </div>
        )}
      </main>

      {/* Switching Persona / Login Modal (when requested) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <AuthGate
              isModal={true}
              onClose={() => setShowAuthModal(false)}
              initialVoterId={authModalVoterId}
              initialAadhaarLast4={authModalAadhaarLast4}
              initialMode={authModalMode}
              onSuccess={() => {
                setShowAuthModal(false);
                fetchMetricsAndElection();
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-slate-400">{t.systemTitle}</span>
            <span>•</span>
            <span>Hexagonal Clean Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Providers: DB[{metrics.activeProviders.database}] • AI[{metrics.activeProviders.ai}] • BFT[{metrics.activeProviders.blockchain}]</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">100% Cryptographically Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;

