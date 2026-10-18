/**
 * Mock AI Adapter
 * Implements IAIService with deterministic explainable security intelligence and structured citations
 */
import { IAIService } from '../../../services/interfaces';
import { FraudCase, AuditEvent } from '../../../types';

export class MockAIService implements IAIService {
  public async analyzeFraudSession(fraudCase: FraudCase): Promise<{
    summary: string;
    riskAssessment: string;
    recommendations: string[];
  }> {
    const highRiskFactors = fraudCase.factors.filter((f) => f.scoreImpact > 20);
    const summary = `Deterministic audit correlation indicates session ${fraudCase.sessionId} accumulated an aggregate risk score of ${fraudCase.score}/100 (${fraudCase.riskLevel} threat tier). Primary anomalous telemetry stems from ${highRiskFactors.map((f) => f.name.toLowerCase()).join(', ')}.`;

    const riskAssessment =
      fraudCase.score >= 70
        ? 'High probability of automated bot orchestration, replay injection, or unauthorized key tampering. Immediate quarantine recommended.'
        : fraudCase.score >= 40
        ? 'Moderate behavioral deviation detected. Cryptographic verification remains intact, but submission cadence requires supervisory review.'
        : 'Telemetry indicates nominal voter behavior with standard client signature timing variance.';

    const recommendations = [
      'Maintain cryptographic nullifier blacklist across all validator nodes.',
      'Check rate limiter threshold for associated IP subnet.',
      'Inspect hash-chained audit log for subsequent replay attempts.',
      'Preserve raw encrypted telemetry packet for independent auditor review.',
    ];

    return { summary, riskAssessment, recommendations };
  }

  public async explainRiskFactors(factors: FraudCase['factors']): Promise<{
    naturalLanguageExplanation: string;
    priorityAction: string;
  }> {
    const sorted = [...factors].sort((a, b) => b.scoreImpact - a.scoreImpact);
    const top = sorted[0];

    const naturalLanguageExplanation = `Analysis indicates the primary driver (+${top?.scoreImpact || 0} pts) is '${top?.name || 'Behavioral Variance'}': ${top?.description || 'Standard distribution variance'}. Supporting evidence: ${top?.evidence || 'Telemetry record verified'}.`;

    const priorityAction =
      sorted.length > 0 && sorted[0].category === 'CRYPTOGRAPHIC'
        ? 'Isolate transaction in mempool and notify validator quorum of signature mismatch.'
        : 'Log telemetry signature and queue for human compliance officer review.';

    return { naturalLanguageExplanation, priorityAction };
  }

  public async summarizeAuditEvents(events: AuditEvent[]): Promise<{
    executiveSummary: string;
    securityAnomalies: string[];
    confidenceScore: number;
  }> {
    const failureCount = events.filter((e) => e.outcome === 'FAILURE' || e.outcome === 'REJECTED').length;
    const total = events.length;

    const executiveSummary = `Audit log contains ${total} total events with ${total - failureCount} successful state transitions and ${failureCount} rejected/flagged security events. Hash chain remains 100% cryptographically verified from genesis.`;

    const securityAnomalies = events
      .filter((e) => e.outcome === 'FAILURE' || e.outcome === 'REJECTED')
      .map((e) => `[${e.type}] at ${new Date(e.timestamp).toLocaleTimeString()}: ${JSON.stringify(e.details)}`);

    return {
      executiveSummary,
      securityAnomalies: securityAnomalies.length > 0 ? securityAnomalies : ['No critical security anomalies detected in current window.'],
      confidenceScore: 0.98,
    };
  }

  public async analyzeIncident(
    incidentDescription: string,
    context: Record<string, unknown>
  ): Promise<{
    rootCauseHypothesis: string;
    remediationSteps: string[];
    isCritical: boolean;
  }> {
    const isCritical = incidentDescription.toLowerCase().includes('tamper') || incidentDescription.toLowerCase().includes('quorum');

    return {
      rootCauseHypothesis: `Hypothesis based on telemetry: ${incidentDescription}. Context indicates validator cluster responded with deterministic rejection.`,
      remediationSteps: [
        'Run hash-chain verification tool across all audit segments.',
        'Verify Merkle inclusion proof against active block header.',
        'Review validator heartbeat telemetry for network partition indications.',
        'If state corruption is detected, initiate Disaster Recovery snapshot restore.',
      ],
      isCritical,
    };
  }

  public async askCopilot(
    question: string,
    electionContext: Record<string, unknown>
  ): Promise<{
    answer: string;
    evidenceCitations: string[];
    suggestedAction?: string;
  }> {
    const q = question.toLowerCase();

    if (q.includes('flagged') || q.includes('s-104') || q.includes('fraud')) {
      return {
        answer: 'Session S-104 was flagged with a risk score of 92/100 due to rapid transaction submission (120ms cadence), replay nonce collision, and timing signature anomaly. Deterministic cryptographic filters automatically blocked the vote.',
        evidenceCitations: [
          'FraudCase: S-104 [Score: 92]',
          'Factor: Timing Anomaly (+28 pts)',
          'Factor: Replay Pattern (+24 pts)',
          'Audit Log Ref: #EV-9821 REPLAY_ATTACK_DETECTED',
        ],
        suggestedAction: 'Review Fraud Case #S-104 in the Fraud Dashboard to confirm quarantine status.',
      };
    }

    if (q.includes('validator') || q.includes('quorum') || q.includes('network')) {
      return {
        answer: 'The validator network currently maintains 3 active nodes (Election Commission, Independent Auditor, Multi-Party Observer). A minimum 2/3 quorum (67%) is required for valid block generation and finality.',
        evidenceCitations: [
          'Validator: val-ec-01 [ONLINE, Latency: 14ms]',
          'Validator: val-auditor-02 [ONLINE, Latency: 28ms]',
          'Validator: val-party-03 [ONLINE, Latency: 32ms]',
          'Quorum Policy: 2 of 3 required (66.7%)',
        ],
        suggestedAction: 'Check Validator Console to simulate node latency or partition scenarios.',
      };
    }

    if (q.includes('tamper') || q.includes('block') || q.includes('integrity')) {
      return {
        answer: 'The blockchain utilizes SHA-256 block hash chaining and Merkle trees. Any modification to transactions, timestamps, or previous hashes alters the block hash, triggering an immediate consensus validation rejection.',
        evidenceCitations: [
          'Genesis Block: #0 [Hash: 0x0a9f...44b1]',
          'Latest Block: Verified',
          'Merkle Integrity: 100% matched',
        ],
        suggestedAction: 'Run the Block Tampering vector in the Security Lab to view real-time detection.',
      };
    }

    return {
      answer: `Operational Copilot Analysis: ${question}. The system is operating in nominal parameters with verified cryptographic audit logs, active 2/3 validator consensus, and deterministic double-vote prevention.`,
      evidenceCitations: [
        `Election State: ${electionContext.electionState || 'VOTING_OPEN'}`,
        `Confirmed Blocks: ${electionContext.blocksCount || 'Active'}`,
        `Audit Chain: Verified Clean`,
      ],
      suggestedAction: 'Monitor the Admin Overview dashboard for real-time election telemetry.',
    };
  }

  public async explainAnomaly(anomalyData: {
    anomalyId: string;
    title: string;
    riskScore: number;
    riskLevel: string;
    factors: FraudCase['factors'];
    telemetry?: Record<string, unknown>;
    timestamp?: string;
  }): Promise<import('../../../types').AnomalyExplanation> {
    const isCrypto = anomalyData.factors.some((f) => f.category === 'CRYPTOGRAPHIC' || f.category === 'DETERMINISTIC');
    const isHighRisk = anomalyData.riskScore >= 70;

    const deterministicFindings = anomalyData.factors
      .filter((f) => f.category === 'CRYPTOGRAPHIC' || f.category === 'DETERMINISTIC' || f.scoreImpact >= 25)
      .map((f) => ({
        finding: `Cryptographic Rule Violation: ${f.name}`,
        certainty: '100%_DETERMINISTIC' as const,
        evidenceHash: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
        ruleViolated: f.category === 'CRYPTOGRAPHIC' ? 'WebCrypto ECDSA P-256 Signature Verification RFC 6979' : 'Single-Use Voter Nullifier Uniqueness Rule',
        explanation: `${f.description}. Evidence: ${f.evidence}`,
      }));

    if (deterministicFindings.length === 0) {
      deterministicFindings.push({
        finding: 'Deterministic Cryptographic Constraints Verified',
        certainty: '100%_DETERMINISTIC' as const,
        evidenceHash: `sha256:genesis_rule_audit_${anomalyData.anomalyId}`,
        ruleViolated: 'None (Zero signature corruption)',
        explanation: 'The underlying cryptographic signatures and Merkle proofs remain mathematically valid.',
      });
    }

    const aiAssistedInterpretations = anomalyData.factors
      .filter((f) => f.category === 'BEHAVIORAL' || f.scoreImpact < 25)
      .map((f) => ({
        interpretation: `Behavioral Telemetry Anomaly: ${f.name}`,
        confidence: 0.94,
        behavioralPattern: f.name.includes('Speed') || f.name.includes('Cadence') ? 'Automated Scripting Burst' : 'Client Jitter & Typing Anomaly',
        heuristicModel: 'Isolation Forest + Gradient Boosted SHAP Risk Attributor v4',
        reasoning: `Observed timing deviation indicates non-human submission cadence (${f.description}). Evidence captured: ${f.evidence}.`,
      }));

    if (aiAssistedInterpretations.length === 0) {
      aiAssistedInterpretations.push({
        interpretation: 'Burst Rate-Limit Deviation',
        confidence: 0.91,
        behavioralPattern: 'Multi-threaded submission burst from single origin subnet',
        heuristicModel: 'Statistical Entropy & Time-Series Autoencoder',
        reasoning: 'Calculated statistical entropy drops below human baseline during ballot submission window.',
      });
    }

    const totalScore = anomalyData.factors.reduce((acc, f) => acc + f.scoreImpact, 0) || anomalyData.riskScore;
    const contributingFactors = anomalyData.factors.map((f) => ({
      factor: f.name,
      category: f.category || ('BEHAVIORAL' as const),
      impactScore: f.scoreImpact,
      weightPercentage: Math.round((f.scoreImpact / (totalScore || 1)) * 100),
      evidence: f.evidence,
    }));

    const concreteRemedialActions = [
      {
        priority: isHighRisk ? ('IMMEDIATE_P0' as const) : ('HIGH_P1' as const),
        action: isCrypto ? 'Quarantine Transaction from Validator Mempool' : 'Flag Session for Supervisory Verification',
        rationale: 'Prevents corrupted or unauthenticated transactions from propagating to block mining queue.',
        actor: 'Security Operations & BFT Validator Consensus',
        automatedExecutable: true,
        command: `quarantine --session-id ${anomalyData.anomalyId} --enforce-nullifier-blacklist`,
      },
      {
        priority: 'HIGH_P1' as const,
        action: 'Isolate Origin IP Subnet via Adaptive Rate Limiter',
        rationale: 'Mitigates potential botnet DDoS or credential stuffing against voter token issuance endpoints.',
        actor: 'Edge Gateway Firewalls',
        automatedExecutable: true,
        command: `ratelimit --quarantine-ip ${anomalyData.telemetry?.ipAddress || '198.51.100.0/24'} --duration 3600`,
      },
      {
        priority: 'MEDIUM_P2' as const,
        action: 'Trigger Independent Auditor Hash-Chain Re-Verification',
        rationale: 'Confirms that no downstream blocks or previous Merkle tree roots were altered by the anomalous session.',
        actor: 'Independent Electoral Auditor',
        automatedExecutable: false,
      },
    ];

    return {
      anomalyId: anomalyData.anomalyId,
      title: anomalyData.title || `Threat Analysis: Anomaly ${anomalyData.anomalyId}`,
      riskScore: anomalyData.riskScore,
      riskLevel: (anomalyData.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'HIGH',
      executiveSummary: `AI Security Analysis for ${anomalyData.anomalyId}: Risk Score ${anomalyData.riskScore}/100 (${anomalyData.riskLevel}). ${
        isCrypto
          ? 'Critical cryptographic anomalies were blocked by deterministic validation rules.'
          : 'High behavioral entropy detected by AI models; requires manual supervisory audit.'
      }`,
      deterministicFindings,
      aiAssistedInterpretations,
      contributingFactors,
      concreteRemedialActions,
      supervisoryApprovalRequired: isHighRisk,
    };
  }
}
