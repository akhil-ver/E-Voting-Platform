/**
 * Merkle Tree Implementation
 * Builds binary Merkle Trees, computes Merkle Roots, generates and verifies Merkle Proofs
 */
import { sha256 } from './hashing';

export interface MerkleProofStep {
  hash: string;
  position: 'left' | 'right';
}

export interface MerkleProofResult {
  root: string;
  leafHash: string;
  proof: MerkleProofStep[];
  leafIndex: number;
}

export async function hashLeaf(data: string): Promise<string> {
  return sha256(`0x00${data}`);
}

export async function hashInternal(left: string, right: string): Promise<string> {
  const combined = left < right ? `${left}${right}` : `${right}${left}`;
  return sha256(`0x01${combined}`);
}

export class MerkleTree {
  private leaves: string[] = [];
  private layers: string[][] = [];

  constructor(leaves: string[] = []) {
    this.leaves = leaves;
  }

  public async build(): Promise<string> {
    if (this.leaves.length === 0) {
      const emptyRoot = await sha256('EMPTY_MERKLE_TREE');
      this.layers = [[emptyRoot]];
      return emptyRoot;
    }

    let currentLayer = await Promise.all(this.leaves.map((l) => hashLeaf(l)));
    this.layers = [currentLayer];

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        const parent = await hashInternal(left, right);
        nextLayer.push(parent);
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return this.getRoot();
  }

  public getRoot(): string {
    if (this.layers.length === 0) return '';
    return this.layers[this.layers.length - 1][0] || '';
  }

  public async getProof(leafIndex: number): Promise<MerkleProofStep[]> {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds`);
    }

    const proof: MerkleProofStep[] = [];
    let idx = leafIndex;

    for (let layerIdx = 0; layerIdx < this.layers.length - 1; layerIdx++) {
      const layer = this.layers[layerIdx];
      const isRightNode = idx % 2 === 1;
      const siblingIdx = isRightNode ? idx - 1 : idx + 1;

      if (siblingIdx < layer.length) {
        proof.push({
          hash: layer[siblingIdx],
          position: isRightNode ? 'left' : 'right',
        });
      } else {
        // Odd node paired with self
        proof.push({
          hash: layer[idx],
          position: 'right',
        });
      }

      idx = Math.floor(idx / 2);
    }

    return proof;
  }

  public static async verifyProof(
    leaf: string,
    proof: MerkleProofStep[],
    expectedRoot: string
  ): Promise<boolean> {
    let current = await hashLeaf(leaf);

    for (const step of proof) {
      if (step.position === 'left') {
        current = await hashInternal(step.hash, current);
      } else {
        current = await hashInternal(current, step.hash);
      }
    }

    return current === expectedRoot;
  }
}
