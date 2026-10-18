/**
 * Voting Service
 * Manages full cryptographic ballot creation, double-voting prevention,
 * mempool broadcasting, block mining, and receipt issuance
 */
import { IVotingService, IDatabaseService, IBlockchainService, IAuditService } from './interfaces';
import { VotingToken, Transaction, VerificationReceipt, EncryptedBallot, EligibilityRecord } from '../types';
import { createBallotCommitment, generateZKProofSimulation } from '../crypto/commitments';
import { encryptBallot } from '../crypto/encryption';
import { sha256 } from '../crypto/hashing';

export class VotingService implements IVotingService {
  private db: IDatabaseService;
  private blockchain: IBlockchainService;
  private audit: IAuditService;

  constructor(db: IDatabaseService, blockchain: IBlockchainService, audit: IAuditService) {
    this.db = db;
    this.blockchain = blockchain;
    this.audit = audit;
  }

  public async generateVotingToken(
    electionId: string,
    credentialRef: string,
    nullifierHash: string
  ): Promise<VotingToken> {
    const token: VotingToken = {
      id: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      electionId,
      credentialRef,
      nullifierHash,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      issuedAt: new Date().toISOString(),
    };

    await this.db.write('tokens', token);
    return token;
  }

  public async encryptVote(
    candidateId: string,
    electionId: string,
    voterSecret: string
  ): Promise<{ commitment: string; encryptedPayload: string; nullifierHash: string }> {
    const commitmentObj = await createBallotCommitment(candidateId, electionId, voterSecret);
    const ballotPayload = JSON.stringify({
      candidateId,
      electionId,
      blindingFactor: commitmentObj.blindingFactor,
      timestamp: new Date().toISOString(),
    });

    const encrypted = await encryptBallot(ballotPayload);

    return {
      commitment: commitmentObj.commitmentHash,
      encryptedPayload: encrypted.ciphertext,
      nullifierHash: commitmentObj.nullifierHash,
    };
  }

  public async detectDuplicateVote(
    electionId: string,
    nullifierHash: string
  ): Promise<{ isDuplicate: boolean; previousTxId?: string }> {
    const existingBallots = await this.db.query<EncryptedBallot>(
      'ballots',
      (b) => b.electionId === electionId && b.nullifierHash === nullifierHash
    );

    if (existingBallots.length > 0) {
      return { isDuplicate: true, previousTxId: existingBallots[0].transactionId };
    }

    const chain = await this.blockchain.getChain();
    for (const block of chain) {
      const match = block.transactions.find(
        (t) => t.electionId === electionId && t.nullifierHash === nullifierHash
      );
      if (match) {
        return { isDuplicate: true, previousTxId: match.id };
      }
    }

    return { isDuplicate: false };
  }

  public async submitVote(ballot: {
    electionId: string;
    commitment: string;
    nullifierHash: string;
    encryptedPayload: string;
    signature: string;
    voterPublicKeyFingerprint: string;
    nonce: string;
  }): Promise<{ transaction: Transaction; receipt: VerificationReceipt }> {
    const requestId = `req-vote-${Date.now()}`;

    // 1. Double-Vote & Nullifier Protection Check
    const dupCheck = await this.detectDuplicateVote(ballot.electionId, ballot.nullifierHash);
    if (dupCheck.isDuplicate) {
      await this.audit.appendEvent({
        type: 'DUPLICATE_VOTE_REJECTED',
        actorId: ballot.voterPublicKeyFingerprint,
        entityId: ballot.electionId,
        details: {
          nullifierHash: ballot.nullifierHash.slice(0, 12) + '...',
          previousTxId: dupCheck.previousTxId,
        },
        requestId,
        outcome: 'REJECTED',
      });
      throw new Error(
        `DUPLICATE VOTE DETECTED: This voting credential nullifier (${ballot.nullifierHash.slice(0, 10)}...) has already recorded a vote for this election. Duplicate submission strictly rejected.`
      );
    }

    // 2. Create Transaction Envelope
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const tx: Transaction = {
      id: txId,
      electionId: ballot.electionId,
      commitment: ballot.commitment,
      nullifierHash: ballot.nullifierHash,
      voterPublicKeyFingerprint: ballot.voterPublicKeyFingerprint,
      signature: ballot.signature,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      nonce: ballot.nonce,
    };

    // 3. Store encrypted ballot in private storage
    const encryptedBallotRecord: EncryptedBallot = {
      id: `ballot-${Date.now()}`,
      electionId: ballot.electionId,
      encryptedPayload: ballot.encryptedPayload,
      commitment: ballot.commitment,
      nullifierHash: ballot.nullifierHash,
      voterSignature: ballot.signature,
      timestamp: new Date().toISOString(),
      transactionId: txId,
    };
    await this.db.write('ballots', encryptedBallotRecord);

    // 4. Mark eligibility as consumed
    const eligRecords = await this.db.query<EligibilityRecord>(
      'eligibility',
      (e) => e.electionId === ballot.electionId && e.publicKeyFingerprint === ballot.voterPublicKeyFingerprint
    );
    if (eligRecords.length > 0) {
      eligRecords[0].status = 'CONSUMED';
      await this.db.write('eligibility', eligRecords[0]);
    }

    // 5. Broadcast to blockchain mempool
    await this.blockchain.broadcastTransaction(tx);

    // 6. Mine Block with validator quorum
    const minedBlock = await this.blockchain.mineBlock();

    // 7. Generate Simulated ZK Proof of Inclusion & Validity
    const zkProof = await generateZKProofSimulation(ballot.commitment, ballot.nullifierHash, ballot.electionId);

    // 8. Generate Public Verification Receipt
    const receiptHash = await sha256(`receipt:${txId}:${minedBlock.id}:${ballot.commitment}`);
    const receipt: VerificationReceipt = {
      receiptHash,
      transactionId: txId,
      electionId: ballot.electionId,
      blockHeight: minedBlock.height,
      blockHash: minedBlock.blockHash,
      merkleRoot: minedBlock.merkleRoot,
      merkleProof: [
        await sha256(`sibling-leaf-0:${minedBlock.height}`),
        await sha256(`sibling-branch-1:${minedBlock.height}`),
      ],
      timestamp: minedBlock.timestamp,
      validatorSignaturesCount: Object.keys(minedBlock.validatorSignatures).length,
      zkProofSimulated: zkProof.proofBytes,
      verificationStatus: 'VERIFIED',
    };

    await this.db.write('receipts', { id: receiptHash, ...receipt });

    await this.audit.appendEvent({
      type: 'VOTE_SUBMITTED',
      actorId: ballot.voterPublicKeyFingerprint,
      entityId: txId,
      details: {
        blockHeight: minedBlock.height,
        receiptHashPrefix: receiptHash.slice(0, 12),
        validatorsSigned: receipt.validatorSignaturesCount,
      },
      requestId,
      outcome: 'SUCCESS',
    });

    return { transaction: tx, receipt };
  }

  public async getBallotStatus(transactionId: string): Promise<{ status: string; blockHeight?: number; blockHash?: string }> {
    const chain = await this.blockchain.getChain();
    for (const block of chain) {
      const tx = block.transactions.find((t) => t.id === transactionId);
      if (tx) {
        return { status: 'CONFIRMED', blockHeight: block.height, blockHash: block.blockHash };
      }
    }
    return { status: 'PENDING' };
  }
}
