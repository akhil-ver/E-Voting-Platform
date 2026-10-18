/**
 * OpenAI AI Adapter
 * Implements IAIService using OpenAI Chat Completions API with structured JSON schemas
 * Pluggable backend for Security Copilot, Fraud Analysis, and Anomaly Explanation
 */
import { z } from 'zod';
import { IAIService } from '../../../services/interfaces';
import { FraudCase, AuditEvent, AnomalyExplanation } from '../../../types';
import { MockAIService } from '../mock';
import { AnomalyExplanationSchema } from '../../../schemas/ai-schemas';

const FraudAnalysisSchema = z.object({
  summary: z.string(),
  riskAssessment: z.string(),
  recommendations: z.array(z.string()),
});

const CopilotAnswerSchema = z.object({
  answer: z.string(),
  evidenceCitations: z.array(z.string()),
  suggestedAction: z.string().optional(),
});

export class OpenAIService implements IAIService {
  private apiKey: string | undefined;
  private model: string;
  private fallbackMock: MockAIService;

  constructor() {
    this.fallbackMock = new MockAIService();
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  private async callOpenAI(messages: Array<{ role: string; content: string }>, jsonMode = true): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  public async analyzeFraudSession(fraudCase: FraudCase): Promise<{
    summary: string;
    riskAssessment: string;
    recommendations: string[];
  }> {
    if (!this.apiKey) {
      return this.fallbackMock.analyzeFraudSession(fraudCase);
    }

    try {
      const prompt = `You are the AI Security Copilot for an E-Voting system. Analyze the following sanitized telemetry data.
Never make authoritative legal decisions; provide an advisory breakdown with recommendations.
Session ID: ${fraudCase.sessionId}
Risk Score: ${fraudCase.score} / 100 (${fraudCase.riskLevel})
Factors: ${JSON.stringify(fraudCase.factors)}

Respond in valid JSON with this exact structure:
{
  "summary": "Concise overview of telemetry and anomaly patterns",
  "riskAssessment": "Threat assessment explaining the severity",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      const raw = await this.callOpenAI([
        {
          role: 'system',
          content: 'You are an objective AI election security advisor. You cite evidence and recommend actions without claiming legal authority.',
        },
        { role: 'user', content: prompt },
      ]);

      const parsed = JSON.parse(raw);
      return FraudAnalysisSchema.parse(parsed);
    } catch (err) {
      console.warn('OpenAI analyzeFraudSession fallback:', err);
      return this.fallbackMock.analyzeFraudSession(fraudCase);
    }
  }

  public async explainRiskFactors(factors: FraudCase['factors']): Promise<{
    naturalLanguageExplanation: string;
    priorityAction: string;
  }> {
    return this.fallbackMock.explainRiskFactors(factors);
  }

  public async summarizeAuditEvents(events: AuditEvent[]): Promise<{
    executiveSummary: string;
    securityAnomalies: string[];
    confidenceScore: number;
  }> {
    if (!this.apiKey) {
      return this.fallbackMock.summarizeAuditEvents(events);
    }

    try {
      const sanitizedEvents = events.slice(-20).map((e) => ({
        type: e.type,
        outcome: e.outcome,
        timestamp: e.timestamp,
        details: e.details,
      }));

      const prompt = `Summarize the following election audit log slice in JSON format:
Events: ${JSON.stringify(sanitizedEvents)}

Format:
{
  "executiveSummary": "Overall summary of audit health and anomalies",
  "securityAnomalies": ["Anomaly 1", "Anomaly 2"],
  "confidenceScore": 0.95
}`;

      const raw = await this.callOpenAI([
        { role: 'system', content: 'You are an election auditor AI.' },
        { role: 'user', content: prompt },
      ]);

      const parsed = JSON.parse(raw);
      return {
        executiveSummary: parsed.executiveSummary || 'Audit log verified.',
        securityAnomalies: Array.isArray(parsed.securityAnomalies) ? parsed.securityAnomalies : [],
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
      };
    } catch (err) {
      console.warn('OpenAI summarizeAuditEvents fallback:', err);
      return this.fallbackMock.summarizeAuditEvents(events);
    }
  }

  public async analyzeIncident(
    incidentDescription: string,
    context: Record<string, unknown>
  ): Promise<{
    rootCauseHypothesis: string;
    remediationSteps: string[];
    isCritical: boolean;
  }> {
    return this.fallbackMock.analyzeIncident(incidentDescription, context);
  }

  public async askCopilot(
    question: string,
    electionContext: Record<string, unknown>
  ): Promise<{
    answer: string;
    evidenceCitations: string[];
    suggestedAction?: string;
  }> {
    if (!this.apiKey) {
      return this.fallbackMock.askCopilot(question, electionContext);
    }

    try {
      const prompt = `You are the AI Security Copilot for the Smart E-Voting System.
Election Operational Context:
- Active State: ${electionContext.electionState}
- Total Votes: ${electionContext.votesCast}
- Quorum Status: ${electionContext.quorumSatisfied ? 'Quorum Satisfied (2/3)' : 'Quorum Degraded'}
- Flagged Sessions: ${electionContext.fraudAlertsCount}
- Audit Chain Status: Cryptographically Linked

User Question: "${question}"

Respond with concise, evidence-linked insights in JSON format:
{
  "answer": "Clear explanation citing system telemetry",
  "evidenceCitations": ["Evidence 1", "Evidence 2"],
  "suggestedAction": "Specific administrator action"
}`;

      const raw = await this.callOpenAI([
        {
          role: 'system',
          content: 'You are an expert AI security analyst assisting an election supervisor.',
        },
        { role: 'user', content: prompt },
      ]);

      const parsed = JSON.parse(raw);
      return CopilotAnswerSchema.parse(parsed);
    } catch (err) {
      console.warn('OpenAI askCopilot fallback:', err);
      return this.fallbackMock.askCopilot(question, electionContext);
    }
  }

  public async explainAnomaly(anomalyData: {
    anomalyId: string;
    title: string;
    riskScore: number;
    riskLevel: string;
    factors: FraudCase['factors'];
    telemetry?: Record<string, unknown>;
    timestamp?: string;
  }): Promise<AnomalyExplanation> {
    if (!this.apiKey) {
      return this.fallbackMock.explainAnomaly(anomalyData);
    }

    try {
      const prompt = `You are the AI Security Intelligence Copilot for an enterprise E-Voting system.
Your mission is to perform deep anomaly decomposition for detected security incident or behavioral outlier:
Anomaly ID: ${anomalyData.anomalyId}
Incident Title: ${anomalyData.title}
Risk Score: ${anomalyData.riskScore} / 100 (${anomalyData.riskLevel})
Contributing Factors: ${JSON.stringify(anomalyData.factors, null, 2)}
Sanitized Telemetry: ${JSON.stringify(anomalyData.telemetry || {}, null, 2)}

CRITICAL MANDATE:
You MUST strictly distinguish between:
1. "deterministicFindings": 100% certainty mathematical/cryptographic violations (e.g. ECDSA signature mismatch, duplicate nullifier collision, Merkle tree root mismatch, replay nonce collision).
2. "aiAssistedInterpretations": Probabilistic heuristic models (e.g. typing cadence speed, statistical entropy variance, mouse velocity anomaly, botnet clustering).

Return a strictly formatted JSON response matching this schema:
{
  "anomalyId": "${anomalyData.anomalyId}",
  "title": "${anomalyData.title}",
  "riskScore": ${anomalyData.riskScore},
  "riskLevel": "${anomalyData.riskLevel}",
  "executiveSummary": "Concise 2-sentence summary explaining why this anomaly was triggered and its threat severity",
  "deterministicFindings": [
    {
      "finding": "Descriptive title of deterministic finding",
      "certainty": "100%_DETERMINISTIC",
      "evidenceHash": "sha256:...",
      "ruleViolated": "RFC/Standard rule name",
      "explanation": "Clear explanation of the mathematical proof or rule trigger"
    }
  ],
  "aiAssistedInterpretations": [
    {
      "interpretation": "Interpretation title",
      "confidence": 0.95,
      "behavioralPattern": "Pattern name",
      "heuristicModel": "Model name",
      "reasoning": "Heuristic reasoning citing telemetry"
    }
  ],
  "contributingFactors": [
    {
      "factor": "Factor name",
      "category": "CRYPTOGRAPHIC" | "BEHAVIORAL" | "DETERMINISTIC" | "NETWORK",
      "impactScore": 30,
      "weightPercentage": 40,
      "evidence": "Evidence string"
    }
  ],
  "concreteRemedialActions": [
    {
      "priority": "IMMEDIATE_P0" | "HIGH_P1" | "MEDIUM_P2",
      "action": "Concrete step for administrators",
      "rationale": "Why this action is necessary",
      "actor": "Responsible entity",
      "automatedExecutable": true,
      "command": "optional CLI command"
    }
  ],
  "supervisoryApprovalRequired": true
}`;

      const raw = await this.callOpenAI([
        {
          role: 'system',
          content: 'You are an authoritative election cybersecurity expert AI. Return valid JSON only.',
        },
        { role: 'user', content: prompt },
      ]);

      const parsed = JSON.parse(raw);
      return AnomalyExplanationSchema.parse(parsed);
    } catch (err) {
      console.warn('OpenAI explainAnomaly fallback:', err);
      return this.fallbackMock.explainAnomaly(anomalyData);
    }
  }
}
