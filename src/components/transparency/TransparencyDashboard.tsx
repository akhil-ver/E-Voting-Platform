/**
 * Public Transparency & Civic Trust Dashboard
 * Real-time public telemetry, cryptographic guarantees, and downloadable audit trail exports
 */
import React from 'react';
import {
  ShieldCheck,
  Eye,
  Lock,
  Download,
  CheckCircle2,
  GitBranch,
  Key,
  Users,
  Activity,
} from 'lucide-react';

interface TransparencyDashboardProps {
  metrics: {
    registeredVoters: number;
    votesCast: number;
    turnoutPercentage: number;
    blocksCount: number;
    activeValidators: number;
    totalValidators: number;
    verificationSuccessRate: number;
  };
}

export const TransparencyDashboard: React.FC<TransparencyDashboardProps> = ({ metrics }) => {
  const handleExportAudit = async () => {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const events = await res.json();
        const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `election-audit-trail-${Date.now()}.json`;
        a.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const guarantees = [
    {
      title: 'End-to-End Verifiability (E2E-V)',
      description: 'Every voter receives a Zero-Knowledge receipt proving their ballot was counted exactly as cast, without revealing their candidate selection.',
      badge: 'ZK-SNARK / Merkle',
    },
    {
      title: 'Double-Voting Immunity',
      description: 'Single-use cryptographic nullifiers derived from voter credentials make it mathematically impossible to vote more than once.',
      badge: 'Deterministic Nullifiers',
    },
    {
      title: '2/3 Multi-Party Validator Consensus',
      description: 'Blocks must be signed by at least 2 independent authorities (Election Commission, Civil Auditor, Multi-Party Observer).',
      badge: 'Byzantine Fault Tolerant',
    },
    {
      title: 'Tamper-Evident Audit Chain',
      description: 'Every system state transition is linked in a SHA-256 hash-chain. Altering 1 bit breaks the entire mathematical chain.',
      badge: 'Hash-Chaining',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.3)]">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Civic Trust & Cryptographic Transparency
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Open cryptographic proofs enabling public scrutiny without compromising individual ballot secrecy.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportAudit}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-cyan-300 border border-cyan-500/30 hover:bg-slate-800 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Full Audit Trail (JSON)</span>
          </button>
        </div>

        {/* Public Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Ballots Counted</span>
            <p className="text-base font-mono font-bold text-white mt-0.5">{metrics.votesCast}</p>
          </div>
          <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Blocks Mined</span>
            <p className="text-base font-mono font-bold text-cyan-400 mt-0.5">{metrics.blocksCount}</p>
          </div>
          <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Validator Consensus</span>
            <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
              {metrics.activeValidators}/{metrics.totalValidators} Nodes Online
            </p>
          </div>
          <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Verification Rate</span>
            <p className="text-base font-mono font-bold text-violet-400 mt-0.5">{metrics.verificationSuccessRate}%</p>
          </div>
        </div>
      </div>

      {/* Core Cryptographic Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guarantees.map((g, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{g.title}</h3>
              <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                {g.badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{g.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
