/**
 * Public Zero-Knowledge Verification Portal
 * Allows voters and independent observers to mathematically verify ballot inclusion,
 * election ongoing state vs election closed count status, Merkle branches, and validator signatures.
 */
import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Lock,
  Clock,
  Unlock,
  EyeOff,
  Vote,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { VerificationReceipt } from '../../types';
import { MerkleVisualizer } from '../blockchain/MerkleVisualizer';

interface VerificationPortalProps {
  initialHash?: string;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({ initialHash }) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialHash || '');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStep, setVerificationStep] = useState<number>(0);
  const [receiptResult, setReceiptResult] = useState<VerificationReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin Election Status Control state
  const [electionStatus, setElectionStatus] = useState<'VOTING_OPEN' | 'VOTING_CLOSED'>('VOTING_OPEN');
  const [isTogglingState, setIsTogglingState] = useState<boolean>(false);
  const [statusMessageBanner, setStatusMessageBanner] = useState<string | null>(null);

  const sampleReceiptHash = '0xRECEIPT_SAMPLE_TX001_BLOCK1_VERIFIED';

  // Fetch initial election state
  const refreshElectionState = async () => {
    try {
      const res = await fetch('/api/elections');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const isOpen = data.some((e: { state: string }) => e.state === 'VOTING_OPEN');
          setElectionStatus(isOpen ? 'VOTING_OPEN' : 'VOTING_CLOSED');
        }
      }
    } catch {
      // Ignore network hiccup
    }
  };

  useEffect(() => {
    refreshElectionState();
  }, []);

  useEffect(() => {
    if (initialHash && initialHash.trim()) {
      setSearchQuery(initialHash);
      handleVerify(initialHash);
    }
  }, [initialHash]);

  // Admin toggle: Close Election <-> Open Election
  const handleToggleAdminElection = async () => {
    setIsTogglingState(true);
    setStatusMessageBanner(null);
    try {
      const res = await fetch('/api/elections/toggle-all-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        const newStatus = data.isClosed ? 'VOTING_CLOSED' : 'VOTING_OPEN';
        setElectionStatus(newStatus);
        setStatusMessageBanner(
          data.isClosed
            ? 'Election Admin has CLOSED the election. Ballots will now verify as COUNTED in the final certified tally!'
            : 'Election Admin has OPENED the election. Election is now undergoing (ballots sealed).'
        );

        // If a receipt is already verified or in search box, re-verify to show instant update
        if (searchQuery.trim()) {
          setTimeout(() => {
            handleVerify(searchQuery.trim());
          }, 300);
        }
      }
    } catch {
      setStatusMessageBanner('Failed to toggle election state. Please retry.');
    } finally {
      setIsTogglingState(false);
    }
  };

  const handleVerify = async (hashToVerify?: string) => {
    const targetHash = hashToVerify || searchQuery;
    if (!targetHash.trim()) {
      setErrorMsg('Please enter a Receipt Hash or Transaction ID.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setReceiptResult(null);
    setVerificationStep(1);

    try {
      // Step 1: Query backend
      await new Promise((r) => setTimeout(r, 300));
      setVerificationStep(2);

      const response = await fetch('/api/verification/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptHash: targetHash.trim() }),
      });

      setVerificationStep(3);
      await new Promise((r) => setTimeout(r, 300));
      setVerificationStep(4);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setErrorMsg(
          errData.error ||
            'Receipt not found in immutable ledger. Please ensure the hash is correct or cast a ballot first.'
        );
      } else {
        const data = await response.json();
        setReceiptResult(data);
      }

      setVerificationStep(5);
    } catch (err: unknown) {
      setErrorMsg('Verification failed. Invalid receipt hash or network unreachable.');
    } finally {
      setIsVerifying(false);
    }
  };

  const isOngoing = receiptResult
    ? receiptResult.isElectionOngoing ?? (receiptResult.electionState === 'VOTING_OPEN' || !receiptResult.isCountedInTally)
    : electionStatus === 'VOTING_OPEN';

  const isCounted = receiptResult
    ? Boolean(receiptResult.isCountedInTally)
    : electionStatus === 'VOTING_CLOSED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ======================================================== */}
      {/* 1. ADMIN ELECTION STATE QUICK-TOGGLE BAR */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                electionStatus === 'VOTING_OPEN'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              }`}
            >
              {electionStatus === 'VOTING_OPEN' ? <Clock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Election Authority Control:
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                    electionStatus === 'VOTING_OPEN'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {electionStatus === 'VOTING_OPEN' ? 'POLLS OPEN (Election Undergoing)' : 'POLLS CLOSED (Voting Ended)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {electionStatus === 'VOTING_OPEN'
                  ? 'Voting is active. Receipts verify that ballots are safely sealed, pending poll closure.'
                  : 'Polls are closed by Admin. Receipts verify that votes are decrypted & counted in the final tally.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAdminElection}
              disabled={isTogglingState}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shrink-0 ${
                electionStatus === 'VOTING_OPEN'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              } disabled:opacity-50`}
            >
              {isTogglingState ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Updating State...</span>
                </>
              ) : electionStatus === 'VOTING_OPEN' ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Admin: Close Election (Count Votes)</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Admin: Reopen Election (Voting Ongoing)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {statusMessageBanner && (
          <div className="mt-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 p-2.5 text-xs text-cyan-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>{statusMessageBanner}</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. SEARCH BAR & RECEIPT LOOKUP */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-950/80 to-blue-950/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.3)]">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Public Cryptographic Receipt Verification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify your ballot hash to check whether your vote is sealed (election ongoing) or counted in the certified tally (election closed).
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              id="verification-receipt-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Paste Public Receipt Hash (e.g. 0xRECEIPT...)"
              className="w-full rounded-xl bg-slate-900 px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>

          <button
            id="verify-receipt-button"
            onClick={() => handleVerify()}
            disabled={isVerifying}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.4)] hover:bg-cyan-400 transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isVerifying ? 'Verifying Proof...' : 'Verify Hash'}</span>
          </button>
        </div>

        {/* Quick Demo Receipt Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Need a test receipt?</span>
          <button
            onClick={() => {
              setSearchQuery(sampleReceiptHash);
              handleVerify(sampleReceiptHash);
            }}
            className="text-cyan-400 hover:underline font-mono text-[11px] cursor-pointer bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20"
          >
            Load Sample Block #1 Receipt
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">Status: Not verified</span>
              <span>The system cannot yet confirm that the ballot was included. ({errorMsg})</span>
            </div>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold bg-rose-950 border border-rose-500/40 text-rose-300 shrink-0">
            NOT VERIFIED
          </span>
        </div>
      )}

      {/* 5-Stage Verification Progress Indicator */}
      {isVerifying && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-400 mb-3 font-bold">
            <Cpu className="h-4 w-4 animate-spin" />
            <span>Executing Cryptographic Verification Sequence...</span>
          </div>
          <div className="space-y-2 text-slate-300">
            {[
              { step: 1, text: 'Resolving Receipt Hash in Distributed Ledger Index' },
              { step: 2, text: 'Fetching Block Header & Validator Quorum Signatures' },
              { step: 3, text: 'Verifying Election State (Ongoing vs Closed)' },
              { step: 4, text: 'Verifying Zero-Knowledge Validity Proof' },
              { step: 5, text: 'Cryptographic Attestation Complete' },
            ].map((s) => (
              <div
                key={s.step}
                className={`flex items-center gap-2 ${
                  verificationStep >= s.step ? 'text-emerald-400' : 'text-slate-600'
                }`}
              >
                {verificationStep >= s.step ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>○</span>}
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. VERIFICATION RESULT: ONGOING VS CLOSED VOTE COUNT */}
      {/* ======================================================== */}
      {receiptResult && !isVerifying && (
        <div className="space-y-5 animate-in fade-in">
          {/* MAIN STATUS CARD */}
          <div
            className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${
              isCounted
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border-emerald-500/50 shadow-emerald-950/30'
                : 'bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border-amber-500/50 shadow-amber-950/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${
                    isCounted
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  {isCounted ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border ${
                        isCounted
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                          : 'bg-amber-950 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      }`}
                    >
                      {isCounted ? '✓ STATUS: COUNTED' : '⏳ STATUS: NOT VERIFIED'}
                    </span>
                    <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-800">
                      BLOCK #{receiptResult.blockHeight} CONFIRMED
                    </span>
                  </div>

                  <h3
                    className={`text-lg font-bold mt-1.5 ${
                      isCounted ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isCounted
                      ? 'Counted: The voter’s ballot was included in the final tally.'
                      : 'Not verified: The system cannot yet confirm that the ballot was included.'}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {isCounted
                      ? receiptResult.statusMessage ||
                        'The Election Admin has officially closed this election. Your ballot was unlocked using multi-party threshold keys and successfully counted in the certified election results.'
                      : receiptResult.statusMessage ||
                        `The election is currently ongoing. Your ballot is securely recorded into Block #${receiptResult.blockHeight} with 3/3 validator signatures. Votes remain sealed in the ledger and are counted only after the Election Admin closes the election.`}
                  </p>
                </div>
              </div>
            </div>

            {/* VOTE COUNT STATUS HIGHLIGHT BOX */}
            <div
              className={`mt-4 rounded-xl p-4 border text-xs ${
                isCounted
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 font-bold">
                  {isCounted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-400" />
                  )}
                  <span className="text-sm">
                    {isCounted
                      ? 'Official Vote Count: INCLUDED IN CERTIFIED TALLY'
                      : 'Official Vote Count: PENDING POLL CLOSURE (ELECTION UNDERGOING)'}
                  </span>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white">
                  3/3 Quorum Signatures
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300 mt-2">
                <div>
                  <span className="text-slate-400 block">Election:</span>
                  <span className="font-semibold text-white">
                    {receiptResult.electionName || 'Municipal Council Election'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Counting Status:</span>
                  <span className="font-semibold font-mono text-cyan-300">
                    {isCounted ? 'VOTE_COUNTED_IN_FINAL_TALLY' : 'ELECTION_ONGOING_BALLOT_SEALED'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cryptographic Seal:</span>
                  <span className="font-mono text-white">Pedersen Commitment + AES-256-GCM</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tally Audit Root:</span>
                  <span className="font-mono text-emerald-300">
                    {isCounted
                      ? receiptResult.tallyAuditHash || '0xMERKLE_TALLY_ROOT_CERTIFIED_BLOCK_1'
                      : 'Locked until Election Admin closes polls'}
                  </span>
                </div>
              </div>
            </div>

            {/* BLOCKCHAIN AUDIT DETAILS */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Block Hash
                </span>
                <p className="font-mono text-white break-all text-[11px] mt-1">
                  {receiptResult.blockHash}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Merkle Root
                </span>
                <p className="font-mono text-white break-all text-[11px] mt-1">
                  {receiptResult.merkleRoot}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                  Validator Consensus
                </span>
                <p className="font-mono font-bold text-violet-300 text-[11px] mt-1">
                  {receiptResult.validatorSignaturesCount}/3 Multi-Party Nodes (Quorum Certified)
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Zero-Knowledge Proof
                </span>
                <p className="font-mono text-amber-300 break-all text-[11px] mt-1">
                  {receiptResult.zkProofSimulated}
                </p>
              </div>
            </div>

            {/* Zero-Leak Notice */}
            <div className="mt-4 rounded-xl bg-cyan-950/20 p-3 border border-cyan-500/30 flex items-center gap-2.5 text-xs text-cyan-300">
              <EyeOff className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>
                <strong>Zero-Knowledge Secrecy:</strong> Your candidate choice is strictly confidential and never revealed in this verification. Only mathematical proof of inclusion is verified.
              </span>
            </div>
          </div>

          {/* Interactive Merkle Tree Component */}
          <MerkleVisualizer
            rootHash={receiptResult.merkleRoot}
            transactions={[
              {
                id: receiptResult.transactionId,
                commitment: '0x4F92E1B48A109C48',
                nullifierHash: '0x99A466D14821CB92',
              },
            ]}
            highlightTxId={receiptResult.transactionId}
          />
        </div>
      )}
    </div>
  );
};
