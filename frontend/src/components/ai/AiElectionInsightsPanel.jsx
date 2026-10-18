import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Activity,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  BarChart2,
  Cpu,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AnomalyDetectionPanel } from './AnomalyDetectionPanel';

export const AiElectionInsightsPanel = ({ elections = [] }) => {
  const [activeSection, setActiveSection] = useState('ANOMALY_DETECTION');
  const [selectedElectionId, setSelectedElectionId] = useState(
    elections.length > 0 ? elections[0].id : 1
  );
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedElectionId) {
      fetchInsights(selectedElectionId);
    }
  }, [selectedElectionId]);

  const fetchInsights = async (electionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/ai/elections/${electionId}/insights`);
      if (res.success && res.data) {
        setInsights(res.data);
      } else {
        setError(res.message || 'Failed to fetch AI election insights');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to AI analytics service');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'HIGH':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'NORMAL':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  const getBarColor = (tier) => {
    switch (tier) {
      case 'HIGH':
        return '#10b981';
      case 'NORMAL':
        return '#06b6d4';
      default:
        return '#f59e0b';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs: Isolation Forest Anomaly Detection vs Area Turnout & Velocity */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={() => setActiveSection('ANOMALY_DETECTION')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'ANOMALY_DETECTION'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <span>Isolation Forest Anomaly Detection</span>
          <span className="ml-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200">
            ML Security
          </span>
        </button>

        <button
          onClick={() => setActiveSection('TURNOUT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'TURNOUT'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
          }`}
        >
          <BarChart2 className="h-4 w-4 text-cyan-400" />
          <span>Area Turnout &amp; Voting Velocity</span>
          <span className="ml-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200">
            Gemini AI
          </span>
        </button>
      </div>

      {activeSection === 'ANOMALY_DETECTION' ? (
        <AnomalyDetectionPanel elections={elections} />
      ) : (
        <div className="space-y-6">
          {/* Panel Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Google Gemini AI Analytics</span>
                <span className="text-[10px] text-slate-400">• Grounded Insights</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Area-Wise Turnout &amp; Voting Velocity Dashboard
              </h2>
          <p className="text-xs text-slate-400">
            Real-time civic turnout analytics, 15-minute sliding velocity, and automated Gemini intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Election Selector */}
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(Number(e.target.value))}
            className="flex-1 sm:w-64 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {elections.map((el) => (
              <option key={el.id} value={el.id}>
                {el.name} ({el.electionCode})
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchInsights(selectedElectionId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh AI insights"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading && !insights && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-300 font-medium">
            Calculating turnout velocity and querying Gemini AI...
          </p>
          <p className="text-xs text-slate-500 mt-1">Grounding statistics in accepted MySQL ballot timestamps</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {insights && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Turnout Percentage */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Overall Turnout</span>
                <TrendingUp className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-bold text-white">
                {typeof insights.overallTurnoutPercentage === 'number'
                  ? insights.overallTurnoutPercentage.toFixed(1)
                  : Number(insights.overallTurnoutPercentage || 0).toFixed(1)}%
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>{insights.totalAcceptedVotes} / {insights.totalEligibleVoters} Ballots</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierColor(insights.overallParticipationTier)}`}>
                  {insights.overallParticipationTier}
                </span>
              </div>
            </div>

            {/* Voting Speed */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Voting Speed (15m)</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-bold text-emerald-400">
                {typeof insights.overallVotingSpeedPerMin === 'number'
                  ? insights.overallVotingSpeedPerMin.toFixed(2)
                  : Number(insights.overallVotingSpeedPerMin || 0).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">/min</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Velocity change:{' '}
                <span className={insights.overallSpeedChangePercentage >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {insights.overallSpeedChangePercentage >= 0 ? '+' : ''}
                  {typeof insights.overallSpeedChangePercentage === 'number'
                    ? insights.overallSpeedChangePercentage.toFixed(1)
                    : Number(insights.overallSpeedChangePercentage || 0).toFixed(1)}%
                </span>
              </p>
            </div>

            {/* Blockchain Synchronization */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>On-Chain Sync</span>
                <Layers className="h-4 w-4 text-violet-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-bold text-violet-300">
                {insights.confirmedBlockchainTransactions}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {insights.pendingBlockchainTransactions} Pending • {insights.failedBlockchainTransactions} Failed
              </p>
            </div>

            {/* AI Engine Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>AI Model</span>
                <Cpu className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="mt-2 text-xs font-mono font-bold text-cyan-300 leading-snug line-clamp-2" title={insights.modelUsed}>
                {insights.modelUsed}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {insights.aiGeneratedAt ? new Date(insights.aiGeneratedAt).toLocaleTimeString() : 'Recent'}
                </span>
              </p>
            </div>
          </div>

          {/* Area-Wise Participation Visualizer (Recharts) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-cyan-400" />
                  <span>Area-Wise Voter Turnout Comparison</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Turnout percentage across primary and comparative metropolitan areas.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> High (&gt;60%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 inline-block" /> Normal (20-60%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> Low (&lt;20%)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.areaMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="areaName"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const pct = typeof data.turnoutPercentage === 'number'
                          ? data.turnoutPercentage.toFixed(1)
                          : Number(data.turnoutPercentage || 0).toFixed(1);
                        return (
                          <div className="rounded-2xl border border-slate-700 bg-slate-950/95 backdrop-blur-md p-3.5 text-xs shadow-2xl space-y-1.5">
                            <p className="font-bold text-white text-sm">{data.areaName}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-mono font-bold text-sm">
                                Turnout: {pct}%
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(data.participationTier)}`}>
                                {data.participationTier}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] font-mono">
                              {data.acceptedVotes} / {data.eligibleVoters} votes cast
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="turnoutPercentage" radius={[4, 4, 0, 0]}>
                    {insights.areaMetrics.map((entry, idx) => {
                      const tier = (entry.participationTier || '').toUpperCase();
                      const barFill = tier === 'HIGH' || entry.turnoutPercentage >= 60
                        ? '#10b981'
                        : tier === 'NORMAL' || entry.turnoutPercentage >= 20
                        ? '#06b6d4'
                        : '#f59e0b';
                      return <Cell key={`cell-${idx}`} fill={barFill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Grounded Synthesis Panel */}
          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-[#0A0D16] p-6 shadow-xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Gemini AI Executive Synthesis</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Grounded in Accepted Ballots</span>
              </span>
            </div>

            {/* Summary */}
            <div className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
              {insights.summary}
            </div>

            {/* Observations & Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Observations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Key Observations</span>
                </h4>
                <ul className="space-y-1.5">
                  {insights.observations?.map((obs, i) => (
                    <li key={i} className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50 flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Operational Recommendations</span>
                </h4>
                <ul className="space-y-1.5">
                  {insights.recommendations?.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Limitations & Methodology Disclaimer */}
            {insights.limitations && insights.limitations.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-400">Analytical Limitations: </span>
                  {insights.limitations.join(' ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
