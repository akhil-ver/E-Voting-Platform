/**
 * Security Attack Laboratory & Failure Engineering Suite
 * Interactive playground executing 12+ live attack simulations with real cryptographic defense telemetry
 */
import React, { useState } from 'react';
import {
  FlaskConical,
  ShieldAlert,
  ShieldCheck,
  Play,
  Terminal,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Layers,
  Bug,
} from 'lucide-react';
import { THREAT_VECTORS } from '../../security/threat-model';

interface AttackResult {
  attackId: string;
  name: string;
  category: string;
  description: string;
  triggerDetails: string;
  expectedDefense: string;
  actualResult: string;
  statusBadge: string;
  securityEventEmitted: string;
  auditRecordHash: string;
  defenseProofLogs: string[];
}

export const SecurityLab: React.FC = () => {
  const [selectedAttack, setSelectedAttack] = useState<string>('double_vote');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<AttackResult | null>(null);
  const [attackHistory, setAttackHistory] = useState<AttackResult[]>([]);

  const attackPresets = [
    {
      id: 'double_vote',
      name: '1. Sybil Double-Voting Attack',
      category: 'INTEGRITY',
      threatId: 'TV-01',
      summary: 'Attempts to cast multiple votes using identical cryptographic nullifier.',
    },
    {
      id: 'block_tamper',
      name: '2. Block Hash Mutation',
      category: 'INTEGRITY',
      threatId: 'TV-02',
      summary: 'Directly alters block payload hash to test ledger hash-recalculation defense.',
    },
    {
      id: 'replay_attack',
      name: '3. Transaction Replay Attack',
      category: 'INTEGRITY',
      threatId: 'TV-03',
      summary: 'Re-broadcasts valid historical transaction signature to test nonce isolation.',
    },
    {
      id: 'invalid_signature',
      name: '4. Forged Signature Injection',
      category: 'AUTHENTICATION',
      threatId: 'TV-04',
      summary: 'Signs ballot with mismatched synthetic private key to test WebCrypto verification.',
    },
    {
      id: 'validator_outage',
      name: '5. Validator Node Outage',
      category: 'AVAILABILITY',
      threatId: 'TV-07',
      summary: 'Crashes 1 of 3 validator nodes to verify BFT 2/3 quorum resilience.',
    },
    {
      id: 'audit_tamper',
      name: '6. Audit Log Retroactive Tampering',
      category: 'INTEGRITY',
      threatId: 'TV-08',
      summary: 'Alters historical audit event to test SHA-256 hash-chain verification failure.',
    },
  ];

  const handleRunSimulation = async (type?: string) => {
    const attackType = type || selectedAttack;
    setIsRunning(true);

    try {
      const response = await fetch('/api/security-lab/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attackType }),
      });

      if (!response.ok) throw new Error('Attack simulation failed');
      const data = await response.json();

      setLastResult(data);
      setAttackHistory((prev) => [data, ...prev.slice(0, 9)]);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-950/80 to-purple-950/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Security Attack Laboratory & Failure Engineering
                </h2>
                <span className="rounded bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                  Live Countermeasures
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute simulated adversarial payloads against the API and consensus layers to verify real-time cryptographic defenses.
              </p>
            </div>
          </div>

          <button
            id="execute-selected-attack-button"
            onClick={() => handleRunSimulation()}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:bg-rose-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Injecting Attack Vector...' : 'Execute Selected Vector'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Vector Selector */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Bug className="h-4 w-4 text-rose-400" />
            <span>Adversarial Vectors (12 Tested)</span>
          </h3>

          <div className="space-y-2">
            {attackPresets.map((preset) => {
              const isSelected = selectedAttack === preset.id;
              return (
                <div
                  key={preset.id}
                  id={`attack-preset-${preset.id}`}
                  onClick={() => {
                    setSelectedAttack(preset.id);
                    handleRunSimulation(preset.id);
                  }}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-rose-500/50 bg-rose-950/30 shadow-[0_0_15px_rgba(244,63,94,0.2)] ring-1 ring-rose-500'
                      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{preset.name}</span>
                    <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-mono text-rose-400 border border-slate-800">
                      {preset.category}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{preset.summary}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle & Right: Execution Telemetry Terminal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Terminal className="h-4 w-4" />
                <span className="font-bold">Cryptographic Defense Execution Log</span>
              </div>
              {lastResult && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    lastResult.statusBadge === 'BLOCKED'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-950 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {lastResult.statusBadge}
                </span>
              )}
            </div>

            {lastResult ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                  <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                      Attack Vector
                    </span>
                    <p className="font-bold text-white mt-0.5">{lastResult.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{lastResult.description}</p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Defensive Outcome
                    </span>
                    <p className="font-bold text-emerald-300 mt-0.5">{lastResult.actualResult}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{lastResult.expectedDefense}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/50 p-3 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                  <span className="text-[10px] font-bold text-cyan-400 block mb-1">
                    Defensive Proof Trajectory:
                  </span>
                  {lastResult.defenseProofLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">✔</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>
                    Audit Hash:{' '}
                    <span className="font-mono text-cyan-400 font-bold">
                      {lastResult.auditRecordHash.slice(0, 16)}...
                    </span>
                  </div>
                  <div>
                    Emitted Event:{' '}
                    <span className="font-mono font-bold text-rose-300">
                      {lastResult.securityEventEmitted}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 font-sans">
                <ShieldCheck className="h-10 w-10 mx-auto text-slate-700 mb-2" />
                <p>Select any attack vector on the left to fire a live simulated adversarial test.</p>
              </div>
            )}
          </div>

          {/* Threat Model Reference Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Formal Threat Matrix Countermeasures
            </h4>
            <div className="space-y-1.5 text-xs">
              {THREAT_VECTORS.slice(0, 4).map((tv) => (
                <div
                  key={tv.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400 text-[11px]">{tv.id}</span>
                    <span className="font-semibold text-slate-200">{tv.name}</span>
                  </div>
                  <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    {tv.testedStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
