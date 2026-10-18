/**
 * Electoral Roll & Area Member Management Panel
 * Enables Election Commission to manage constituency rolls, add/remove voters,
 * monitor voter turnout by city/hometown, toggle area voting sessions,
 * and reset/re-process voting seasons.
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Radio,
  Building2,
  MapPin,
  Trash2,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { AreaMember, AreaElectionSession } from '../../types';

interface ElectoralRollManagerProps {
  onRefreshMetrics?: () => void;
}

export const ElectoralRollManager: React.FC<ElectoralRollManagerProps> = ({ onRefreshMetrics }) => {
  const [members, setMembers] = useState<AreaMember[]>([]);
  const [sessions, setSessions] = useState<AreaElectionSession[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Add Member Modal / Form State (Layer 1 details)
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newFatherName, setNewFatherName] = useState<string>('');
  const [newMotherName, setNewMotherName] = useState<string>('');
  const [newAadhaarLast4, setNewAadhaarLast4] = useState<string>('');
  const [newHometown, setNewHometown] = useState<string>('Mumbai');
  const [newConstituency, setNewConstituency] = useState<string>('Mumbai South Constituency');
  const [newNationalId, setNewNationalId] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [customVoterId, setCustomVoterId] = useState<string>('');

  // Reset Season Modal State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetTargetArea, setResetTargetArea] = useState<string>('Mumbai');

  const availableAreas = Array.from(
    new Set([
      'Mumbai',
      'Delhi',
      'Bengaluru',
      'Pune',
      'Hyderabad',
      'Kolkata',
      'Chennai',
      'Ahmedabad',
      'Jaipur',
      'Lucknow',
      ...sessions.map((s) => s.area),
    ])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, sessionsRes] = await Promise.all([
        fetch(`/api/electoral-roll?area=${selectedArea}&search=${encodeURIComponent(searchQuery)}`),
        fetch('/api/area-sessions'),
      ]);

      if (membersRes.ok) {
        setMembers(await membersRes.json());
      }
      if (sessionsRes.ok) {
        setSessions(await sessionsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedArea, searchQuery]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener('voter-auth-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/admin/realtime-stream');
      es.onmessage = () => loadData();
    } catch {
      // Offline fallback
    }

    return () => {
      window.removeEventListener('voter-auth-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      if (es) es.close();
    };
  }, [selectedArea, searchQuery]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newFatherName.trim() || !newMotherName.trim()) {
      setFeedback({ type: 'ERROR', text: 'Full name, Father name, and Mother name are required.' });
      return;
    }
    const cleanAadhaar = newAadhaarLast4.trim() || (newNationalId ? newNationalId.slice(-4) : '');
    if (!cleanAadhaar || cleanAadhaar.length !== 4) {
      setFeedback({ type: 'ERROR', text: 'Aadhaar must be exactly the last 4 numeric digits.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const generatedId = customVoterId.trim() || `VOT-${newHometown.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await fetch('/api/admin/voters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true',
        },
        body: JSON.stringify({
          name: newName.trim(),
          fatherName: newFatherName.trim(),
          motherName: newMotherName.trim(),
          aadhaarLast4: cleanAadhaar,
          voterId: generatedId.toUpperCase(),
          hometown: newHometown,
          constituencyName: newConstituency,
          email: newEmail.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add voter to roll.');
      }

      const created = await res.json();
      setFeedback({
        type: 'SUCCESS',
        text: `Voter ${created.voter.name} registered successfully with Election ID: ${created.voter.voterId} (${created.voter.hometown}).`,
      });

      setShowAddModal(false);
      setNewName('');
      setNewFatherName('');
      setNewMotherName('');
      setNewAadhaarLast4('');
      setCustomVoterId('');
      setNewNationalId('');
      setNewEmail('');
      loadData();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Error adding member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the electoral roll?`)) return;
    try {
      const res = await fetch(`/api/electoral-roll/member/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback({ type: 'SUCCESS', text: `Removed ${name} from electoral roll.` });
        loadData();
        if (onRefreshMetrics) onRefreshMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLiveSession = async (area: string, currentIsLive: boolean) => {
    try {
      const res = await fetch(`/api/area-sessions/${area}/toggle-live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: !currentIsLive }),
      });
      if (res.ok) {
        setFeedback({
          type: 'SUCCESS',
          text: `Voting season for ${area} is now ${!currentIsLive ? 'LIVE & ACTIVE' : 'CLOSED'}.`,
        });
        loadData();
        if (onRefreshMetrics) onRefreshMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetAreaSeason = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/area-sessions/${resetTargetArea}/reset`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset voting season.');
      }
      const data = await res.json();
      setFeedback({
        type: 'SUCCESS',
        text: `Voting season for ${resetTargetArea} successfully reset! ${data.membersResetCount} members can now register & cast their votes for Round ${data.session.seasonRound}.`,
      });
      setShowResetModal(false);
      loadData();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Reset failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Summary Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Electoral Roll & Area Constituency Roster
              </h3>
              <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                Jurisdiction Enforced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Add constituency members, manage voter IDs, enforce hometown boundaries, and control live voting seasons per city.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.3)] hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Area Member</span>
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset / Re-run Season</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs flex items-center gap-2 border ${
              feedback.type === 'SUCCESS'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'SUCCESS' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Area Voting Sessions Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sessions.map((session) => {
          const isLive = session.isLive && session.state === 'VOTING_OPEN';
          return (
            <div
              key={session.id}
              className={`rounded-2xl p-4 border transition-all ${
                isLive
                  ? 'border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-slate-950/90 shadow-[0_0_15px_rgba(79,209,255,0.15)]'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  {session.area}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                    isLive
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {isLive ? 'LIVE' : 'CLOSED'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-1 truncate">{session.constituency}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800/80 pt-2.5">
                <div>
                  <span className="text-slate-500 block">Round</span>
                  <span className="font-mono font-bold text-cyan-300">Round {session.seasonRound}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Voted / Enrolled</span>
                  <span className="font-mono font-bold text-white">
                    {session.totalVoted} / {session.totalRegistered}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleToggleLiveSession(session.area, session.isLive)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    session.isLive
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {session.isLive ? 'Pause Voting' : 'Open Live Voting'}
                </button>
                <button
                  onClick={() => {
                    setResetTargetArea(session.area);
                    setShowResetModal(true);
                  }}
                  title="Reset & Start New Season Round"
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Electoral Roll Filter & Search */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Hometown Area Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', ...availableAreas].map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedArea === area
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(79,209,255,0.2)]'
                    : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {area === 'ALL' ? 'All Hometowns' : area}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name or Election Number..."
              className="w-full rounded-xl bg-slate-900 px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          </div>
        </div>

        {/* Member Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pl-2 font-semibold">Election ID</th>
                <th className="pb-3 font-semibold">Voter Full Name</th>
                <th className="pb-3 font-semibold">Father's Name</th>
                <th className="pb-3 font-semibold">Mother's Name</th>
                <th className="pb-3 font-semibold">Aadhaar (Last 4)</th>
                <th className="pb-3 font-semibold">Hometown / Area</th>
                <th className="pb-3 font-semibold">Constituency</th>
                <th className="pb-3 font-semibold">Account Status</th>
                <th className="pb-3 font-semibold">Voting Status</th>
                <th className="pb-3 pr-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No voters found for the selected area filter. Click "Add Area Member" to register one.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 pl-2">
                      <span className="font-mono font-bold text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20">
                        {member.voterId}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {member.name}
                      {member.email && (
                        <span className="block text-[10px] font-normal text-slate-500">{member.email}</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-300">{member.fatherName || '—'}</td>
                    <td className="py-3 text-slate-300">{member.motherName || '—'}</td>
                    <td className="py-3 font-mono font-bold text-amber-300">
                      •••• {member.aadhaarLast4 || member.nationalIdMasked?.slice(-4) || '—'}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-slate-200 border border-slate-800">
                        <MapPin className="h-3 w-3 text-cyan-400" />
                        {member.hometown}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{member.constituency}</td>
                    <td className="py-3">
                      {member.hasRegisteredAccount ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          Registered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                          Unregistered
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {member.hasVoted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          VOTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20 text-[11px]">
                          <Clock className="h-3 w-3" />
                          ELIGIBLE
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        title="Remove Voter (Admin Only)"
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD AREA MEMBER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Add Member to Electoral Roll (Layer 1)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Voter Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Father's Name *</label>
                  <input
                    type="text"
                    required
                    value={newFatherName}
                    onChange={(e) => setNewFatherName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Mother's Name *</label>
                  <input
                    type="text"
                    required
                    value={newMotherName}
                    onChange={(e) => setNewMotherName(e.target.value)}
                    placeholder="e.g. Sunita Sharma"
                    className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Hometown Area *</label>
                  <select
                    value={newHometown}
                    onChange={(e) => {
                      setNewHometown(e.target.value);
                      setNewConstituency(`${e.target.value} Central Constituency`);
                    }}
                    className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  >
                    {availableAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Constituency</label>
                  <input
                    type="text"
                    value={newConstituency}
                    onChange={(e) => setNewConstituency(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Election ID (Unique) *</label>
                  <input
                    type="text"
                    value={customVoterId}
                    onChange={(e) => setCustomVoterId(e.target.value)}
                    placeholder={`e.g. VOT-${newHometown.slice(0, 3).toUpperCase()}-901`}
                    className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs font-mono text-cyan-300 border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Aadhaar (Last 4 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={newAadhaarLast4}
                    onChange={(e) => setNewAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 8821"
                    className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-amber-300 font-mono font-bold border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Email Address (Optional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="voter@electorate.in"
                  className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.3)] hover:bg-cyan-400 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  <span>Register Voter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET AREA VOTING SEASON */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <RotateCcw className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Reset & Process Voting Season Again</h3>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Resetting a voting season will:
            </p>
            <ul className="mt-2 text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>
                Clear the <strong className="text-white">voted status</strong> for all registered members in the selected area.
              </li>
              <li>
                Increment the <strong className="text-cyan-300">Voting Season Round</strong> (e.g. Round 2, Round 3).
              </li>
              <li>
                Open fresh live voting in that area so registered voters can cast their ballot again.
              </li>
            </ul>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300">Select Area / City to Reset</label>
              <select
                value={resetTargetArea}
                onChange={(e) => setResetTargetArea(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAreaSeason}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(245,185,66,0.3)] hover:bg-amber-400 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                <span>Confirm Reset Season</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
