import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Sparkles,
  Layers,
  Activity,
  Vote,
  UserX,
  Clock,
  ExternalLink,
  MessageSquare,
  FileCheck,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const AnomalyDetectionPanel = ({ elections = [] }) => {
  const [selectedElectionId, setSelectedElectionId] = useState(
    elections.length > 0 ? elections[0].id : 1
  );
  const [evaluation, setEvaluation] = useState(null);
  const [alertsHistory, setAlertsHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Review modal state
  const [selectedAlertToReview, setSelectedAlertToReview] = useState(null);
  const [reviewStatusInput, setReviewStatusInput] = useState('REVIEWED');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (selectedElectionId) {
      runAnomalyScan(selectedElectionId);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    fetchAlertsHistory();
  }, [statusFilter]);

  const runAnomalyScan = async (electionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/ai/anomalies/elections/${electionId}`);
      if (res.success && res.data) {
        setEvaluation(res.data);
      } else {
        setError(res.message || 'Failed to scan operational telemetry.');
      }
    } catch (err) {
      setError(err.message || 'Error executing Isolation Forest anomaly model.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertsHistory = async () => {
    setHistoryLoading(true);
    try {
      const url = statusFilter === 'ALL'
        ? '/ai/anomalies?size=15'
        : `/ai/anomalies?status=${statusFilter}&size=15`;
      const res = await axiosClient.get(url);
      if (res.success && res.data) {
        setAlertsHistory(res.data.content || []);
      }
    } catch (err) {
      console.error('Failed to load anomaly alert history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlertToReview) return;
    setReviewSubmitting(true);
    try {
      const res = await axiosClient.patch(`/ai/anomalies/${selectedAlertToReview.id}/review`, {
        reviewStatus: reviewStatusInput,
        adminNotes: adminNotesInput,
      });
      if (res.success) {
        setSelectedAlertToReview(null);
        setAdminNotesInput('');
        fetchAlertsHistory();
        if (evaluation && evaluation.id === selectedAlertToReview.id) {
          setEvaluation({
            ...evaluation,
            reviewStatus: reviewStatusInput,
            adminNotes: adminNotesInput,
          });
        }
      }
    } catch (err) {
      alert('Failed to update review: ' + err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse';
      case 'WARNING':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      case 'NORMAL':
      default:
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    }
  };

  const getReviewStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED_INCIDENT':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'REVIEWED':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      case 'DISMISSED':
        return 'bg-slate-800 text-slate-300 border-slate-600';
      case 'PENDING_REVIEW':
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Isolation Forest Anomaly Monitoring</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-dimensional operational telemetry analysis detecting voting speed surges, duplicate attempts, auth bursts, and blockchain stalls.
            </p>
          </div>
        </div>

        {/* Election Selector & Scan Button */}
        <div className="flex items-center gap-2">
          {elections.length > 0 && (
            <select
              value={selectedElectionId || ''}
              onChange={(e) => setSelectedElectionId(Number(e.target.value))}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.name ? `${el.name} (${el.electionCode})` : (el.electionCode || `Election #${el.id}`)}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => selectedElectionId && runAnomalyScan(selectedElectionId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Run Anomaly Scan'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Live Evaluation Card */}
      {evaluation && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            {/* Score & Category Meter */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Isolation Forest Anomaly Score
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-mono font-black text-white">
                  {typeof evaluation.anomalyScore === 'number'
                    ? evaluation.anomalyScore.toFixed(3)
                    : Number(evaluation.anomalyScore || 0).toFixed(3)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getSeverityBadge(evaluation.severity)}`}>
                  {evaluation.severity}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (Threshold: &ge; 0.58)
                </span>
              </div>
              <div className="w-64 max-w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    evaluation.severity === 'CRITICAL'
                      ? 'bg-rose-500'
                      : evaluation.severity === 'WARNING'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, evaluation.anomalyScore * 100))}%` }}
                />
              </div>
            </div>

            {/* Model & Review Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-[10px] text-slate-400 block">Model Engine</span>
                <span className="font-mono text-cyan-300 font-bold">{evaluation.modelVersion}</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-[10px] text-slate-400 block">Review Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getReviewStatusBadge(evaluation.reviewStatus)}`}>
                  {evaluation.reviewStatus}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-[10px] text-slate-400 block">Observation Time</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {evaluation.observationTimestamp
                    ? new Date(evaluation.observationTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Now'}
                </span>
              </div>
            </div>
          </div>

          {/* 7 Operational Metric Feature Chips */}
          {evaluation.featureVector && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Ballots / Min</span>
                <span className="text-lg font-mono font-bold text-cyan-400 block truncate" title={String(evaluation.featureVector.acceptedBallotsPerMin)}>
                  {typeof evaluation.featureVector.acceptedBallotsPerMin === 'number'
                    ? evaluation.featureVector.acceptedBallotsPerMin.toFixed(2)
                    : Number(evaluation.featureVector.acceptedBallotsPerMin || 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block truncate" title={`Δ ${evaluation.featureVector.speedVsBaselineDiff} vs baseline`}>
                  &Delta; {typeof evaluation.featureVector.speedVsBaselineDiff === 'number'
                    ? evaluation.featureVector.speedVsBaselineDiff.toFixed(2)
                    : Number(evaluation.featureVector.speedVsBaselineDiff || 0).toFixed(2)} vs baseline
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Failed Ballots</span>
                <span className={`text-lg font-mono font-bold block truncate ${evaluation.featureVector.failedSubmissionsCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {evaluation.featureVector.failedSubmissionsCount}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">in 15m window</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Duplicate Blocks</span>
                <span className={`text-lg font-mono font-bold block truncate ${evaluation.featureVector.rejectedDuplicateAttempts > 0 ? 'text-rose-400 font-black' : 'text-slate-300'}`}>
                  {evaluation.featureVector.rejectedDuplicateAttempts}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">prevented</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Auth Failures</span>
                <span className={`text-lg font-mono font-bold block truncate ${evaluation.featureVector.authFailuresCount > 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {evaluation.featureVector.authFailuresCount}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">bad logins</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Pending Blockchain</span>
                <span className={`text-lg font-mono font-bold block truncate ${evaluation.featureVector.pendingBlockchainTxCount > 3 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {evaluation.featureVector.pendingBlockchainTxCount}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">queued txs</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Tx Latency</span>
                <span className="text-lg font-mono font-bold text-slate-200 block truncate">
                  {typeof evaluation.featureVector.blockchainLatencySec === 'number'
                    ? evaluation.featureVector.blockchainLatencySec.toFixed(1)
                    : Number(evaluation.featureVector.blockchainLatencySec || 0).toFixed(1)}s
                </span>
                <span className="text-[10px] text-slate-500 block truncate">confirmation age</span>
              </div>
            </div>
          )}

          {/* Model Primary Diagnostics */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Model Diagnostic Rationale
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {evaluation.primaryReason}
            </p>
          </div>

          {/* Gemini AI Diagnostic Explanation */}
          {evaluation.geminiExplanation && (
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini Technical Investigation Advice</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {evaluation.geminiExplanation}
              </p>
            </div>
          )}

          {/* Review Action Trigger */}
          {evaluation.id && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Alert ID: <span className="font-mono text-white font-bold">#{evaluation.id}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedAlertToReview(evaluation);
                  setReviewStatusInput(evaluation.reviewStatus || 'REVIEWED');
                  setAdminNotesInput(evaluation.adminNotes || '');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <FileCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Review &amp; Record Notes</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Historical Anomaly Alerts Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-white text-sm">Persisted Anomaly Audit Trail</h4>
            <p className="text-xs text-slate-400">Historical records of operational alerts flagged by Isolation Forest.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            {['ALL', 'PENDING_REVIEW', 'REVIEWED', 'CONFIRMED_INCIDENT', 'DISMISSED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="py-8 flex justify-center text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
        ) : alertsHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No historical anomaly alerts match filter: <span className="font-bold text-slate-400">{statusFilter}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Election</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Admin Notes</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {alertsHistory.map((al) => (
                  <tr key={al.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">#{al.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{al.electionCode}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(al.observationTimestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                      {typeof al.anomalyScore === 'number'
                        ? al.anomalyScore.toFixed(3)
                        : Number(al.anomalyScore || 0).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getSeverityBadge(al.severity)}`}>
                        {al.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getReviewStatusBadge(al.reviewStatus)}`}>
                        {al.reviewStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={al.adminNotes || ''}>
                      {al.adminNotes || <span className="italic text-slate-600">None</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlertToReview(al);
                          setReviewStatusInput(al.reviewStatus || 'REVIEWED');
                          setAdminNotesInput(al.adminNotes || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-[11px] cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Disclaimer Notice */}
        <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
          * Notice: An anomaly score is a technical heuristic for administrative review, not evidence of misconduct or fraud.
          Anomaly alerts do not invalidate ballots, block voters, or alter election tallies.
        </p>
      </div>

      {/* Review Modal */}
      {selectedAlertToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Review Anomaly Alert #{selectedAlertToReview.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAlertToReview(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Investigation Review Outcome *</label>
                <select
                  value={reviewStatusInput}
                  onChange={(e) => setReviewStatusInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="REVIEWED">REVIEWED (Investigated, standard operational fluctuation)</option>
                  <option value="CONFIRMED_INCIDENT">CONFIRMED_INCIDENT (Technical fault / verified operational incident)</option>
                  <option value="DISMISSED">DISMISSED (Benign false alarm)</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW (Hold for ongoing analysis)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Administrator Investigation Notes</label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Record technical findings, e.g. checked node RPC logs, verified voter retry rate..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAlertToReview(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Saving Review...' : 'Save Review Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
