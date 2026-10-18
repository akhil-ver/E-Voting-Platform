/**
 * Interactive 5-Layer Clean Architecture & Hexagonal Ports Visualizer
 * Shows real-time packet flow from client browser through cryptographic primitives to pluggable adapters
 */
import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Key,
  Database,
  Shield,
  Network,
  ArrowDown,
  CheckCircle2,
  Sparkles,
  Zap,
  HardDrive,
  Bot,
} from 'lucide-react';

interface ArchitectureDiagramProps {
  providers: {
    database: string;
    storage: string;
    blockchain: string;
    ai: string;
    notification: string;
  };
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ providers }) => {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(1);
  const [isSimulatingPacket, setIsSimulatingPacket] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  const layers = [
    {
      id: 1,
      title: 'Layer 1: Presentation & Client UI (React + Tailwind)',
      badge: 'Client Context',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400',
      icon: Cpu,
      description: 'Zero raw private keys exposed. Client uses Web Crypto API for client-side key generation and challenge signing.',
      components: [
        'VoterPortal.tsx (P-256 ECDSA Key Gen)',
        'VerificationPortal.tsx (ZK Merkle Proof)',
        'AdminCommandCenter.tsx (Lifecycle & Quorum)',
        'SecurityLab.tsx (12 Attack Simulators)',
      ],
      guarantee: 'Zero biometrics, Zero plaintext ballot choices transmitted over network.',
    },
    {
      id: 2,
      title: 'Layer 2: Application Services & Hexagonal Ports',
      badge: 'Domain Inversion',
      color: 'from-violet-500/20 to-purple-500/20 border-violet-500/40 text-violet-400',
      icon: Layers,
      description: 'Clean service contracts (IAuthService, IVotingService, IFraudDetectionService, IVerificationService).',
      components: [
        'VotingService (Double-vote nullifier isolation)',
        'EligibilityService (Single-use anonymous token)',
        'FraudDetectionService (Multi-signal scoring + SHAP)',
        'AuditService (SHA-256 Hash-Chained ledger)',
      ],
      guarantee: 'Authoritative decisions never delegated to AI. Deterministic cryptographic checks prevail.',
    },
    {
      id: 3,
      title: 'Layer 3: Cryptographic & Zero-Knowledge Domain Kernel',
      badge: 'Crypto Core',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
      icon: Key,
      description: 'Zero-Knowledge commitments, AES-GCM-256 encryption, ECDSA signatures, and Merkle tree roots.',
      components: [
        'commitments.ts (C = Hash(vote || r), Nullifier = Hash(cred || elec))',
        'encryption.ts (AES-256-GCM browser & server)',
        'merkle.ts (Pairwise SHA-256 cryptographic proof generator)',
        'signatures.ts (ECDSA P-256 challenge-response)',
      ],
      guarantee: 'Receipts prove mathematical inclusion without disclosing vote.',
    },
    {
      id: 4,
      title: 'Layer 4: Pluggable Infrastructure Adapters (Dependency Injection)',
      badge: 'Active Provider Matrix',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
      icon: Database,
      description: 'Provider factory decouples application logic from specific database or cloud vendors.',
      components: [
        `Database Adapter: [${providers.database.toUpperCase()}] (Postgres / Mock / Supabase)`,
        `Storage Adapter: [${providers.storage.toUpperCase()}] (Local / S3 / Supabase)`,
        `Blockchain Adapter: [${providers.blockchain.toUpperCase()}] (Mock BFT / Fabric)`,
        `AI Intelligence: [${providers.ai.toUpperCase()}] (@google/genai Gemini SDK)`,
      ],
      guarantee: 'Runtime hot-swappable via environment configuration.',
    },
    {
      id: 5,
      title: 'Layer 5: Consensus Network & Immutable Hash-Chained Audit Ledger',
      badge: 'Consensus & Audit',
      color: 'from-rose-500/20 to-pink-500/20 border-rose-500/40 text-rose-400',
      icon: Network,
      description: 'Distributed 3-node validator quorum (2/3 threshold) with hash-linked block generation.',
      components: [
        'Node 1: Election Commission Authority (val-ec-01)',
        'Node 2: Independent Civil Auditor (val-auditor-02)',
        'Node 3: Multi-Party Public Observer (val-party-03)',
        'Audit Event Hash Chain (Event(N).prev = Hash(Event(N-1)))',
      ],
      guarantee: '100% tamper-evident. Mutating 1 bit invalidates downstream hash chain instantly.',
    },
  ];

  const triggerPacketSimulation = () => {
    if (isSimulatingPacket) return;
    setIsSimulatingPacket(true);
    setActiveStep(1);

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSimulatingPacket(false);
            setActiveStep(0);
          }, 800);
          return 5;
        }
        return prev + 1;
      });
    }, 600);
  };

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-400" />
              Clean / Hexagonal Architecture Inspector
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict domain boundary isolation, dependency injection, and zero-knowledge cryptographic pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerPacketSimulation}
            disabled={isSimulatingPacket}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:bg-violet-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`h-4 w-4 ${isSimulatingPacket ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingPacket ? `Routing Packet (Layer ${activeStep})...` : 'Trace Cryptographic Packet'}</span>
          </button>
        </div>
      </div>

      {/* Active Provider Matrix Chip Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Database</span>
          </div>
          <p className="text-xs font-mono font-bold text-cyan-300 mt-1 uppercase">
            {providers.database}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
            <span>Storage</span>
          </div>
          <p className="text-xs font-mono font-bold text-emerald-300 mt-1 uppercase">
            {providers.storage}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Network className="h-3.5 w-3.5 text-violet-400" />
            <span>Blockchain</span>
          </div>
          <p className="text-xs font-mono font-bold text-violet-300 mt-1 uppercase">
            {providers.blockchain}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Bot className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Copilot</span>
          </div>
          <p className="text-xs font-mono font-bold text-amber-300 mt-1 uppercase">
            {providers.ai}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Shield className="h-3.5 w-3.5 text-rose-400" />
            <span>Security Model</span>
          </div>
          <p className="text-xs font-mono font-bold text-rose-300 mt-1">
            BFT 2/3 + ZK
          </p>
        </div>
      </div>

      {/* 5-Layer Stack Grid */}
      <div className="space-y-3 mt-4">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isSelected = selectedLayer === layer.id;
          const isPacketHere = activeStep === layer.id;

          return (
            <div
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                isPacketHere
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(79,209,255,0.4)] scale-[1.01]'
                  : isSelected
                  ? `bg-slate-900/90 ${layer.color} shadow-lg`
                  : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${layer.color.split(' ')[3]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{layer.title}</h3>
                      {isPacketHere && (
                        <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-black animate-pulse">
                          EXECUTING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{layer.description}</p>
                  </div>
                </div>

                <span className="rounded-md bg-slate-950 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-800">
                  {layer.badge}
                </span>
              </div>

              {/* Expanded details */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Module Components:
                    </span>
                    <ul className="mt-1.5 space-y-1 font-mono text-slate-300">
                      {layer.components.map((c, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      Security Guarantee:
                    </span>
                    <p className="mt-1 text-slate-300 leading-relaxed font-sans">{layer.guarantee}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
