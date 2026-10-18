/**
 * Aadhaar & Election ID Verification Step
 * Requires voters to verify their Election ID and the last 4 digits of their
 * UIDAI Aadhaar card against the official backend electoral roll before
 * unlocking access to the candidate ballot.
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Lock,
  Unlock,
  Key,
  MapPin,
  Vote,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building2,
  Users,
  Search,
} from 'lucide-react';
import { Election, EligibleVoter } from '../../types';

export interface VerifiedVoterSession {
  voter: EligibleVoter;
  election: Election;
  aadhaarLast4: string;
}

interface AadhaarElectionVerificationStepProps {
  currentElection: Election;
  allElections: Election[];
  onSelectElection: (election: Election) => void;
  onVerificationSuccess: (session: VerifiedVoterSession) => void;
  verifiedSession: VerifiedVoterSession | null;
  onResetVerification?: () => void;
  initialVoterId?: string;
  initialAadhaarLast4?: string;
}

// Pre-seeded official roll entries for instant testing
const QUICK_VERIFY_PERSONAS = [
  {
    name: 'Sarah Connor',
    voterId: 'VOT-2026-8821',
    aadhaarLast4: '8821',
    hometown: 'Mumbai',
    electionNumber: 'ELEC-2026-MUM-01',
    electionId: 'elec-mum-01',
    constituency: 'Mumbai South',
  },
  {
    name: 'Sarah Connor (Alt)',
    voterId: 'VOT-MUM-101',
    aadhaarLast4: '1001',
    hometown: 'Mumbai',
    electionNumber: 'ELEC-2026-MUM-01',
    electionId: 'elec-mum-01',
    constituency: 'Mumbai South',
  },
  {
    name: 'Rahul Sharma',
    voterId: 'VOT-MUM-102',
    aadhaarLast4: '1002',
    hometown: 'Mumbai',
    electionNumber: 'ELEC-2026-MUM-01',
    electionId: 'elec-mum-01',
    constituency: 'Mumbai South',
  },
  {
    name: 'Amit Verma',
    voterId: 'VOT-DEL-201',
    aadhaarLast4: '2001',
    hometown: 'Delhi',
    electionNumber: 'ELEC-2026-DEL-02',
    electionId: 'elec-del-02',
    constituency: 'New Delhi Central',
  },
  {
    name: 'Priya Patel',
    voterId: 'VOT-BLR-301',
    aadhaarLast4: '3001',
    hometown: 'Bengaluru',
    electionNumber: 'ELEC-2026-BLR-03',
    electionId: 'elec-blr-03',
    constituency: 'Bengaluru South',
  },
  {
    name: 'Vikram Joshi',
    voterId: 'VOT-PUN-401',
    aadhaarLast4: '6721',
    hometown: 'Pune',
    electionNumber: 'ELEC-2026-PUN-04',
    electionId: 'elec-pun-04',
    constituency: 'Pune East',
  },
];

export const AadhaarElectionVerificationStep: React.FC<AadhaarElectionVerificationStepProps> = ({
  currentElection,
  allElections,
  onSelectElection,
  onVerificationSuccess,
  verifiedSession,
  onResetVerification,
  initialVoterId,
  initialAadhaarLast4,
}) => {
  const [selectedElectionId, setSelectedElectionId] = useState<string>(currentElection.id);
  const [voterIdInput, setVoterIdInput] = useState<string>(initialVoterId || 'VOT-2026-8821');
  const [aadhaarLast4Input, setAadhaarLast4Input] = useState<string>(initialAadhaarLast4 || '8821');

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [alreadyVotedInfo, setAlreadyVotedInfo] = useState<{ receiptHash?: string; message: string } | null>(null);

  // Sync when election changes from outside
  useEffect(() => {
    setSelectedElectionId(currentElection.id);
  }, [currentElection.id]);

  useEffect(() => {
    if (initialVoterId) setVoterIdInput(initialVoterId);
  }, [initialVoterId]);

  useEffect(() => {
    if (initialAadhaarLast4) setAadhaarLast4Input(initialAadhaarLast4);
  }, [initialAadhaarLast4]);

  const handleElectionChange = (newElectionId: string) => {
    setSelectedElectionId(newElectionId);
    const target = allElections.find((e) => e.id === newElectionId);
    if (target) {
      onSelectElection(target);
    }
    setVerificationError(null);
    setAlreadyVotedInfo(null);
  };

  const handleApplyPersona = (persona: typeof QUICK_VERIFY_PERSONAS[0]) => {
    setVoterIdInput(persona.voterId);
    setAadhaarLast4Input(persona.aadhaarLast4);
    setSelectedElectionId(persona.electionId);
    const match = allElections.find((e) => e.id === persona.electionId);
    if (match) {
      onSelectElection(match);
    }
    setVerificationError(null);
    setAlreadyVotedInfo(null);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError(null);
    setAlreadyVotedInfo(null);

    const cleanVoterId = voterIdInput.trim();
    const cleanAadhaar = aadhaarLast4Input.trim();

    if (!cleanVoterId) {
      setVerificationError('Please enter your Election Voter ID Number.');
      return;
    }

    if (!cleanAadhaar || cleanAadhaar.length !== 4 || !/^\d{4}$/.test(cleanAadhaar)) {
      setVerificationError('Please enter exactly the last 4 numeric digits of your Aadhaar Number.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/voter/verify-aadhaar-election', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId: selectedElectionId,
          voterId: cleanVoterId,
          aadhaarLast4: cleanAadhaar,
          attemptedConstituency: currentElection.constituencyName,
        }),
      });

      const data = await res.json();

      if (data.verified && data.voter && data.election) {
        onVerificationSuccess({
          voter: data.voter,
          election: data.election,
          aadhaarLast4: cleanAadhaar,
        });
      } else {
        if (data.errorCode === 'ALREADY_VOTED') {
          setAlreadyVotedInfo({
            receiptHash: data.voter?.receiptHash || data.receiptHash,
            message: data.errorMessage || 'You have already voted in this election.',
          });
        } else {
          setVerificationError(data.errorMessage || data.error || 'Verification failed. Please check your credentials.');
        }
      }
    } catch {
      setVerificationError('Network error during Aadhaar & Election ID verification. Please check backend connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  // If already verified, show the authenticated identity badge with reset button
  if (verifiedSession) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Step 1 Complete: Identity Verified & Locked
                </span>
                <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> UIDAI & Roll Matched
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {verifiedSession.voter.name}
              </h3>
            </div>
          </div>

          {onResetVerification && (
            <button
              type="button"
              onClick={onResetVerification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
              <span>Change / Re-verify Voter</span>
            </button>
          )}
        </div>

        {/* Verified details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Election ID & Roll
            </span>
            <span className="font-mono font-bold text-cyan-300 mt-0.5 block truncate">
              {verifiedSession.voter.voterId}
            </span>
            <span className="text-[10px] text-slate-400 truncate block">
              {verifiedSession.election.electionNumber}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Aadhaar (UIDAI)
            </span>
            <span className="font-mono font-bold text-emerald-300 mt-0.5 block">
              •••• •••• {verifiedSession.aadhaarLast4}
            </span>
            <span className="text-[10px] text-emerald-400/80 block">Verified Active</span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Constituency Area
            </span>
            <span className="font-bold text-white mt-0.5 block truncate">
              {verifiedSession.voter.constituencyName}
            </span>
            <span className="text-[10px] text-slate-400 block">{verifiedSession.voter.hometown}</span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Ballot Clearance
            </span>
            <span className="font-bold text-cyan-400 mt-0.5 block flex items-center gap-1">
              <Unlock className="h-3.5 w-3.5 text-emerald-400" /> Authorized to Vote
            </span>
            <span className="text-[10px] text-slate-400 block">Single-use nullifier active</span>
          </div>
        </div>
      </div>
    );
  }

  // Not yet verified: Verification form
  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.25)]">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  Step 1: Mandatory Sovereign Voter Verification
                </span>
                <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                  UIDAI + Electoral Roll
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Verify Last 4 Digits of Aadhaar & Election ID
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Ballot Locked Until Verified</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Before ballot access is granted, the Election Commission requires two-factor validation
          matching your assigned <strong>Election Voter ID</strong> and <strong>last 4 digits of Aadhaar</strong>
          against the backend sovereign roll. One citizen may only vote once.
        </p>
      </div>

      {/* Error / Double Vote Alerts */}
      {verificationError && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-rose-100 block">Verification Unsuccessful</span>
            <span>{verificationError}</span>
          </div>
        </div>
      )}

      {alreadyVotedInfo && (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-950/40 p-4 text-xs text-amber-200 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>Ballot Already Cast (Double-Voting Rejection)</span>
          </div>
          <p>{alreadyVotedInfo.message}</p>
          {alreadyVotedInfo.receiptHash && (
            <div className="rounded-xl bg-slate-950/80 p-2.5 border border-amber-500/30">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Existing Receipt Hash:</span>
              <span className="font-mono text-cyan-300 text-xs break-all select-all font-bold">
                {alreadyVotedInfo.receiptHash}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Access Demo Personas for One-Click Verification */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Quick-Fill from Official Electoral Roll</span>
          </span>
          <span className="text-[11px] text-slate-500">1-Click Auto-Fill</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {QUICK_VERIFY_PERSONAS.map((p) => {
            const isMatch = voterIdInput === p.voterId && aadhaarLast4Input === p.aadhaarLast4;
            return (
              <button
                key={p.voterId}
                type="button"
                onClick={() => handleApplyPersona(p)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isMatch
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 ring-1 ring-cyan-400/40'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{p.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/30">
                    UID •••• {p.aadhaarLast4}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                  <span>{p.voterId}</span>
                  <span className="text-slate-500">{p.hometown}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* The Core Verification Form */}
      <form onSubmit={handleVerify} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Field 1: Election ID & Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1. Election ID & Area
            </label>
            <select
              value={selectedElectionId}
              onChange={(e) => handleElectionChange(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              {allElections.map((elec) => (
                <option key={elec.id} value={elec.id}>
                  {elec.hometown} - {elec.electionNumber} ({elec.state.replace('_', ' ')})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Constituency: {currentElection.constituencyName}
            </span>
          </div>

          {/* Field 2: Election Voter ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. Election Voter ID Number
            </label>
            <input
              type="text"
              required
              id="verification-voter-id-input"
              value={voterIdInput}
              onChange={(e) => setVoterIdInput(e.target.value)}
              placeholder="e.g. VOT-2026-8821 or VOT-MUM-101"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Official roll ID issued by Electoral Commission
            </span>
          </div>

          {/* Field 3: Aadhaar Last 4 Digits */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>3. Last 4 Digits of Aadhaar</span>
              <span className="text-[10px] text-cyan-400 font-mono">UIDAI 4-Digit</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-500 select-none shrink-0">
                •••• ••••
              </span>
              <input
                type="text"
                required
                maxLength={4}
                id="verification-aadhaar-input"
                value={aadhaarLast4Input}
                onChange={(e) => setAadhaarLast4Input(e.target.value.replace(/\D/g, ''))}
                placeholder="8821"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-center tracking-widest text-emerald-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Last 4 numbers of your 12-digit UID card
            </span>
          </div>
        </div>

        {/* Submit Verification Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="verify-aadhaar-election-btn"
            disabled={isVerifying}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-xs font-black text-slate-950 shadow-[0_0_25px_rgba(79,209,255,0.3)] hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                <span>Verifying Credentials Against Sovereign Electoral Roll...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-slate-950" />
                <span>Verify Aadhaar & Election ID to Unlock Official Ballot</span>
                <ArrowRight className="h-4 w-4 text-slate-950" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
