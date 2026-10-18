/**
 * Service Abstraction Layer Interfaces
 * Clean Architecture Contract Definitions
 */
import {
  User,
  VoterCredential,
  EligibilityRecord,
  Election,
  Candidate,
  VotingToken,
  EncryptedBallot,
  Transaction,
  Block,
  Validator,
  FraudCase,
  AuditEvent,
  VerificationReceipt,
  SystemSnapshot,
  ElectionState,
  SystemMetrics,
  ElectionResults,
  AnomalyExplanation,
} from '../../types';

export interface IAuthService {
  generateKeyPair(): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey; fingerprint: string }>;
  signChallenge(challenge: string, privateKey: JsonWebKey): Promise<string>;
  login(credentialId: string, signedChallenge: string, role?: string): Promise<{ token: string; user: User }>;
  register(nationalId: string, publicKeyJwk: JsonWebKey): Promise<{ user: User; credential: VoterCredential; challenge: string }>;
  refreshSession(refreshToken: string): Promise<{ token: string; user: User }>;
  logout(token: string): Promise<boolean>;
}

export interface IEligibilityService {
  checkEligibility(electionId: string, credentialRef: string): Promise<{ isEligible: boolean; reason?: string }>;
  registerEligibility(electionId: string, credentialRef: string, fingerprint: string): Promise<EligibilityRecord>;
  issueEligibilityCredential(electionId: string, credentialRef: string): Promise<VotingToken>;
  revokeEligibility(electionId: string, credentialRef: string, reason: string): Promise<boolean>;
  getEligibilityStatus(electionId: string, credentialRef: string): Promise<EligibilityRecord | null>;
}

export interface IElectionService {
  getElection(electionId: string): Promise<Election | null>;
  listElections(): Promise<Election[]>;
  createElection(params: Partial<Election>): Promise<Election>;
  configureElection(electionId: string, config: Partial<Election['configuration']>): Promise<Election>;
  openRegistration(electionId: string): Promise<Election>;
  openVoting(electionId: string): Promise<Election>;
  closeVoting(electionId: string): Promise<Election>;
  publishResults(electionId: string): Promise<Election>;
  archiveElection(electionId: string): Promise<Election>;
  pauseElection(electionId: string, reason: string): Promise<Election>;
  resumeElection(electionId: string): Promise<Election>;
  lockdown(electionId: string, reason: string): Promise<Election>;
  getResults(electionId: string): Promise<ElectionResults>;
  unlockThresholdResults(electionId: string, keyHolderId: string): Promise<ElectionResults>;
}

export interface IVotingService {
  generateVotingToken(electionId: string, credentialRef: string, nullifierHash: string): Promise<VotingToken>;
  encryptVote(candidateId: string, electionId: string, voterSecret: string): Promise<{ commitment: string; encryptedPayload: string; nullifierHash: string }>;
  submitVote(ballot: {
    electionId: string;
    commitment: string;
    nullifierHash: string;
    encryptedPayload: string;
    signature: string;
    voterPublicKeyFingerprint: string;
    nonce: string;
  }): Promise<{ transaction: Transaction; receipt: VerificationReceipt }>;
  getBallotStatus(transactionId: string): Promise<{ status: string; blockHeight?: number; blockHash?: string }>;
  detectDuplicateVote(electionId: string, nullifierHash: string): Promise<{ isDuplicate: boolean; previousTxId?: string }>;
}

export interface IBlockchainService {
  broadcastTransaction(tx: Transaction): Promise<{ accepted: boolean; txId: string }>;
  mineBlock(): Promise<Block>;
  getChain(): Promise<Block[]>;
  getBlock(blockIdOrHeight: string | number): Promise<Block | null>;
  getValidatorStatus(): Promise<Validator[]>;
  validateBlock(block: Block): Promise<{ isValid: boolean; errors: string[] }>;
  verifyMerkleProof(leaf: string, proof: string[], root: string): Promise<boolean>;
  simulateTamper(blockHeight: number, field: string, value: string): Promise<Block>;
  updateValidatorStatus(validatorId: string, status: Validator['status']): Promise<Validator>;
}

export interface IFraudDetectionService {
  scoreSession(sessionData: {
    sessionId: string;
    signingLatencyMs: number;
    submissionSpeedMs: number;
    replayNonceUsed: boolean;
    invalidSignatureAttempt: boolean;
    repeatedNullifierAttempt: boolean;
    unusualSequence: boolean;
    requestCountInMinute: number;
  }): Promise<FraudCase>;
  detectFraud(caseId: string): Promise<FraudCase | null>;
  getExplanation(caseId: string): Promise<{ explanation: string; factorBreakdown: { factor: string; weight: number; impact: string }[] }>;
  listFlagged(): Promise<FraudCase[]>;
  reviewCase(caseId: string, decision: 'CLEARED' | 'RESOLVED_FRAUD', reviewer: string): Promise<FraudCase>;
}

export interface IVerificationService {
  verifyReceipt(receiptHash: string): Promise<VerificationReceipt | null>;
  generateZKProof(commitment: string, nullifier: string, electionId: string): Promise<string>;
  checkInclusion(transactionId: string): Promise<{ included: boolean; blockHeight?: number; merkleProof?: string[]; root?: string }>;
  verifyAuditIntegrity(): Promise<{ valid: boolean; brokenAtIndex?: number; totalEvents: number }>;
}

export interface IDatabaseService {
  read<T>(collection: string, id: string): Promise<T | null>;
  write<T extends { id: string }>(collection: string, data: T): Promise<T>;
  query<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]>;
  delete(collection: string, id: string): Promise<boolean>;
  transaction<T>(operations: () => Promise<T>): Promise<T>;
  healthCheck(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE'; latencyMs: number; provider: string }>;
}

export interface IStorageService {
  upload(path: string, content: string | Uint8Array, metadata?: Record<string, string>): Promise<{ uri: string; hash: string }>;
  retrieve(path: string): Promise<string | Uint8Array | null>;
  delete(path: string): Promise<boolean>;
  healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }>;
}

export interface INotificationService {
  send(recipient: string, message: { subject: string; body: string; type: 'ALERT' | 'RECEIPT' | 'AUDIT' }): Promise<boolean>;
  broadcast(topic: string, alert: { title: string; message: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' }): Promise<number>;
  healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }>;
}

export interface IAIService {
  analyzeFraudSession(fraudCase: FraudCase): Promise<{ summary: string; riskAssessment: string; recommendations: string[] }>;
  explainRiskFactors(factors: FraudCase['factors']): Promise<{ naturalLanguageExplanation: string; priorityAction: string }>;
  summarizeAuditEvents(events: AuditEvent[]): Promise<{ executiveSummary: string; securityAnomalies: string[]; confidenceScore: number }>;
  analyzeIncident(incidentDescription: string, context: Record<string, unknown>): Promise<{ rootCauseHypothesis: string; remediationSteps: string[]; isCritical: boolean }>;
  askCopilot(question: string, electionContext: Record<string, unknown>): Promise<{ answer: string; evidenceCitations: string[]; suggestedAction?: string }>;
  explainAnomaly(anomalyData: {
    anomalyId: string;
    title: string;
    riskScore: number;
    riskLevel: string;
    factors: FraudCase['factors'];
    telemetry?: Record<string, unknown>;
    timestamp?: string;
  }): Promise<AnomalyExplanation>;
}

export interface IAuditService {
  appendEvent(event: Omit<AuditEvent, 'id' | 'previousHash' | 'eventHash' | 'timestamp'>): Promise<AuditEvent>;
  queryEvents(filter?: { type?: string; actorId?: string; outcome?: string; limit?: number }): Promise<AuditEvent[]>;
  verifyIntegrity(): Promise<{ isTampered: boolean; totalEvents: number; brokenEventId?: string; brokenIndex?: number }>;
  exportAudit(): Promise<string>;
  tamperEvent(eventId: string, modifiedDetails: Record<string, unknown>): Promise<AuditEvent>;
}

export interface IEventBus {
  publish<T>(eventType: string, payload: T): void;
  subscribe<T>(eventType: string, handler: (payload: T) => void): () => void;
}
