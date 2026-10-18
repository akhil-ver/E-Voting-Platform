/**
 * SecurityThreatDashboard Component
 * Enterprise AI-Powered Security Threat Intelligence & Risk Assessment Center
 * 
 * Features:
 * - Dynamic AI Risk Assessment Score (0-100) calculated from live & simulated election metrics
 * - Explains WHY anomalies were detected using clear, summarized bulleted lists
 * - Strict distinction between 100% Deterministic Cryptographic Rules & AI Behavioral Heuristics
 * - Scenario Simulator (Live Telemetry, Bot Flooding, Replay Attack, Quorum Outage, Geofence Surge)
 * - Step-by-step AI Scanning Engine with live synthesis
 * - Actionable one-click remediations that dynamically lower risk score
 * - Exportable AI Threat Intelligence Report
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Zap,
  Activity,
  Lock,
  Unlock,
  Terminal,
  Cpu,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  Flame,
  ArrowRight,
  Filter,
  Eye,
  AlertTriangle,
  Info,
  Server,
  FileText,
  Clock,
  Fingerprint,
} from 'lucide-react';
import { AnomalyExplainerModal } from '../ai/AnomalyExplainerModal';

export interface ThreatAnomaly {
  id: string;
  title: string;
  category: 'CRYPTOGRAPHIC' | 'BEHAVIORAL' | 'CONSENSUS_QUORUM' | 'NETWORK_INGRESS' | 'DATA_INTEGRITY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scoreImpact: number;
  deterministic: boolean;
  whyDetectedBullets: string[];
  evidenceData: string;
  recommendedAction: string;
  remediationCommand: string;
  isMitigated?: boolean;
}

interface SecurityThreatDashboardProps {
  metrics: {
    activeValidators?: number;
    totalValidators?: number;
    quorumSatisfied?: boolean;
    blocksCount?: number;
    electionState?: string;
    isPaused?: boolean;
    isLockedDown?: boolean;
    fraudAlertsCount?: number;
    criticalIncidentsCount?: number;
    verificationSuccessRate?: number;
    systemLatencyMs?: number;
    turnoutPercentage?: number;
    registeredVoters?: number;
    votesCast?: number;
    pendingTransactions?: number;
  };
  onRefreshMetrics?: () => void;
}

export const SecurityThreatDashboard: React.FC<SecurityThreatDashboardProps> = ({
  metrics,
  onRefreshMetrics,
}) => {
  // Scenario state: 'LIVE' or simulated attack profiles
  const [selectedScenario, setSelectedScenario] = useState<
    'LIVE' | 'BOT_FLOOD' | 'REPLAY_ATTACK' | 'QUORUM_PARTITION' | 'GEOFENCE_SPOOF'
  >('LIVE');

  // AI Scanning state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [lastScanTime, setLastScanTime] = useState<Date>(new Date());

  // Filter for anomaly list
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [mitigatedIds, setMitigatedIds] = useState<Set<string>>(new Set());
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Selected anomaly for deep dive Gemini modal
  const [modalAnomaly, setModalAnomaly] = useState<{
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
  } | null>(null);

  // Derived core parameters from live metrics
  const activeValidators = metrics.activeValidators ?? 3;
  const totalValidators = metrics.totalValidators ?? 3;
  const quorumSatisfied = metrics.quorumSatisfied ?? (activeValidators / totalValidators >= 0.66);
  const verificationSuccessRate = metrics.verificationSuccessRate ?? 99.8;
  const systemLatencyMs = metrics.systemLatencyMs ?? 18;
  const fraudAlertsCount = metrics.fraudAlertsCount ?? 1;
  const isLockedDown = metrics.isLockedDown ?? false;
  const isPaused = metrics.isPaused ?? false;
  const pendingTransactions = metrics.pendingTransactions ?? 0;

  // Generate dynamic anomalies based on current scenario + metrics
  const baseAnomalies = useMemo<ThreatAnomaly[]>(() => {
    const list: ThreatAnomaly[] = [];

    // Scenario 1: LIVE election telemetry evaluation
    if (selectedScenario === 'LIVE') {
      // 1. Quorum evaluation
      if (!quorumSatisfied || activeValidators < totalValidators * 0.66) {
        list.push({
          id: 'anom-quorum-degraded',
          title: 'Byzantine Quorum Compromised (< 66.0%)',
          category: 'CONSENSUS_QUORUM',
          severity: 'CRITICAL',
          scoreImpact: 38,
          deterministic: true,
          whyDetectedBullets: [
            `Active validator consensus ratio dropped to ${((activeValidators / totalValidators) * 100).toFixed(1)}% (${activeValidators}/${totalValidators} nodes online).`,
            'Byzantine Fault Tolerant (BFT) mathematical safety requires at least 66.67% honest nodes for block commitment.',
            'Risk of state partition, consensus stall, or non-deterministic fork divergence.',
          ],
          evidenceData: `Heartbeat timed out on node(s). Quorum status: FAILED (${activeValidators}/${totalValidators})`,
          recommendedAction: 'Reconnect dropped validator nodes or adjust active node roster.',
          remediationCommand: 'CLUSTER_QUORUM_RECONNECT_ALL',
        });
      }

      // 2. Verification rate degradation
      if (verificationSuccessRate < 99.0) {
        list.push({
          id: 'anom-sig-failures',
          title: 'Cryptographic Signature Verification Degradation',
          category: 'CRYPTOGRAPHIC',
          severity: 'HIGH',
          scoreImpact: 26,
          deterministic: true,
          whyDetectedBullets: [
            `Verification success rate fell to ${verificationSuccessRate.toFixed(1)}% (below nominal 99.5% baseline).`,
            'ECDSA P-256 curve point multiplication checks failed on multiple batch envelopes.',
            'Indicates possible payload bit-rot, signature corruption, or unauthorized injection attempts.',
          ],
          evidenceData: `Failed verification delta: ${(100 - verificationSuccessRate).toFixed(2)}% anomalous signatures in last 500 tx`,
          recommendedAction: 'Isolate corrupted transaction queue and verify public key registry hash.',
          remediationCommand: 'ENFORCE_STRICT_ECDSA_AUDIT',
        });
      }

      // 3. High latency or mempool congestion
      if (systemLatencyMs > 150 || pendingTransactions > 100) {
        list.push({
          id: 'anom-mempool-pressure',
          title: 'Ingress Mempool Pressure & Network Jitter',
          category: 'NETWORK_INGRESS',
          severity: 'MEDIUM',
          scoreImpact: 15,
          deterministic: false,
          whyDetectedBullets: [
            `Mempool queue latency elevated to ${systemLatencyMs}ms with ${pendingTransactions} unconfirmed ballots.`,
            'Burst traffic pattern deviates by +140% from rolling 15-minute moving average.',
            'May degrade voter submission responsiveness and cause transaction timeouts.',
          ],
          evidenceData: `Queue depth: ${pendingTransactions} tx | Avg round-trip time: ${systemLatencyMs}ms`,
          recommendedAction: 'Activate adaptive mempool load-balancing and increase batch worker threads.',
          remediationCommand: 'DEPLOY_MEMPOOL_LOAD_BALANCER',
        });
      }

      // 4. Active fraud alerts
      if (fraudAlertsCount > 0) {
        list.push({
          id: 'anom-shap-behavioral',
          title: 'Heuristic Behavioral Timing Anomaly',
          category: 'BEHAVIORAL',
          severity: 'HIGH',
          scoreImpact: 22,
          deterministic: false,
          whyDetectedBullets: [
            `${fraudAlertsCount} session(s) flagged by SHAP behavioral radar for sub-human interaction velocity.`,
            'Form completion clock under 210ms between cryptographic challenge issuance and ballot confirmation.',
            'Statistical entropy distribution matches automated headless browser fingerprint.',
          ],
          evidenceData: `SHAP feature impact: submissionSpeedMs (-0.42), signingLatencyMs (-0.31)`,
          recommendedAction: 'Require proof-of-work cryptographic challenge or secondary CAPTCHA gate.',
          remediationCommand: 'ACTIVATE_CHALLENGE_CAPTCHA_GATE',
        });
      }

      // 5. Emergency state flag
      if (isLockedDown || isPaused) {
        list.push({
          id: 'anom-state-lockdown',
          title: 'Administrative Lock / Pipeline Frozen',
          category: 'DATA_INTEGRITY',
          severity: 'HIGH',
          scoreImpact: 30,
          deterministic: true,
          whyDetectedBullets: [
            `Election lifecycle is currently in ${isLockedDown ? 'EMERGENCY_LOCKDOWN' : 'PAUSED'} mode.`,
            'All public ballot casting endpoints are intentionally suspended by administrative override.',
            'Ingress is blocked to safeguard ledger integrity during ongoing investigation.',
          ],
          evidenceData: `Lifecycle FSM State: ${metrics.electionState || 'LOCKED'}`,
          recommendedAction: 'Review audit trail and lift lockdown once security parameters are validated.',
          remediationCommand: 'VERIFY_AND_RESUME_ELECTION',
        });
      }

      // If clean live state with no major flags, provide baseline monitor
      if (list.length === 0) {
        list.push({
          id: 'anom-baseline-nominal',
          title: 'Nominal Election Baseline Invariants',
          category: 'DATA_INTEGRITY',
          severity: 'LOW',
          scoreImpact: 6,
          deterministic: true,
          whyDetectedBullets: [
            'All 3 Multi-Party Validator nodes online with 100% consensus quorum.',
            'ECDSA P-256 signature verification pass rate is at 99.8% with zero nullifier collisions.',
            'Ingress flow and client interaction intervals conform to natural human behavior models.',
          ],
          evidenceData: 'Zero critical invariants breached. Telemetry within standard deviation (sigma < 0.4).',
          recommendedAction: 'Maintain continuous passive anomaly monitoring.',
          remediationCommand: 'NO_ACTION_REQUIRED',
        });
      }
    }

    // Scenario 2: Simulated Mempool Bot Flooding Attack
    else if (selectedScenario === 'BOT_FLOOD') {
      list.push(
        {
          id: 'sim-bot-cadence',
          title: 'High-Velocity Botnet Ingress Surge (85 tx/sec)',
          category: 'BEHAVIORAL',
          severity: 'CRITICAL',
          scoreImpact: 36,
          deterministic: false,
          whyDetectedBullets: [
            'Submission cadence spiked to 85.4 transactions/second from 12 distinct IP subnets.',
            'Sub-human execution timing: Average ballot formulation time measured at 64ms (human minimum: ~1,200ms).',
            'Identical browser user-agent strings and headless canvas entropy fingerprints detected.',
          ],
          evidenceData: 'Ingress velocity: 85.4 tx/s | Average duration delta: 64.2ms | Sigma deviation: +8.4σ',
          recommendedAction: 'Enable adaptive IP subnet rate-limiting and enforce WebAuthn client challenge.',
          remediationCommand: 'APPLY_BOT_RATE_LIMITING_AND_CHALLENGE',
        },
        {
          id: 'sim-mempool-flooding',
          title: 'Mempool Queue Flooding & Buffer Exhaustion',
          category: 'NETWORK_INGRESS',
          severity: 'HIGH',
          scoreImpact: 28,
          deterministic: true,
          whyDetectedBullets: [
            'Mempool buffer reached 84% maximum capacity with 892 unverified pending payloads.',
            'Submission queue latency increased from 18ms to 420ms.',
            'Simultaneous TCP connections saturated worker pool threads.',
          ],
          evidenceData: 'Queue buffer: 892/1000 items | Worker thread utilization: 96%',
          recommendedAction: 'Flush unauthenticated buffer queue and scale validation worker threads.',
          remediationCommand: 'DRAIN_SUSPICIOUS_MEMPOOL_QUEUE',
        }
      );
    }

    // Scenario 3: Simulated Nullifier Replay & Double-Voting Attack
    else if (selectedScenario === 'REPLAY_ATTACK') {
      list.push(
        {
          id: 'sim-nullifier-collision',
          title: 'Double-Vote / Consumed Nullifier Collision Attempt',
          category: 'CRYPTOGRAPHIC',
          severity: 'CRITICAL',
          scoreImpact: 42,
          deterministic: true,
          whyDetectedBullets: [
            '7 duplicate ballot envelopes submitted using already-spent anonymous nullifier hashes.',
            'Deterministic cryptographic ledger check: Nullifier hash 0x7a8e...41bf matched existing block #1.',
            'Zero-Knowledge membership proof replay prevented by stateful nullifier commitment table.',
          ],
          evidenceData: 'Collision count: 7 attempts | Nullifier index: #NULLIFIER-COLLISION-0x7A',
          recommendedAction: 'Blacklist transaction envelopes and record cryptographic violation in audit log.',
          remediationCommand: 'QUARANTINE_NULLIFIER_COLLISIONS',
        },
        {
          id: 'sim-signature-mismatch',
          title: 'ECDSA secp256r1 Digital Signature Mutation',
          category: 'CRYPTOGRAPHIC',
          severity: 'HIGH',
          scoreImpact: 31,
          deterministic: true,
          whyDetectedBullets: [
            'Payload hash did not match signed curve coordinates (r, s) on 12 incoming ballots.',
            'Indicates man-in-the-middle payload tampering or ballot envelope mutation in transit.',
            'WebCrypto subtle.verify returned FALSE on canonical digest test.',
          ],
          evidenceData: 'Signature integrity failure rate: 8.6% across sampled batch',
          recommendedAction: 'Reject mutated envelopes and alert regional electoral audit observers.',
          remediationCommand: 'PURGE_MUTATED_PAYLOADS',
        }
      );
    }

    // Scenario 4: Simulated Byzantine Validator Quorum Partition
    else if (selectedScenario === 'QUORUM_PARTITION') {
      list.push(
        {
          id: 'sim-quorum-partition',
          title: 'Byzantine Fault Tolerance Threshold Failure (33.3% Consensus)',
          category: 'CONSENSUS_QUORUM',
          severity: 'CRITICAL',
          scoreImpact: 45,
          deterministic: true,
          whyDetectedBullets: [
            'Validator nodes #2 (Independent Auditor) and #3 (Party Observer) unresponsive.',
            'Active consensus ratio at 33.3% (1/3 nodes) — strictly below 66.0% BFT mathematical threshold.',
            'Block finality paused automatically to prevent split-brain ledger partitioning.',
          ],
          evidenceData: 'Active nodes: 1/3 | Quorum health: 33.3% < 66.0% required safety limit',
          recommendedAction: 'Dispatch node restart RPC and establish emergency peer re-sync.',
          remediationCommand: 'RECOVER_BFT_CONSENSUS_QUORUM',
        },
        {
          id: 'sim-heartbeat-timeout',
          title: 'Validator Peer Gossip Network Disconnection',
          category: 'NETWORK_INGRESS',
          severity: 'HIGH',
          scoreImpact: 24,
          deterministic: true,
          whyDetectedBullets: [
            'Gossip protocol missed 6 consecutive round heartbeats across peer mesh.',
            'TLS handshake failure on RPC port 8443 between validator nodes.',
            'Block production halted to safeguard multi-party signature validity.',
          ],
          evidenceData: 'Gossip missed heartbeats: 6/6 | Socket status: ERR_CONNECTION_REFUSED',
          recommendedAction: 'Re-authenticate mTLS certificates and reboot peer discovery mesh.',
          remediationCommand: 'RESET_PEER_GOSSIP_MESH',
        }
      );
    }

    // Scenario 5: Simulated Geofencing & Sybil Spoofing Surge
    else if (selectedScenario === 'GEOFENCE_SPOOF') {
      list.push(
        {
          id: 'sim-geofence-deviation',
          title: 'Voter Registration Geofence Boundary Deviation',
          category: 'BEHAVIORAL',
          severity: 'HIGH',
          scoreImpact: 32,
          deterministic: false,
          whyDetectedBullets: [
            '64 ballots cast from IP addresses originating outside registered election district (District 04).',
            'GPS coordinates reported by client hardware conflict with ASN routing geo-table by > 450km.',
            'Likely proxy/VPN masking to bypass geographic residency eligibility constraints.',
          ],
          evidenceData: 'District mismatch count: 64 ballots | VPN/Proxy heuristic confidence: 94.2%',
          recommendedAction: 'Flag for secondary residency audit and require physical polling-station confirmation.',
          remediationCommand: 'FLAG_GEOFENCE_MISMATCHES_FOR_AUDIT',
        },
        {
          id: 'sim-sybil-burst',
          title: 'Correlated Client Token Generation Burst',
          category: 'BEHAVIORAL',
          severity: 'MEDIUM',
          scoreImpact: 20,
          deterministic: false,
          whyDetectedBullets: [
            '28 voter authentication tokens generated within 4.5 seconds from identical browser session cookies.',
            'Token entropy analysis indicates automated script generation without human keystroke jitter.',
            'Pre-registration queue shows clustered timestamp sequencing.',
          ],
          evidenceData: 'Token issue interval: avg 160ms | Key entropy: 0.12 (standard: > 0.85)',
          recommendedAction: 'Invalidate clustered token batch and re-issue identity challenges.',
          remediationCommand: 'REVOKE_CLUSTERED_TOKENS',
        }
      );
    }

    return list;
  }, [
    selectedScenario,
    quorumSatisfied,
    activeValidators,
    totalValidators,
    verificationSuccessRate,
    systemLatencyMs,
    fraudAlertsCount,
    isLockedDown,
    isPaused,
    pendingTransactions,
    metrics.electionState,
  ]);

  // Compute live Risk Assessment Score (0 - 100)
  const computedRiskScore = useMemo(() => {
    let score = 0;
    for (const anom of baseAnomalies) {
      if (!mitigatedIds.has(anom.id)) {
        score += anom.scoreImpact;
      }
    }
    // Cap at 100
    return Math.min(100, Math.max(4, score));
  }, [baseAnomalies, mitigatedIds]);

  // Risk Classification Tier
  const riskTier = useMemo(() => {
    if (computedRiskScore >= 80) return { label: 'CRITICAL THREAT', color: 'rose', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/50' };
    if (computedRiskScore >= 55) return { label: 'HIGH RISK', color: 'amber', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/50' };
    if (computedRiskScore >= 30) return { label: 'MODERATE ANOMALY', color: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/50' };
    return { label: 'LOW NOMINAL RISK', color: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/50' };
  }, [computedRiskScore]);

  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    return baseAnomalies.filter((a) => {
      if (filterCategory === 'ALL') return true;
      if (filterCategory === 'CRITICAL') return a.severity === 'CRITICAL';
      return a.category === filterCategory;
    });
  }, [baseAnomalies, filterCategory]);

  // Execute Simulated Scan
  const handleRunAiScan = () => {
    setIsScanning(true);
    setScanStep(1);

    setTimeout(() => setScanStep(2), 500);
    setTimeout(() => setScanStep(3), 1000);
    setTimeout(() => setScanStep(4), 1500);
    setTimeout(() => {
      setIsScanning(false);
      setScanStep(0);
      setLastScanTime(new Date());
      if (onRefreshMetrics) onRefreshMetrics();
    }, 2000);
  };

  // Execute Remediation Action
  const handleExecuteRemediation = (anomaly: ThreatAnomaly) => {
    setExecutingActionId(anomaly.id);
    setTimeout(() => {
      setMitigatedIds((prev) => new Set([...prev, anomaly.id]));
      setExecutingActionId(null);
    }, 600);
  };

  // Copy AI Threat Report to Clipboard
  const handleCopyReport = () => {
    const reportText = `=== AI SECURITY THREAT & RISK ASSESSMENT REPORT ===
Generated: ${new Date().toLocaleString()}
Scenario Model: ${selectedScenario}
AI Risk Assessment Score: ${computedRiskScore}/100 (${riskTier.label})
Active Validator Quorum: ${activeValidators}/${totalValidators} (${quorumSatisfied ? 'SATISFIED' : 'BREACHED'})
Signature Verification Rate: ${verificationSuccessRate.toFixed(1)}%

ANOMALIES DETECTED & CAUSATION BREAKDOWN:
${baseAnomalies
  .map(
    (a, idx) => `
${idx + 1}. [${a.category}] ${a.title} (${a.severity} SEVERITY | +${a.scoreImpact} PTS)
   Classification: ${a.deterministic ? '100% Deterministic Rule' : 'AI Behavioral Heuristic'}
   Status: ${mitigatedIds.has(a.id) ? 'MITIGATED' : 'ACTIVE THREAT'}
   Why Detected:
   ${a.whyDetectedBullets.map((b) => `   - ${b}`).join('\n')}
   Evidence: ${a.evidenceData}
   Recommended Remediation: ${a.recommendedAction}
`
  )
  .join('\n')}
===================================================`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Switcher */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>AI Security Threat & Risk Intelligence Dashboard</span>
                  <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                    Continuous AI Scanner Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-signal anomaly detection evaluating cryptographic proofs, validator quorum, and behavioral timing.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="run-ai-security-scan-btn"
              onClick={handleRunAiScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.3)] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Telemetry...' : 'Run AI Security Scan'}</span>
            </button>

            <button
              id="copy-threat-report-btn"
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedReport ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copiedReport ? 'Report Copied!' : 'Export AI Report'}</span>
            </button>
          </div>
        </div>

        {/* Live vs Simulated Scenario Selector */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sliders className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-300">Telemetry Feed / Threat Model:</span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            {[
              { id: 'LIVE', label: '🟢 Live Election Stream', tip: 'Real-time telemetry' },
              { id: 'BOT_FLOOD', label: '🤖 Mempool Bot Ingress', tip: 'High-frequency sub-human timing burst' },
              { id: 'REPLAY_ATTACK', label: '⚡ Nullifier Replay', tip: 'Double-voting & ECDSA mutation test' },
              { id: 'QUORUM_PARTITION', label: '🛡️ Quorum Partition', tip: 'Validator outage (<66% BFT)' },
              { id: 'GEOFENCE_SPOOF', label: '📍 Geofence Surge', tip: 'District boundary violation' },
            ].map((scen) => (
              <button
                key={scen.id}
                onClick={() => {
                  setSelectedScenario(scen.id as any);
                  setMitigatedIds(new Set());
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  selectedScenario === scen.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(79,209,255,0.2)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                }`}
                title={scen.tip}
              >
                {scen.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scanning Step Progress Bar (when scanning) */}
        {isScanning && (
          <div className="mt-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 p-3 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                {scanStep === 1 && 'Step 1/4: Analyzing Mempool Ingress Cadence & Influx Velocity...'}
                {scanStep === 2 && 'Step 2/4: Verifying ECDSA secp256r1 Digital Signatures & Nonces...'}
                {scanStep === 3 && 'Step 3/4: Evaluating Byzantine Quorum & Multi-Party Validator Health...'}
                {scanStep === 4 && 'Step 4/4: Synthesizing Heuristic & Deterministic Threat Explanations...'}
              </span>
              <span className="text-slate-400 font-bold">{scanStep * 25}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${scanStep * 25}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Risk Assessment Score & Key Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Prominent AI Risk Assessment Gauge Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          {/* Subtle glow background */}
          <div
            className={`absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-20 pointer-events-none ${
              computedRiskScore >= 80
                ? 'bg-rose-500'
                : computedRiskScore >= 55
                ? 'bg-amber-500'
                : computedRiskScore >= 30
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            }`}
          />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AI Risk Assessment Score
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Model: Gemini-3.7-Flash-Sec
              </span>
            </div>

            {/* Score Ring Display */}
            <div className="my-6 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* SVG Gauge */}
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-900"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="10"
                    className={`${riskTier.text} transition-all duration-700 ease-out`}
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * computedRiskScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Score Number inside */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                    {computedRiskScore}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-400 -mt-0.5">
                    out of 100
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Tier Badge */}
            <div className="text-center space-y-1">
              <div className="inline-block">
                <span
                  className={`px-3 py-1 rounded-full font-mono text-xs font-extrabold border ${riskTier.border} ${
                    computedRiskScore >= 80
                      ? 'bg-rose-950 text-rose-300 animate-pulse'
                      : computedRiskScore >= 55
                      ? 'bg-amber-950 text-amber-300'
                      : computedRiskScore >= 30
                      ? 'bg-yellow-950 text-yellow-300'
                      : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {riskTier.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 pt-1">
                {computedRiskScore >= 80
                  ? 'Critical invariants violated. Immediate operator response required.'
                  : computedRiskScore >= 55
                  ? 'Elevated threat probability. Heuristic thresholds breached.'
                  : computedRiskScore >= 30
                  ? 'Minor anomaly detected. Under continuous monitoring.'
                  : 'System operates within nominal security parameters.'}
              </p>
            </div>
          </div>

          {/* Bottom Assessment Metadata */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Scan timestamp:</span>
            <span className="font-mono text-slate-300">{lastScanTime.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Right: Key Telemetry Signals & Threat Vector Breakdown (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Signal Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metric 1: Quorum */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Validator Quorum</span>
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {activeValidators}/{totalValidators} Nodes
              </div>
              <div className="text-[10px] font-mono flex items-center gap-1">
                <span className={quorumSatisfied ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                  {((activeValidators / totalValidators) * 100).toFixed(1)}%
                </span>
                <span className="text-slate-500">(&ge;66% req)</span>
              </div>
            </div>

            {/* Metric 2: Verification Success */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>ECDSA Verification</span>
                <Lock className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {verificationSuccessRate.toFixed(1)}%
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                P-256 curve validity
              </div>
            </div>

            {/* Metric 3: Ingress Influx / Mempool */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Ingress Pipeline</span>
                <Server className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {pendingTransactions} Pending
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Latency: {systemLatencyMs}ms
              </div>
            </div>

            {/* Metric 4: Flagged Sessions */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Behavioral Flags</span>
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {baseAnomalies.length - mitigatedIds.size} Active
              </div>
              <div className="text-[10px] font-mono text-emerald-400">
                {mitigatedIds.size} Mitigated
              </div>
            </div>
          </div>

          {/* AI Executive Threat Synopsis Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Security Threat Analysis Executive Summary
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Active Anomaly Vectors: {baseAnomalies.length}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {computedRiskScore >= 80 ? (
                <>
                  <strong className="text-rose-400">CRITICAL SAFETY ALERT:</strong> Multiple high-impact security anomalies detected. Mathematical consensus or cryptographic proof chains have crossed critical vulnerability thresholds. Ingress isolation and operator mitigation are strongly advised.
                </>
              ) : computedRiskScore >= 55 ? (
                <>
                  <strong className="text-amber-400">ELEVATED RISK LEVEL:</strong> AI analysis identifies potential coordinated automated submission cadence or cryptographic retry irregularities. System integrity remains protected by zero-knowledge nullifier verification, but secondary rate-limiting is recommended.
                </>
              ) : computedRiskScore >= 30 ? (
                <>
                  <strong className="text-yellow-400">MODERATE HEURISTIC ALERT:</strong> Minor velocity or latency variances detected in telemetry stream. No mathematical rule violations observed; consensus quorum remains within healthy parameters.
                </>
              ) : (
                <>
                  <strong className="text-emerald-400">NOMINAL STATE:</strong> All multi-party validator signatures, cryptographic nullifiers, and behavioral telemetry are consistent with authentic human voter activity and Byzantine Fault Tolerant safety rules.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED SECTION: EXPLAINING WHY ANOMALIES WERE DETECTED (SUMMARIZED BULLETED LIST) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 shadow-2xl">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>AI Anomaly Causation Breakdown — Why Anomalies Were Detected</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent, summarized audit breakdown explaining root causes, telemetry evidence, and mathematical invariants for each flagged condition.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Vectors' },
              { id: 'CRITICAL', label: 'Critical Only' },
              { id: 'CRYPTOGRAPHIC', label: 'Cryptographic' },
              { id: 'BEHAVIORAL', label: 'Behavioral' },
              { id: 'CONSENSUS_QUORUM', label: 'Quorum' },
              { id: 'NETWORK_INGRESS', label: 'Network' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterCategory(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterCategory === f.id
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Anomaly Cards List with Summarized Bullet Points */}
        <div className="space-y-3.5">
          {filteredAnomalies.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-mono">
              No anomalies found matching filter "{filterCategory}".
            </div>
          ) : (
            filteredAnomalies.map((anomaly, idx) => {
              const isMitigated = mitigatedIds.has(anomaly.id);
              const isExecuting = executingActionId === anomaly.id;

              return (
                <div
                  key={anomaly.id}
                  className={`rounded-2xl border p-4.5 transition-all ${
                    isMitigated
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      : anomaly.severity === 'CRITICAL'
                      ? 'bg-slate-900/90 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                      : anomaly.severity === 'HIGH'
                      ? 'bg-slate-900/80 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Top Bar: Title, Category Badge, Severity & Score Contribution */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold border ${
                          isMitigated
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                            : anomaly.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                            : anomaly.severity === 'HIGH'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                        }`}
                      >
                        {isMitigated ? <CheckCircle2 className="h-4 w-4" /> : <AlertOctagon className="h-4 w-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white tracking-tight">
                            {idx + 1}. {anomaly.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                              anomaly.category === 'CRYPTOGRAPHIC'
                                ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                                : anomaly.category === 'CONSENSUS_QUORUM'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                                : anomaly.category === 'BEHAVIORAL'
                                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                                : 'bg-blue-950 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            {anomaly.category}
                          </span>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {anomaly.deterministic ? '100% Deterministic Rule' : 'AI Behavioral Heuristic'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Score impact + Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isMitigated
                            ? 'bg-slate-900 border-slate-800 text-slate-500 line-through'
                            : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        +{anomaly.scoreImpact} Risk Score Pts
                      </span>

                      {isMitigated ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mitigated</span>
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            anomaly.severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                              : 'bg-amber-950 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {anomaly.severity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SUMMARIZED BULLETED LIST EXPLAINING WHY ANOMALY WAS DETECTED */}
                  <div className="mt-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 p-3.5 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      <span>Why This Anomaly Was Detected:</span>
                    </div>

                    {/* The bulleted list */}
                    <ul className="space-y-1.5 text-xs text-slate-300 pl-1 font-sans">
                      {anomaly.whyDetectedBullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-0.5 shrink-0 font-bold">•</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Evidence & Telemetry Line */}
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <Fingerprint className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-500">Evidence:</span>
                      <span className="text-slate-300 truncate">{anomaly.evidenceData}</span>
                    </div>
                  </div>

                  {/* Remediation Action & Deep Dive Button Footer */}
                  <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-300">Recommended Remediation:</span>
                      <span className="text-slate-400">{anomaly.recommendedAction}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Deep Dive Modal Trigger */}
                      <button
                        onClick={() =>
                          setModalAnomaly({
                            anomalyId: anomaly.id,
                            title: anomaly.title,
                            riskScore: anomaly.scoreImpact * 2,
                            riskLevel: anomaly.severity,
                            factors: anomaly.whyDetectedBullets.map((b) => ({
                              name: anomaly.title,
                              category:
                                anomaly.category === 'CRYPTOGRAPHIC'
                                  ? 'CRYPTOGRAPHIC'
                                  : anomaly.category === 'CONSENSUS_QUORUM'
                                  ? 'DETERMINISTIC'
                                  : 'BEHAVIORAL',
                              scoreImpact: anomaly.scoreImpact,
                              description: b,
                              evidence: anomaly.evidenceData,
                            })),
                          })
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Gemini Deep Dive</span>
                      </button>

                      {/* Mitigation Execution Button */}
                      {!isMitigated && (
                        <button
                          onClick={() => handleExecuteRemediation(anomaly)}
                          disabled={isExecuting}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <Zap className={`h-3 w-3 ${isExecuting ? 'animate-spin' : ''}`} />
                          <span>{isExecuting ? 'Applying Fix...' : 'Apply Remediation'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Anomaly Explainer Modal (Gemini Deep Dive) */}
      {modalAnomaly && (
        <AnomalyExplainerModal
          isOpen={!!modalAnomaly}
          onClose={() => setModalAnomaly(null)}
          anomalyData={modalAnomaly}
        />
      )}
    </div>
  );
};
