import { z } from 'zod';

export const AnomalyExplanationSchema = z.object({
  anomalyId: z.string(),
  title: z.string(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  executiveSummary: z.string(),
  // Strict separation of deterministic proof vs AI-assisted interpretation
  deterministicFindings: z.array(
    z.object({
      finding: z.string(),
      certainty: z.literal('100%_DETERMINISTIC'),
      evidenceHash: z.string(),
      ruleViolated: z.string(),
      explanation: z.string(),
    })
  ),
  aiAssistedInterpretations: z.array(
    z.object({
      interpretation: z.string(),
      confidence: z.number().min(0).max(1),
      behavioralPattern: z.string(),
      heuristicModel: z.string(),
      reasoning: z.string(),
    })
  ),
  contributingFactors: z.array(
    z.object({
      factor: z.string(),
      category: z.enum(['CRYPTOGRAPHIC', 'BEHAVIORAL', 'DETERMINISTIC', 'NETWORK']),
      impactScore: z.number(),
      weightPercentage: z.number(),
      evidence: z.string(),
    })
  ),
  concreteRemedialActions: z.array(
    z.object({
      priority: z.enum(['IMMEDIATE_P0', 'HIGH_P1', 'MEDIUM_P2']),
      action: z.string(),
      rationale: z.string(),
      actor: z.string(),
      automatedExecutable: z.boolean(),
      command: z.string().optional(),
    })
  ),
  supervisoryApprovalRequired: z.boolean(),
});

export type AnomalyExplanationZodType = z.infer<typeof AnomalyExplanationSchema>;
