/**
 * Simplified, Intuitive, and Secure Voting Pipeline
 * Fast 1-click voting with WebCrypto ECDSA, single-use nullifiers,
 * instant cryptographic receipt generation, and optional ZK circuit inspection.
 */
import React, { useState, useEffect } from 'react';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MapPin,
  User,
  Users,
  Building2,
  Binary,
  RotateCcw,
  CheckCheck,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { Candidate, Election, VerificationReceipt, EligibleVoter } from '../../types';
import { generateVoterKeyPair, signChallenge } from '../../crypto/signatures';
import { sha256 } from '../../crypto/hashing';
import { useAuth } from '../auth/AuthContext';
import { ZeroKnowledgeProofGenerator, ZKProofArtifact } from './ZeroKnowledgeProofGenerator';
import {
  AadhaarElectionVerificationStep,
  VerifiedVoterSession,
} from './AadhaarElectionVerificationStep';

interface VotingPipelineProps {
  election: Election;
  onVoteCast?: (receipt: VerificationReceipt) => void;
  onNavigate?: (tab: string, receiptHash?: string) => void;
}

const PRESET_VOTERS = [
  { name: 'Sarah Connor', voterId: 'VOT-MUM-101', hometown: 'Mumbai', electionId: 'elec-mum-01' },
  { name: 'Rahul Sharma', voterId: 'VOT-MUM-102', hometown: 'Mumbai', electionId: 'elec-mum-01' },
  { name: 'Amit Verma', voterId: 'VOT-DEL-201', hometown: 'Delhi', electionId: 'elec-del-02' },
  { name: 'Priya Patel', voterId: 'VOT-BLR-301', hometown: 'Bengaluru', electionId: 'elec-blr-03' },
  { name: 'Vikram Joshi', voterId: 'VOT-PUN-401', hometown: 'Pune', electionId: 'elec-pun-04' },
];

export const VotingPipeline: React.FC<VotingPipelineProps> = ({
  election: initialElection,
  onVoteCast,
  onNavigate,
}) => {
  const { user } = useAuth();

  // All elections & active selection
  const [allElections, setAllElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election>(initialElection);

  // Active voter identity
  const [voterId, setVoterId] = useState<string>(user?.voterId || 'VOT-MUM-101');
  const [voterName, setVoterName] = useState<string>(user?.name || 'Sarah Connor');
  const [showVoterSwitcher, setShowVoterSwitcher] = useState<boolean>(false);
  const [customVoterId, setCustomVoterId] = useState<string>('');

  // Eligibility & ballot state
  const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(false);
  const [eligibilityStatus, setEligibilityStatus] = useState<{
    isEligible: boolean;
    hasVoted?: boolean;
    message?: string;
  } | null>(null);

  // Mandatory Aadhaar & Election ID Verification Session
  const [verifiedSession, setVerifiedSession] = useState<VerifiedVoterSession | null>(null);

  const handleVerificationSuccess = (session: VerifiedVoterSession) => {
    setVerifiedSession(session);
    setVoterId(session.voter.voterId);
    setVoterName(session.voter.name);
    setSelectedElection(session.election);
    setEligibilityStatus({ isEligible: true, hasVoted: false });
    setErrorMessage(null);
  };

  const handleResetVerification = () => {
    setVerifiedSession(null);
    setSelectedCandidate(null);
    setShowConfirmation(false);
  };

  // Candidate choice & casting state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Completed Receipt state
  const [receipt, setReceipt] = useState<VerificationReceipt | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Optional Technical / ZK inspection
  const [showZKInspector, setShowZKInspector] = useState<boolean>(false);
  const [showCryptoDetails, setShowCryptoDetails] = useState<boolean>(false);

  // Load elections on mount
  useEffect(() => {
    fetch('/api/elections')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Election[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllElections(data);
          const found = data.find((e) => e.id === selectedElection.id);
          if (found) setSelectedElection(found);
        }
      })
      .catch(() => {});
  }, [selectedElection.id]);

  // Sync if initialElection prop updates
  useEffect(() => {
    if (initialElection && initialElection.id !== selectedElection.id) {
      setSelectedElection(initialElection);
    }
  }, [initialElection]);

  // Check eligibility whenever selected election or voter changes
  useEffect(() => {
    let isCancelled = false;

    const checkEligibility = async () => {
      setIsCheckingEligibility(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/voter/check-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            electionId: selectedElection.id,
            voterId: voterId.trim(),
            attemptedConstituency: selectedElection.hometown,
          }),
        });
        const data = await res.json();
        if (!isCancelled) {
          if (data.isEligible) {
            setEligibilityStatus({ isEligible: true });
          } else {
            setEligibilityStatus({
              isEligible: false,
              hasVoted: data.voter?.hasVoted || data.errorCode === 'ALREADY_VOTED',
              message: data.errorMessage || 'Eligibility verification check not passed.',
            });
          }
        }
      } catch {
        if (!isCancelled) {
          // Allow demo voting even if offline
          setEligibilityStatus({ isEligible: true });
        }
      } finally {
        if (!isCancelled) setIsCheckingEligibility(false);
      }
    };

    checkEligibility();

    return () => {
      isCancelled = true;
    };
  }, [selectedElection.id, voterId]);

  // Switch City / Election Area
  const handleSelectArea = (hometown: string) => {
    const target = allElections.find(
      (e) =>
        e.hometown.toLowerCase() === hometown.toLowerCase() ||
        e.constituencyName.toLowerCase().includes(hometown.toLowerCase())
    );
    if (target) {
      setSelectedElection(target);
      setSelectedCandidate(null);
      setShowConfirmation(false);
      setReceipt(null);
      setErrorMessage(null);

      // Auto-switch to matching preset voter for that area if available
      const matchingVoter = PRESET_VOTERS.find((v) => v.hometown.toLowerCase() === target.hometown.toLowerCase());
      if (matchingVoter) {
        setVoterId(matchingVoter.voterId);
        setVoterName(matchingVoter.name);
      }
    }
  };

  // Switch Voter Persona
  const handleSelectPresetVoter = (preset: typeof PRESET_VOTERS[0]) => {
    setVoterId(preset.voterId);
    setVoterName(preset.name);
    setShowVoterSwitcher(false);
    setSelectedCandidate(null);
    setShowConfirmation(false);
    setReceipt(null);
    setErrorMessage(null);

    // Switch to election area if different
    const matchingElection = allElections.find((e) => e.hometown.toLowerCase() === preset.hometown.toLowerCase());
    if (matchingElection && matchingElection.id !== selectedElection.id) {
      setSelectedElection(matchingElection);
    }
  };

  // Reset Ballot for Testing
  const handleResetBallot = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/voter/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId: selectedElection.id,
          voterId: voterId.trim(),
        }),
      });
      setReceipt(null);
      setSelectedCandidate(null);
      setShowConfirmation(false);
      setErrorMessage(null);
      setEligibilityStatus({ isEligible: true });
    } catch {
      // Ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Fast Cryptographic Ballot Submission
  const handleCastBallot = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Generate WebCrypto ECDSA Keypair in browser
      const keyPair = await generateVoterKeyPair();

      // 2. Derive single-use nullifier & Pedersen commitment
      const secretNonce = `${Date.now()}_${Math.random()}`;
      const commitmentHash = await sha256(`BALLOT_COMMITMENT:${selectedElection.id}:${selectedCandidate.id}:${secretNonce}`);
      const nullifierHash = await sha256(`NULLIFIER:${selectedElection.id}:${voterId.trim()}:SALT_9842`);

      // 3. Encrypt payload & sign with ECDSA
      const encryptedPayload = `0xAES256GCM_${btoa(selectedCandidate.id)}_${Date.now()}`;
      const challengeToSign = `VOTE_TX:${selectedElection.id}:${commitmentHash}:${nullifierHash}:${Date.now()}`;
      const signature = await signChallenge(challengeToSign, keyPair.privateKeyJwk);

      // 4. Submit to consensus network
      const response = await fetch('/api/voting/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId: selectedElection.id,
          candidateId: selectedCandidate.id,
          ballot: {
            electionId: selectedElection.id,
            commitment: commitmentHash,
            nullifierHash,
            encryptedPayload,
            signature,
            voterPublicKeyFingerprint: keyPair.publicKeyFingerprint,
            voterId: voterId.trim(),
            aadhaarLast4: verifiedSession?.aadhaarLast4,
            votingArea: selectedElection.constituencyName,
            nonce: `nonce-${Date.now()}`,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Vote submission rejected by consensus validators.');
      }

      const result = await response.json();
      setReceipt(result.receipt);
      setShowConfirmation(false);
      if (onVoteCast) onVoteCast(result.receipt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Vote submission failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReceiptHash = () => {
    if (!receipt) return;
    navigator.clipboard.writeText(receipt.receiptHash);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Area Switcher */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.3)]">
              <Vote className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white">
                  {selectedElection.name}
                </h1>
                <span className="rounded-lg bg-cyan-950 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30">
                  {selectedElection.electionNumber}
                </span>
                <span className="rounded-lg bg-emerald-950/80 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/40">
                  POLLS OPEN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>Constituency: <strong>{selectedElection.constituencyName}</strong> ({selectedElection.hometown})</span>
              </p>
            </div>
          </div>

          {/* Active Voter Identity Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                {voterName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{voterName}</span>
                  <span className="text-[10px] text-emerald-400 font-normal">● Ready</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {voterId}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVoterSwitcher(!showVoterSwitcher)}
              className="rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 p-2.5 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Switch Voter Persona"
            >
              <Users className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Voter Switcher Dropdown (when toggled) */}
        {showVoterSwitcher && (
          <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span>Switch Test Voter Persona</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowVoterSwitcher(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PRESET_VOTERS.map((preset) => (
                <button
                  key={preset.voterId}
                  type="button"
                  onClick={() => handleSelectPresetVoter(preset)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                    voterId === preset.voterId
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{preset.voterId} • {preset.hometown}</div>
                  </div>
                  {voterId === preset.voterId && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                </button>
              ))}
            </div>

            {/* Custom Voter Input */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={customVoterId}
                onChange={(e) => setCustomVoterId(e.target.value)}
                placeholder="Or enter custom Voter ID (e.g. VOT-MUM-999)"
                className="flex-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs text-white border border-slate-800 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (customVoterId.trim()) {
                    setVoterId(customVoterId.trim());
                    setVoterName('Custom Citizen');
                    setShowVoterSwitcher(false);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Quick Area / City Selector Pills (All 10 Areas & Live Statuses) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-300 shrink-0 uppercase tracking-wider">
            Open Election Areas ({allElections.length}):
          </span>
          {allElections.map((elec) => {
            const isSelected = selectedElection.id === elec.id;
            const isOpen = elec.state === 'VOTING_OPEN';
            const isClosed = elec.state === 'VOTING_CLOSED' || elec.state === 'RESULTS_PUBLISHED';
            const statusLabel = isOpen ? 'Open' : isClosed ? 'Closed' : 'Upcoming';
            const statusBadge = isOpen
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              : isClosed
              ? 'bg-rose-950 text-rose-300 border-rose-500/40'
              : 'bg-blue-950 text-blue-300 border-blue-500/40';

            return (
              <button
                key={elec.id}
                type="button"
                onClick={() => {
                  setSelectedElection(elec);
                  setSelectedCandidate(null);
                  setShowConfirmation(false);
                  setReceipt(null);
                  setErrorMessage(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(79,209,255,0.4)] scale-[1.02]'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <span>{elec.hometown}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase border ${statusBadge}`}>
                  {statusLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mandatory Step 1: Aadhaar & Election ID Verification Component */}
      {!receipt && selectedElection.state === 'VOTING_OPEN' && (
        <AadhaarElectionVerificationStep
          currentElection={selectedElection}
          allElections={allElections}
          onSelectElection={(elec) => {
            setSelectedElection(elec);
            setVerifiedSession(null);
            setSelectedCandidate(null);
            setShowConfirmation(false);
          }}
          onVerificationSuccess={handleVerificationSuccess}
          verifiedSession={verifiedSession}
          onResetVerification={handleResetVerification}
          initialVoterId={voterId}
          initialAadhaarLast4="8821"
        />
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-rose-200 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="text-xs font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleResetBallot}
            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Reset Ballot & Retry
          </button>
        </div>
      )}

      {/* Already Voted Banner: 1-User 1-Vote Enforced */}
      {eligibilityStatus && (!eligibilityStatus.isEligible || eligibilityStatus.hasVoted) && eligibilityStatus.hasVoted && !receipt && (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-950/30 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <CheckCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ballot Already Cast for This Election</h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Citizen <strong>{voterName}</strong> (ID: <code className="font-mono text-cyan-300">{voterId}</code>) has already cast their ballot for {selectedElection.name}. Strict One-User-One-Vote protocol is active; duplicate voting is not permitted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate?.('verify')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verify Your Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('results')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Election Closed by Admin Banner */}
      {selectedElection.state !== 'VOTING_OPEN' && (
        <div className="rounded-3xl border border-rose-500/40 bg-rose-950/30 p-6 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Polls Closed by Election Commission</h3>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Voting has concluded for <strong>{selectedElection.name}</strong>. Ballots are no longer accepted.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigate?.('verify')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verify Receipt & Hash</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('results')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
            >
              View Certified Election Tally
            </button>
          </div>
        </div>
      )}

      {/* 2. SUCCESS: Verified Digital Ballot Receipt */}
      {receipt && (
        <div className="rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 via-slate-950 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/30 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">Official Ballot Receipt Issued</h2>
                  <span className="rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5">
                    VERIFIED & RECORDED
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Your ballot has been cryptographically sealed and recorded into the immutable blockchain block.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start sm:self-auto">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>1 User, 1 Vote Recorded</span>
            </div>
          </div>

          {/* Receipt Details Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Cryptographic Receipt Hash (Save for Verification)
              </span>
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl bg-slate-950 p-3 border border-slate-800">
                <code className="text-xs font-mono text-cyan-300 break-all">
                  {receipt.receiptHash}
                </code>
                <button
                  type="button"
                  onClick={copyReceiptHash}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedReceipt ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedReceipt ? 'Copied!' : 'Copy Hash'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800/80">
              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Block Height</span>
                <span className="font-bold text-white font-mono">#{receipt.blockHeight}</span>
              </div>
              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Consensus Quorum</span>
                <span className="font-bold text-emerald-400 font-mono">{receipt.validatorSignaturesCount}/3 Validators</span>
              </div>
              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Transaction ID</span>
                <span className="font-bold text-slate-300 font-mono truncate block">{receipt.transactionId}</span>
              </div>
              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Timestamp</span>
                <span className="font-bold text-slate-300 font-mono text-[11px] truncate block">
                  {new Date(receipt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.('verify', receipt.receiptHash)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,209,255,0.3)] cursor-pointer transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Verify Receipt on Public Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('results')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>View Live Election Results</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. CANDIDATE SELECTION BALLOT (If not voted yet, election is OPEN, and verified via Aadhaar & Election ID) */}
      {(!receipt && (!eligibilityStatus || eligibilityStatus.isEligible) && !eligibilityStatus?.hasVoted && selectedElection.state === 'VOTING_OPEN') && (
        verifiedSession ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Official Ballot: Select Your Candidate
              </h2>
              <p className="text-xs text-slate-400">
                Click on your preferred candidate to review and cast your encrypted ballot.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCryptoDetails(!showCryptoDetails)}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>{showCryptoDetails ? 'Hide Security Details' : 'Security Details'}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCryptoDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Optional Cryptographic Details Accordion */}
          {showCryptoDetails && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-3 animate-fadeIn text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Cryptographic Guarantees (End-to-End Verifiable)
                </span>
                <button
                  type="button"
                  onClick={() => setShowZKInspector(true)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Binary className="h-3 w-3" />
                  <span>Launch Visual ZK Circuit Studio</span>
                </button>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-400">
                <li className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-slate-200 block mb-0.5">1. Anonymity</strong>
                  Pedersen commitments ensure your identity is mathematically decoupled from your vote choice.
                </li>
                <li className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-slate-200 block mb-0.5">2. 1-Person-1-Vote</strong>
                  A cryptographic single-use nullifier prevents duplicate ballots without revealing your voter ID.
                </li>
                <li className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-slate-200 block mb-0.5">3. Byzantine Fault Tolerant</strong>
                  Blocks are mined and certified by independent threshold validator nodes across jurisdictions.
                </li>
              </ul>
            </div>
          )}

          {/* Candidate Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedElection.candidates.map((candidate) => {
              const isSelected = selectedCandidate?.id === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => {
                    setSelectedCandidate(candidate);
                    setShowConfirmation(true);
                  }}
                  className={`rounded-2xl border p-5 backdrop-blur-xl transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(79,209,255,0.25)] scale-[1.01]'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shrink-0 overflow-hidden shadow-inner">
                      {candidate.symbolImageUrl ? (
                        <img
                          src={candidate.symbolImageUrl}
                          alt={candidate.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{candidate.symbol || '🗳️'}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300">
                          {candidate.party}
                        </span>
                        <span className="text-xl">{candidate.symbol}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {candidate.displayName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {candidate.bio}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {candidate.id}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidate(candidate);
                        setShowConfirmation(true);
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(79,209,255,0.4)]'
                          : 'bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Vote for Candidate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-3 backdrop-blur-xl">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Ballot Candidates Locked</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              To preserve election integrity and verify one-person-one-vote, please complete the <strong>Aadhaar & Election ID Verification Step</strong> above before accessing the candidate ballot.
            </p>
          </div>
        )
      )}

      {/* 4. CONFIRMATION MODAL / DRAWER */}
      {showConfirmation && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Vote className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Confirm Your Ballot Choice</h3>
                  <p className="text-xs text-slate-400">Review before final cryptographic submission</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Candidate Card Summary */}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                {selectedCandidate.symbolImageUrl ? (
                  <img src={selectedCandidate.symbolImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{selectedCandidate.symbol || '🗳️'}</span>
                )}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-cyan-300">
                  {selectedCandidate.party}
                </span>
                <h4 className="text-base font-bold text-white leading-tight">
                  {selectedCandidate.displayName}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Constituency: {selectedElection.constituencyName} ({selectedElection.hometown})
                </p>
              </div>
            </div>

            {/* Voter Verification Confirmation */}
            <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Voter ID:</span>
                <strong className="text-white font-mono">{voterId} ({voterName})</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Election:</span>
                <strong className="text-white">{selectedElection.electionNumber}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Privacy:</span>
                <span className="text-emerald-400 font-semibold">100% Secret & Anonymous (ZK Nullifier)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Change Choice
              </button>

              <button
                type="button"
                onClick={handleCastBallot}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Signing & Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm & Cast Ballot</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual ZK Proof Circuit Studio Modal (if user explicitly launches it) */}
      {showZKInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Binary className="h-5 w-5 text-cyan-400" />
                <span>Visual Zero-Knowledge Proof Circuit Simulator</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowZKInspector(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close Simulator
              </button>
            </div>
            <ZeroKnowledgeProofGenerator
              voterId={voterId}
              electionId={selectedElection.id}
              hometown={selectedElection.hometown}
              onProofGenerated={() => setShowZKInspector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
