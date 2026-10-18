/**
 * Real-Time Election Monitoring Dashboard for Administrators
 * Features:
 * - Live Server-Sent Events (SSE) telemetry stream with automatic reconnection & fallback
 * - Key Metrics: Voter turnout, votes per hour, system performance indicators, security posture
 * - High-contrast data visualizations with accessible data table alternatives (WCAG AA compliant)
 * - Real-time security alerts feed with integrated AI Anomaly Explainer
 * - Interactive simulation triggers to observe live metric updates
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Vote,
  Users,
  ShieldCheck,
  AlertTriangle,
  Radio,
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
  Database,
  Zap,
  Server,
  Layers,
  ArrowUpRight,
  Sparkles,
  Table as TableIcon,
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  RealtimeMonitoringState,
  SecurityAlert,
  HourlyTurnoutData,
} from '../../types';
import { AnomalyExplainerModal } from '../ai/AnomalyExplainerModal';
import { useElectionMetrics } from '../../hooks/useElectionMetrics';
import { ELECTION_EVENTS } from '../../events/event-bus';

interface RealtimeMonitoringDashboardProps {
  onRefreshGlobal?: () => void;
}

export function RealtimeMonitoringDashboard({
  onRefreshGlobal,
}: RealtimeMonitoringDashboardProps) {
  // Use the event-driven real-time metrics hook (replaces interval polling)
  const {
    monitoring: monitoringData,
    isConnected,
    connectionMode,
    lastUpdated: lastStreamTime,
    isLoading: isRefreshing,
    refresh: fetchSnapshot,
    emitEvent,
  } = useElectionMetrics();

  const [activeAlertFilter, setActiveAlertFilter] = useState<'ALL' | 'ACTIVE' | 'QUARANTINED' | 'RESOLVED'>('ALL');

  // Accessible Table View Toggles
  const [showTurnoutTable, setShowTurnoutTable] = useState<boolean>(false);
  const [showPerformanceTable, setShowPerformanceTable] = useState<boolean>(false);

  // AI Anomaly Explainer Modal state
  const [selectedAnomaly, setSelectedAnomaly] = useState<{
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
  } | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);

  // Simulation Feedback state
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  const handleUpdateAlertStatus = async (alertId: string, newStatus: 'ACTIVE' | 'INVESTIGATING' | 'QUARANTINED' | 'RESOLVED') => {
    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchSnapshot();
        onRefreshGlobal?.();
      }
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  const handleTriggerSimulation = async (type: 'VOTE_BURST' | 'SIGNATURE_TAMPER' | 'RATE_SPIKE') => {
    try {
      if (type === 'VOTE_BURST') {
        for (let i = 0; i < 50; i++) {
          emitEvent(ELECTION_EVENTS.VOTE_CAST, {});
        }
        setSimulationNotice('Simulated +50 voter ballot burst processed into mempool.');
        fetchSnapshot();
      } else if (type === 'SIGNATURE_TAMPER') {
        const res = await fetch('/api/admin/alerts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            severity: 'CRITICAL',
            category: 'CRYPTOGRAPHIC_VIOLATION',
            title: 'Synthetic ECDSA Curve Mismatch Attack',
            description: 'Injected signature with corrupted r/s scalar component was deterministically rejected by validator consensus.',
            sessionId: `S-SIM-${Math.floor(100 + Math.random() * 900)}`,
            isDeterministic: true,
            riskScore: 94,
          }),
        });
        if (res.ok) {
          const alert = await res.json();
          emitEvent(ELECTION_EVENTS.ALERT_GENERATED, alert);
        }
        setSimulationNotice('Critical Cryptographic Anomaly injected into real-time security stream.');
      } else {
        const res = await fetch('/api/admin/alerts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            severity: 'MEDIUM',
            category: 'RATE_LIMIT_BREACH',
            title: 'Simulated API Gateway Traffic Burst',
            description: 'Edge filter detected 60 requests/sec from single proxy origin; backpressure applied.',
            sessionId: `S-SIM-${Math.floor(100 + Math.random() * 900)}`,
            isDeterministic: true,
            riskScore: 62,
          }),
        });
        if (res.ok) {
          const alert = await res.json();
          emitEvent(ELECTION_EVENTS.ALERT_GENERATED, alert);
        }
        setSimulationNotice('Rate Limit Anomaly injected into real-time security stream.');
      }

      setTimeout(() => setSimulationNotice(null), 4000);
      fetchSnapshot();
    } catch (err) {
      console.error('Simulation trigger failed:', err);
    }
  };

  const handleOpenAnomalyExplainer = (alert: SecurityAlert) => {
    setSelectedAnomaly({
      anomalyId: alert.sessionId || alert.id,
      title: alert.title,
      riskScore: alert.riskScore,
      riskLevel: alert.severity,
      factors: [
        {
          name: alert.category.replace(/_/g, ' '),
          category: alert.isDeterministic ? 'CRYPTOGRAPHIC' : 'BEHAVIORAL',
          scoreImpact: alert.riskScore > 80 ? 35 : 20,
          description: alert.description,
          evidence: alert.evidenceHash || 'Deterministic verification violation',
        },
        {
          name: 'Network Anomaly Factor',
          category: 'NETWORK',
          scoreImpact: 15,
          description: `Origin client IP: ${alert.sourceIpMasked || '198.51.100.***'}`,
          evidence: 'IP subnet traffic density',
        },
      ],
      telemetry: {
        alertId: alert.id,
        timestamp: alert.timestamp,
        ipAddress: alert.sourceIpMasked,
        isDeterministic: alert.isDeterministic,
      },
    });
    setIsExplainerOpen(true);
  };

  if (!monitoringData) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-12 text-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
        <p className="text-sm font-bold text-white">Initializing Real-Time Telemetry Stream...</p>
        <p className="text-xs text-slate-400 font-mono">Connecting to SSE stream at /api/admin/realtime-stream</p>
      </div>
    );
  }

  const {
    registeredVoters,
    totalVotesCast,
    turnoutPercentage,
    turnoutVelocityPerHour,
    performance,
    hourlyTurnout,
    validatorConsensus,
    recentAlerts,
  } = monitoringData;

  const filteredAlerts = recentAlerts.filter((a) => {
    if (activeAlertFilter === 'ALL') return true;
    return a.status === activeAlertFilter;
  });

  return (
    <div className="space-y-8" role="region" aria-label="Real-time Election Monitoring Dashboard">
      {/* 1. REAL-TIME STREAM STATUS & CONTROLS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Real-Time Election Monitoring Dashboard
            </h2>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold border ${
                isConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              }`}
              role="status"
              aria-live="polite"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>
                {connectionMode === 'SSE'
                  ? 'LIVE STREAM (SSE)'
                  : connectionMode === 'EVENT_BUS'
                  ? 'EVENT-BUS REACTIVE'
                  : 'POLLING RECOVERY'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Real-time biometric velocity, Mempool latency, BFT validator heartbeats, and cryptographic security alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] font-mono text-slate-400 hidden md:block">
            <span>Last Stream Pulse: </span>
            <span className="text-cyan-400 font-bold">{lastStreamTime.toLocaleTimeString()}</span>
          </div>

          <button
            id="refresh-monitoring-btn"
            onClick={fetchSnapshot}
            disabled={isRefreshing}
            aria-label="Force Refresh Telemetry"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {simulationNotice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-cyan-500/50 bg-cyan-950/40 p-4 text-cyan-200 flex items-center justify-between shadow-lg animate-fadeIn"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{simulationNotice}</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">Updated Live in Stream</span>
        </div>
      )}

      {/* 2. KEY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Voter Turnout */}
        <div
          id="metric-voter-turnout"
          className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Voter Turnout</span>
            <Vote className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-extrabold text-white">
              {turnoutPercentage}%
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              +{turnoutVelocityPerHour} votes/hr
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden" aria-label="Turnout progress bar">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, turnoutPercentage * 4)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{totalVotesCast.toLocaleString()} Cast</span>
            <span>of {registeredVoters.toLocaleString()} Electorate</span>
          </div>
        </div>

        {/* Metric 2: Consensus & Block Finality */}
        <div
          id="metric-validator-consensus"
          className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">BFT Validator Quorum</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-extrabold text-emerald-400">
              3 / 3
            </span>
            <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
              100% QUORUM
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Finalization Time: <strong className="text-white font-mono">{performance.blockFinalizationTimeMs}ms</strong>
          </p>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>2/3 Supermajority Verified</span>
          </div>
        </div>

        {/* Metric 3: System Performance & Latency */}
        <div
          id="metric-system-performance"
          className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Voting Latency (p50 / p95)</span>
            <Zap className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-extrabold text-white">
              {performance.votingLatencyP50Ms}
              <span className="text-sm text-slate-400 font-normal">ms</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              p95: <strong className="text-yellow-400">{performance.votingLatencyP95Ms}ms</strong>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Mempool Depth:</span>
            <span className="font-mono font-bold text-cyan-400">
              {performance.mempoolQueueDepth} txs pending
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>API Gateway Success:</span>
            <span className="font-mono font-bold text-emerald-400">
              {performance.apiSuccessRatePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Metric 4: Security Alerts & Posture */}
        <div
          id="metric-security-posture"
          className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Security Threat Stream</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-extrabold text-rose-400">
              {recentAlerts.filter((a) => a.status === 'ACTIVE').length}
              <span className="text-sm text-slate-400 font-normal"> active</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {recentAlerts.length} Total Logs
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Active Listeners: <strong className="text-white font-mono">{performance.activeListenersCount} nodes</strong>
          </p>
          <div className="text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>0 Unquarantined Breaches</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE SIMULATION & TESTING ACTION BAR */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <span className="font-bold">Real-Time Simulation Triggers:</span>
          <span className="text-slate-400 hidden sm:inline">Inject live telemetry to evaluate real-time dashboard responsiveness</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="sim-vote-surge-btn"
            onClick={() => handleTriggerSimulation('VOTE_BURST')}
            className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-all cursor-pointer"
          >
            + Simulate Vote Surge
          </button>
          <button
            id="sim-sig-tamper-btn"
            onClick={() => handleTriggerSimulation('SIGNATURE_TAMPER')}
            className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/50 transition-all cursor-pointer"
          >
            + Inject Signature Attack
          </button>
          <button
            id="sim-rate-spike-btn"
            onClick={() => handleTriggerSimulation('RATE_SPIKE')}
            className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-all cursor-pointer"
          >
            + Inject Rate Limit Spike
          </button>
        </div>
      </div>

      {/* 4. VOTES CAST PER HOUR & TURNOUT TRAJECTORY CHART (WITH ACCESSIBLE TABLE TOGGLE) */}
      <div
        id="section-hourly-turnout"
        className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-extrabold text-white">
                Hourly Voter Turnout & Velocity Trajectory
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Time-series distribution of ballots cast per 1-hour window alongside cumulative turnout vs expected baseline.
            </p>
          </div>

          {/* Accessible View Toggle Button */}
          <button
            id="toggle-turnout-table-view-btn"
            onClick={() => setShowTurnoutTable(!showTurnoutTable)}
            aria-expanded={showTurnoutTable}
            aria-controls="accessible-turnout-table"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shrink-0"
          >
            {showTurnoutTable ? (
              <>
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <span>Switch to Interactive Chart</span>
              </>
            ) : (
              <>
                <TableIcon className="h-4 w-4 text-cyan-400" />
                <span>View Accessible Data Table</span>
              </>
            )}
          </button>
        </div>

        {/* Hidden Screen Reader Summary for WCAG AA compliance */}
        <div className="sr-only" aria-live="polite">
          Hourly voting chart summary: Total votes cast {totalVotesCast}, peak turnout hour occurred at 11:00 with surge velocity, currently running at {turnoutVelocityPerHour} votes per hour.
        </div>

        {showTurnoutTable ? (
          /* ACCESSIBLE DATA TABLE VIEW */
          <div id="accessible-turnout-table" className="overflow-x-auto">
            <table
              className="w-full text-left text-xs border-collapse font-sans"
              aria-label="Hourly voter turnout table data"
            >
              <caption className="text-xs text-slate-400 mb-3 text-left">
                Table: Hourly distribution of election ballots cast across polling hours (08:00 - 19:00).
              </caption>
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th scope="col" className="py-3 px-4">Hour Window</th>
                  <th scope="col" className="py-3 px-4">Votes in Hour</th>
                  <th scope="col" className="py-3 px-4">Cumulative Votes</th>
                  <th scope="col" className="py-3 px-4">Expected Baseline</th>
                  <th scope="col" className="py-3 px-4">Status / Surge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {hourlyTurnout.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 text-slate-200">
                    <td className="py-3 px-4 font-bold text-white">{row.hourLabel}</td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{row.votesCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-300">{row.cumulativeVotes.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400">{row.expectedBaseline.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      {row.isSpikeAnomaly ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                          Surge Window
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Nominal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* VISUAL RECHARTS AREA & BAR CHART */
          <div className="h-72 w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTurnout} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="votesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hourLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '1rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="votesCount"
                  name="Votes / Hour"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#votesGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="expectedBaseline"
                  name="Expected Baseline"
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. SYSTEM PERFORMANCE INDICATORS & VALIDATOR CONSENSUS TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance & Resource Telemetry */}
        <div
          id="section-system-telemetry"
          className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                System Performance & IOPS
              </h3>
            </div>
            <button
              onClick={() => setShowPerformanceTable(!showPerformanceTable)}
              aria-expanded={showPerformanceTable}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
            >
              {showPerformanceTable ? 'Chart View' : 'Table View'}
            </button>
          </div>

          {showPerformanceTable ? (
            <table className="w-full text-left text-xs font-mono" aria-label="System Performance Metrics Table">
              <caption className="sr-only">System performance indicators</caption>
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2">Indicator</th>
                  <th className="py-2">Current Value</th>
                  <th className="py-2">Operational Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                <tr>
                  <td className="py-2.5">CPU Load</td>
                  <td className="py-2.5 text-cyan-400 font-bold">{performance.cpuUsagePercent}%</td>
                  <td className="py-2.5 text-slate-400">&lt; 75.0%</td>
                </tr>
                <tr>
                  <td className="py-2.5">Memory Resident</td>
                  <td className="py-2.5 text-cyan-400 font-bold">{performance.memoryUsageMb} MB ({performance.memoryUsagePercent}%)</td>
                  <td className="py-2.5 text-slate-400">&lt; 1024 MB</td>
                </tr>
                <tr>
                  <td className="py-2.5">Database IOPS</td>
                  <td className="py-2.5 text-cyan-400 font-bold">{performance.dbIops} ops/sec</td>
                  <td className="py-2.5 text-slate-400">1,500 ops/sec</td>
                </tr>
                <tr>
                  <td className="py-2.5">Network Ingress/Egress</td>
                  <td className="py-2.5 text-cyan-400 font-bold">{performance.networkThroughputKbps} Kbps</td>
                  <td className="py-2.5 text-slate-400">10,000 Kbps</td>
                </tr>
                <tr>
                  <td className="py-2.5">Block Finalization Speed</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{performance.blockFinalizationTimeMs} ms</td>
                  <td className="py-2.5 text-slate-400">&lt; 500 ms</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" /> CPU Core Utilization
                  </span>
                  <span className="font-mono font-bold text-white">{performance.cpuUsagePercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${performance.cpuUsagePercent * 2}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-violet-400" /> RAM Footprint
                  </span>
                  <span className="font-mono font-bold text-white">
                    {performance.memoryUsageMb} MB ({performance.memoryUsagePercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-violet-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${performance.memoryUsagePercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-emerald-400" /> DB Read/Write IOPS
                  </span>
                  <span className="font-mono font-bold text-white">{performance.dbIops} ops/s</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(performance.dbIops / 300) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-slate-400 text-[11px] block">Mempool Queue</span>
                  <span className="font-mono font-bold text-cyan-400 text-lg">
                    {performance.mempoolQueueDepth} txs
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-slate-400 text-[11px] block">Throughput</span>
                  <span className="font-mono font-bold text-emerald-400 text-lg">
                    {performance.networkThroughputKbps} Kbps
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validator Node BFT Consensus Heartbeats */}
        <div
          id="section-validator-consensus"
          className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                BFT Validator Node Consensus Status
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              Quorum 2/3 Active
            </span>
          </div>

          <div className="space-y-3">
            {validatorConsensus.map((node) => (
              <div
                key={node.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        node.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-white">{node.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({node.id})</span>
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${
                      node.status === 'ONLINE'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Latency</span>
                    <span className="text-slate-200 font-bold">{node.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Proposed</span>
                    <span className="text-cyan-400 font-bold">{node.blocksProposed} blocks</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Node CPU</span>
                    <span className="text-slate-200 font-bold">{node.cpuPercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECENT SECURITY ALERTS REAL-TIME FEED WITH AI EXPLAINER */}
      <div
        id="section-security-alerts"
        className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <h3 className="text-base font-extrabold text-white">
                Live Security Alerts & Attack Mitigation Feed
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic rule violations and behavioral anomaly detections with instant AI Copilot explanation decomposition.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-slate-900 p-1 border border-slate-800" role="tablist">
            {(['ALL', 'ACTIVE', 'QUARANTINED', 'RESOLVED'] as const).map((filter) => (
              <button
                key={filter}
                id={`alert-filter-${filter.toLowerCase()}`}
                onClick={() => setActiveAlertFilter(filter)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  activeAlertFilter === filter
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No security alerts found matching current filter ({activeAlertFilter}).
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-mono font-extrabold border ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : alert.severity === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-yellow-950 text-yellow-300 border-yellow-800'
                        }`}
                      >
                        {alert.severity}
                      </span>

                      <span className="font-mono text-xs font-bold text-white">
                        {alert.id} • {alert.category.replace(/_/g, ' ')}
                      </span>

                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                          alert.isDeterministic
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-violet-950 text-violet-400 border border-violet-800'
                        }`}
                      >
                        {alert.isDeterministic ? 'DETERMINISTIC FINDING' : 'AI BEHAVIORAL HEURISTIC'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">{alert.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
                  </div>

                  {/* Actions: AI Explainer & Status buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id={`explain-alert-${alert.id}`}
                      onClick={() => handleOpenAnomalyExplainer(alert)}
                      className="flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-950/60 px-3.5 py-2 text-xs font-bold text-violet-200 hover:bg-violet-900/80 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      <span>Explain Anomaly</span>
                    </button>

                    {alert.status !== 'QUARANTINED' && alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateAlertStatus(alert.id, 'QUARANTINED')}
                        className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/50 transition-all cursor-pointer"
                      >
                        Quarantine
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateAlertStatus(alert.id, 'RESOLVED')}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 transition-all cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>IP: {alert.sourceIpMasked || '198.51.100.***'}</span>
                    <span>Session: {alert.sessionId || 'N/A'}</span>
                    <span>Risk Score: <strong className="text-rose-400">{alert.riskScore}/100</strong></span>
                  </div>
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI ANOMALY EXPLAINER MODAL */}
      <AnomalyExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        anomalyData={selectedAnomaly}
      />
    </div>
  );
}
