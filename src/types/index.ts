/**
 * Smart E-Voting System - Core Domain Types & Data Contracts
 * Clean Architecture Model Definitions
 */

export type UserRole = 'VOTER' | 'ADMIN' | 'AUDITOR' | 'OBSERVER';

export type ElectionState =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'REGISTRATION_OPEN'
  | 'VOTING_OPEN'
  | 'VOTING_CLOSED'
  | 'TALLYING'
  | 'RESULTS_PUBLISHED'
  | 'ARCHIVED';

export type VotePipelineStatus =
  | 'PENDING'
  | 'ENCRYPTING'
  | 'HASHING'
  | 'SIGNING'
  | 'BROADCASTING'
  | 'VALIDATING'
  | 'MINING'
  | 'CONFIRMED'
  | 'FAILED';

export type ValidatorHealthStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'REJECTED' | 'PARTITIONED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  nationalIdMasked: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  createdAt: string;
  lastLogin?: string;
}

export interface VoterCredential {
  id: string;
  credentialId: string;
  userId: string;
  publicKey: string;
  publicKeyFingerprint: string;
  status: 'ISSUED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  issuedAt: string;
  expiresAt: string;
  jurisdiction: string;
}

export interface EligibilityRecord {
  id: string;
  eligibilityId: string;
  electionId: string;
  credentialRef: string;
  publicKeyFingerprint: string;
  status: 'ELIGIBLE' | 'CONSUMED' | 'INELIGIBLE' | 'REVOKED';
  verifiedAt: string;
}

export interface Candidate {
  id: string;
  electionId: string;
  displayName: string;
  party: string;
  symbol: string;
  symbolImageUrl?: string;
  bio: string;
  color: string;
  candidateStatus?: 'ACTIVE' | 'WITHDRAWN' | 'DISQUALIFIED';
  createdAt?: string;
}

export interface ElectionConfiguration {
  allowWriteIn: boolean;
  quorumThreshold: number; // e.g. 0.67 (2/3)
  fraudThreshold: number; // e.g. 70
  maxVoters: number;
  thresholdKeyHolders: number; // e.g. 3
  thresholdRequired: number; // e.g. 2
  zkProofEnabled: boolean;
  doubleVoteRule: 'STRICT_REJECT' | 'SUPERSEDE_NOT_ALLOWED';
}

export interface Election {
  id: string;
  electionNumber: string; // Unique Election Number e.g. 'ELEC-2026-001'
  name: string;
  electionType: string; // e.g. 'Municipal Council', 'State Assembly', 'Parliamentary', 'Civic By-Election'
  constituencyId: string; // e.g. 'CONST-MUM-01'
  constituencyName: string; // e.g. 'Mumbai South'
  hometown: string; // e.g. 'Mumbai'
  description: string;
  state: ElectionState;
  startAt: string;
  endAt: string;
  createdBy?: string;
  candidates: Candidate[];
  configuration: ElectionConfiguration;
  isPaused: boolean;
  pauseReason?: string;
  isLockedDown: boolean;
  lockdownReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleVoter {
  id: string;
  electionId: string;
  voterId: string; // Unique Election Number / Voter ID e.g. 'VOT-MUM-1001', 'VOT-2026-8821'
  name: string;
  fatherName: string;
  motherName: string;
  aadhaarLast4: string; // Last four digits of Aadhaar e.g. '8821'
  constituencyId: string;
  constituencyName: string;
  hometown: string; // City or area e.g. 'Mumbai'
  nationalIdMasked: string; // e.g. 'IND-****-8821'
  email?: string;
  eligibilityStatus: 'ELIGIBLE' | 'SUSPENDED' | 'INELIGIBLE';
  hasRegisteredAccount?: boolean;
  password?: string;
  userRegisteredAt?: string;
  hasVoted: boolean;
  votedAt?: string;
  receiptHash?: string;
  createdAt: string;
}

export interface VoterElectionView {
  election: Election;
  isEligible: boolean;
  eligibilityReason?: string;
  hasVoted: boolean;
  receiptHash?: string;
  verificationStatus?: 'MINED' | 'AWAITING_TALLY' | 'COUNTED' | 'NOT_VOTED';
  blockHeight?: number;
}

export interface VotingToken {
  id: string;
  electionId: string;
  credentialRef: string;
  nullifierHash: string; // SHA-256(voterPrivateKey + electionId)
  status: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'VOIDED';
  expiresAt: string;
  issuedAt: string;
}

export interface EncryptedBallot {
  id: string;
  electionId: string;
  encryptedPayload: string; // AES-GCM ciphertext of { candidateId, nonce, timestamp }
  ephemeralPublicKey?: string;
  commitment: string; // SHA-256(ballotChoice + blindingFactor)
  nullifierHash: string;
  voterSignature: string;
  timestamp: string;
  transactionId: string;
}

export interface Transaction {
  id: string;
  electionId: string;
  commitment: string;
  nullifierHash: string;
  voterPublicKeyFingerprint: string;
  signature: string;
  blockId?: string;
  timestamp: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  rejectionReason?: string;
  nonce: string;
}

export interface Block {
  id: string;
  height: number;
  timestamp: string;
  previousHash: string;
  merkleRoot: string;
  transactions: Transaction[];
  validatorSignatures: Record<string, string>; // validatorId -> signature
  blockHash: string;
  nonce: number;
  isValid?: boolean;
}

export interface Validator {
  id: string;
  name: string;
  role: 'ELECTION_COMMISSION' | 'INDEPENDENT_AUDITOR' | 'PARTY_OBSERVER' | 'CIVIL_SOCIETY';
  status: ValidatorHealthStatus;
  publicIdentity: string;
  endpoint: string;
  latencyMs: number;
  lastHeartbeat: string;
  blocksValidated: number;
  blocksRejected: number;
}

export type ValidatorNode = Validator;

export interface FraudFactor {
  name: string;
  category: 'DETERMINISTIC' | 'BEHAVIORAL' | 'CRYPTOGRAPHIC';
  scoreImpact: number;
  description: string;
  evidence: string;
}

export interface FraudCase {
  id: string;
  sessionId: string;
  ipAddressMasked: string;
  score: number; // 0-100
  riskLevel: RiskLevel;
  factors: FraudFactor[];
  status: 'UNDER_REVIEW' | 'FLAGGED' | 'CLEARED' | 'RESOLVED_FRAUD';
  reviewer?: string;
  reviewedAt?: string;
  timestamp: string;
  timeline: { time: string; event: string; type: string }[];
  recommendedAction: string;
  aiExplanation?: string;
}

export type AuditEventType =
  | 'VOTER_REGISTERED'
  | 'ELIGIBILITY_VERIFIED'
  | 'CREDENTIAL_ISSUED'
  | 'TOKEN_ISSUED'
  | 'VOTE_STARTED'
  | 'VOTE_ENCRYPTED'
  | 'VOTE_SIGNED'
  | 'VOTE_SUBMITTED'
  | 'DUPLICATE_VOTE_REJECTED'
  | 'REPLAY_ATTACK_DETECTED'
  | 'INVALID_SIGNATURE_REJECTED'
  | 'TRANSACTION_CREATED'
  | 'BLOCK_MINED'
  | 'BLOCK_VALIDATED'
  | 'BLOCK_REJECTED'
  | 'VALIDATOR_OFFLINE'
  | 'VALIDATOR_RECONNECTED'
  | 'FRAUD_DETECTED'
  | 'FRAUD_REVIEWED'
  | 'VERIFICATION_STARTED'
  | 'VERIFICATION_COMPLETED'
  | 'RESULTS_UNLOCKED'
  | 'ELECTION_PAUSED'
  | 'ELECTION_RESUMED'
  | 'EMERGENCY_LOCKDOWN'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_COMPLETED'
  | 'SECURITY_LAB_ATTACK_RUN'
  | 'TAMPERING_DETECTED';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actorId: string;
  entityId: string;
  details: Record<string, unknown>;
  requestId: string;
  previousHash: string;
  eventHash: string;
  timestamp: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'REJECTED';
}

export interface VerificationReceipt {
  receiptHash: string;
  transactionId: string;
  electionId: string;
  blockHeight: number;
  blockHash: string;
  merkleRoot: string;
  merkleProof: string[];
  timestamp: string;
  validatorSignaturesCount: number;
  zkProofSimulated: string;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'PENDING';
  electionName?: string;
  electionState?: string;
  isElectionOngoing?: boolean;
  isCountedInTally?: boolean;
  countingStatus?: string;
  countingStatusText?: string;
  statusHeading?: string;
  statusMessage?: string;
  tallyAuditHash?: string;
  hometown?: string;
}

export interface SystemSnapshot {
  id: string;
  createdAt: string;
  stateHash: string;
  storageRef: string;
  verificationStatus: 'VERIFIED' | 'TAMPERED';
  totalTransactions: number;
  totalBlocks: number;
  totalAuditEvents: number;
  electionState: ElectionState;
}

export interface SystemMetrics {
  registeredVoters: number;
  votesCast: number;
  turnoutPercentage: number;
  pendingTransactions: number;
  confirmedTransactions: number;
  blocksCount: number;
  activeValidators: number;
  totalValidators: number;
  quorumSatisfied: boolean;
  fraudAlertsCount: number;
  criticalIncidentsCount: number;
  auditEventsCount: number;
  verificationSuccessRate: number;
  systemLatencyMs: number;
  activeProviders: {
    database: string;
    storage: string;
    blockchain: string;
    ai: string;
    notification: string;
  };
}

export interface ThreatVector {
  id: string;
  name: string;
  category: 'INTEGRITY' | 'CONFIDENTIALITY' | 'AVAILABILITY' | 'AUTHENTICATION';
  description: string;
  attackVector: string;
  defenseMechanism: string;
  testedStatus: 'SECURED' | 'ALERTED' | 'BLOCKED';
}

export interface ElectionResults {
  electionId: string;
  totalVotes: number;
  turnoutPercentage: number;
  isDecrypted: boolean;
  keyHoldersUnlocked: string[];
  keyHoldersRequired: number;
  candidateResults: {
    candidateId: string;
    displayName: string;
    party: string;
    symbol: string;
    color: string;
    voteCount: number;
    percentage: number;
  }[];
  tallyAuditHash: string;
  publishedAt?: string;
}

export interface ElectionReportSignature {
  signerId: string;
  signerName: string;
  role: string;
  keyFingerprint: string;
  signature: string;
  signedAt: string;
}

export interface SignedElectionReport {
  schemaVersion: string;
  reportId: string;
  generatedAt: string;
  election: {
    id: string;
    electionNumber: string;
    name: string;
    electionType: string;
    constituencyId: string;
    constituencyName: string;
    hometown: string;
    state: ElectionState;
    startAt: string;
    endAt: string;
    createdBy?: string;
  };
  statistics: {
    registeredVoters: number;
    totalVotesCast: number;
    turnoutPercentage: number;
    thresholdKeyHoldersTotal: number;
    thresholdKeyHoldersUnlocked: number;
    isDecrypted: boolean;
    blocksHeight: number;
    quorumThreshold: number;
  };
  tally: {
    candidates: {
      candidateId: string;
      displayName: string;
      party: string;
      symbol: string;
      voteCount: number;
      percentage: number;
      color?: string;
    }[];
    winner?: {
      candidateId: string;
      displayName: string;
      party: string;
      voteCount: number;
      percentage: number;
    };
  };
  cryptographicProofs: {
    tallyAuditHash: string;
    merkleRoot: string;
    latestBlockHash: string;
    zkProofScheme: string;
    encryptionScheme: string;
    contentDigestSha256: string;
  };
  signatures: ElectionReportSignature[];
  verificationInstructions: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category:
    | 'CRYPTOGRAPHIC_VIOLATION'
    | 'REPLAY_ATTACK'
    | 'SYBIL_CLUSTER'
    | 'RATE_LIMIT_BREACH'
    | 'VALIDATOR_PARTITION'
    | 'NULLIFIER_COLLISION'
    | 'BEHAVIORAL_ANOMALY';
  title: string;
  description: string;
  sourceIpMasked?: string;
  sessionId?: string;
  nodeId?: string;
  isDeterministic: boolean;
  status: 'ACTIVE' | 'INVESTIGATING' | 'QUARANTINED' | 'RESOLVED';
  evidenceHash?: string;
  riskScore: number;
}

export interface HourlyTurnoutData {
  hourLabel: string;
  hourTimestamp: string;
  votesCount: number;
  cumulativeVotes: number;
  expectedBaseline: number;
  isSpikeAnomaly?: boolean;
}

export interface SystemPerformanceIndicator {
  votingLatencyP50Ms: number;
  votingLatencyP95Ms: number;
  mempoolQueueDepth: number;
  blockFinalizationTimeMs: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  memoryUsageMb: number;
  dbIops: number;
  networkThroughputKbps: number;
  apiSuccessRatePercent: number;
  activeListenersCount: number;
}

export interface RealtimeMonitoringState {
  timestamp: string;
  registeredVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  turnoutVelocityPerHour: number;
  electionState: ElectionState;
  isPaused: boolean;
  isLockedDown: boolean;
  performance: SystemPerformanceIndicator;
  hourlyTurnout: HourlyTurnoutData[];
  validatorConsensus: {
    id: string;
    name: string;
    status: ValidatorHealthStatus;
    latencyMs: number;
    blocksProposed: number;
    blocksValidated: number;
    cpuPercent: number;
    lastHeartbeat: string;
  }[];
  recentAlerts: SecurityAlert[];
}

export interface AnomalyExplanation {
  anomalyId: string;
  title: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  executiveSummary: string;
  deterministicFindings: {
    finding: string;
    certainty: '100%_DETERMINISTIC';
    evidenceHash: string;
    ruleViolated: string;
    explanation: string;
  }[];
  aiAssistedInterpretations: {
    interpretation: string;
    confidence: number;
    behavioralPattern: string;
    heuristicModel: string;
    reasoning: string;
  }[];
  contributingFactors: {
    factor: string;
    category: 'CRYPTOGRAPHIC' | 'BEHAVIORAL' | 'DETERMINISTIC' | 'NETWORK';
    impactScore: number;
    weightPercentage: number;
    evidence: string;
  }[];
  concreteRemedialActions: {
    priority: 'IMMEDIATE_P0' | 'HIGH_P1' | 'MEDIUM_P2';
    action: string;
    rationale: string;
    actor: string;
    automatedExecutable: boolean;
    command?: string;
  }[];
  supervisoryApprovalRequired: boolean;
}

export interface AreaMember {
  id: string;
  voterId: string; // Election Number e.g. VOT-MUM-1001
  name: string;
  fatherName: string;
  motherName: string;
  aadhaarLast4: string;
  hometown: string; // e.g. 'Mumbai', 'Delhi', 'Bengaluru', 'Pune'
  constituency: string; // e.g. 'Mumbai South', 'Delhi Central'
  nationalIdMasked: string; // e.g. 'IND-****-8821'
  email?: string;
  status: 'REGISTERED' | 'ELIGIBLE' | 'VOTED' | 'SUSPENDED';
  hasRegisteredAccount?: boolean;
  hasVoted: boolean;
  votedAt?: string;
  receiptHash?: string;
  votingTokenRef?: string;
  createdAt: string;
}

export interface AreaElectionSession {
  id: string;
  area: string; // 'Mumbai', 'Delhi', 'Bengaluru', 'Pune'
  constituency: string;
  electionName: string;
  seasonRound: number; // e.g. Round 1, Round 2 (incremented on reset)
  state: ElectionState; // 'VOTING_OPEN', 'VOTING_CLOSED', 'TALLYING', 'RESULTS_PUBLISHED'
  isLive: boolean;
  totalRegistered: number;
  totalVoted: number;
  candidates: Candidate[];
  startedAt: string;
  endsAt: string;
  lastResetAt?: string;
}

export interface ElectoralRollVerifyRequest {
  voterId: string;
  voterName?: string;
  votingArea: string; // The area where user is attempting to vote
}

export interface ElectoralRollVerifyResponse {
  isFound: boolean;
  isEligible: boolean;
  member?: AreaMember;
  error?: string;
  errorCode?: 'NOT_IN_LIST' | 'HOMETOWN_MISMATCH' | 'ALREADY_VOTED' | 'SEASON_NOT_LIVE' | 'SUSPENDED';
  hometownMismatch?: {
    registeredHometown: string;
    attemptedArea: string;
  };
  hasVoted?: boolean;
  isSeasonLive?: boolean;
}

