/**
 * Mock Database Adapter
 * Implements IDatabaseService with in-memory persistence and transactional isolation
 */
import { IDatabaseService } from '../../../services/interfaces';

export class MockDatabaseService implements IDatabaseService {
  private store: Map<string, Map<string, unknown>> = new Map();

  constructor() {
    this.store.set('users', new Map());
    this.store.set('credentials', new Map());
    this.store.set('eligibility', new Map());
    this.store.set('elections', new Map());
    this.store.set('tokens', new Map());
    this.store.set('ballots', new Map());
    this.store.set('transactions', new Map());
    this.store.set('blocks', new Map());
    this.store.set('validators', new Map());
    this.store.set('fraudCases', new Map());
    this.store.set('auditEvents', new Map());
    this.store.set('receipts', new Map());
    this.store.set('snapshots', new Map());
  }

  private getCollectionMap(collection: string): Map<string, unknown> {
    if (!this.store.has(collection)) {
      this.store.set(collection, new Map());
    }
    return this.store.get(collection)!;
  }

  public async read<T>(collection: string, id: string): Promise<T | null> {
    const col = this.getCollectionMap(collection);
    const item = col.get(id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item)) as T;
  }

  public async write<T extends { id: string }>(collection: string, data: T): Promise<T> {
    const col = this.getCollectionMap(collection);
    col.set(data.id, JSON.parse(JSON.stringify(data)));
    return data;
  }

  public async query<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]> {
    const col = this.getCollectionMap(collection);
    const all = Array.from(col.values()).map((v) => JSON.parse(JSON.stringify(v)) as T);
    if (!filter) return all;
    return all.filter(filter);
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const col = this.getCollectionMap(collection);
    return col.delete(id);
  }

  public async transaction<T>(operations: () => Promise<T>): Promise<T> {
    // Snapshot state for rollback on error
    const backup = new Map<string, Map<string, unknown>>();
    for (const [colName, colMap] of this.store.entries()) {
      backup.set(colName, new Map(colMap));
    }

    try {
      return await operations();
    } catch (err) {
      this.store = backup;
      throw err;
    }
  }

  public async healthCheck(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE'; latencyMs: number; provider: string }> {
    return {
      status: 'HEALTHY',
      latencyMs: 1.2,
      provider: 'mock-in-memory',
    };
  }

  public async dumpAll(): Promise<Record<string, unknown[]>> {
    const result: Record<string, unknown[]> = {};
    for (const [k, v] of this.store.entries()) {
      result[k] = Array.from(v.values());
    }
    return result;
  }

  public async restoreAll(dump: Record<string, unknown[]>): Promise<void> {
    this.store.clear();
    for (const [k, arr] of Object.entries(dump)) {
      const colMap = new Map<string, unknown>();
      for (const item of arr) {
        if (item && typeof item === 'object' && 'id' in item) {
          colMap.set((item as { id: string }).id, item);
        }
      }
      this.store.set(k, colMap);
    }
  }
}
