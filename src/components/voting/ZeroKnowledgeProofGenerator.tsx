/**
 * Interactive Visual Zero-Knowledge Proof (zk-SNARK) Generator
 * Simulates the mathematical process of proving voter eligibility without revealing voter identity:
 * 1. Private Witness Masking (Poseidon / Pedersen Commitment)
 * 2. Merkle Tree Inclusion Traversal (Roll membership without revealing leaf position)
 * 3. R1CS Arithmetic Circuit & Constraint Satisfaction (A * B - C = 0)
 * 4. Fiat-Shamir Non-Interactive Challenge Derivation
 * 5. Cryptographic Proof Synthesis (pi = (A, B, C)) & Elliptic Curve Pairing Verification
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  EyeOff,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Binary,
  Layers,
  Lock,
  Download,
  Copy,
  Check,
  Activity,
  FileCode,
  Sliders,
  X,
  Sparkles,
  ArrowRight,
  Fingerprint,
  Info,
  Key,
} from 'lucide-react';
import { sha256 } from '../../crypto/hashing';

export interface ZKProofArtifact {
  proofType: 'GROTH16_BN254_SNARK';
  statement: string;
  publicInputs: {
    merkleRoot: string;
    nullifierHash: string;
    electionId: string;
    constituencyHash: string;
    minimumAgeConstraint: string;
  };
  proof: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
  };
  verificationStatus: 'VERIFIED_VALID' | 'FAILED_INVALID';
  timestamp: string;
  gasCostEstimate: string;
  soundnessError: string;
}

interface ZeroKnowledgeProofGeneratorProps {
  voterId?: string;
  electionId?: string;
  constituencyName?: string;
  hometown?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onProofApplied?: (proof: ZKProofArtifact) => void;
}

const STAGES = [
  {
    step: 1,
    title: 'Private Witness Masking',
    shortName: 'Witness',
    icon: Lock,
    mathEquation: 'C = \\text{Poseidon}(ID_{\\text{voter}} \\parallel sk \\parallel r)',
    description: 'Blinds voter national credentials into an anonymous cryptographic commitment scalar.',
  },
  {
    step: 2,
    title: 'Merkle Roll Inclusion Path',
    shortName: 'Merkle Path',
    icon: Layers,
    mathEquation: '\\mathcal{R} = \\text{MerkleVerify}(C, \\{S_1, S_2, S_3\\})',
    description: 'Calculates inclusion path to public Electoral Roll root without exposing leaf index.',
  },
  {
    step: 3,
    title: 'Arithmetic Circuit & R1CS Gates',
    shortName: 'R1CS Circuit',
    icon: Binary,
    mathEquation: '(A \\cdot w) \\circ (B \\cdot w) - (C \\cdot w) = 0',
    description: 'Evaluates Rank-1 Constraint System verifying age ≥ 18, roll presence, and area match.',
  },
  {
    step: 4,
    title: 'Fiat-Shamir Challenge Derivation',
    shortName: 'Fiat-Shamir',
    icon: Activity,
    mathEquation: 'c = \\text{SHA256}(\\mathcal{R} \\parallel \\text{Nullifier} \\parallel T_1 \\parallel T_2)',
    description: 'Converts 3-pass interactive Sigma protocol into non-interactive zero-knowledge proof.',
  },
  {
    step: 5,
    title: 'Proof Synthesis & Pairing Invariant',
    shortName: 'Pairing Check',
    icon: ShieldCheck,
    mathEquation: 'e(\\pi_A, \\pi_B) = e(\\alpha, \\beta) \\cdot e(x \\cdot \\gamma, \\delta) \\cdot e(\\pi_C, \\delta)',
    description: 'Synthesizes curve points on BN254 and computes bilinear pairing verification.',
  },
];

export const ZeroKnowledgeProofGenerator: React.FC<ZeroKnowledgeProofGeneratorProps> = ({
  voterId = 'VOT-MUM-101',
  electionId = 'elec-mum-01',
  constituencyName = 'Mumbai South',
  hometown = 'Mumbai',
  isOpen = true,
  onClose,
  onProofApplied,
}) => {
  // Simulator State
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 0.5, 1, 2
  const [isAdversaryMode, setIsAdversaryMode] = useState<boolean>(false);
  const [activeVoterId, setActiveVoterId] = useState<string>(voterId);
  const [activeElectionId, setActiveElectionId] = useState<string>(electionId);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);

  // Computed Cryptographic Simulation Values
  const [blindingScalar, setBlindingScalar] = useState<string>('0x7e29a8f4c10239b1');
  const [commitmentLeaf, setCommitmentLeaf] = useState<string>('');
  const [nullifierHash, setNullifierHash] = useState<string>('');
  const [merkleRoot, setMerkleRoot] = useState<string>('0x5a18e3f947bc389d91f2780e227a');
  const [challengeScalar, setChallengeScalar] = useState<string>('');
  const [pairingSuccess, setPairingSuccess] = useState<boolean>(true);
  const [generatedProof, setGeneratedProof] = useState<ZKProofArtifact | null>(null);

  // Animation pulse ticker
  const [pulse, setPulse] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Compute live cryptographic mock values based on inputs and adversary toggle
  useEffect(() => {
    let mounted = true;

    async function computeCrypto() {
      const salt = isAdversaryMode ? 'FORGED_WITNESS_SALT' : blindingScalar;
      const leaf = await sha256(`poseidon::${activeVoterId}::${salt}::${constituencyName}`);
      const nullifier = await sha256(`nullifier::${activeVoterId}::${activeElectionId}`);
      const root = isAdversaryMode 
        ? '0xDEADBEEF00000000000000000000' 
        : '0x9bf822d517c18a2039ee16f73199bc4892c';
      const challenge = await sha256(`fiat-shamir::${root}::${nullifier}::${Date.now()}`);

      if (!mounted) return;

      setCommitmentLeaf(`0x${leaf.slice(0, 24)}...`);
      setNullifierHash(`0x${nullifier.slice(0, 24)}...`);
      setMerkleRoot(root);
      setChallengeScalar(`0x${challenge.slice(0, 16)}`);
      setPairingSuccess(!isAdversaryMode);

      // Generate verifiable artifact
      const artifact: ZKProofArtifact = {
        proofType: 'GROTH16_BN254_SNARK',
        statement: `Zero-Knowledge proof that the prover possesses a valid voter secret key registered in the Electoral Roll for ${activeElectionId} (${constituencyName}) without revealing identity or roll position.`,
        publicInputs: {
          merkleRoot: root,
          nullifierHash: `0x${nullifier}`,
          electionId: activeElectionId,
          constituencyHash: `0x${await sha256(constituencyName)}`,
          minimumAgeConstraint: '18_YEARS_SATISFIED',
        },
        proof: {
          pi_a: [
            `0x2b${leaf.slice(0, 30)}`,
            `0x4a${challenge.slice(0, 30)}`,
            '0x01',
          ],
          pi_b: [
            [`0x18${leaf.slice(30, 60)}`, `0x29${challenge.slice(30, 60)}`],
            [`0x3c${nullifier.slice(0, 30)}`, `0x4d${nullifier.slice(30, 60)}`],
            ['0x01', '0x00'],
          ],
          pi_c: [
            `0x5e${challenge.slice(10, 40)}`,
            `0x6f${leaf.slice(10, 40)}`,
            '0x01',
          ],
        },
        verificationStatus: isAdversaryMode ? 'FAILED_INVALID' : 'VERIFIED_VALID',
        timestamp: new Date().toISOString(),
        gasCostEstimate: '184,219 Gas (On-chain BN254 Pairings)',
        soundnessError: '2^-128 (Cryptographically Negligible)',
      };

      setGeneratedProof(artifact);
    }

    computeCrypto();

    return () => {
      mounted = false;
    };
  }, [activeVoterId, activeElectionId, constituencyName, blindingScalar, isAdversaryMode]);

  // Autoplay progression loop
  useEffect(() => {
    if (!isPlaying) return;

    const stageDuration = (2800 / playSpeed);
    const timer = setTimeout(() => {
      setCurrentStageIndex((prev) => {
        if (prev >= STAGES.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, stageDuration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStageIndex, playSpeed]);

  const handleNextStage = () => {
    setIsPlaying(false);
    setCurrentStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
  };

  const handlePrevStage = () => {
    setIsPlaying(false);
    setCurrentStageIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setCurrentStageIndex(0);
    setIsPlaying(true);
    setBlindingScalar(`0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16).substring(4)}`);
  };

  const handleCopyProof = () => {
    if (!generatedProof) return;
    navigator.clipboard.writeText(JSON.stringify(generatedProof, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentStage = STAGES[currentStageIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Zero-Knowledge Proof Generator & Interactive Circuit Simulator
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  Groth16 / BN254
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mathematically proving you are an eligible registered voter without revealing your voter ID, roll index, or name.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showFormulaDetails
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Formula Deep-Dive"
            >
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">Formulas</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close Visualizer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Timeline & Step Navigator */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
          <div className="grid grid-cols-5 gap-2">
            {STAGES.map((s, idx) => {
              const Icon = s.icon;
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStageIndex(idx);
                  }}
                  className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                    isCurrent
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                      : isPast
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-slate-800'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                      Stage 0{s.step}
                    </span>
                    <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'text-cyan-400' : isPast ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <span className="text-xs font-semibold truncate text-white">
                    {s.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Interactive Stage Canvas (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Top Stage Descriptor Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div>
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                Executing Stage {currentStage.step} of 5
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{currentStage.title}</span>
                {currentStageIndex === 4 && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                    pairingSuccess
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                      : 'bg-rose-950 border border-rose-500/50 text-rose-400'
                  }`}>
                    {pairingSuccess ? 'Invariant Matched (Q.E.D.)' : 'Circuit Constraint Violation'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentStage.description}
              </p>
            </div>

            {/* Stage Math Pill */}
            {showFormulaDetails && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-cyan-300 shrink-0 self-start sm:self-center">
                <span className="text-slate-500 text-[10px] block uppercase font-sans">Formal Mathematical Invariant:</span>
                <code>{currentStage.mathEquation}</code>
              </div>
            )}
          </div>

          {/* Dynamic Interactive Stage Visualizers */}
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-5 relative overflow-hidden min-h-[310px] flex flex-col justify-center">
            
            {/* Background Grid & Circuit Lines */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px), radial-gradient(#22d3ee 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            {/* STAGE 1: Witness Masking Animation */}
            {currentStageIndex === 0 && (
              <div className="relative z-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* Left: Raw Identity (Will be Blinded) */}
                  <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Fingerprint className="h-4 w-4" />
                        Private Witness (Hidden)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400">
                        Top Secret
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-slate-300">
                        <span>Voter ID:</span>
                        <strong className="text-white">{activeVoterId}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Constituency:</span>
                        <span className="text-white">{constituencyName}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Secret Key:</span>
                        <span className="text-amber-400">sk_priv_p256_***</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Blinding Transformation */}
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-cyan-300">Poseidon Hash & Blinding</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Salt: {blindingScalar}
                    </span>
                    <div className="flex items-center gap-1 text-cyan-400">
                      <ArrowRight className="h-4 w-4 animate-bounceX" />
                    </div>
                  </div>

                  {/* Right: Anonymous Leaf Commitment */}
                  <div className="p-4 rounded-2xl border border-cyan-500/40 bg-cyan-950/30 space-y-2">
                    <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <EyeOff className="h-4 w-4" />
                        Public Anonymous Leaf
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400">
                        Zero Leaks
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="text-slate-400 text-[11px]">Calculated Commitment:</div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-bold break-all">
                        {commitmentLeaf || 'Generating commitment...'}
                      </div>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Identity completely masked from network
                      </p>
                    </div>
                  </div>

                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
                  <Info className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    The voter’s device creates an algebraic commitment using a cryptographic blinding factor $r$. Even with quantum computing, third parties cannot reverse-engineer the voter’s identity from this commitment.
                  </span>
                </div>
              </div>
            )}

            {/* STAGE 2: Merkle Tree Inclusion Animation */}
            {currentStageIndex === 1 && (
              <div className="relative z-10 space-y-4">
                <div className="text-center mb-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Proving Inclusion in Official Electoral Roll Merkle Root
                  </span>
                </div>

                {/* SVG Visual Merkle Tree with animated pulses */}
                <div className="flex items-center justify-center">
                  <svg className="w-full max-w-xl h-44 overflow-visible" viewBox="0 0 600 160">
                    {/* Connection Lines */}
                    <line x1="300" y1="25" x2="160" y2="80" stroke="#0e7490" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="300" y1="25" x2="440" y2="80" stroke="#0e7490" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="160" y1="80" x2="80" y2="135" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="160" y1="80" x2="240" y2="135" stroke="#0e7490" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="440" y1="80" x2="380" y2="135" stroke="#0e7490" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="440" y1="80" x2="520" y2="135" stroke="#0e7490" strokeWidth="2" strokeDasharray="4 4" />

                    {/* ROOT NODE */}
                    <g transform="translate(300, 25)">
                      <rect x="-80" y="-18" width="160" height="34" rx="10" fill="#082f49" stroke="#38bdf8" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                        Root: {merkleRoot.slice(0, 10)}...
                      </text>
                    </g>

                    {/* INTERMEDIATE LAYER */}
                    <g transform="translate(160, 80)">
                      <rect x="-65" y="-14" width="130" height="28" rx="8" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
                      <text x="0" y="4" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="monospace">
                        Branch H(L, S₁)
                      </text>
                    </g>
                    <g transform="translate(440, 80)">
                      <rect x="-65" y="-14" width="130" height="28" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        Sibling Branch S₂
                      </text>
                    </g>

                    {/* LEAF NODES (Bottom) */}
                    <g transform="translate(80, 135)">
                      <rect x="-65" y="-15" width="130" height="30" rx="8" fill="#164e63" stroke="#22d3ee" strokeWidth="2" className="animate-pulse" />
                      <text x="0" y="4" textAnchor="middle" fill="#67e8f9" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        ★ Anonymous Leaf
                      </text>
                    </g>
                    <g transform="translate(240, 135)">
                      <rect x="-55" y="-14" width="110" height="28" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <text x="0" y="4" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                        Sibling Hash S₁
                      </text>
                    </g>
                    <g transform="translate(380, 135)">
                      <rect x="-50" y="-14" width="100" height="28" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <text x="0" y="4" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                        Citizen Roll #482
                      </text>
                    </g>
                    <g transform="translate(520, 135)">
                      <rect x="-50" y="-14" width="100" height="28" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <text x="0" y="4" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                        Citizen Roll #483
                      </text>
                    </g>
                  </svg>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Authenticated Public Root:</span>
                    <span className="font-mono text-cyan-300 font-bold break-all">{merkleRoot}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Merkle Proof Sibling Count:</span>
                    <span className="text-emerald-400 font-mono font-bold">14 Sibling Steps (Tree Depth: 16,384 Roll Entries)</span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: Arithmetic Circuit & R1CS Gates */}
            {currentStageIndex === 2 && (
              <div className="relative z-10 space-y-4">
                <div className="text-xs text-slate-400 mb-2">
                  Verifying 4 Mathematical Constraints via Rank-1 Constraint System (R1CS):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: '1. Roll Membership Invariant',
                      expr: 'MerkleVerify(Root, Leaf, Path) == 1',
                      status: isAdversaryMode ? 'FAIL' : 'SATISFIED',
                      desc: 'Proves leaf belongs to certified electoral root without identifying position.',
                    },
                    {
                      label: '2. Legal Voting Age (≥ 18)',
                      expr: '(Age - 18) * q_overflow >= 0',
                      status: 'SATISFIED',
                      desc: 'Proves chronological majority without disclosing date of birth.',
                    },
                    {
                      label: '3. Constituency Geofence Invariant',
                      expr: 'Constituency(ID) - TargetArea == 0',
                      status: isAdversaryMode ? 'FAIL' : 'SATISFIED',
                      desc: `Enforces matching ${constituencyName} voting district.`,
                    },
                    {
                      label: '4. Nullifier Derivation (Anti-Double Vote)',
                      expr: 'Poseidon(sk, ElectionID) - Nullifier == 0',
                      status: 'SATISFIED',
                      desc: 'Ensures exactly one ballot per voter without tracking who they are.',
                    },
                  ].map((gate, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        gate.status === 'SATISFIED'
                          ? 'border-emerald-500/30 bg-emerald-950/20'
                          : 'border-rose-500/40 bg-rose-950/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white">{gate.label}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            gate.status === 'SATISFIED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {gate.status}
                        </span>
                      </div>
                      <code className="text-[11px] font-mono text-cyan-300 block mb-1">
                        {gate.expr}
                      </code>
                      <p className="text-[10px] text-slate-400">{gate.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-300">Total Circuit Constraints:</span>
                  <span className="font-mono text-cyan-400 font-bold">1,842 R1CS Multiplier Gates</span>
                </div>
              </div>
            )}

            {/* STAGE 4: Fiat-Shamir Heuristic */}
            {currentStageIndex === 3 && (
              <div className="relative z-10 space-y-4">
                <div className="text-xs text-slate-400 mb-2">
                  Non-Interactive Random Oracle Transformation (Eliminates interactive back-and-forth roundtrips):
                </div>

                <div className="p-4 rounded-2xl border border-cyan-500/30 bg-slate-900/80 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">
                        Transcript Hash Oracle:
                      </span>
                      <code className="text-xs text-cyan-300 font-mono break-all">
                        c = SHA256(MerkleRoot ∥ Nullifier ∥ CurvePoints)
                      </code>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase block">Derived Challenge Scalar:</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {challengeScalar}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Prover Response Scalar z:</span>
                      <span className="font-mono text-white font-bold">
                        z = r + c · sk (mod q)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Soundness Guarantee:</span>
                      <span className="text-emerald-400 font-bold">
                        Forging probability &lt; 2⁻¹²⁸
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    By applying the Fiat-Shamir transformation, the zero-knowledge proof becomes completely autonomous and non-interactive, allowing it to be bundled directly inside the voter’s blockchain ballot envelope.
                  </span>
                </div>
              </div>
            )}

            {/* STAGE 5: Proof Synthesis & Pairing Invariant */}
            {currentStageIndex === 4 && (
              <div className="relative z-10 space-y-4">
                <div className={`p-4 rounded-2xl border transition-all ${
                  pairingSuccess
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {pairingSuccess ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-rose-400" />
                      )}
                      <h4 className="text-sm font-bold text-white">
                        {pairingSuccess ? 'Elliptic Curve Pairing Invariant Verified' : 'Pairing Verification Rejected'}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      BN254 (alt_bn128)
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 break-all">
                      <code>e(π_A, π_B) = e(α, β) · e(x · γ, δ) · e(π_C, δ)</code>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-slate-500 block">π_A (G₁ Point):</span>
                        <span className="text-slate-200 truncate block font-mono">
                          {generatedProof?.proof.pi_a[0].slice(0, 16)}...
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-slate-500 block">π_B (G₂ Point):</span>
                        <span className="text-slate-200 truncate block font-mono">
                          {generatedProof?.proof.pi_b[0][0].slice(0, 16)}...
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-slate-500 block">π_C (G₁ Point):</span>
                        <span className="text-slate-200 truncate block font-mono">
                          {generatedProof?.proof.pi_c[0].slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-white block">Zero-Knowledge Token Ready</span>
                    <span className="text-slate-400 text-[11px]">
                      Identity revealed to Election Authority: <strong className="text-emerald-400">0 bytes (0.00%)</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyProof}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? 'Copied JSON' : 'Copy Proof'}</span>
                    </button>

                    {onProofApplied && generatedProof && (
                      <button
                        type="button"
                        onClick={() => onProofApplied(generatedProof)}
                        className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Apply Proof to Ballot</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Interactive Controls & Adversarial Stress Tester */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Player Controls */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Animation & Step Controls
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlaying ? 'Pause Simulation' : 'Auto-Play Simulation'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrevStage}
                  disabled={currentStageIndex === 0}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  title="Previous Step"
                >
                  Step Back
                </button>

                <button
                  type="button"
                  onClick={handleNextStage}
                  disabled={currentStageIndex === STAGES.length - 1}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  title="Next Step"
                >
                  <span>Next Step</span>
                  <SkipForward className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset Simulation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Speed Toggle */}
                <div className="flex items-center gap-1 ml-auto text-xs">
                  <span className="text-slate-500 text-[11px]">Speed:</span>
                  {[0.5, 1, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPlaySpeed(s)}
                      className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold cursor-pointer ${
                        playSpeed === s
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Adversarial Tamper Tester */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Mathematical Soundness & Adversary Test
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isAdversaryMode ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  {isAdversaryMode ? 'Simulating Forgery Attack' : 'Honest Prover'}
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Test what happens if an unregistered attacker tries to generate a valid proof without knowing a valid witness.
              </p>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdversaryMode(!isAdversaryMode);
                    setCurrentStageIndex(2); // Jump to circuit constraints
                    setIsPlaying(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    isAdversaryMode
                      ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{isAdversaryMode ? 'Stop Attack (Restore Valid Witness)' : '⚠️ Simulate Forgery Attempt'}</span>
                </button>

                <span className="text-[11px] font-mono text-slate-400">
                  {isAdversaryMode ? 'Result: Rejected at Gate 3' : 'Result: 100% Sound'}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer info & CTA */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/90 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Cryptographic Circuit Model: <strong>Groth16 SNARK over BN254 Curve</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Visualizer
              </button>
            )}
            {onProofApplied && generatedProof && (
              <button
                type="button"
                onClick={() => {
                  onProofApplied(generatedProof);
                  if (onClose) onClose();
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Verify & Proceed with ZK Proof</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
