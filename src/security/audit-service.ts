/**
 * Cryptographic Hash-Chained Audit Trail Service
 * Every security-sensitive state transition is hashed and chained to its predecessor
 */
import { IAuditService, IDatabaseService } from '../services/interfaces';
import { AuditEvent } from '../types';
import { sha256 } from '../crypto/hashing';

export class AuditService implements IAuditService {
  private db: IDatabaseService;
  private lastHash: string = '0x0000000000000000000000000000000000000000000000000000000000000000';

  constructor(db: IDatabaseService) {
    this.db = db;
  }

  public async appendEvent(
    eventData: Omit<AuditEvent, 'id' | 'previousHash' | 'eventHash' | 'timestamp'>
  ): Promise<AuditEvent> {
    const existingEvents = await this.db.query<AuditEvent>('auditEvents');
    const previousHash = existingEvents.length > 0
      ? existingEvents[existingEvents.length - 1].eventHash
      : this.lastHash;

    const id = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const payloadString = `${id}:${eventData.type}:${eventData.actorId}:${eventData.entityId}:${JSON.stringify(eventData.details)}:${eventData.requestId}:${eventData.outcome}:${timestamp}`;
    const eventHash = await sha256(`${payloadString}:${previousHash}`);

    const event: AuditEvent = {
      ...eventData,
      id,
      previousHash,
      eventHash,
      timestamp,
    };

    await this.db.write('auditEvents', event);
    this.lastHash = eventHash;
    return event;
  }

  public async queryEvents(filter?: {
    type?: string;
    actorId?: string;
    outcome?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    let events = await this.db.query<AuditEvent>('auditEvents');
    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }
    if (filter?.actorId) {
      events = events.filter((e) => e.actorId === filter.actorId);
    }
    if (filter?.outcome) {
      events = events.filter((e) => e.outcome === filter.outcome);
    }
    const limit = filter?.limit || 100;
    return events.slice(-limit);
  }

  public async verifyIntegrity(): Promise<{
    isTampered: boolean;
    totalEvents: number;
    brokenEventId?: string;
    brokenIndex?: number;
  }> {
    const events = await this.db.query<AuditEvent>('auditEvents');
    let expectedPreviousHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Check previous hash link
      if (event.previousHash !== expectedPreviousHash) {
        return {
          isTampered: true,
          totalEvents: events.length,
          brokenEventId: event.id,
          brokenIndex: i,
        };
      }

      // Check current event hash recalculation
      const payloadString = `${event.id}:${event.type}:${event.actorId}:${event.entityId}:${JSON.stringify(event.details)}:${event.requestId}:${event.outcome}:${event.timestamp}`;
      const calculatedHash = await sha256(`${payloadString}:${event.previousHash}`);

      if (calculatedHash !== event.eventHash) {
        return {
          isTampered: true,
          totalEvents: events.length,
          brokenEventId: event.id,
          brokenIndex: i,
        };
      }

      expectedPreviousHash = event.eventHash;
    }

    return {
      isTampered: false,
      totalEvents: events.length,
    };
  }

  public async exportAudit(): Promise<string> {
    const events = await this.db.query<AuditEvent>('auditEvents');
    return JSON.stringify(events, null, 2);
  }

  public async tamperEvent(eventId: string, modifiedDetails: Record<string, unknown>): Promise<AuditEvent> {
    const event = await this.db.read<AuditEvent>('auditEvents', eventId);
    if (!event) throw new Error(`Audit event ${eventId} not found`);

    event.details = modifiedDetails;
    // Do not update eventHash or subsequent hashes to simulate deliberate log tampering
    await this.db.write('auditEvents', event);
    return event;
  }
}
