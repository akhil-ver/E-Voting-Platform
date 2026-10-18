/**
 * Election Timeline & Lifecycle Phase Transition Component
 * Displays:
 * 1. Live countdown timers to upcoming deadlines (polls closing, tallying, audit)
 * 2. Cryptographic phase transitions stepper (REGISTRATION -> VOTING -> TALLYING -> PUBLISHED)
 * 3. Chronological key election milestones with protocol invariants & responsible authorities
 * 4. Interactive milestone inspection, category filters, and simulated deadline testing
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  ChevronRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  Key,
  Users,
  Vote,
  Building2,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  FileText,
  ExternalLink,
  Filter,
  Activity,
  ArrowRight,
  Timer,
  Info,
  Radio,
} from 'lucide-react';
import { Election, ElectionState } from '../../types';

export interface Milestone {
  id: string;
  title: string;
  phase: ElectionState;
  category: 'VOTER' | 'VALIDATOR' | 'TALLY' | 'GOVERNANCE';
  scheduledTime: string; // ISO 8601
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  shortSummary: string;
  cryptographicInvariant: string;
  responsibleAuthority: string;
  legalBasis: string;
  technicalDetails: string[];
  actionLabel?: string;
  actionTab?: string;
}

interface ElectionTimelineProps {
  primaryElection: Election | null;
  onNavigate?: (tab: string) => void;
}

// Current baseline simulation reference time: 2026-09-23T13:11:30Z
const SIMULATED_NOW_BASE = new Date('2026-09-23T13:11:30Z').getTime();

export const ElectionTimeline: React.FC<ElectionTimelineProps> = ({
  primaryElection,
  onNavigate,
}) => {
  // Time offset simulation: 0 = live reference time (Sep 23 13:11), 
  // positive = fast forward toward deadline, negative = rewind
  const [timeShiftHours, setTimeShiftHours] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'VOTER' | 'VALIDATOR' | 'TALLY' | 'GOVERNANCE'>('ALL');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>('m-close');
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'PHASE_MATRIX' | 'DEADLINES_ONLY'>('TIMELINE');
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(1); // 1 = VOTING_OPEN

  // Current effective time ticker
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => {
    return SIMULATED_NOW_BASE + timeShiftHours * 3600 * 1000;
  });

  // Keep ticking forward 1s every real second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs((prev) => prev + 1000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync when timeShiftHours changes
  useEffect(() => {
    setCurrentTimeMs(SIMULATED_NOW_BASE + timeShiftHours * 3600 * 1000);
  }, [timeShiftHours]);

  const now = useMemo(() => new Date(currentTimeMs), [currentTimeMs]);

  // Comprehensive election milestones anchored to official schedule
  const milestones: Milestone[] = useMemo(() => {
    return [
      {
        id: 'm-gazette',
        title: 'Official Gazette Notification & BN254 Curve Setup',
        phase: 'CONFIGURED',
        category: 'GOVERNANCE',
        scheduledTime: '2026-09-10T09:00:00Z',
        status: 'COMPLETED',
        shortSummary: 'Legal proclamation gazetted; zero-knowledge elliptic curve parameters and cryptographic generators initialized.',
        cryptographicInvariant: 'Alt-BN128 / BN254 pairing generators (G1, G2) committed and publicly verifiable on immutable bulletin board.',
        responsibleAuthority: 'Chief Election Commissioner & Ministry of Law',
        legalBasis: 'Electoral Representation Act 2026, Section 14(2)',
        technicalDetails: [
          'CRS (Common Reference String) generated via multi-party ceremony with 12 global witnesses.',
          'Official constituency boundary and seat allocation permanently hashed with SHA-256.',
          'Initial election smart contract state deployed with nullifier registry initialized to empty state.',
        ],
        actionLabel: 'Inspect Gazette Hash',
        actionTab: 'verify',
      },
      {
        id: 'm-roll-freeze',
        title: 'Electoral Roll Certification & Merkle Root Publish',
        phase: 'REGISTRATION_OPEN',
        category: 'VOTER',
        scheduledTime: '2026-09-16T18:00:00Z',
        status: 'COMPLETED',
        shortSummary: 'Final certified voter registry published. 25,000 eligible voter identities committed to roll Merkle tree root.',
        cryptographicInvariant: 'Root hash R_roll = SHA256(leaf_1 ... leaf_N) frozen. Zero voter identities or national IDs exposed.',
        responsibleAuthority: 'District Electoral Officer & Civil Registration Agency',
        legalBasis: 'Electoral Roll Rules 2026, Rule 22',
        technicalDetails: [
          '25,000 voter records hashed with Pedersen commitments.',
          'Roll Merkle tree depth = 16 leaves. Root hash anchored across all validator consensus nodes.',
          'Zero-knowledge proof circuits activated for anonymous membership inclusion.',
        ],
        actionLabel: 'Verify Roll Invariant',
        actionTab: 'voter',
      },
      {
        id: 'm-candidates',
        title: 'Candidate Scrutiny, Symbol Allocation & ECDSA Slates',
        phase: 'CONFIGURED',
        category: 'GOVERNANCE',
        scheduledTime: '2026-09-18T12:00:00Z',
        status: 'COMPLETED',
        shortSummary: '4 candidate profiles, party symbols, and cryptographic candidate public IDs cryptographically sealed.',
        cryptographicInvariant: 'Candidate ballot options sealed in smart contract storage; array indices cannot be manipulated.',
        responsibleAuthority: 'Returning Officer & Scrutiny Committee',
        legalBasis: 'Conduct of Elections Rules, Rule 10',
        technicalDetails: [
          'Candidate credentials verified and signed by returning officer P-256 key.',
          'High-resolution symbols hashed with SHA-256 to prevent ballot tampering or spoofing.',
          'Ballot order randomized using deterministic PRNG seeded by block hash #0.',
        ],
        actionLabel: 'View Candidate Slates',
        actionTab: 'results',
      },
      {
        id: 'm-polls-open',
        title: 'Genesis Block Mined: Network Polls Open',
        phase: 'VOTING_OPEN',
        category: 'VALIDATOR',
        scheduledTime: '2026-09-21T08:00:00Z',
        status: 'COMPLETED',
        shortSummary: 'Byzantine Fault Tolerant validator pool reaches 2/3 consensus. Live voting pipeline unlocked.',
        cryptographicInvariant: 'Genesis block #0 header timestamp verified; P-256 signature verification pipeline enabled.',
        responsibleAuthority: 'Decentralized Validator Council (3 Independent Quorum Nodes)',
        legalBasis: 'Electronic Voting Protocol Standards RFC-9421',
        technicalDetails: [
          '3-of-3 validator nodes operational: Node Alpha (ECI), Node Beta (Judiciary), Node Gamma (Academic).',
          'Voter portal enabled for WebCrypto ECDSA key pair generation and blind ballot commitments.',
          'Single-use nullifier registry opened for double-vote prevention.',
        ],
        actionLabel: 'Launch Voter Portal',
        actionTab: 'voter',
      },
      {
        id: 'm-midterm-audit',
        title: 'Mid-Election BFT Quorum & Shuffled Audit Checkpoint',
        phase: 'VOTING_OPEN',
        category: 'VALIDATOR',
        scheduledTime: '2026-09-23T12:00:00Z',
        status: now.getTime() >= new Date('2026-09-23T12:00:00Z').getTime() ? 'COMPLETED' : 'IN_PROGRESS',
        shortSummary: 'Validator consensus health verified: 100% block continuity, 0 fork attempts, 1,422 ballots verified in mempool.',
        cryptographicInvariant: 'Merkle audit chain verified unbroken; zero nullifier collisions detected across all validator states.',
        responsibleAuthority: 'Independent Technical Auditor & Cyber Defense Cell',
        legalBasis: 'Digital Voting Infrastructure Security Directive 2026',
        technicalDetails: [
          'Audit snapshot signed by 2/3 BFT consensus quorum.',
          'Automated Sybil cluster and deterministic nonce collision scans passed with 0 critical breaches.',
          'Real-time voter turnout and block production latency holding steady at < 20ms.',
        ],
        actionLabel: 'Inspect Audit Chain',
        actionTab: 'verify',
      },
      {
        id: 'm-close',
        title: 'Active Voting Deadline: Polls Close & Mempool Quorum Lock',
        phase: 'VOTING_CLOSED',
        category: 'VOTER',
        scheduledTime: '2026-09-25T18:00:00Z',
        status: now.getTime() >= new Date('2026-09-25T18:00:00Z').getTime() ? 'COMPLETED' : 'UPCOMING',
        shortSummary: 'Official cutoff for ballot submissions. Mempool rejects new transactions; pending queue processed to block inclusion.',
        cryptographicInvariant: 'Mempool quarantine enabled. No transaction with timestamp > deadline can be included in consensus blocks.',
        responsibleAuthority: 'Decentralized Consensus Engine & Returning Officer',
        legalBasis: 'Electoral Representation Act 2026, Section 56',
        technicalDetails: [
          'P-256 signature verification gateway closes to incoming client submissions.',
          'All outstanding in-flight transactions must be committed into Block N within 180 seconds grace window.',
          'Final nullifier set locked as immutable read-only state.',
        ],
        actionLabel: 'Cast Ballot Now',
        actionTab: 'voter',
      },
      {
        id: 'm-key-assembly',
        title: 'Threshold Decryption Ceremony: Key Custodians Assembly',
        phase: 'TALLYING',
        category: 'TALLY',
        scheduledTime: '2026-09-25T19:30:00Z',
        status: now.getTime() >= new Date('2026-09-25T19:30:00Z').getTime() ? 'COMPLETED' : 'UPCOMING',
        shortSummary: '3 independent key holders assemble to submit Shamir secret shares (2-of-3 threshold required) to unlock encrypted tally.',
        cryptographicInvariant: 'No single party possesses master decryption key; reconstruction strictly requires t=2 out of n=3 valid shares.',
        responsibleAuthority: 'Key Custodians: Chief Election Commissioner, High Court Chief Justice, Senior University Dean',
        legalBasis: 'Multi-Party Cryptographic Protocols in Elections Code 2026',
        technicalDetails: [
          'Custodian 1: Dr. Elena Vance (ECI Chief).',
          'Custodian 2: Justice H. R. Nariman (Judiciary Oversight).',
          'Custodian 3: Prof. A. Bhattacharya (IIT Bombay Cryptography Lab).',
          'Shamir polynomial interpolation computes joint ElGamal private decryption scalar without disclosing individual shares.',
        ],
        actionLabel: 'Inspect Custodian Threshold',
        actionTab: 'admin',
      },
      {
        id: 'm-homomorphic-tally',
        title: 'Homomorphic Ballot Tallying & ZK Batch Proof Generation',
        phase: 'TALLYING',
        category: 'TALLY',
        scheduledTime: '2026-09-25T21:00:00Z',
        status: now.getTime() >= new Date('2026-09-25T21:00:00Z').getTime() ? 'COMPLETED' : 'UPCOMING',
        shortSummary: 'Encrypted votes aggregated homomorphically without decrypting individual ballots. ZK proof validates mathematical sum.',
        cryptographicInvariant: 'Sum of encrypted choices equals decrypted totals: Prod(Enc(v_i)) = Enc(Sum(v_i)). Zero voter choices exposed.',
        responsibleAuthority: 'Automated Tabulation Engine & Public Verifier Cluster',
        legalBasis: 'Verifiable Electronic Voting Standards Annex A',
        technicalDetails: [
          'Additively homomorphic cipher addition computes candidate vote counts in ciphertext space.',
          'Zero-Knowledge Groth16 batch proof generated certifying that every ballot counted was cast by an eligible voter.',
          'Decryption performed exclusively on aggregate sum vector.',
        ],
        actionLabel: 'View Tabulation Circuit',
        actionTab: 'results',
      },
      {
        id: 'm-publish-results',
        title: 'Official Gazette Declaration & UN Observer Multi-Signature',
        phase: 'RESULTS_PUBLISHED',
        category: 'GOVERNANCE',
        scheduledTime: '2026-09-26T10:00:00Z',
        status: now.getTime() >= new Date('2026-09-26T10:00:00Z').getTime() ? 'COMPLETED' : 'UPCOMING',
        shortSummary: 'Final certified election results published. Certified signed report anchored with multi-party signatures.',
        cryptographicInvariant: 'Report signed with 3/3 cryptographic signatures (Returning Officer, Observer, System). Immutable audit ledger published.',
        responsibleAuthority: 'Election Commission Board & Independent UN Election Observers',
        legalBasis: 'Conduct of Elections Rules, Rule 64',
        technicalDetails: [
          'Official Certificate of Election issued to winning candidate with cryptographic seal.',
          'Public bulletin board updated with verifiable tally receipts for all 25,000 voters.',
          'Complete audit chain package exported to international archiving repositories.',
        ],
        actionLabel: 'View Official Results',
        actionTab: 'results',
      },
      {
        id: 'm-audit-window',
        title: 'Public Cryptographic Challenge & Recount Audit Window',
        phase: 'RESULTS_PUBLISHED',
        category: 'VALIDATOR',
        scheduledTime: '2026-10-03T18:00:00Z',
        status: now.getTime() >= new Date('2026-10-03T18:00:00Z').getTime() ? 'COMPLETED' : 'UPCOMING',
        shortSummary: '30-day window for public verification. Any citizen or political party can independently download and re-verify the full chain.',
        cryptographicInvariant: 'Independent mathematical replay of all Merkle branches produces identical candidate tally with 100% determinism.',
        responsibleAuthority: 'Public Electorate, Political Parties & Academic Researchers',
        legalBasis: 'Constitutional Representation Appeals Chapter IX',
        technicalDetails: [
          'Full chain JSON package downloadable with zero authentication required.',
          'Open-source CLI verifier allows offline verification on consumer laptops in under 15 seconds.',
          'Formal dispute arbitration smart contract active for challenge registration.',
        ],
        actionLabel: 'Public Verification Tool',
        actionTab: 'verify',
      },
    ];
  }, [now]);

  // Phase transition definitions for the lifecycle stepper
  const phases = useMemo(() => {
    return [
      {
        state: 'REGISTRATION_OPEN' as ElectionState,
        title: 'Voter Registration & Roll',
        shortDesc: 'Roll Merkle Tree Frozen',
        startLabel: 'Sep 10',
        endLabel: 'Sep 16',
        icon: Users,
        status: 'COMPLETED' as const,
        description: 'Electoral rolls verified, ZK-friendly Merkle tree roots computed and published.',
      },
      {
        state: 'VOTING_OPEN' as ElectionState,
        title: 'Active Voting & Consensus',
        shortDesc: 'WebCrypto ECDSA Submissions',
        startLabel: 'Sep 21, 08:00 UTC',
        endLabel: 'Sep 25, 18:00 UTC',
        icon: Vote,
        status: 'IN_PROGRESS' as const,
        description: 'Voters cast blinded encrypted ballots; 2/3 BFT validator nodes mine verifiable blocks.',
      },
      {
        state: 'VOTING_CLOSED' as ElectionState,
        title: 'Mempool Lock & Cutoff',
        shortDesc: 'Nullifier Registry Frozen',
        startLabel: 'Sep 25, 18:00 UTC',
        endLabel: 'Sep 25, 19:30 UTC',
        icon: Lock,
        status: 'UPCOMING' as const,
        description: 'Polls close, transaction mempool freezes, double-vote nullifier verification locks.',
      },
      {
        state: 'TALLYING' as ElectionState,
        title: 'Threshold Decryption',
        shortDesc: '2-of-3 Shamir Key Shards',
        startLabel: 'Sep 25, 19:30 UTC',
        endLabel: 'Sep 25, 23:00 UTC',
        icon: Key,
        status: 'UPCOMING' as const,
        description: 'Key holders submit threshold shares; homomorphic batch tally computes verified sum.',
      },
      {
        state: 'RESULTS_PUBLISHED' as ElectionState,
        title: 'Certified Gazette & Audit',
        shortDesc: 'Immutable Merkle Archive',
        startLabel: 'Sep 26, 10:00 UTC',
        endLabel: 'Oct 03, 18:00 UTC',
        icon: CheckCircle2,
        status: 'UPCOMING' as const,
        description: 'Official results gazetted, UN observers multi-sign, public challenge window opens.',
      },
    ];
  }, []);

  // Find the primary deadline we are counting down to
  const primaryDeadlineMilestone = useMemo(() => {
    // Look for the first milestone that is scheduled in the future
    const upcoming = milestones.find((m) => new Date(m.scheduledTime).getTime() > now.getTime());
    return upcoming || milestones[milestones.length - 1];
  }, [milestones, now]);

  // Selected milestone detail
  const selectedMilestone = useMemo(() => {
    return milestones.find((m) => m.id === selectedMilestoneId) || primaryDeadlineMilestone;
  }, [milestones, selectedMilestoneId, primaryDeadlineMilestone]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    if (activeCategory === 'ALL') return milestones;
    return milestones.filter((m) => m.category === activeCategory);
  }, [milestones, activeCategory]);

  // Real-time calculation of countdown components
  const deadlineCountdown = useMemo(() => {
    const targetMs = new Date(primaryDeadlineMilestone.scheduledTime).getTime();
    const diffMs = targetMs - now.getTime();

    if (diffMs <= 0) {
      return {
        isPassed: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        formattedString: 'Deadline Reached',
      };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      isPassed: false,
      days,
      hours,
      minutes,
      seconds,
      formattedString: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  }, [primaryDeadlineMilestone, now]);

  // Calculate overall voting phase progress percentage
  const votingProgressPercent = useMemo(() => {
    const votingStart = new Date('2026-09-21T08:00:00Z').getTime();
    const votingEnd = new Date('2026-09-25T18:00:00Z').getTime();
    const totalDuration = votingEnd - votingStart;
    const elapsed = Math.max(0, now.getTime() - votingStart);
    const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    return pct;
  }, [now]);

  // Helper formatting for ISO dates
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      dateStr: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      timeStr: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }),
      utcStr: date.toUTCString().replace('GMT', 'UTC'),
    };
  };

  const currentFormatted = formatDateTime(now.toISOString());
  const deadlineFormatted = formatDateTime(primaryDeadlineMilestone.scheduledTime);

  return (
    <section aria-labelledby="timeline-heading" className="space-y-6">
      {/* 1. Header & Context Control Bar */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-[#0A0D16] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
                Official Election Lifecycle & Invariants
              </span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="text-xs text-slate-400 font-mono">
                {primaryElection?.electionNumber || 'ELEC-2026-MUM-01'}
              </span>
            </div>

            <h2 id="timeline-heading" className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              Election Timeline & Phase Transitions
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Cryptographic schedule tracking: real-time deadline countdowns, Byzantine quorum checkpoints,
              and multi-party threshold decryption milestones.
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-3 flex-wrap font-mono">
              <span className="text-slate-300 font-semibold">
                {primaryElection?.name || '2026 Mumbai South Municipal Council Election'}
              </span>
              <span>•</span>
              <span>Constituency: <strong className="text-cyan-300">{primaryElection?.constituencyName || 'Mumbai South'}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> 2/3 BFT Quorum Enforced
              </span>
            </div>
          </div>

          {/* View Mode Segmented Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode('TIMELINE')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TIMELINE'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chronological Feed
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PHASE_MATRIX')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'PHASE_MATRIX'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Phase Matrix
              </button>
              <button
                type="button"
                onClick={() => setViewMode('DEADLINES_ONLY')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'DEADLINES_ONLY'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Deadlines
              </button>
            </div>
          </div>
        </div>

        {/* 2. Hero Deadline Countdown Widget */}
        <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
            {/* Left: Milestone Target Information */}
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Next Critical Deadline
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Target: {primaryDeadlineMilestone.title}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {primaryDeadlineMilestone.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {primaryDeadlineMilestone.shortSummary}
              </p>

              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                <span>Cutoff: <strong className="text-white">{deadlineFormatted.dateStr} at {deadlineFormatted.timeStr}</strong></span>
                <span>•</span>
                <span className="text-cyan-300 font-bold">{deadlineFormatted.utcStr}</span>
              </div>
            </div>

            {/* Right: High-Precision Live Countdown Clock */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
              <div className="grid grid-cols-4 gap-2.5 text-center w-full sm:w-auto">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 min-w-[64px] sm:min-w-[76px]">
                  <span className="block text-2xl sm:text-3xl font-mono font-black text-white">
                    {String(deadlineCountdown.days).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase mt-0.5">Days</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 min-w-[64px] sm:min-w-[76px]">
                  <span className="block text-2xl sm:text-3xl font-mono font-black text-cyan-300">
                    {String(deadlineCountdown.hours).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase mt-0.5">Hours</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 min-w-[64px] sm:min-w-[76px]">
                  <span className="block text-2xl sm:text-3xl font-mono font-black text-cyan-300">
                    {String(deadlineCountdown.minutes).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase mt-0.5">Mins</span>
                </div>

                <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-2.5 min-w-[64px] sm:min-w-[76px] shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <span className="block text-2xl sm:text-3xl font-mono font-black text-cyan-400 animate-pulse">
                    {String(deadlineCountdown.seconds).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-mono text-cyan-300 uppercase mt-0.5">Secs</span>
                </div>
              </div>

              {/* Action button corresponding to next deadline */}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(primaryDeadlineMilestone.actionTab || 'voter')}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 text-xs font-black tracking-tight shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shrink-0"
                >
                  <Vote className="h-4 w-4" />
                  <span>{primaryDeadlineMilestone.actionLabel || 'Take Action'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Time simulation bar (For Testing & Auditing Deadlines) */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-mono text-[11px]">Simulated Clock:</span>
              <span className="font-mono text-white text-[11px]">
                {currentFormatted.dateStr} {currentFormatted.timeStr}
              </span>
              {timeShiftHours !== 0 && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                  {timeShiftHours > 0 ? `+${timeShiftHours}h offset` : `${timeShiftHours}h offset`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-500">Test Scenarios:</span>
              <button
                type="button"
                onClick={() => setTimeShiftHours(0)}
                className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  timeShiftHours === 0
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Live (Sep 23)
              </button>
              <button
                type="button"
                onClick={() => setTimeShiftHours(51)} // Fast forward to close (Sep 25 16:11, ~1.8h before close)
                className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  timeShiftHours === 51
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Approaching Close (&lt;2h)
              </button>
              <button
                type="button"
                onClick={() => setTimeShiftHours(55)} // Sep 25 20:11 (During tallying & threshold key assembly)
                className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  timeShiftHours === 55
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Threshold Tallying (Sep 25)
              </button>
              <button
                type="button"
                onClick={() => setTimeShiftHours(72)} // Sep 26 (Results Published)
                className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  timeShiftHours === 72
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Results Published (Sep 26)
              </button>
            </div>
          </div>
        </div>

        {/* 3. Five-Phase Lifecycle Stepper */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Cryptographic Phase Progression
              </h4>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Active Voting Phase: <strong className="text-cyan-400">{votingProgressPercent}% Elapsed</strong>
            </div>
          </div>

          {/* Phase cards / horizontal stepped tracker */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {phases.map((phase, idx) => {
              const IconComponent = phase.icon;
              const isCurrent = idx === 1; // VOTING_OPEN is current
              const isPast = idx < 1;
              const isUpcoming = idx > 1;

              return (
                <div
                  key={phase.state}
                  onClick={() => setActivePhaseIndex(idx)}
                  className={`relative rounded-2xl p-4 border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-cyan-500 bg-gradient-to-b from-cyan-950/40 to-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/50'
                      : isPast
                      ? 'border-emerald-500/30 bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-500/50'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      PHASE 0{idx + 1}
                    </span>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 animate-pulse">
                        <Radio className="h-3 w-3" /> Live
                      </span>
                    ) : isPast ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 mt-2.5">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : isPast
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">
                        {phase.title}
                      </h5>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {phase.shortDesc}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{phase.startLabel}</span>
                    <span>→</span>
                    <span>{phase.endLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar across lifecycle */}
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-2">
            <div
              className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-400 h-full transition-all duration-700"
              style={{ width: `${30 + votingProgressPercent * 0.4}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Main Body: Timeline Feed or Phase Matrix */}
      {viewMode === 'TIMELINE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Middle: Chronological Milestones Feed (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-semibold text-slate-300">Filter Milestones:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'VOTER', 'VALIDATOR', 'TALLY', 'GOVERNANCE'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                      activeCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'All (10)' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Milestones Vertical Chronology */}
            <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-slate-800">
              {filteredMilestones.map((milestone, idx) => {
                const isSelected = selectedMilestoneId === milestone.id;
                const dateMeta = formatDateTime(milestone.scheduledTime);
                const isCompleted = milestone.status === 'COMPLETED';
                const isInProgress = milestone.status === 'IN_PROGRESS';
                const isUpcoming = milestone.status === 'UPCOMING';

                return (
                  <div
                    key={milestone.id}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                    className={`relative rounded-2xl border transition-all cursor-pointer p-5 ${
                      isSelected
                        ? 'border-cyan-500/70 bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/30 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/40'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    {/* Circle marker on the timeline line */}
                    <div
                      className={`absolute -left-[30px] sm:-left-[38px] top-6 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'border-emerald-400 bg-emerald-950 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                          : isInProgress
                          ? 'border-cyan-400 bg-cyan-950 text-cyan-300 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.7)]'
                          : 'border-slate-700 bg-slate-950 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      ) : isInProgress ? (
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {milestone.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Phase: <strong className="text-slate-300">{milestone.phase}</strong>
                          </span>
                          <span className="text-slate-700 hidden sm:inline">·</span>
                          <span className="text-[11px] font-mono text-cyan-400">
                            {dateMeta.dateStr} at {dateMeta.timeStr}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-white mt-1.5 flex items-center gap-2">
                          <span>{milestone.title}</span>
                          {milestone.id === 'm-close' && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                              Next Active Deadline
                            </span>
                          )}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCompleted ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                          </span>
                        ) : isInProgress ? (
                          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1 animate-pulse">
                            <Activity className="h-3.5 w-3.5" /> In Progress
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                            <Hourglass className="h-3.5 w-3.5 text-slate-500" /> Upcoming
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {milestone.shortSummary}
                    </p>

                    {/* Invariant pill line */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-300">
                      <Lock className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200">Cryptographic Invariant: </strong>
                        <span className="text-slate-400 font-mono">{milestone.cryptographicInvariant}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Authority: <strong className="text-slate-400">{milestone.responsibleAuthority}</strong></span>
                      <span className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                        Inspect Specification →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Milestone Protocol Inspector (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-20 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Protocol Specification
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                  {selectedMilestone.phase}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedMilestone.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Scheduled: {formatDateTime(selectedMilestone.scheduledTime).utcStr}
                </p>
              </div>

              {/* Status Banner */}
              <div className="rounded-xl p-3 bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Milestone State:</span>
                {selectedMilestone.status === 'COMPLETED' ? (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified Complete
                  </span>
                ) : selectedMilestone.status === 'IN_PROGRESS' ? (
                  <span className="text-cyan-400 font-mono font-bold flex items-center gap-1 animate-pulse">
                    <Activity className="h-3.5 w-3.5" /> Currently Executing
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Hourglass className="h-3.5 w-3.5" /> Awaiting Scheduled Trigger
                  </span>
                )}
              </div>

              {/* Legal & Governance Basis */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
                  Legal & Statutory Basis
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-violet-400 inline mr-1.5" />
                  {selectedMilestone.legalBasis}
                </div>
              </div>

              {/* Cryptographic Invariant Enforced */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
                  Mathematical Invariant
                </span>
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 font-mono leading-relaxed">
                  {selectedMilestone.cryptographicInvariant}
                </div>
              </div>

              {/* Technical Safeguards */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
                  Automated Technical Safeguards
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedMilestone.technicalDetails.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-cyan-400 font-bold shrink-0">✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Responsible Authority */}
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span className="block text-[11px] text-slate-500 font-mono">Signatory Authority:</span>
                <strong className="text-slate-200">{selectedMilestone.responsibleAuthority}</strong>
              </div>

              {/* Direct Action Link */}
              {onNavigate && selectedMilestone.actionTab && (
                <button
                  type="button"
                  onClick={() => onNavigate(selectedMilestone.actionTab || 'voter')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  <span>{selectedMilestone.actionLabel || 'Inspect in Portal'}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Alternative View: Phase Transition Matrix */}
      {viewMode === 'PHASE_MATRIX' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 overflow-x-auto shadow-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-3 px-4">Phase State</th>
                <th className="py-3 px-4">Target Window</th>
                <th className="py-3 px-4">Consensus Threshold</th>
                <th className="py-3 px-4">Permitted Network Operations</th>
                <th className="py-3 px-4">Frozen / Quarantined</th>
                <th className="py-3 px-4">Cryptographic Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  DRAFT & CONFIGURED
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">Pre-Sep 10</td>
                <td className="py-3.5 px-4 text-slate-300">3-of-3 Commission Signatures</td>
                <td className="py-3.5 px-4 text-slate-400">Candidate filing, curve generation, parameter setup</td>
                <td className="py-3.5 px-4 text-slate-500">Ballot submission locked</td>
                <td className="py-3.5 px-4 text-cyan-300 font-mono">Alt-BN128 CRS Setup</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  REGISTRATION_OPEN
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">Sep 10 - Sep 16</td>
                <td className="py-3.5 px-4 text-slate-300">DEO & Returning Officer</td>
                <td className="py-3.5 px-4 text-slate-400">Roll verification, ZK credential generation</td>
                <td className="py-3.5 px-4 text-slate-500">Voting mempool disabled</td>
                <td className="py-3.5 px-4 text-cyan-300 font-mono">Merkle Root R_roll Locked</td>
              </tr>
              <tr className="bg-cyan-950/20 hover:bg-cyan-950/30">
                <td className="py-3.5 px-4 font-bold text-cyan-300 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  VOTING_OPEN (Active)
                </td>
                <td className="py-3.5 px-4 font-mono text-white font-bold">Sep 21 - Sep 25</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold">2/3 BFT Validator Quorum</td>
                <td className="py-3.5 px-4 text-white">Ballot submission, zero-knowledge verification, mining</td>
                <td className="py-3.5 px-4 text-slate-400">Tallying locked, rolls immutable</td>
                <td className="py-3.5 px-4 text-cyan-300 font-mono">Nullifier & P-256 Signatures</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-amber-300 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  VOTING_CLOSED
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">Sep 25, 18:00 UTC</td>
                <td className="py-3.5 px-4 text-slate-300">Automated Network Cutoff</td>
                <td className="py-3.5 px-4 text-slate-400">In-flight block finalization, mempool drainage</td>
                <td className="py-3.5 px-4 text-rose-400">All new ballot submissions rejected</td>
                <td className="py-3.5 px-4 text-cyan-300 font-mono">Mempool Quarantine Active</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-violet-300 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                  TALLYING
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">Sep 25, 19:30 UTC</td>
                <td className="py-3.5 px-4 text-slate-300">2-of-3 Key Custodians</td>
                <td className="py-3.5 px-4 text-slate-400">Shamir share release, homomorphic sum, ZK batch proof</td>
                <td className="py-3.5 px-4 text-rose-400">No single party can view ballot choice</td>
                <td className="py-3.5 px-4 text-cyan-300 font-mono">Shamir Secret Sharing (t=2, n=3)</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-emerald-300 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  RESULTS_PUBLISHED
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">Sep 26 - Oct 03</td>
                <td className="py-3.5 px-4 text-slate-300">3/3 Observer Multi-Sign</td>
                <td className="py-3.5 px-4 text-slate-400">Public verification, offline replay, recount disputes</td>
                <td className="py-3.5 px-4 text-slate-500">Database sealed to read-only</td>
                <td className="py-3.5 px-4 text-cyan-300 font-mono">Final Block Merkle Root Gazetted</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Alternative View: Deadlines Summary Only */}
      {viewMode === 'DEADLINES_ONLY' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-cyan-400 font-bold">VOTER DEADLINE</span>
              <span className="text-amber-400 font-bold">In 2 Days</span>
            </div>
            <h4 className="text-base font-bold text-white">Ballot Submission Cutoff</h4>
            <p className="text-xs text-slate-300">
              Voters must submit encrypted ballots before Friday, Sep 25, 18:00 UTC. The mempool closes permanently at this time.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Sep 25, 18:00 UTC</span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('voter')}
                  className="text-cyan-400 font-bold hover:underline cursor-pointer"
                >
                  Cast Ballot →
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-violet-400 font-bold">CUSTODIAN DEADLINE</span>
              <span className="text-slate-400">In 2 Days, 6h</span>
            </div>
            <h4 className="text-base font-bold text-white">Threshold Key Custodians Assembly</h4>
            <p className="text-xs text-slate-300">
              2 of 3 designated key holders must enter cryptographic shards to decrypt the aggregated sum by Friday, Sep 25, 19:30 UTC.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Sep 25, 19:30 UTC</span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="text-violet-400 font-bold hover:underline cursor-pointer"
                >
                  Inspect Panel →
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-bold">PUBLIC AUDIT DEADLINE</span>
              <span className="text-slate-400">In 3 Days</span>
            </div>
            <h4 className="text-base font-bold text-white">Certified Results Publication</h4>
            <p className="text-xs text-slate-300">
              Final verified results and observer multi-signatures will be published to the public bulletin board on Saturday, Sep 26, 10:00 UTC.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Sep 26, 10:00 UTC</span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('results')}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Results Board →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
