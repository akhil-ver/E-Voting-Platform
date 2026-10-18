/**
 * Byzantine Fault Tolerant (BFT) Consensus Toast Notification System
 * Monitors validator quorum health and dispatches high-priority toast alerts
 * whenever active consensus falls below the 66% Byzantine Fault Tolerance threshold.
 *
 * Mathematical Threshold: Quorum is satisfied when >= 2/3 (66.67%) of validator nodes
 * are actively online and signing blocks. If < 66%, safety is compromised.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Activity,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  ArrowUpRight,
  History,
  Trash2,
  Radio,
  Sliders,
  ExternalLink,
  Info,
  Server,
  Zap,
} from 'lucide-react';
import { ValidatorNode } from '../../types';

export interface BftToastAlert {
  id: string;
  type: 'CRITICAL_BFT_BREACH' | 'QUORUM_RESTORED' | 'DEGRADED_WARNING' | 'INFO';
  title: string;
  message: string;
  consensusPercentage: number;
  activeCount: number;
  totalCount: number;
  offlineNodeIds: string[];
  timestamp: Date;
  autoDismissMs?: number; // 0 or undefined means sticky
  isDismissed?: boolean;
}

interface BftConsensusToastSystemProps {
  validators: ValidatorNode[];
  onToggleValidator?: (valId: string, currentStatus: string) => Promise<void>;
  onRecoverAllValidators?: () => Promise<void>;
  onNavigateToSubtab?: (subtabId: string) => void;
  threshold?: number; // default 66.0%
}

// Audio tone synthesizer using Web Audio API for zero-dependency sound feedback
function playAlertChime(type: 'CRITICAL' | 'RECOVERY') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'CRITICAL') {
      // Urgent double beep (480Hz -> 380Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(480, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.25);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);

      // Second pulse
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(540, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.3);
          gain2.gain.setValueAtTime(0.15, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.3);
        } catch (_) {}
      }, 140);
    } else {
      // Pleasant recovery chord (523Hz -> 659Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.35); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    // AudioContext blocked or not supported - silently ignore
  }
}

export const BftConsensusToastSystem: React.FC<BftConsensusToastSystemProps> = ({
  validators,
  onToggleValidator,
  onRecoverAllValidators,
  onNavigateToSubtab,
  threshold = 66.0,
}) => {
  const [activeToasts, setActiveToasts] = useState<BftToastAlert[]>([]);
  const [toastHistory, setToastHistory] = useState<BftToastAlert[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  // Track previous consensus state to detect transitions across the 66% threshold
  const prevRatioRef = useRef<number | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  // Compute active vs total nodes & consensus ratio
  const totalCount = validators.length || 3;
  const activeCount = validators.filter((v) => v.status === 'ONLINE').length;
  const consensusPercentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 100;
  const isBelowThreshold = consensusPercentage < threshold;

  const offlineValidators = validators.filter((v) => v.status !== 'ONLINE');
  const offlineNodeIds = offlineValidators.map((v) => v.id);

  // Helper to add toast
  const addToast = useCallback(
    (alert: Omit<BftToastAlert, 'id' | 'timestamp'>) => {
      const newToast: BftToastAlert = {
        ...alert,
        id: `toast-bft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
      };

      setActiveToasts((prev) => [newToast, ...prev.slice(0, 4)]);
      setToastHistory((prev) => [newToast, ...prev.slice(0, 49)]);

      if (soundEnabled) {
        if (newToast.type === 'CRITICAL_BFT_BREACH') {
          playAlertChime('CRITICAL');
        } else if (newToast.type === 'QUORUM_RESTORED') {
          playAlertChime('RECOVERY');
        }
      }
    },
    [soundEnabled]
  );

  // Dismiss toast handler
  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Monitor validator transitions and trigger toast alerts
  useEffect(() => {
    if (validators.length === 0) return;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevRatioRef.current = consensusPercentage;

      // If initial state is already below 66%, fire initial notification
      if (consensusPercentage < threshold) {
        addToast({
          type: 'CRITICAL_BFT_BREACH',
          title: 'CRITICAL: BFT Consensus Threshold Violated (<66%)',
          message: `Active validator quorum is currently at ${activeCount}/${totalCount} nodes (${consensusPercentage.toFixed(
            1
          )}%). The Byzantine Fault Tolerant threshold requires at least 66.0% online nodes for safe state finality.`,
          consensusPercentage,
          activeCount,
          totalCount,
          offlineNodeIds,
          autoDismissMs: 0, // Sticky critical alert
        });
      }
      return;
    }

    const prevRatio = prevRatioRef.current ?? 100;
    const wasBelow = prevRatio < threshold;
    const isNowBelow = consensusPercentage < threshold;

    // Transition 1: Consensus dropped below 66% threshold!
    if (!wasBelow && isNowBelow) {
      addToast({
        type: 'CRITICAL_BFT_BREACH',
        title: 'ALERT: BFT Consensus Dropped Below 66%',
        message: `Consensus quorum compromised: ${activeCount}/${totalCount} nodes online (${consensusPercentage.toFixed(
          1
        )}% < ${threshold}% required). Block finality stalled to prevent split-brain / Byzantine fork divergence.`,
        consensusPercentage,
        activeCount,
        totalCount,
        offlineNodeIds,
        autoDismissMs: 0, // Sticky
      });
    }
    // Transition 2: Consensus restored back to >= 66% threshold!
    else if (wasBelow && !isNowBelow) {
      addToast({
        type: 'QUORUM_RESTORED',
        title: 'BFT Quorum Health Restored',
        message: `Consensus threshold recovered to ${consensusPercentage.toFixed(
          1
        )}% (${activeCount}/${totalCount} nodes online). Byzantine multi-party verification has resumed.`,
        consensusPercentage,
        activeCount,
        totalCount,
        offlineNodeIds: [],
        autoDismissMs: 7000,
      });
    }
    // If ratio changed but stayed below threshold (e.g. dropped from 50% to 0%)
    else if (isNowBelow && Math.abs(prevRatio - consensusPercentage) > 0.1) {
      addToast({
        type: 'CRITICAL_BFT_BREACH',
        title: `Consensus Degraded Further (${consensusPercentage.toFixed(1)}%)`,
        message: `Quorum capacity further reduced to ${activeCount}/${totalCount} online nodes. Immediate administrative intervention required.`,
        consensusPercentage,
        activeCount,
        totalCount,
        offlineNodeIds,
        autoDismissMs: 0,
      });
    }

    prevRatioRef.current = consensusPercentage;
  }, [validators, consensusPercentage, threshold, activeCount, totalCount, offlineNodeIds, addToast]);

  // Execute one-click quorum recovery
  const handleExecuteQuorumRecovery = async () => {
    setIsRecovering(true);
    try {
      if (onRecoverAllValidators) {
        await onRecoverAllValidators();
      } else if (onToggleValidator) {
        // Toggle all offline validators back online
        for (const v of offlineValidators) {
          await onToggleValidator(v.id, v.status);
        }
      }

      addToast({
        type: 'INFO',
        title: 'Quorum Recovery Executed',
        message: 'Reconnection signals dispatched to all registered validator nodes.',
        consensusPercentage,
        activeCount,
        totalCount,
        offlineNodeIds: [],
        autoDismissMs: 4000,
      });
    } catch (err) {
      console.error('Error recovering quorum:', err);
    } finally {
      setIsRecovering(false);
    }
  };

  // Manual test simulations
  const handleSimulateDropBelowThreshold = async () => {
    if (onToggleValidator) {
      // Turn off first 2 validators to drop to 1/3 (33.3% < 66%)
      const onlineNodes = validators.filter((v) => v.status === 'ONLINE');
      for (let i = 0; i < Math.min(2, onlineNodes.length); i++) {
        await onToggleValidator(onlineNodes[i].id, 'ONLINE');
      }
    } else {
      addToast({
        type: 'CRITICAL_BFT_BREACH',
        title: 'SIMULATED: BFT Consensus Threshold Violated (33.3%)',
        message:
          'Simulated validator partition event. Active quorum dropped below 66% BFT threshold (1/3 nodes online). Block finality suspended.',
        consensusPercentage: 33.3,
        activeCount: 1,
        totalCount: 3,
        offlineNodeIds: ['val-independent-auditor', 'val-party-observer'],
        autoDismissMs: 0,
      });
    }
  };

  return (
    <>
      {/* Real-time BFT Status Banner Bar in Admin Header */}
      <div
        className={`rounded-2xl border p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-md ${
          isBelowThreshold
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono font-bold border ${
              isBelowThreshold
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isBelowThreshold ? <AlertOctagon className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                BFT Consensus Quorum: {consensusPercentage.toFixed(1)}%
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                  isBelowThreshold
                    ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isBelowThreshold ? 'QUORUM VIOLATED (<66%)' : 'QUORUM SATISFIED (≥66%)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeCount} of {totalCount} validator nodes online • BFT safety limit: 66.0% (2/3 rule)
            </p>
          </div>
        </div>

        {/* Quick Diagnostic Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Audio Chime Enabled' : 'Audio Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Toast History Log Modal Trigger */}
          <button
            id="view-bft-toast-history-btn"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-cyan-400" />
            <span>Alert Log ({toastHistory.length})</span>
          </button>

          {/* Test Trigger: Drop below 66% */}
          <button
            id="simulate-bft-drop-btn"
            onClick={handleSimulateDropBelowThreshold}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Simulate outage dropping active validators to <66%"
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
            <span>Simulate &lt;66% Drop</span>
          </button>

          {/* Auto Recover Button */}
          {isBelowThreshold && (
            <button
              id="recover-bft-quorum-btn"
              onClick={handleExecuteQuorumRecovery}
              disabled={isRecovering}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRecovering ? 'animate-spin' : ''}`} />
              <span>Restore Quorum</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Toast Notification Container (Top-Right / Fixed Z-Index 50) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {activeToasts.map((toast) => {
          const isCritical = toast.type === 'CRITICAL_BFT_BREACH';
          const isRecovery = toast.type === 'QUORUM_RESTORED';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-top-4 fade-in duration-200 ${
                isCritical
                  ? 'bg-slate-950/95 border-rose-500/60 text-white shadow-[0_10px_35px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/40'
                  : isRecovery
                  ? 'bg-slate-950/95 border-emerald-500/60 text-white shadow-[0_10px_35px_rgba(52,211,153,0.25)] ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/95 border-cyan-500/40 text-white shadow-2xl'
              }`}
            >
              {/* Header & Close */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                      isCritical
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-bounce'
                        : isRecovery
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    }`}
                  >
                    {isCritical ? (
                      <AlertOctagon className="h-5 w-5" />
                    ) : isRecovery ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <Activity className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-white tracking-tight">{toast.title}</h4>
                      <span
                        className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                            : isRecovery
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                        }`}
                      >
                        {toast.consensusPercentage.toFixed(1)}% Consensus
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">{toast.message}</p>
                  </div>
                </div>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Node Status Matrix in Critical Toast */}
              {isCritical && toast.offlineNodeIds.length > 0 && (
                <div className="mt-3 rounded-xl bg-slate-900/80 p-2.5 border border-slate-800 text-[11px]">
                  <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
                    <span>Impacted Offline Nodes:</span>
                    <span className="font-mono text-rose-400">{toast.offlineNodeIds.length} Failed</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {toast.offlineNodeIds.map((nid) => (
                      <span
                        key={nid}
                        className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 font-mono text-[10px]"
                      >
                        {nid}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  {toast.timestamp.toLocaleTimeString()}
                </span>

                <div className="flex items-center gap-2">
                  {isCritical && (
                    <button
                      onClick={handleExecuteQuorumRecovery}
                      disabled={isRecovering}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRecovering ? 'animate-spin' : ''}`} />
                      <span>Auto-Recover</span>
                    </button>
                  )}

                  {onNavigateToSubtab && (
                    <button
                      onClick={() => {
                        onNavigateToSubtab('validators');
                        dismissToast(toast.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-medium transition-all cursor-pointer"
                    >
                      <span>Quorum Tab</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}

                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer font-medium"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast Alert History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">BFT Consensus Alert Log</h3>
                  <p className="text-xs text-slate-400">Audit trail of quorum threshold transitions & triggers</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {toastHistory.length > 0 && (
                  <button
                    onClick={() => setToastHistory([])}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                    title="Clear Log History"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {toastHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No BFT alerts recorded in this session. Quorum nominal.
                </div>
              ) : (
                toastHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl p-3 text-xs border ${
                      item.type === 'CRITICAL_BFT_BREACH'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        : item.type === 'QUORUM_RESTORED'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="font-bold text-white">{item.title}</span>
                      <span className="text-slate-400">{item.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{item.message}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>Nodes: {item.activeCount}/{item.totalCount}</span>
                      <span>•</span>
                      <span>Ratio: {item.consensusPercentage.toFixed(1)}%</span>
                      {item.offlineNodeIds.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-400">Offline: {item.offlineNodeIds.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400">
                Rule: BFT Consensus requires &ge; 66.0% (2/3) validator agreement.
              </span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
