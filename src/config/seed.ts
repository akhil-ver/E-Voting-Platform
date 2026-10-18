/**
 * Comprehensive Demonstration Seed Engine
 * Populates realistic elections, candidates, mined blocks, fraud cases, and hash-chained audit trails
 */
import { getServices } from '../services/factory/service-factory';
import { Election, Block, Transaction, FraudCase } from '../types';
import { sha256 } from '../crypto/hashing';
import { MerkleTree } from '../crypto/merkle';

export async function seedDemoData(): Promise<void> {
  const services = getServices();

  // Check if already seeded
  const existingElections = await services.election.listElections();
  if (existingElections.length > 0) {
    return;
  }

  const now = new Date();
  const startAt = new Date(now.getTime() - 86400000).toISOString();
  const endAt = new Date(now.getTime() + 86400000 * 2).toISOString();

  // 1. Primary Election
  const election: Election = {
    id: 'elec-2026-presidential',
    electionNumber: 'ELEC-2026-PRES-01',
    name: '2026 Sovereign Presidential Election',
    electionType: 'Presidential General',
    constituencyId: 'const-mumbai-south',
    constituencyName: 'National Federal & Mumbai South Constituency',
    hometown: 'Mumbai',
    description: 'National General Election with end-to-end zero-knowledge voter receipt verifiability and decentralized validator consensus.',
    state: 'VOTING_OPEN',
    startAt,
    endAt,
    candidates: [
      {
        id: 'cand-01',
        electionId: 'elec-2026-presidential',
        displayName: 'Dr. Elena Vance',
        party: 'Digital Frontier & Innovation Party',
        symbol: '🌐',
        bio: 'Technologist and constitutional reform advocate focused on transparent governance and algorithmic integrity.',
        color: '#4FD1FF',
      },
      {
        id: 'cand-02',
        electionId: 'elec-2026-presidential',
        displayName: 'Marcus Sterling',
        party: 'National Integrity Coalition',
        symbol: '⚖️',
        bio: 'Former Supreme Court jurist championing institutional rule of law and balanced civic representation.',
        color: '#8B5CF6',
      },
      {
        id: 'cand-03',
        electionId: 'elec-2026-presidential',
        displayName: 'Senator Ronald Bennett',
        party: 'Democratic Renewal Alliance',
        symbol: '🏛️',
        bio: 'Senior parliamentarian with 20 years of public infrastructure and economic development experience.',
        color: '#F5B942',
      },
      {
        id: 'cand-04',
        electionId: 'elec-2026-presidential',
        displayName: 'Amara Okafor',
        party: 'Ecological & Civic Harmony Union',
        symbol: '🌿',
        bio: 'Environmental economist and grassroots civic organizer advancing sustainable energy and community trusts.',
        color: '#34D399',
      },
    ],
    configuration: {
      allowWriteIn: false,
      quorumThreshold: 0.67,
      fraudThreshold: 70,
      maxVoters: 25000,
      thresholdKeyHolders: 3,
      thresholdRequired: 2,
      zkProofEnabled: true,
      doubleVoteRule: 'STRICT_REJECT',
    },
    isPaused: false,
    isLockedDown: false,
    createdAt: startAt,
    updatedAt: now.toISOString(),
  };

  await services.database.write('elections', election);

  // 2. Initial Blocks & Seeded Transactions
  const genesisTxs: Transaction[] = [
    {
      id: 'tx-gen-001',
      electionId: 'elec-2026-presidential',
      commitment: await sha256('genesis-commitment-01'),
      nullifierHash: await sha256('genesis-nullifier-01'),
      voterPublicKeyFingerprint: '0x8F3A...11B9',
      signature: '0xSIG_ECDSA_GENESIS_01',
      timestamp: new Date(now.getTime() - 3600000 * 5).toISOString(),
      status: 'CONFIRMED',
      nonce: 'nonce-gen-001',
    },
    {
      id: 'tx-gen-002',
      electionId: 'elec-2026-presidential',
      commitment: await sha256('genesis-commitment-02'),
      nullifierHash: await sha256('genesis-nullifier-02'),
      voterPublicKeyFingerprint: '0x3C19...E842',
      signature: '0xSIG_ECDSA_GENESIS_02',
      timestamp: new Date(now.getTime() - 3600000 * 4.8).toISOString(),
      status: 'CONFIRMED',
      nonce: 'nonce-gen-002',
    },
  ];

  const tree0 = new MerkleTree(genesisTxs.map((t) => `${t.id}:${t.commitment}:${t.nullifierHash}`));
  const root0 = await tree0.build();
  const hash0 = await sha256(`0:0x0000000000000000000000000000000000000000000000000000000000000000:${root0}:${genesisTxs[0].timestamp}:482910`);

  const block0: Block = {
    id: 'block-0',
    height: 0,
    timestamp: genesisTxs[0].timestamp,
    previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    merkleRoot: root0,
    transactions: genesisTxs.map((t) => ({ ...t, blockId: 'block-0' })),
    validatorSignatures: {
      'val-ec-01': await sha256(`${hash0}:val-ec-01`),
      'val-auditor-02': await sha256(`${hash0}:val-auditor-02`),
      'val-party-03': await sha256(`${hash0}:val-party-03`),
    },
    blockHash: hash0,
    nonce: 482910,
    isValid: true,
  };

  // Block 1
  const b1Txs: Transaction[] = [
    {
      id: 'tx-001',
      electionId: 'elec-2026-presidential',
      commitment: await sha256('commitment-seed-01'),
      nullifierHash: await sha256('nullifier-seed-01'),
      voterPublicKeyFingerprint: '0x4F92...B391',
      signature: '0xSIG_ECDSA_VALID_01',
      timestamp: new Date(now.getTime() - 3600000 * 3).toISOString(),
      status: 'CONFIRMED',
      nonce: 'nonce-seed-01',
    },
    {
      id: 'tx-002',
      electionId: 'elec-2026-presidential',
      commitment: await sha256('commitment-seed-02'),
      nullifierHash: await sha256('nullifier-seed-02'),
      voterPublicKeyFingerprint: '0x99A4...4821',
      signature: '0xSIG_ECDSA_VALID_02',
      timestamp: new Date(now.getTime() - 3600000 * 2.8).toISOString(),
      status: 'CONFIRMED',
      nonce: 'nonce-seed-02',
    },
  ];

  const tree1 = new MerkleTree(b1Txs.map((t) => `${t.id}:${t.commitment}:${t.nullifierHash}`));
  const root1 = await tree1.build();
  const hash1 = await sha256(`1:${hash0}:${root1}:${b1Txs[0].timestamp}:791823`);

  const block1: Block = {
    id: 'block-1',
    height: 1,
    timestamp: b1Txs[0].timestamp,
    previousHash: hash0,
    merkleRoot: root1,
    transactions: b1Txs.map((t) => ({ ...t, blockId: 'block-1' })),
    validatorSignatures: {
      'val-ec-01': await sha256(`${hash1}:val-ec-01`),
      'val-auditor-02': await sha256(`${hash1}:val-auditor-02`),
      'val-party-03': await sha256(`${hash1}:val-party-03`),
    },
    blockHash: hash1,
    nonce: 791823,
    isValid: true,
  };

  // Seed into Blockchain service
  const mockBc = services.blockchain as { seedInitialChain?: (b: Block[]) => Promise<void> };
  if (mockBc.seedInitialChain) {
    await mockBc.seedInitialChain([block0, block1]);
  }

  // Seed sample public receipt
  const sampleReceiptHash = await sha256(`receipt:tx-001:block-1:${b1Txs[0].commitment}`);
  await services.database.write('receipts', {
    id: sampleReceiptHash,
    receiptHash: sampleReceiptHash,
    transactionId: 'tx-001',
    electionId: 'elec-2026-presidential',
    blockHeight: 1,
    blockHash: hash1,
    merkleRoot: root1,
    merkleProof: [await sha256('sibling-proof-01'), await sha256('sibling-proof-02')],
    timestamp: b1Txs[0].timestamp,
    validatorSignaturesCount: 3,
    zkProofSimulated: '0x7f88a912bc04...99f4',
    verificationStatus: 'VERIFIED',
  });

  // 3. Seed Fraud Cases with SHAP-style Factors
  const fraudCase1: FraudCase = {
    id: 'case-s104-flagged',
    sessionId: 'S-104',
    ipAddressMasked: '198.51.100.***',
    score: 92,
    riskLevel: 'CRITICAL',
    factors: [
      {
        name: 'Timing Anomaly (Sub-300ms Submission)',
        category: 'BEHAVIORAL',
        scoreImpact: 28,
        description: 'Voter client submitted encrypted ballot within 140ms of key issuance.',
        evidence: 'Timestamp delta: 140ms (99.8th percentile bot velocity)',
      },
      {
        name: 'Signature Pattern Anomaly',
        category: 'CRYPTOGRAPHIC',
        scoreImpact: 24,
        description: 'Mismatched entropy in ECDSA nonce k-generation.',
        evidence: 'Deterministic k-entropy deviation score: 0.94',
      },
      {
        name: 'Replay-Like Nonce Collision',
        category: 'CRYPTOGRAPHIC',
        scoreImpact: 18,
        description: 'Nonce similarity matched prior revoked mempool broadcast.',
        evidence: 'Levenshtein distance 1 to nonce-0x8892',
      },
      {
        name: 'Rapid Sequential Submissions',
        category: 'BEHAVIORAL',
        scoreImpact: 12,
        description: '4 burst submissions detected from origin subnet in 3.2s.',
        evidence: 'Burst rate: 1.25 req/sec',
      },
      {
        name: 'Session Lineage Deviation',
        category: 'BEHAVIORAL',
        scoreImpact: 10,
        description: 'Omitted standard client capability negotiation step.',
        evidence: 'Skipped handshake marker #3',
      },
    ],
    status: 'UNDER_REVIEW',
    timestamp: new Date(now.getTime() - 3600000 * 1.5).toISOString(),
    timeline: [
      { time: '14:20:01', event: 'Session initialized via Tor relay proxy', type: 'AUTH' },
      { time: '14:20:01.140', event: 'Ballot submitted with 140ms velocity', type: 'VOTE' },
      { time: '14:20:01.145', event: 'Automated Quarantine: Risk 92/100', type: 'ALERT' },
    ],
    recommendedAction: 'Isolate session in sandbox; preserve raw cryptographic evidence; require physical KYC audit.',
  };

  const fraudCase2: FraudCase = {
    id: 'case-s108-medium',
    sessionId: 'S-108',
    ipAddressMasked: '203.0.113.***',
    score: 45,
    riskLevel: 'MEDIUM',
    factors: [
      {
        name: 'Fast Interaction Velocity',
        category: 'BEHAVIORAL',
        scoreImpact: 25,
        description: 'Candidate selection completed in 1.4s.',
        evidence: 'Interaction duration: 1,420ms',
      },
      {
        name: 'Rate-Limit Transient Spike',
        category: 'BEHAVIORAL',
        scoreImpact: 20,
        description: '6 page requests in 10-second interval.',
        evidence: 'Burst load observed during ballot review',
      },
    ],
    status: 'CLEARED',
    reviewer: 'Officer Sarah Chen (Civil Auditor)',
    reviewedAt: new Date(now.getTime() - 1800000).toISOString(),
    timestamp: new Date(now.getTime() - 3600000 * 0.8).toISOString(),
    timeline: [
      { time: '15:10:12', event: 'Session started from mobile browser', type: 'AUTH' },
      { time: '15:10:14', event: 'Ballot verified and signed', type: 'VOTE' },
      { time: '15:30:00', event: 'Supervisory human clearance recorded', type: 'AUDIT' },
    ],
    recommendedAction: 'Cleared for standard block inclusion following human auditor inspection.',
  };

  await services.database.write('fraudCases', fraudCase1);
  await services.database.write('fraudCases', fraudCase2);

  // 4. Seed Hash-Chained Audit Trail
  const auditEvents = [
    {
      type: 'ELECTION_PAUSED' as const,
      actorId: 'admin-ec-commissioner',
      entityId: 'elec-2026-presidential',
      details: { action: 'INITIAL_EPOCH_BOOT', state: 'CONFIGURED' },
      requestId: 'req-init-001',
      outcome: 'SUCCESS' as const,
    },
    {
      type: 'VOTER_REGISTERED' as const,
      actorId: 'usr-voter-alpha',
      entityId: 'cred-001',
      details: { fingerprint: '0x4F92...B391', jurisdiction: 'District 04' },
      requestId: 'req-reg-001',
      outcome: 'SUCCESS' as const,
    },
    {
      type: 'VOTE_SUBMITTED' as const,
      actorId: '0x4F92...B391',
      entityId: 'tx-001',
      details: { blockHeight: 1, validatorSignaturesCount: 3 },
      requestId: 'req-vote-001',
      outcome: 'SUCCESS' as const,
    },
    {
      type: 'FRAUD_DETECTED' as const,
      actorId: 'S-104',
      entityId: 'case-s104-flagged',
      details: { score: 92, riskLevel: 'CRITICAL', topFactor: 'Timing Anomaly' },
      requestId: 'req-fraud-s104',
      outcome: 'WARNING' as const,
    },
  ];

  for (const ev of auditEvents) {
    await services.audit.appendEvent(ev);
  }
}
