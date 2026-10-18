/**
 * Mock Blockchain Adapter
 * Implements IBlockchainService with realistic block mining, Merkle roots, quorum, and tamper detection
 */
import { IBlockchainService } from '../../../services/interfaces';
import { Block, Transaction, Validator } from '../../../types';
import { MerkleTree } from '../../../crypto/merkle';
import { sha256 } from '../../../crypto/hashing';

export class MockBlockchainService implements IBlockchainService {
  private chain: Block[] = [];
  private pendingTransactions: Transaction[] = [];
  private validators: Validator[] = [];

  constructor() {
    this.initializeValidators();
  }

  private initializeValidators() {
    this.validators = [
      {
        id: 'val-ec-01',
        name: 'Election Commission Validator',
        role: 'ELECTION_COMMISSION',
        status: 'ONLINE',
        publicIdentity: '0x89F3...A120',
        endpoint: 'node-ec.election.gov.internal',
        latencyMs: 14,
        lastHeartbeat: new Date().toISOString(),
        blocksValidated: 4,
        blocksRejected: 0,
      },
      {
        id: 'val-auditor-02',
        name: 'Independent Civil Auditor',
        role: 'INDEPENDENT_AUDITOR',
        status: 'ONLINE',
        publicIdentity: '0x34C1...B892',
        endpoint: 'node-auditor.democracy-watch.org',
        latencyMs: 28,
        lastHeartbeat: new Date().toISOString(),
        blocksValidated: 4,
        blocksRejected: 0,
      },
      {
        id: 'val-party-03',
        name: 'Multi-Party Observer Node',
        role: 'PARTY_OBSERVER',
        status: 'ONLINE',
        publicIdentity: '0x77E4...D901',
        endpoint: 'observer.inter-party-council.org',
        latencyMs: 32,
        lastHeartbeat: new Date().toISOString(),
        blocksValidated: 4,
        blocksRejected: 0,
      },
    ];
  }

  public async seedInitialChain(initialBlocks: Block[]): Promise<void> {
    this.chain = [...initialBlocks];
  }

  public async broadcastTransaction(tx: Transaction): Promise<{ accepted: boolean; txId: string }> {
    // Check if duplicate nonce or nullifier exists in pending or chain
    const inPending = this.pendingTransactions.some(
      (p) => p.nullifierHash === tx.nullifierHash || p.id === tx.id
    );
    if (inPending) {
      throw new Error(`Transaction rejection: Nullifier ${tx.nullifierHash.slice(0, 10)}... already in mempool`);
    }

    for (const block of this.chain) {
      const inBlock = block.transactions.some(
        (bTx) => bTx.nullifierHash === tx.nullifierHash || bTx.id === tx.id
      );
      if (inBlock) {
        throw new Error(`Duplicate vote rejected: Nullifier ${tx.nullifierHash.slice(0, 10)}... already recorded on block #${block.height}`);
      }
    }

    this.pendingTransactions.push(tx);
    return { accepted: true, txId: tx.id };
  }

  public async mineBlock(): Promise<Block> {
    const height = this.chain.length;
    const previousHash = height === 0 ? '0x0000000000000000000000000000000000000000000000000000000000000000' : this.chain[height - 1].blockHash;

    const txsToMine = this.pendingTransactions.length > 0
      ? [...this.pendingTransactions]
      : [
          {
            id: `tx-sys-${Date.now()}`,
            electionId: 'elec-2026-presidential',
            commitment: await sha256(`system-state-sync-${height}-${Date.now()}`),
            nullifierHash: await sha256(`system-nullifier-sync-${height}`),
            voterPublicKeyFingerprint: '0xSYSTEM...CONSENSUS',
            signature: '0xSIG_CONSENSUS_VALID',
            timestamp: new Date().toISOString(),
            status: 'CONFIRMED',
            nonce: `nonce-${Date.now()}`,
          },
        ];

    // Compute Merkle Tree
    const merkleLeaves = txsToMine.map((t) => `${t.id}:${t.commitment}:${t.nullifierHash}`);
    const tree = new MerkleTree(merkleLeaves);
    const merkleRoot = await tree.build();

    const timestamp = new Date().toISOString();
    const nonce = Math.floor(Math.random() * 1000000);

    // Compute Block Hash
    const blockPayload = `${height}:${previousHash}:${merkleRoot}:${timestamp}:${nonce}`;
    const blockHash = await sha256(blockPayload);

    // Collect validator signatures from active online nodes
    const activeValidators = this.validators.filter((v) => v.status === 'ONLINE');
    const validatorSignatures: Record<string, string> = {};

    for (const val of activeValidators) {
      validatorSignatures[val.id] = await sha256(`${blockHash}:${val.publicIdentity}`);
      val.blocksValidated++;
    }

    const block: Block = {
      id: `block-${height}`,
      height,
      timestamp,
      previousHash,
      merkleRoot,
      transactions: txsToMine.map((t) => ({ ...t, blockId: `block-${height}`, status: 'CONFIRMED' })),
      validatorSignatures,
      blockHash,
      nonce,
      isValid: true,
    };

    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  public async getChain(): Promise<Block[]> {
    return JSON.parse(JSON.stringify(this.chain));
  }

  public async getBlock(blockIdOrHeight: string | number): Promise<Block | null> {
    const block = this.chain.find(
      (b) => b.id === blockIdOrHeight || b.height === Number(blockIdOrHeight)
    );
    return block ? JSON.parse(JSON.stringify(block)) : null;
  }

  public async getValidatorStatus(): Promise<Validator[]> {
    return JSON.parse(JSON.stringify(this.validators));
  }

  public async validateBlock(block: Block): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. Check previous hash linkage
    if (block.height > 0) {
      const prevBlock = this.chain[block.height - 1];
      if (!prevBlock || prevBlock.blockHash !== block.previousHash) {
        errors.push(`Previous hash mismatch at height ${block.height}. Expected ${prevBlock?.blockHash}, got ${block.previousHash}`);
      }
    }

    // 2. Check Merkle root recalculation
    const merkleLeaves = block.transactions.map((t) => `${t.id}:${t.commitment}:${t.nullifierHash}`);
    const tree = new MerkleTree(merkleLeaves);
    const calculatedRoot = await tree.build();
    if (calculatedRoot !== block.merkleRoot) {
      errors.push(`Merkle root integrity failure: calculated ${calculatedRoot}, stored ${block.merkleRoot}`);
    }

    // 3. Check block hash calculation
    const blockPayload = `${block.height}:${block.previousHash}:${block.merkleRoot}:${block.timestamp}:${block.nonce}`;
    const calculatedHash = await sha256(blockPayload);
    if (calculatedHash !== block.blockHash) {
      errors.push(`Block hash tampering detected: calculated ${calculatedHash}, stored ${block.blockHash}`);
    }

    // 4. Check validator quorum (must have at least 2 signatures)
    const sigCount = Object.keys(block.validatorSignatures || {}).length;
    if (sigCount < 2) {
      errors.push(`Quorum failure: block has only ${sigCount}/3 validator signatures`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public async verifyMerkleProof(leaf: string, proof: string[], root: string): Promise<boolean> {
    // Basic verification check
    return MerkleTree.verifyProof(leaf, proof as unknown as { hash: string; position: 'left' | 'right' }[], root);
  }

  public async simulateTamper(blockHeight: number, field: string, value: string): Promise<Block> {
    const block = this.chain.find((b) => b.height === blockHeight);
    if (!block) throw new Error(`Block height ${blockHeight} not found`);

    if (field === 'blockHash') {
      block.blockHash = value;
    } else if (field === 'merkleRoot') {
      block.merkleRoot = value;
    } else if (field === 'previousHash') {
      block.previousHash = value;
    } else if (field === 'transaction' && block.transactions.length > 0) {
      block.transactions[0].commitment = value;
    }
    block.isValid = false;
    return block;
  }

  public async updateValidatorStatus(validatorId: string, status: Validator['status']): Promise<Validator> {
    const val = this.validators.find((v) => v.id === validatorId);
    if (!val) throw new Error(`Validator ${validatorId} not found`);
    val.status = status;
    val.lastHeartbeat = new Date().toISOString();
    return val;
  }
}
