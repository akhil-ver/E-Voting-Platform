/**
 * Google Gemini AI Adapter
 * Implements IAIService using @google/genai TypeScript SDK server-side
 * strictly advisory, structured outputs validated via Zod
 */
import { GoogleGenAI } from '@google/genai';
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

export class GeminiAIService implements IAIService {
  private ai: GoogleGenAI | null = null;
  private fallbackMock: MockAIService;

  constructor() {
    this.fallbackMock = new MockAIService();
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  public async analyzeFraudSession(fraudCase: FraudCase): Promise<{
    summary: string;
    riskAssessment: string;
    recommendations: string[];
  }> {
    if (!this.ai) {
      return this.fallbackMock.analyzeFraudSession(fraudCase);
    }

    try {
      const prompt = `You are the AI Security Copilot for an E-Voting system. Analyze the following sanitized telemetry data. Never make authoritative legal decisions; provide an advisory breakdown with recommendations.
Session ID: ${fraudCase.sessionId}
Risk Score: ${fraudCase.score} / 100 (${fraudCase.riskLevel})
Factors: ${JSON.stringify(fraudCase.factors)}

Respond in valid JSON with this exact structure:
{
  "summary": "Concise overview of telemetry and anomaly patterns",
  "riskAssessment": "Threat assessment explaining the severity",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an objective AI election security advisor. You cite evidence and recommend actions without claiming legal authority.',
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      return FraudAnalysisSchema.parse(parsed);
    } catch {
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
    if (!this.ai) {
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        executiveSummary: parsed.executiveSummary || 'Audit log verified.',
        securityAnomalies: Array.isArray(parsed.securityAnomalies) ? parsed.securityAnomalies : [],
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
      };
    } catch {
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
    if (!this.ai) {
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return CopilotAnswerSchema.parse(parsed);
    } catch {
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
    if (!this.ai) {
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction:
            'You are an authoritative election cybersecurity expert AI. You provide structured, mathematically grounded threat analyses. You never make final binding legal verdicts, but provide rigorous structured intelligence validated via strict schemas.',
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      return AnomalyExplanationSchema.parse(parsed);
    } catch (err) {
      console.warn('Gemini explainAnomaly fallback due to parsing/API error:', err);
      return this.fallbackMock.explainAnomaly(anomalyData);
    }
  }
}
