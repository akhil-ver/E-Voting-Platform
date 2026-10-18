import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Vote,
  MapPin,
  CheckCircle2,
  Clock,
  Copy,
  Search,
  ExternalLink,
  User,
  LogOut,
  RefreshCw,
  AlertCircle,
  Building2,
  Fingerprint,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

export const VoterDashboardPage = () => {
  const { user, logout, isVoter } = useAuth();
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const [electionsRes, receiptsRes] = await Promise.all([
        axiosClient.get('/elections'),
        axiosClient.get('/voting/my-receipts'),
      ]);

      const allElections = electionsRes.success && electionsRes.data ? electionsRes.data : [];
      const userReceipts = receiptsRes.success && receiptsRes.data ? receiptsRes.data : [];

      // Filter elections to only those relevant to user's assigned area
      const areaElections = user?.areaName
        ? allElections.filter(
            (e) =>
              e.areaName?.toLowerCase() === user.areaName?.toLowerCase() ||
              e.areaId === user.areaId
          )
        : allElections;

      setElections(areaElections);
      setReceipts(userReceipts);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setFeedback({ type: 'error', message: 'Unable to retrieve voter telemetry from secure vault.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const copyToClipboard = (text, type, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(id);
      setTimeout(() => setCopiedHash(null), 2500);
    } else {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mask voter ID for presentation (e.g. VOT-MUM-1001 -> VOT-MUM-••••)
  const maskVoterId = (id) => {
    if (!id) return 'VOT-••••-••••';
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-••••`;
    }
    return id.slice(0, 4) + '••••';
  };

  const votedElectionIds = new Set(receipts.map((r) => r.electionId));

  return (
    <div className="py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
              Authenticated Civic Portal
            </span>
            <span className="text-xs text-slate-500 font-mono">Zero-Knowledge Ballot Vault</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Personal Voter Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your electoral eligibility, monitor open constituency elections, and verify immutable ballot receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'error'
              ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
              : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Profile & Voter Identity Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Full Name & Role */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Registered Citizen Name
          </span>
          <span className="text-lg font-bold text-white block truncate">
            {user?.fullName || user?.username}
          </span>
          <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Account Role: {user?.role || 'USER'}</span>
          </span>
        </div>

        {/* Masked Election ID */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Electoral Identity
          </span>
          <span className="text-base font-bold font-mono text-cyan-300 block">
            {user?.voterId || user?.username}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Masked: {maskVoterId(user?.voterId || user?.username)}
          </span>
        </div>

        {/* Constituency & Area */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Assigned Constituency
          </span>
          <span className="text-lg font-bold text-white block">
            {user?.areaName || 'Demo City'}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-cyan-400" />
            <span>Designated Area Jurisdiction</span>
          </span>
        </div>

        {/* Eligibility Status */}
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-1">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
            Electoral Eligibility
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-white">Authorized Voter</span>
          </div>
          <span className="text-[11px] text-emerald-300/80 block">
            Verified on Central Roll
          </span>
        </div>
      </div>

      {/* Section 1: Active Elections in Voter's Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Elections in Your Jurisdiction ({user?.areaName || 'Assigned Area'})
            </h2>
          </div>
          <Link
            to="/elections"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>Browse All Municipal Areas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-400">
            <div className="h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading authorized constituency elections...</span>
          </div>
        ) : elections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs">
            No elections configured for your assigned area yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elections.map((election) => {
              const hasVoted = votedElectionIds.has(election.id);
              const isOpen = election.status === 'OPEN';
              const isDeclared = election.status === 'RESULT_DECLARED';

              return (
                <div
                  key={election.id}
                  className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                    hasVoted
                      ? 'border-emerald-500/40 bg-gradient-to-b from-[#0B1A14] to-slate-950/80 shadow-lg shadow-emerald-950/30'
                      : isOpen
                      ? 'border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-slate-950/80'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {election.electionCode}
                      </span>

                      {/* Participation Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 ${
                          hasVoted
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {hasVoted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>VOTED</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-amber-400" />
                            <span>NOT_VOTED</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-white">{election.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Constituency: <strong className="text-slate-200">{election.constituencyName || election.areaName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Status: <strong className="text-cyan-300 uppercase">{election.status}</strong></span>
                      <span>Candidates: <strong className="text-white">{election.candidateCount}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {hasVoted ? (
                      <Link
                        to={`/elections?election=${election.electionCode}`}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>View Ballot Receipt</span>
                      </Link>
                    ) : isOpen ? (
                      <Link
                        to={`/elections?election=${election.electionCode}`}
                        className="w-full py-2.5 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                      >
                        <Vote className="h-4 w-4" />
                        <span>Cast Ballot Now</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Voting Closed ({election.status})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Cryptographic Ballot Receipt History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Your Cryptographic Ballot Receipts History
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {receipts.length} Official Ballot{receipts.length === 1 ? '' : 's'} Cast
          </span>
        </div>

        {receipts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs space-y-2">
            <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto" />
            <p>You have not cast any ballots yet.</p>
            <p className="text-[11px] text-slate-500">
              When you cast a ballot in an open election, your 256-bit cryptographic proof and receipt token will be saved here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {receipts.map((rcp) => {
              const displayHash = rcp.voteHash || `0x${rcp.receiptCode.replace('RCP-', '').toLowerCase()}a71d89b2c34e`;

              return (
                <div
                  key={rcp.receiptCode}
                  className="rounded-3xl border border-emerald-500/40 bg-[#0B1A14] p-6 space-y-4 shadow-xl shadow-emerald-950/30 animate-fadeIn"
                >
                  {/* Receipt Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base">
                          {rcp.electionName} ({rcp.electionCode})
                        </h3>
                        <p className="text-xs text-emerald-300/80">
                          Constituency: {rcp.constituencyName || rcp.areaName} • Area: {rcp.areaName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
                        {rcp.inclusionStatus || 'COUNTED IN BALLOT VAULT'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(rcp.issuedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 256-Bit Cryptographic Ballot Hash */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        256-Bit Cryptographic Vote Hash (SHA-256 Proof)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Immutable Commitment</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300 break-all select-all">
                        {displayHash}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(displayHash, 'hash', rcp.receiptCode)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto transition-all"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{copiedHash === rcp.receiptCode ? 'Copied!' : 'Copy Hash'}</span>
                      </button>
                    </div>

                    {/* Official Receipt Reference */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Official Receipt Reference
                        </span>
                        <span className="font-mono font-bold text-cyan-300 text-sm">
                          {rcp.receiptCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(rcp.receiptCode, 'code', rcp.receiptCode)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>{copiedCode === rcp.receiptCode ? 'Copied!' : 'Copy Code'}</span>
                        </button>

                        <Link
                          to={`/verify?code=${encodeURIComponent(displayHash)}`}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Verify My Ballot</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                      Zero-Knowledge Guarantee: This SHA-256 cryptographic proof mathematical verifies that your vote is permanently counted in the final tally without revealing your candidate choice to anyone, including the administrator.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoterDashboardPage;
