/**
 * SHAP-Style Explainable AI Attribution & Waterfall Chart
 * Displays exact mathematical factor contributions to fraud risk scores
 */
import React, { useState } from 'react';
import { FraudFactor, RiskLevel } from '../../types';
import { AlertTriangle, ShieldCheck, Cpu, ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react';
import { AnomalyExplainerModal } from '../ai/AnomalyExplainerModal';

interface FraudShapChartProps {
  score: number;
  riskLevel: RiskLevel;
  factors: FraudFactor[];
  sessionId: string;
  recommendedAction?: string;
}

export const FraudShapChart: React.FC<FraudShapChartProps> = ({
  score,
  riskLevel,
  factors,
  sessionId,
  recommendedAction,
}) => {
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);

  const getBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-400 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Explainable Anomaly Attribution (SHAP Factor Decomposition)
            </h3>
            <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-slate-800">
              Session: {sessionId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic cryptographic validation overrides probabilistic behavioral signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
              Risk Score
            </span>
            <span className="text-xl font-mono font-black text-white">{score}/100</span>
          </div>
          <span className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${getBadgeColor(riskLevel)}`}>
            {riskLevel} RISK
          </span>
          <button
            id={`explain-anomaly-shap-${sessionId}`}
            onClick={() => setIsExplainerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)] transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Copilot Analysis</span>
          </button>
        </div>
      </div>

      {/* Waterfall Factor Bars */}
      <div className="space-y-3">
        {factors.map((factor, idx) => {
          const widthPercent = Math.min(100, Math.max(8, factor.scoreImpact * 2.5));
          const isHighImpact = factor.scoreImpact >= 20;

          return (
            <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{factor.name}</span>
                  <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 border border-slate-800">
                    {factor.category}
                  </span>
                </div>
                <span className={`font-mono font-bold ${isHighImpact ? 'text-rose-400' : 'text-amber-400'}`}>
                  +{factor.scoreImpact} pts
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    factor.category === 'CRYPTOGRAPHIC'
                      ? 'bg-rose-500'
                      : factor.category === 'DETERMINISTIC'
                      ? 'bg-purple-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <p className="line-clamp-1">{factor.description}</p>
                <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
                  {factor.evidence}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Action Footer */}
      {recommendedAction && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-bold text-amber-200">Recommended Security Protocol:</span>
            <p className="mt-0.5 leading-relaxed">{recommendedAction}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnomalyExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        anomalyData={{
          anomalyId: sessionId,
          title: `SHAP Session ${sessionId} Anomaly Breakdown`,
          riskScore: score,
          riskLevel: riskLevel,
          factors: factors.map((f) => ({
            name: f.name,
            category: f.category,
            scoreImpact: f.scoreImpact,
            description: f.description,
            evidence: f.evidence,
          })),
          telemetry: {
            sessionId,
            recommendedAction,
          },
        }}
      />
    </div>
  );
};
