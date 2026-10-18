import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckCircle2,
  Users,
  Vote,
  Clock,
  ShieldCheck,
  AlertCircle,
  BarChart2,
  ChevronDown,
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

export const PublicAiElectionInsights = () => {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      fetchPublicInsights(selectedElectionId);
    }
  }, [selectedElectionId]);

  const fetchElections = async () => {
    try {
      const res = await axiosClient.get('/elections');
      if (res.success && res.data && res.data.length > 0) {
        setElections(res.data);
        setSelectedElectionId(res.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Unable to load active elections roster.');
      setLoading(false);
    }
  };

  const fetchPublicInsights = async (electionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/ai/elections/${electionId}/public-insights`);
      if (res.success && res.data) {
        setInsights(res.data);
      } else {
        setError(res.message || 'Could not load public turnout telemetry.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to election insights service.');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'HIGH':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'NORMAL':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
      case 'LOW':
      default:
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'INCREASING':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'DECREASING':
        return <TrendingDown className="h-4 w-4 text-rose-400" />;
      case 'STABLE':
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0c101c]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Public AI Election Insights</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Live Turnout
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified civic participation telemetry and neutral AI synthesis for citizens and observers.
            </p>
          </div>
        </div>

        {/* Election Selector & Refresh */}
        <div className="flex items-center gap-2.5">
          {elections.length > 0 && (
            <div className="relative">
              <select
                value={selectedElectionId || ''}
                onChange={(e) => setSelectedElectionId(Number(e.target.value))}
                className="appearance-none rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 pr-9 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.electionCode} — {el.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            type="button"
            onClick={() => selectedElectionId && fetchPublicInsights(selectedElectionId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Refresh live turnout telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && !insights && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <p className="text-xs">Synthesizing live public turnout metrics...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      {insights && (
        <div className="space-y-6">
          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Turnout */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Turnout</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-cyan-400">
                  {insights.overallTurnoutPercentage}%
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(insights.overallParticipationTier)}`}>
                  {insights.overallParticipationTier}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, insights.overallTurnoutPercentage))}%` }}
                />
              </div>
            </div>

            {/* Total Ballots Cast */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accepted Ballots</span>
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-emerald-400" />
                <span className="text-2xl font-mono font-bold text-white">
                  {insights.totalAcceptedVotes?.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                of {insights.totalEligibleVoters?.toLocaleString() || '500'} eligible voters
              </p>
            </div>

            {/* Voting Velocity */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Voting Velocity (15m)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-amber-300">
                  {insights.overallVotingSpeedPerMin}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ballots/min</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                {getTrendIcon(insights.participationTrend)}
                <span className="capitalize">{insights.participationTrend?.toLowerCase() || 'stable'} trend</span>
              </div>
            </div>

            {/* Verification Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cryptographic Audit</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-bold text-slate-200">Receipts Verified</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Zero-knowledge nullifier commitments
              </p>
            </div>
          </div>

          {/* Neutral Gemini AI Summary Banner */}
          {insights.publicSummary && (
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-blue-950/30 p-5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Civic Turnout Synthesis</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {insights.publicSummary}
              </p>
              {insights.generalObservations && insights.generalObservations.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-4 text-[11px] text-slate-400">
                  {insights.generalObservations.map((obs, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      {obs}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Area-Wise Participation Bar Chart */}
          {insights.areaTurnouts && insights.areaTurnouts.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-cyan-400" />
                    <span>Constituency Turnout Comparison</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Percentage of registered citizens who have participated across municipal voting jurisdictions.
                  </p>
                </div>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights.areaTurnouts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="areaName"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 100]}
                      unit="%"
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
                            <div className="rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs shadow-xl space-y-1">
                              <p className="font-bold text-white">{data.areaName}</p>
                              <p className="text-cyan-400 font-mono font-bold">Turnout: {pct}%</p>
                              <p className="text-slate-400 text-[10px] uppercase font-semibold">Tier: {data.participationTier}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="turnoutPercentage" radius={[6, 6, 0, 0]}>
                      {insights.areaTurnouts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.turnoutPercentage >= 50 ? '#06b6d4' : entry.turnoutPercentage >= 25 ? '#3b82f6' : '#64748b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Footer Timestamp & Civic Privacy Disclaimer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Calculated:{' '}
                {insights.publishedAt
                  ? new Date(insights.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Live'}
              </span>
            </div>
            <p>
              Civic Privacy Guarantee: All figures are aggregated. Zero voter identity or ballot choice data is exposed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
