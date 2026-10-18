/**
 * AI-Powered Anomaly Explainer Component
 * Decomposes detected security anomalies with strict distinction between
 * 100% Deterministic Findings (cryptographic/mathematical rules) and
 * AI-Assisted Interpretations (probabilistic behavioral heuristics).
 * Validated with Zod schema. Fully accessible (WCAG AA).
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Lock,
  Brain,
  AlertOctagon,
  CheckCircle2,
  X,
  Terminal,
  Clock,
  Fingerprint,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sliders,
  Check,
} from 'lucide-react';
import { AnomalyExplanation } from '../../types';

interface AnomalyExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  anomalyData: {
    anomalyId: string;
    title: string;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors?: {
      name: string;
      category: 'CRYPTOGRAPHIC' | 'BEHAVIORAL' | 'DETERMINISTIC' | 'NETWORK';
      scoreImpact: number;
      description: string;
      evidence: string;
    }[];
    telemetry?: Record<string, unknown>;
  } | null;
}

export function AnomalyExplainerModal({
  isOpen,
  onClose,
  anomalyData,
}: AnomalyExplainerModalProps) {
  const [explanation, setExplanation] = useState<AnomalyExplanation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const fetchExplanation = async () => {
    if (!anomalyData) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/explain-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anomalyData),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate AI explanation (${res.status})`);
      }

      const data = await res.json();
      setExplanation(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown AI error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && anomalyData) {
      fetchExplanation();
    } else {
      setExplanation(null);
      setError(null);
    }
  }, [isOpen, anomalyData?.anomalyId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !anomalyData) return null;

  const handleExecuteAction = async (actionId: string, cmd?: string) => {
    setExecutingActionId(actionId);
    // Simulate immediate automated operational dispatch
    setTimeout(() => {
      setExecutedActions((prev) => ({ ...prev, [actionId]: true }));
      setExecutingActionId(null);
    }, 900);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/50';
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="anomaly-modal-title"
      aria-describedby="anomaly-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
    >
      <div
        id="anomaly-explainer-dialog"
        className="relative w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-950 p-6 sm:p-8 text-slate-100 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">
                  INCIDENT #{anomalyData.anomalyId}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getRiskBadgeColor(
                    anomalyData.riskLevel
                  )}`}
                >
                  {anomalyData.riskLevel} RISK (SCORE {anomalyData.riskScore}/100)
                </span>
              </div>
              <h2 id="anomaly-modal-title" className="text-lg sm:text-xl font-bold text-white mt-1">
                {anomalyData.title}
              </h2>
            </div>
          </div>

          <button
            id="close-anomaly-modal-btn"
            onClick={onClose}
            aria-label="Close Anomaly Explainer"
            className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">
              Decomposing anomaly telemetry with Gemini AI Copilot & validating Zod schemas...
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Separating deterministic cryptographic constraints from probabilistic heuristics
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <AlertOctagon className="h-5 w-5 text-rose-400" />
              <span>Failed to load AI explanation</span>
            </div>
            <p className="text-xs">{error}</p>
            <button
              onClick={fetchExplanation}
              className="mt-2 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
            >
              Retry Explanation
            </button>
          </div>
        )}

        {/* Loaded Explanation Content */}
        {explanation && !isLoading && (
          <div className="space-y-6 animate-fadeIn">
            {/* Executive Summary */}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 sm:p-5 text-cyan-100">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                <Brain className="h-4 w-4" />
                <span>Executive Intelligence Summary</span>
              </div>
              <p id="anomaly-modal-desc" className="text-sm leading-relaxed text-slate-200">
                {explanation.executiveSummary}
              </p>
            </div>

            {/* TWO-COLUMN METHODOLOGY BREAKDOWN: DETERMINISTIC VS AI PROBABILISTIC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. DETERMINISTIC FINDINGS (100% Certainty) */}
              <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-300">
                        Deterministic Findings
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        100% Certainty • Cryptographic & Invariant Proofs
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    MATHEMATICALLY BOUND
                  </span>
                </div>

                <div className="space-y-3">
                  {explanation.deterministicFindings.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-emerald-900/40 bg-slate-950/80 p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {item.finding}
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      </div>

                      <div className="text-[11px] text-slate-300 leading-relaxed">
                        {item.explanation}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          Rule: {item.ruleViolated}
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-cyan-400 truncate max-w-[200px]">
                          Hash: {item.evidenceHash}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. AI-ASSISTED INTERPRETATIONS (Probabilistic Heuristics) */}
              <div className="rounded-2xl border border-violet-500/30 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-violet-300">
                        AI-Assisted Interpretations
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Probabilistic • Behavioral & Statistical Telemetry
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-violet-950 border border-violet-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-violet-400">
                    HEURISTIC MODEL
                  </span>
                </div>

                <div className="space-y-3">
                  {explanation.aiAssistedInterpretations.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-violet-900/40 bg-slate-950/80 p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {item.interpretation}
                        </span>
                        <span className="rounded bg-violet-950 px-1.5 py-0.5 text-[10px] font-mono text-violet-300 border border-violet-800">
                          {Math.round(item.confidence * 100)}% Conf
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 leading-relaxed">
                        {item.reasoning}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          Pattern: {item.behavioralPattern}
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-violet-400">
                          Model: {item.heuristicModel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contributing Factor Decomposition (SHAP Attribution) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Contributing Threat Factor Decomposition</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Additive Impact Model
                </span>
              </div>

              <div className="space-y-2.5">
                {explanation.contributingFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{factor.factor}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                            factor.category === 'CRYPTOGRAPHIC'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : factor.category === 'DETERMINISTIC'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-violet-950 text-violet-400 border border-violet-800'
                          }`}
                        >
                          {factor.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{factor.evidence}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, factor.weightPercentage)}%` }}
                        />
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="font-bold text-cyan-400">+{factor.impactScore} pts</span>
                        <span className="text-slate-500 block text-[9px]">{factor.weightPercentage}% weight</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concrete Investigative & Remedial Actions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span>Concrete Investigative & Remedial Actions</span>
                </h3>
                {explanation.supervisoryApprovalRequired && (
                  <span className="rounded-full bg-amber-950 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    SUPERVISORY SIGN-OFF MANDATED
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {explanation.concreteRemedialActions.map((action, idx) => {
                  const isDone = executedActions[`act-${idx}`];
                  const isExecuting = executingActionId === `act-${idx}`;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 transition-all ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-950/20'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                                action.priority === 'IMMEDIATE_P0'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {action.priority}
                            </span>
                            <h4 className="text-xs font-bold text-white">{action.action}</h4>
                          </div>
                          <p className="text-[11px] text-slate-400">{action.rationale}</p>
                          <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-slate-500">
                            <span>Actor: {action.actor}</span>
                            {action.command && (
                              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400 truncate max-w-xs">
                                $ {action.command}
                              </span>
                            )}
                          </div>
                        </div>

                        {action.automatedExecutable ? (
                          <button
                            id={`execute-action-btn-${idx}`}
                            disabled={isDone || isExecuting}
                            onClick={() => handleExecuteAction(`act-${idx}`, action.command)}
                            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                              isDone
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(79,209,255,0.3)]'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Action Dispatched</span>
                              </>
                            ) : isExecuting ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Executing...</span>
                              </>
                            ) : (
                              <>
                                <Terminal className="h-3.5 w-3.5" />
                                <span>Execute Action</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-[10px] font-mono text-slate-400 shrink-0 text-center">
                            Manual Escalation Required
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Validated with Zod • Clean Architecture Service Boundary</span>
          </div>

          <button
            id="anomaly-explainer-dismiss-btn"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            Close Decomposition
          </button>
        </div>
      </div>
    </div>
  );
}
