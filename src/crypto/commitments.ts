/**
 * Cryptographic Commitments & Nullifiers
 * Preserves voter privacy while ensuring double-voting and replay prevention
 */
import { sha256 } from './hashing';

export interface BallotCommitment {
  commitmentHash: string;
  nullifierHash: string;
  blindingFactor: string;
}

export async function createBallotCommitment(
  candidateId: string,
  electionId: string,
  voterSecret: string
): Promise<BallotCommitment> {
  // Generate random 128-bit hex blinding factor
  let blindingFactor: string;
  if (typeof window !== 'undefined' && window.crypto) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    blindingFactor = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    blindingFactor = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Commitment = SHA-256(candidateId || blindingFactor || electionId)
  const commitmentHash = await sha256(`${candidateId}::${blindingFactor}::${electionId}`);

  // Nullifier = SHA-256(voterSecret || electionId || "nullifier")
  // Nullifier is unique per voter per election, without revealing voter identity or candidate choice
  const nullifierHash = await sha256(`${voterSecret}::${electionId}::nullifier_v1`);

  return {
    commitmentHash,
    nullifierHash,
    blindingFactor,
  };
}

export async function verifyBallotCommitment(
  candidateId: string,
  blindingFactor: string,
  electionId: string,
  expectedCommitment: string
): Promise<boolean> {
  const calculated = await sha256(`${candidateId}::${blindingFactor}::${electionId}`);
  return calculated === expectedCommitment;
}

export async function generateZKProofSimulation(
  commitment: string,
  nullifier: string,
  electionId: string
): Promise<{
  proofType: 'SIMULATED_GROTH16_ZK_SNARK';
  publicInputs: string[];
  proofBytes: string;
  statement: string;
}> {
  const statement = `Proof that ballot commitment ${commitment.slice(0, 10)}... belongs to a valid election credential without revealing candidate or secret key.`;
  const proofHash = await sha256(`${commitment}::${nullifier}::${electionId}::zk_snark_proof`);

  return {
    proofType: 'SIMULATED_GROTH16_ZK_SNARK',
    publicInputs: [commitment, nullifier, electionId],
    proofBytes: `0x7f${proofHash.slice(0, 48)}...${proofHash.slice(proofHash.length - 12)}`,
    statement,
  };
}
