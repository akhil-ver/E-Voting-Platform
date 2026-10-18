/**
 * Area-Wise Voter Directory & Management Component (Layer 1)
 * Displays all verified and eligible voters according to their city or area.
 * Seeded with 10 cities x 50 voters (500 total voter records), with full details:
 * - Full name
 * - Father's name
 * - Mother's name
 * - Last 4 digits of Aadhaar number
 * - Full Election ID
 * - City or area
 *
 * Provides:
 * - City selector for Mumbai and other 9 cities (+ custom admin-added cities)
 * - 1-Click "Take Election ID & Register / Log In"
 * - Duplicate prevention enforcement
 * - Single Administrator permissions to add new cities and voter records
 */
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Key,
  ShieldCheck,
  UserPlus,
  Plus,
  Copy,
  Check,
  ArrowRight,
  Vote,
  Sparkles,
  RefreshCw,
  Lock,
  Trash2,
  AlertTriangle,
  Info,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { EligibleVoter } from '../../types';
import { useAuth } from '../auth/AuthContext';

interface CitySummary {
  name: string;
  electionId: string;
  electionNumber: string;
  constituencyName: string;
  totalVoters: number;
  registeredAccounts: number;
  votedCount: number;
  state?: string;
}

export function getElectionStatusLabel(state?: string): {
  label: 'Upcoming' | 'Open' | 'Closed' | 'Result Declared';
  badgeClass: string;
  dotClass: string;
} {
  switch (state) {
    case 'VOTING_OPEN':
      return {
        label: 'Open',
        badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        dotClass: 'bg-emerald-400 animate-pulse',
      };
    case 'VOTING_CLOSED':
    case 'TALLYING':
      return {
        label: 'Closed',
        badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        dotClass: 'bg-rose-400',
      };
    case 'RESULTS_PUBLISHED':
    case 'ARCHIVED':
      return {
        label: 'Result Declared',
        badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
        dotClass: 'bg-purple-400',
      };
    case 'DRAFT':
    case 'CONFIGURED':
    case 'REGISTRATION_OPEN':
    default:
      return {
        label: 'Upcoming',
        badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
        dotClass: 'bg-blue-400',
      };
  }
}

interface AreaVoterDirectoryProps {
  onSelectVoterForAuth?: (voterId: string, aadhaarLast4?: string, mode?: 'LOGIN' | 'SIGNUP') => void;
  onNavigateToVote?: (electionId: string) => void;
}

export const AreaVoterDirectory: React.FC<AreaVoterDirectoryProps> = ({
  onSelectVoterForAuth,
  onNavigateToVote,
}) => {
  const { user, setShowAuthModal } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Area & Cities State
  const [cities, setCities] = useState<CitySummary[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Mumbai');
  const [voters, setVoters] = useState<EligibleVoter[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [registeredCount, setRegisteredCount] = useState<number>(0);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'REGISTERED' | 'UNREGISTERED' | 'VOTED'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Modals
  const [showAddCityModal, setShowAddCityModal] = useState<boolean>(false);
  const [showAddVoterModal, setShowAddVoterModal] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  // Form states for Admin Add City
  const [newCityName, setNewCityName] = useState<string>('');
  const [newConstituencyName, setNewConstituencyName] = useState<string>('');
  const [newElectionType, setNewElectionType] = useState<string>('Municipal Corporation');
  const [newCityDesc, setNewCityDesc] = useState<string>('');

  // Form states for Admin Add Voter Record
  const [newVoterName, setNewVoterName] = useState<string>('');
  const [newFatherName, setNewFatherName] = useState<string>('');
  const [newMotherName, setNewMotherName] = useState<string>('');
  const [newAadhaarLast4, setNewAadhaarLast4] = useState<string>('');
  const [newVoterId, setNewVoterId] = useState<string>('');
  const [newVoterCity, setNewVoterCity] = useState<string>('Mumbai');
  const [newVoterEmail, setNewVoterEmail] = useState<string>('');

  // Load cities summary
  const loadCities = async () => {
    try {
      const res = await fetch('/api/admin/areas');
      if (res.ok) {
        const data = await res.json();
        setCities(data);
      }
    } catch (err) {
      console.warn('Failed to fetch cities summary', err);
    }
  };

  // Load voters for selected city
  const loadVoters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/voters?area=${encodeURIComponent(selectedCity)}&search=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setVoters(data.voters || []);
        setTotalCount(data.total || 0);
        setRegisteredCount(data.registeredAccountsCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load voters', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    loadVoters();
  }, [selectedCity, searchQuery, user]);

  // Real-time synchronization when a user registers, signs up, or logs in
  useEffect(() => {
    const handleAuthUpdated = (e?: Event) => {
      const customEvent = e as CustomEvent;
      const updatedVoter = customEvent?.detail?.voter;
      if (updatedVoter && updatedVoter.voterId) {
        // Immediate optimistic UI update
        setVoters((prev) =>
          prev.map((v) =>
            v.voterId.toLowerCase() === updatedVoter.voterId.toLowerCase()
              ? {
                  ...v,
                  hasRegisteredAccount: true,
                  password: updatedVoter.password || '••••',
                  userRegisteredAt: new Date().toISOString(),
                }
              : v
          )
        );
        setRegisteredCount((prev) => prev + 1);
        setCities((prev) =>
          prev.map((c) =>
            c.name.toLowerCase() === (updatedVoter.hometown || '').toLowerCase()
              ? { ...c, registeredAccounts: c.registeredAccounts + 1 }
              : c
          )
        );
      }
      loadCities();
      loadVoters();
    };

    window.addEventListener('voter-auth-updated', handleAuthUpdated);
    window.addEventListener('focus', handleAuthUpdated);

    // Server-Sent Events (SSE) listener for multi-client / backend registration updates
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/admin/realtime-stream');
      es.onmessage = () => {
        loadCities();
        loadVoters();
      };
    } catch {
      // Offline fallback
    }

    return () => {
      window.removeEventListener('voter-auth-updated', handleAuthUpdated);
      window.removeEventListener('focus', handleAuthUpdated);
      if (es) es.close();
    };
  }, [selectedCity, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTakeIdToAuth = (voter: EligibleVoter, mode: 'LOGIN' | 'SIGNUP') => {
    if (onSelectVoterForAuth) {
      onSelectVoterForAuth(voter.voterId, voter.aadhaarLast4, mode);
    } else {
      setShowAuthModal(true);
    }
  };

  // Admin: Add New City / Area
  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true',
        },
        body: JSON.stringify({
          name: newCityName.trim(),
          constituencyName: newConstituencyName.trim() || `${newCityName.trim()} Urban Ward`,
          electionType: newElectionType,
          description: newCityDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create city');
      }

      setFeedback({
        type: 'SUCCESS',
        message: `Area '${newCityName}' added successfully to authorized voting zones.`,
      });
      setShowAddCityModal(false);
      setNewCityName('');
      setNewConstituencyName('');
      setNewCityDesc('');
      loadCities();
      setSelectedCity(newCityName.trim());
    } catch (err: unknown) {
      setFeedback({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Error creating city',
      });
    }
  };

  // Admin: Add New Voter Record with Duplicate Prevention
  const handleCreateVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/voters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true',
        },
        body: JSON.stringify({
          name: newVoterName.trim(),
          fatherName: newFatherName.trim(),
          motherName: newMotherName.trim(),
          aadhaarLast4: newAadhaarLast4.trim(),
          voterId: newVoterId.trim().toUpperCase(),
          hometown: newVoterCity,
          email: newVoterEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add voter record');
      }

      setFeedback({
        type: 'SUCCESS',
        message: `Voter record ${data.voter.name} (${data.voter.voterId}) added successfully to ${data.voter.hometown}.`,
      });
      setShowAddVoterModal(false);
      setNewVoterName('');
      setNewFatherName('');
      setNewMotherName('');
      setNewAadhaarLast4('');
      setNewVoterId('');
      setNewVoterEmail('');
      loadCities();
      loadVoters();
    } catch (err: unknown) {
      setFeedback({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Error adding voter record',
      });
    }
  };

  // Admin: Delete Voter Record
  const handleDeleteVoter = async (voterId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} (${voterId}) from the authorized electoral roll?`)) return;
    try {
      const res = await fetch(`/api/admin/voters/${encodeURIComponent(voterId)}`, {
        method: 'DELETE',
        headers: { 'x-admin-auth': 'true' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'SUCCESS',
          message: `Voter record ${voterId} deleted from roll.`,
        });
        loadCities();
        loadVoters();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Failed to delete voter',
      });
    }
  };

  // Filter voters list
  const filteredVoters = voters.filter((v) => {
    if (filterMode === 'REGISTERED') return v.hasRegisteredAccount;
    if (filterMode === 'UNREGISTERED') return !v.hasRegisteredAccount;
    if (filterMode === 'VOTED') return v.hasVoted;
    return true;
  });

  const activeCitySummary = cities.find((c) => c.name.toLowerCase() === selectedCity.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-[#0E1322] to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950/80 px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/30">
              <Building2 className="h-3.5 w-3.5" />
              <span>Layer 1: Area-Wise Voter Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Electoral Roll & Citizen Roster by Area
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Browse eligible voters across <strong>10 major cities</strong> (50 verified voter records per city, 500 total).
              Select your city, retrieve your <strong>Election ID</strong> and <strong>Aadhaar last 4 digits</strong>, and proceed to sign up or log in.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddCityModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Area / City</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewVoterCity(selectedCity);
                    setShowAddVoterModal(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Voter Record</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-300">
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  Admin management restricted to <strong>Single Administrator (ADMIN-001)</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 rounded-2xl p-4 text-xs flex items-center justify-between gap-3 border ${
              feedback.type === 'SUCCESS'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 10 Cities Selector Navigation Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            <span>Select Election Area / City (10 Cities Available)</span>
          </label>
          <span className="text-xs font-mono text-cyan-400">
            {cities.length} Areas Managed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {cities.map((city) => {
            const isSelected = selectedCity.toLowerCase() === city.name.toLowerCase();
            const statusInfo = getElectionStatusLabel(city.state);
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => {
                  setSelectedCity(city.name);
                  setSearchQuery('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_18px_rgba(79,209,255,0.3)] text-white scale-[1.03]'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs truncate max-w-full">{city.name}</span>
                <span className="text-[10px] text-cyan-300 font-mono mt-0.5">
                  {city.totalVoters} Voters
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 border truncate max-w-full ${statusInfo.badgeClass}`}>
                  {statusInfo.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected City Info & Stats Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-black text-white">{selectedCity}</h2>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
              {activeCitySummary?.constituencyName || `${selectedCity} Constituency`}
            </span>
            {(() => {
              const activeStatus = getElectionStatusLabel(activeCitySummary?.state);
              return (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border flex items-center gap-1 ${activeStatus.badgeClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeStatus.dotClass}`} />
                  <span>Election Status: {activeStatus.label}</span>
                </span>
              );
            })()}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Official Election Code: {activeCitySummary?.electionNumber || `ELEC-2026-${selectedCity.slice(0, 3).toUpperCase()}-01`} • Total Authorized Voters: {totalCount}
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Voters</span>
            <span className="text-base font-black text-white font-mono">{totalCount}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-center">
            <span className="block text-[10px] uppercase font-bold text-emerald-400">Accounts Active</span>
            <span className="text-base font-black text-emerald-400 font-mono">{registeredCount}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-center">
            <span className="block text-[10px] uppercase font-bold text-cyan-400">Ready to Sign Up</span>
            <span className="text-base font-black text-cyan-300 font-mono">{totalCount - registeredCount}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedCity} voters by name, father, mother, Aadhaar, ID...`}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
          {(
            [
              { key: 'ALL', label: `All (${voters.length})` },
              { key: 'REGISTERED', label: `Registered (${registeredCount})` },
              { key: 'UNREGISTERED', label: `Ready to Sign Up (${totalCount - registeredCount})` },
              { key: 'VOTED', label: `Voted (${voters.filter((v) => v.hasVoted).length})` },
            ] as const
          ).map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setFilterMode(filter.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterMode === filter.key
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {filter.label}
            </button>
          ))}

          <button
            type="button"
            title="Refresh Area Voter Roll"
            onClick={() => {
              loadCities();
              loadVoters();
            }}
            className="rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/40 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Voters List Table & Cards */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Election ID</th>
                <th className="py-3.5 px-4">Voter Full Name</th>
                <th className="py-3.5 px-4">Father's Name</th>
                <th className="py-3.5 px-4">Mother's Name</th>
                <th className="py-3.5 px-4">Aadhaar Last 4</th>
                <th className="py-3.5 px-4">City / Area</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Quick Auth Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="h-6 w-6 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <span>Loading authorized voters for {selectedCity}...</span>
                  </td>
                </tr>
              ) : filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No voters matched your criteria.</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching filters.</p>
                  </td>
                </tr>
              ) : (
                filteredVoters.map((voter, index) => {
                  const isAccountRegistered = voter.hasRegisteredAccount;
                  return (
                    <tr
                      key={voter.id || voter.voterId}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{index + 1}</td>

                      {/* Full Election ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                            {voter.voterId}
                          </span>
                          <button
                            type="button"
                            title="Copy Election ID"
                            onClick={() => handleCopy(voter.voterId, `id-${voter.voterId}`)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                          >
                            {copiedId === `id-${voter.voterId}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Full Name */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <span>{voter.name}</span>
                        {voter.email && (
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            {voter.email}
                          </span>
                        )}
                      </td>

                      {/* Father's Name */}
                      <td className="py-3.5 px-4 text-slate-300">{voter.fatherName || '—'}</td>

                      {/* Mother's Name */}
                      <td className="py-3.5 px-4 text-slate-300">{voter.motherName || '—'}</td>

                      {/* Last 4 Digits of Aadhaar */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">••••</span>
                          <span className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {voter.aadhaarLast4 || voter.nationalIdMasked.slice(-4)}
                          </span>
                        </div>
                      </td>

                      {/* City or Area */}
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-300 text-[11px]">
                          {voter.hometown}
                        </span>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3.5 px-4">
                        {voter.hasVoted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-950/80 px-2.5 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-500/40">
                            <CheckCircle2 className="h-3 w-3 text-violet-400" />
                            <span>Voted</span>
                          </span>
                        ) : isAccountRegistered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>Account Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                            <Info className="h-3 w-3 text-amber-400" />
                            <span>Ready to Sign Up</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAccountRegistered ? (
                            <button
                              type="button"
                              onClick={() => handleTakeIdToAuth(voter, 'LOGIN')}
                              className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Key className="h-3 w-3" />
                              <span>Log In</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTakeIdToAuth(voter, 'SIGNUP')}
                              className="inline-flex items-center gap-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>Sign Up</span>
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              title="Delete voter from roll (Admin Only)"
                              onClick={() => handleDeleteVoter(voter.voterId, voter.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Modal: Add New City */}
      {showAddCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">Add New City / Area (Admin Clearance)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCityModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateCity} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">City or Area Name *</label>
                <input
                  type="text"
                  required
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="e.g. Chandigarh, Bhopal, Surat"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Constituency Name</label>
                <input
                  type="text"
                  value={newConstituencyName}
                  onChange={(e) => setNewConstituencyName(e.target.value)}
                  placeholder="e.g. Chandigarh Central Ward"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Election Type</label>
                <select
                  value={newElectionType}
                  onChange={(e) => setNewElectionType(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="Municipal Council">Municipal Council</option>
                  <option value="State Assembly">State Assembly</option>
                  <option value="Parliamentary Constituency">Parliamentary Constituency</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  value={newCityDesc}
                  onChange={(e) => setNewCityDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief description of municipal boundary..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCityModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 font-bold text-white shadow-lg cursor-pointer"
                >
                  Add City to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal: Add New Voter Record */}
      {showAddVoterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Add Authorized Voter Record (Admin Only)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVoterModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateVoter} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Voter Full Name *</label>
                <input
                  type="text"
                  required
                  value={newVoterName}
                  onChange={(e) => setNewVoterName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Father's Name *</label>
                  <input
                    type="text"
                    required
                    value={newFatherName}
                    onChange={(e) => setNewFatherName(e.target.value)}
                    placeholder="e.g. Dinesh Patel"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mother's Name *</label>
                  <input
                    type="text"
                    required
                    value={newMotherName}
                    onChange={(e) => setNewMotherName(e.target.value)}
                    placeholder="e.g. Sushma Patel"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Election ID (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={newVoterId}
                    onChange={(e) => setNewVoterId(e.target.value)}
                    placeholder={`e.g. VOT-${selectedCity.slice(0, 3).toUpperCase()}-9901`}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 font-mono font-bold text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Aadhaar (Last 4 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={newAadhaarLast4}
                    onChange={(e) => setNewAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 7821"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 font-mono font-bold text-amber-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City or Area *</label>
                  <select
                    value={newVoterCity}
                    onChange={(e) => setNewVoterCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {cities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Citizen Email (Optional)</label>
                  <input
                    type="email"
                    value={newVoterEmail}
                    onChange={(e) => setNewVoterEmail(e.target.value)}
                    placeholder="citizen@e-voting.gov"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-[11px] text-cyan-300">
                <strong>Duplicate Prevention Notice:</strong> The backend verifies that the Election ID is globally unique. If a voter with this Election ID already exists in any city, the system will reject the submission.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVoterModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 font-extrabold text-slate-950 shadow-lg cursor-pointer"
                >
                  Register Voter to Roll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
