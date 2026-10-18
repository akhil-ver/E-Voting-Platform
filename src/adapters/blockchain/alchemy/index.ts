/**
 * Alchemy Blockchain Adapter
 * Implements IBlockchainService using Alchemy Ethereum JSON-RPC with local consensus fallback
 */
import { JsonRpcProvider } from 'ethers';
import { IBlockchainService } from '../../../services/interfaces';
import { Block, Transaction, Validator } from '../../../types';
import { MockBlockchainService } from '../mock';

export class AlchemyBlockchainService implements IBlockchainService {
  private provider: JsonRpcProvider | null = null;
  private fallbackService: MockBlockchainService;
  private isConfigured = false;
  private rpcUrl: string | undefined;

  constructor() {
    this.fallbackService = new MockBlockchainService();
    this.rpcUrl = process.env.ALCHEMY_RPC_URL || process.env.ETHEREUM_RPC_URL;

    if (this.rpcUrl) {
      try {
        this.provider = new JsonRpcProvider(this.rpcUrl);
        this.isConfigured = true;
      } catch (err) {
        console.warn('[AlchemyBlockchainService] Initialization error:', err);
      }
    }
  }

  public async seedInitialChain(initialBlocks: Block[]): Promise<void> {
    return this.fallbackService.seedInitialChain(initialBlocks);
  }

  public async broadcastTransaction(tx: Transaction): Promise<{ accepted: boolean; txId: string }> {
    return this.fallbackService.broadcastTransaction(tx);
  }

  public async mineBlock(): Promise<Block> {
    const block = await this.fallbackService.mineBlock();

    // If Alchemy RPC is available, anchor or tag the state with the latest Ethereum block number
    if (this.provider && this.isConfigured) {
      try {
        const ethBlockNumber = await this.provider.getBlockNumber();
        const ethBlock = await this.provider.getBlock(ethBlockNumber);
        if (ethBlock) {
          block.validatorSignatures['alchemy_ethereum_anchor'] = `eth_block:${ethBlockNumber}:${ethBlock.hash?.slice(0, 16)}`;
        }
      } catch (err) {
        console.warn('[Alchemy anchor lookup warning]:', err);
      }
    }

    return block;
  }

  public async getChain(): Promise<Block[]> {
    return this.fallbackService.getChain();
  }

  public async getBlock(blockIdOrHeight: string | number): Promise<Block | null> {
    return this.fallbackService.getBlock(blockIdOrHeight);
  }

  public async getValidatorStatus(): Promise<Validator[]> {
    const validators = await this.fallbackService.getValidatorStatus();

    if (this.provider && this.isConfigured) {
      try {
        const start = Date.now();
        const blockNum = await this.provider.getBlockNumber();
        const latency = Date.now() - start;

        // Enhance with Alchemy Ethereum Anchor Node
        validators.push({
          id: 'val-alchemy-eth',
          name: 'Alchemy Ethereum Mainnet Anchor',
          role: 'ELECTION_COMMISSION',
          status: 'ONLINE',
          publicIdentity: `Block #${blockNum}`,
          endpoint: 'eth-mainnet.g.alchemy.com',
          latencyMs: latency,
          lastHeartbeat: new Date().toISOString(),
          blocksValidated: blockNum,
          blocksRejected: 0,
        });
      } catch (err) {
        console.warn('[Alchemy validator status error]:', err);
      }
    }

    return validators;
  }

  public async validateBlock(block: Block): Promise<{ isValid: boolean; errors: string[] }> {
    return this.fallbackService.validateBlock(block);
  }

  public async verifyMerkleProof(leaf: string, proof: string[], root: string): Promise<boolean> {
    return this.fallbackService.verifyMerkleProof(leaf, proof, root);
  }

  public async simulateTamper(blockHeight: number, field: string, value: string): Promise<Block> {
    return this.fallbackService.simulateTamper(blockHeight, field, value);
  }

  public async updateValidatorStatus(validatorId: string, status: Validator['status']): Promise<Validator> {
    return this.fallbackService.updateValidatorStatus(validatorId, status);
  }
}
