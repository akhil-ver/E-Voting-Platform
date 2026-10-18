/**
 * Comprehensive Enterprise Admin Command Center
 * Features Lifecycle FSM, Quorum Management, Blockchain Explorer,
 * Fraud Radar, AI Copilot, Hash-Chained Audit Verifier, and Disaster Recovery
 */
import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Activity,
  Play,
  Pause,
  AlertOctagon,
  ShieldAlert,
  Database,
  Network,
  Lock,
  Unlock,
  Bot,
  FileText,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  GitBranch,
  Radio,
} from 'lucide-react';
import { Election, Block, ValidatorNode, FraudCase, AuditEvent, ElectionState } from '../../types';
import { FraudShapChart } from '../fraud/FraudShapChart';
import { SecurityCopilot } from '../ai/SecurityCopilot';
import { RealtimeMonitoringDashboard } from './RealtimeMonitoringDashboard';
import { ElectionPanelManager } from './ElectionPanelManager';
import { ElectoralRollManager } from './ElectoralRollManager';
import { BftConsensusToastSystem } from './BftConsensusToastSystem';
import { SecurityThreatDashboard } from './SecurityThreatDashboard';
import { Users, Vote } from 'lucide-react';

interface AdminDashboardProps {
  metrics: {
    activeValidators: number;
    quorumSatisfied: boolean;
    blocksCount: number;
    electionState: string;
    isPaused: boolean;
    isLockedDown: boolean;
  };
  onRefreshMetrics?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ metrics, onRefreshMetrics }) => {
  const [activeSubtab, setActiveSubtab] = useState<string>('election-panel');
  const [election, setElection] = useState<Election | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [validators, setValidators] = useState<ValidatorNode[]>([]);
  const [fraudCases, setFraudCases] = useState<FraudCase[]>([]);
  const [selectedFraudCase, setSelectedFraudCase] = useState<FraudCase | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditIntegrity, setAuditIntegrity] = useState<{ isTampered: boolean; totalEvents: number } | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const loadAdminData = async () => {
    try {
      const [elecRes, blocksRes, valRes, fraudRes, auditRes] = await Promise.all([
        fetch('/api/elections/elec-2026-presidential'),
        fetch('/api/blockchain'),
        fetch('/api/validators'),
        fetch('/api/fraud/flagged'),
        fetch('/api/audit'),
      ]);

      if (elecRes.ok) setElection(await elecRes.json());
      if (blocksRes.ok) setBlocks(await blocksRes.json());
      if (valRes.ok) setValidators(await valRes.json());
      if (fraudRes.ok) {
        const cases = await fraudRes.json();
        setFraudCases(cases);
        if (cases.length > 0 && !selectedFraudCase) setSelectedFraudCase(cases[0]);
      }
      if (auditRes.ok) setAuditEvents(await auditRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleStateTransition = async (targetState: ElectionState) => {
    setIsUpdating(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/elections/elec-2026-presidential/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Transition failed');
      }
      setElection(await res.json());
      setFeedbackMsg({ type: 'SUCCESS', text: `Election state successfully transitioned to ${targetState}` });
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'ERROR', text: err instanceof Error ? err.message : 'Transition failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleValidator = async (valId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      const res = await fetch(`/api/validators/${valId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setValidators((prev) => prev.map((v) => (v.id === valId ? updated : v)));
        if (onRefreshMetrics) onRefreshMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecoverAllValidators = async () => {
    try {
      const offline = validators.filter((v) => v.status !== 'ONLINE');
      await Promise.all(
        offline.map((v) =>
          fetch(`/api/validators/${v.id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ONLINE' }),
          })
        )
      );
      setValidators((prev) => prev.map((v) => ({ ...v, status: 'ONLINE' as const })));
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyAuditIntegrity = async () => {
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAuditIntegrity(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmergencyLockdown = async () => {
    try {
      const res = await fetch('/api/admin/lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual Emergency Operator Lockdown' }),
      });
      if (res.ok) {
        setElection(await res.json());
        setFeedbackMsg({ type: 'ERROR', text: 'EMERGENCY LOCKDOWN ACTIVATED: All voting endpoints frozen.' });
        if (onRefreshMetrics) onRefreshMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const subtabs = [
    { id: 'election-panel', label: 'Election Panel & Roster', icon: Vote },
    { id: 'security-threats', label: 'AI Security Threat & Risk', icon: ShieldAlert },
    { id: 'monitoring', label: 'Real-Time Monitoring', icon: Radio },
    { id: 'electoral-roll', label: 'Constituency Rolls', icon: Users },
    { id: 'lifecycle', label: 'Election Lifecycle', icon: SlidersHorizontal },
    { id: 'blockchain', label: 'Blockchain Explorer', icon: Network },
    { id: 'validators', label: 'Validator Quorum', icon: Activity },
    { id: 'fraud', label: 'Fraud & SHAP Radar', icon: ShieldAlert },
    { id: 'ai-copilot', label: 'Gemini Copilot', icon: Bot },
    { id: 'audit', label: 'Hash-Chained Audit', icon: FileText },
    { id: 'recovery', label: 'Disaster Recovery', icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      {/* BFT Consensus Toast Alert System & Quorum Monitor */}
      <BftConsensusToastSystem
        validators={validators}
        onToggleValidator={handleToggleValidator}
        onRecoverAllValidators={handleRecoverAllValidators}
        onNavigateToSubtab={(subtabId) => setActiveSubtab(subtabId)}
        threshold={66.0}
      />

      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-cyan-400" />
            <span>Enterprise Admin Command Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Finite State Machine lifecycle controls, Byzantine fault-tolerant quorum, and immutable audit logs.
          </p>
        </div>

        {/* Emergency Lockdown Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmergencyLockdown}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600/20 px-3.5 py-2 text-xs font-bold text-rose-400 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
          >
            <AlertOctagon className="h-4 w-4" />
            <span>Emergency Lockdown</span>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div
          className={`rounded-xl p-3.5 text-xs flex items-center gap-2 border ${
            feedbackMsg.type === 'SUCCESS'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'SUCCESS' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Subtab Navigation */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-800 pb-2 scrollbar-none">
        {subtabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubtab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(79,209,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 0: ELECTION PANEL & ROSTER MANAGER */}
      {activeSubtab === 'election-panel' && (
        <ElectionPanelManager onRefreshMetrics={onRefreshMetrics} />
      )}

      {/* SUBTAB: AI SECURITY THREAT & RISK ASSESSMENT DASHBOARD */}
      {activeSubtab === 'security-threats' && (
        <SecurityThreatDashboard
          metrics={{
            ...metrics,
            totalValidators: validators.length || 3,
            activeValidators: validators.filter((v) => v.status === 'ONLINE').length,
            fraudAlertsCount: fraudCases.length,
          }}
          onRefreshMetrics={onRefreshMetrics}
        />
      )}

      {/* SUBTAB 1: ELECTORAL ROLL & AREA MEMBERS */}
      {activeSubtab === 'electoral-roll' && (
        <ElectoralRollManager onRefreshMetrics={onRefreshMetrics} />
      )}

      {/* SUBTAB 1: REAL-TIME ELECTION MONITORING DASHBOARD */}
      {activeSubtab === 'monitoring' && (
        <RealtimeMonitoringDashboard onRefreshGlobal={onRefreshMetrics} />
      )}

      {/* SUBTAB 1: LIFECYCLE CONTROLS */}
      {activeSubtab === 'lifecycle' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h3 className="text-sm font-bold text-white">Election Finite State Machine</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current State:{' '}
              <span className="font-mono font-bold text-cyan-400">
                {election?.state || 'VOTING_OPEN'}
              </span>
            </p>

            {/* FSM Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {[
                { state: 'DRAFT' as ElectionState, label: '1. Draft' },
                { state: 'CONFIGURED' as ElectionState, label: '2. Configured' },
                { state: 'REGISTRATION_OPEN' as ElectionState, label: '3. Registration Open' },
                { state: 'VOTING_OPEN' as ElectionState, label: '4. Voting Open' },
                { state: 'VOTING_CLOSED' as ElectionState, label: '5. Voting Closed' },
                { state: 'TALLYING' as ElectionState, label: '6. Tallying' },
                { state: 'RESULTS_PUBLISHED' as ElectionState, label: '7. Results Published' },
                { state: 'ARCHIVED' as ElectionState, label: '8. Archive Election' },
              ].map((s) => {
                const isCurrent = election?.state === s.state;
                return (
                  <button
                    key={s.state}
                    onClick={() => handleStateTransition(s.state)}
                    disabled={isUpdating}
                    className={`rounded-xl p-3 text-xs font-bold border transition-all cursor-pointer text-left ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(79,209,255,0.2)]'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isCurrent && <span className="block text-[9px] text-cyan-400 font-mono mt-1">● CURRENT</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BLOCKCHAIN EXPLORER */}
      {activeSubtab === 'blockchain' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Confirmed Blockchain Blocks</h3>
            <div className="space-y-3">
              {blocks.map((block) => (
                <div key={block.height} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400">Block #{block.height}</span>
                    <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {Object.keys(block.validatorSignatures).length}/3 Signatures Valid
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                    <div>
                      Hash: <span className="text-slate-400">{block.blockHash.slice(0, 20)}...</span>
                    </div>
                    <div>
                      Merkle Root: <span className="text-slate-400">{block.merkleRoot.slice(0, 20)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: VALIDATORS */}
      {activeSubtab === 'validators' && (
        <div className="space-y-4">
          {/* BFT Health & Threshold Metric Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Byzantine Fault Tolerant (BFT) Validator Consensus</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  State replication requires &ge; 66.0% (2/3) honest multi-party validator signatures to produce blocks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    // Turn off 2 validators to drop below 66%
                    const online = validators.filter((v) => v.status === 'ONLINE');
                    for (let i = 0; i < Math.min(2, online.length); i++) {
                      await handleToggleValidator(online[i].id, 'ONLINE');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Simulate &lt;66% Drop
                </button>

                <button
                  onClick={handleRecoverAllValidators}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                >
                  Restore 100% Quorum
                </button>
              </div>
            </div>

            {/* Threshold Gauge Bar */}
            {(() => {
              const total = validators.length || 3;
              const online = validators.filter((v) => v.status === 'ONLINE').length;
              const pct = (online / total) * 100;
              const isBelow = pct < 66.0;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Active Consensus: <strong className="text-white">{online}/{total} Nodes Online</strong>
                    </span>
                    <span
                      className={`font-bold ${
                        isBelow ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {pct.toFixed(1)}% ({isBelow ? 'Quorum Violated (<66%)' : 'Quorum Satisfied (≥66%)'})
                    </span>
                  </div>

                  <div className="relative h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isBelow ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                    {/* 66% marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                      style={{ left: '66.67%' }}
                      title="66.67% BFT Quorum Threshold"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>0% (0 Nodes)</span>
                    <span className="text-amber-400 font-mono font-bold">▲ 66.7% BFT Minimum Threshold</span>
                    <span>100% (3 Nodes)</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Node Cards */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h3 className="text-sm font-bold text-white mb-3">
              Multi-Party Validator Nodes (Quorum: 2/3)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {validators.map((val) => {
                const isOnline = val.status === 'ONLINE';
                return (
                  <div
                    key={val.id}
                    className={`rounded-xl border p-4 text-xs ${
                      isOnline
                        ? 'border-emerald-500/40 bg-emerald-950/10 text-slate-300'
                        : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{val.name}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">ID: {val.id}</p>
                    <p className="font-mono text-[11px] text-slate-400">Latency: {val.latencyMs}ms</p>

                    <button
                      onClick={() => handleToggleValidator(val.id, val.status)}
                      className={`mt-3 w-full rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all ${
                        isOnline
                          ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white'
                          : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {isOnline ? 'Simulate Outage (Kill Node)' : 'Re-connect Node'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: FRAUD & SHAP */}
      {activeSubtab === 'fraud' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Flagged Sessions</h4>
              {fraudCases.map((fc) => (
                <div
                  key={fc.id}
                  onClick={() => setSelectedFraudCase(fc)}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                    selectedFraudCase?.id === fc.id
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Session {fc.sessionId}</span>
                    <span className="font-mono font-bold text-rose-400">{fc.score}/100</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{fc.status}</span>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              {selectedFraudCase ? (
                <FraudShapChart
                  score={selectedFraudCase.score}
                  riskLevel={selectedFraudCase.riskLevel}
                  factors={selectedFraudCase.factors}
                  sessionId={selectedFraudCase.sessionId}
                  recommendedAction={selectedFraudCase.recommendedAction}
                />
              ) : (
                <p className="text-xs text-slate-500">Select a flagged session to inspect SHAP decomposition.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: AI COPILOT */}
      {activeSubtab === 'ai-copilot' && (
        <SecurityCopilot
          activeFraudCasesCount={fraudCases.length}
          auditEventsCount={auditEvents.length}
        />
      )}

      {/* SUBTAB 6: HASH-CHAINED AUDIT TRAIL */}
      {activeSubtab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Cryptographic Hash-Chained Audit Trail</h3>
              <button
                onClick={handleVerifyAuditIntegrity}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Verify Hash-Chain Integrity</span>
              </button>
            </div>

            {auditIntegrity && (
              <div
                className={`my-3 p-3 rounded-xl text-xs border ${
                  auditIntegrity.isTampered
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                }`}
              >
                {auditIntegrity.isTampered
                  ? 'CRITICAL INTEGRITY BREAK: Hash chain mismatch detected!'
                  : `100% Cryptographic Integrity: All ${auditIntegrity.totalEvents} events chained successfully.`}
              </div>
            )}

            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
              {auditEvents.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">{ev.type}</span>
                    <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>Prev Hash: {ev.previousHash.slice(0, 20)}...</div>
                    <div>Event Hash: {ev.eventHash.slice(0, 20)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 7: DISASTER RECOVERY */}
      {activeSubtab === 'recovery' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-xs space-y-4">
          <h3 className="text-sm font-bold text-white">Disaster Recovery & Hot-Standby Snapshots</h3>
          <p className="text-slate-400">
            Export cryptographic snapshots to secondary storage adapters and test deterministic restoration.
          </p>

          <div className="flex gap-3">
            <button
              onClick={async () => {
                const res = await fetch('/api/admin/recovery/snapshot', { method: 'POST' });
                if (res.ok) setFeedbackMsg({ type: 'SUCCESS', text: 'Encrypted snapshot created and archived.' });
              }}
              className="rounded-xl bg-cyan-600 px-4 py-2 font-bold text-white hover:bg-cyan-500 cursor-pointer"
            >
              Create State Snapshot
            </button>
            <button
              onClick={async () => {
                const res = await fetch('/api/admin/recovery/restore', { method: 'POST' });
                if (res.ok) setFeedbackMsg({ type: 'SUCCESS', text: 'System restored from snapshot; 100% hash integrity verified.' });
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-slate-300 border border-slate-800 hover:bg-slate-800 cursor-pointer"
            >
              Simulate Safe State Restore
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
