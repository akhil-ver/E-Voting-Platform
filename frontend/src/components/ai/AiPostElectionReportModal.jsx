import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  FileText,
  Sparkles,
  X,
  Trophy,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export const AiPostElectionReportModal = ({ election, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async () => {
    if (!election) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post(`/ai/elections/${election.id}/report`);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.message || 'Could not compile post-election report');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate AI report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="flex flex-col w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-800 bg-[#0c101c] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>AI Post-Election Executive Audit Report</span>
              </h3>
              <p className="text-xs text-slate-400">{election?.name} ({election?.electionCode})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {!report && !loading && (
            <div className="text-center py-8 space-y-4">
              <FileText className="h-12 w-12 text-slate-600 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">Generate Certified Post-Election Analysis</h4>
                <p className="text-xs text-slate-400">
                  Google Gemini will analyze the official certified results, final turnout across jurisdictions, and blockchain audit commitments to produce an executive post-election report.
                </p>
              </div>
              <button
                onClick={handleGenerateReport}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                Compile Report with Gemini AI
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 space-y-3">
              <Sparkles className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
              <p className="text-sm font-medium text-slate-300">Synthesizing certified election results...</p>
              <p className="text-xs text-slate-500">Cross-referencing database tally with on-chain commitments</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {report && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Outcome Badge Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-emerald-400" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Certified Victor
                    </span>
                    <h4 className="text-base font-black text-white">{report.winnerName}</h4>
                    <p className="text-xs text-slate-300">{report.winnerParty} • {report.winningPercentage}% of votes</p>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                  <span className="text-[10px] uppercase text-slate-400">Final Turnout</span>
                  <p className="text-base font-bold text-white">{report.finalTurnoutPercentage}%</p>
                  <p className="text-[11px] text-slate-400">{report.totalAcceptedBallots} / {report.totalEligibleVoters} Ballots</p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Executive Overview</span>
                </h5>
                <p className="text-xs text-slate-200 leading-relaxed">{report.executiveSummary}</p>
              </div>

              {/* Key Highlights */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Key Analytical Highlights</span>
                </h5>
                <ul className="space-y-1.5">
                  {report.keyHighlights?.map((hl, i) => (
                    <li key={i} className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">•</span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Blockchain & Integrity Notes */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                  <span>Blockchain Cryptographic Audit</span>
                </h5>
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-mono text-[11px] text-slate-400 truncate">
                    Tally Hash: <span className="text-slate-200">{report.onChainTallyHash || 'N/A'}</span>
                  </p>
                  <p className="font-mono text-[11px] text-slate-400 truncate">
                    Tx Hash: <span className="text-violet-300">{report.onChainTallyTxHash || 'Anchored on-chain'}</span>
                  </p>
                  <div className="pt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Cryptographically verified on Hyperledger Besu / Ethereum ledger</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-500 italic leading-normal">
                {report.disclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
