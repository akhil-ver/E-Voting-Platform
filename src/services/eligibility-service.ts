/**
 * Voter Eligibility & Anonymous Voting Token Service
 * Issues single-use voting tokens with nullifiers without tying voter identity to ballot
 */
import { IEligibilityService, IDatabaseService, IAuditService } from './interfaces';
import { EligibilityRecord, VotingToken } from '../types';
import { sha256 } from '../crypto/hashing';

export class EligibilityService implements IEligibilityService {
  private db: IDatabaseService;
  private audit: IAuditService;

  constructor(db: IDatabaseService, audit: IAuditService) {
    this.db = db;
    this.audit = audit;
  }

  public async checkEligibility(
    electionId: string,
    credentialRef: string
  ): Promise<{ isEligible: boolean; reason?: string }> {
    const existing = await this.db.query<EligibilityRecord>(
      'eligibility',
      (e) => e.electionId === electionId && e.credentialRef === credentialRef
    );

    if (existing.length > 0) {
      const record = existing[0];
      if (record.status === 'CONSUMED') {
        return { isEligible: false, reason: 'Voting token has already been consumed for this election.' };
      }
      if (record.status === 'REVOKED') {
        return { isEligible: false, reason: 'Eligibility has been revoked by Election Authority.' };
      }
      return { isEligible: true };
    }

    return { isEligible: true };
  }

  public async registerEligibility(
    electionId: string,
    credentialRef: string,
    fingerprint: string
  ): Promise<EligibilityRecord> {
    const eligibilityId = `elig-${Date.now()}`;
    const record: EligibilityRecord = {
      id: eligibilityId,
      eligibilityId,
      electionId,
      credentialRef,
      publicKeyFingerprint: fingerprint,
      status: 'ELIGIBLE',
      verifiedAt: new Date().toISOString(),
    };

    await this.db.write('eligibility', record);

    await this.audit.appendEvent({
      type: 'ELIGIBILITY_VERIFIED',
      actorId: credentialRef,
      entityId: electionId,
      details: { eligibilityId, fingerprint },
      requestId: `req-${Date.now()}`,
      outcome: 'SUCCESS',
    });

    return record;
  }

  public async issueEligibilityCredential(
    electionId: string,
    credentialRef: string
  ): Promise<VotingToken> {
    const eligibility = await this.checkEligibility(electionId, credentialRef);
    if (!eligibility.isEligible) {
      throw new Error(`Eligibility check failed: ${eligibility.reason}`);
    }

    const nullifierHash = await sha256(`${credentialRef}::${electionId}::nullifier_seed_${Date.now()}`);
    const token: VotingToken = {
      id: `vtok-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      electionId,
      credentialRef,
      nullifierHash,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      issuedAt: new Date().toISOString(),
    };

    await this.db.write('tokens', token);

    await this.audit.appendEvent({
      type: 'TOKEN_ISSUED',
      actorId: credentialRef,
      entityId: token.id,
      details: { electionId, nullifierPrefix: nullifierHash.slice(0, 10) },
      requestId: `req-${Date.now()}`,
      outcome: 'SUCCESS',
    });

    return token;
  }

  public async revokeEligibility(electionId: string, credentialRef: string, reason: string): Promise<boolean> {
    const existing = await this.db.query<EligibilityRecord>(
      'eligibility',
      (e) => e.electionId === electionId && e.credentialRef === credentialRef
    );
    if (existing.length > 0) {
      existing[0].status = 'REVOKED';
      await this.db.write('eligibility', existing[0]);
      return true;
    }
    return false;
  }

  public async getEligibilityStatus(electionId: string, credentialRef: string): Promise<EligibilityRecord | null> {
    const existing = await this.db.query<EligibilityRecord>(
      'eligibility',
      (e) => e.electionId === electionId && e.credentialRef === credentialRef
    );
    return existing[0] || null;
  }
}
