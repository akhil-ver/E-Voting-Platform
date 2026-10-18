/**
 * PostgreSQL / Neon Database Adapter
 * Implements IDatabaseService with connection pooling and schema auto-creation
 */
import pg from 'pg';
import { IDatabaseService } from '../../../services/interfaces';

const { Pool } = pg;

export class PostgresDatabaseService implements IDatabaseService {
  private pool: pg.Pool | null = null;
  private isConnected = false;
  private initPromise: Promise<void> | null = null;
  private memoryFallbackStore: Map<string, Map<string, unknown>> = new Map();

  constructor() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

    if (connectionString) {
      this.initPromise = this.initConnection(connectionString);
    }
  }

  private async initConnection(connectionString: string): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
      });

      // Ensure key table exists for key-value store mapping
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS app_documents (
          collection VARCHAR(128) NOT NULL,
          id VARCHAR(256) NOT NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (collection, id)
        );
        CREATE INDEX IF NOT EXISTS idx_app_documents_collection ON app_documents(collection);
      `);

      this.isConnected = true;
      console.log('[PostgresDatabaseService] Connected to PostgreSQL / Neon DB');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.isConnected = false;
      console.warn('[PostgresDatabaseService] Connection initialization failed, using memory fallback:', msg);
    }
  }

  private getMemoryCol(collection: string): Map<string, unknown> {
    if (!this.memoryFallbackStore.has(collection)) {
      this.memoryFallbackStore.set(collection, new Map());
    }
    return this.memoryFallbackStore.get(collection)!;
  }

  public async read<T>(collection: string, id: string): Promise<T | null> {
    if (this.initPromise) await this.initPromise;

    if (this.pool && this.isConnected) {
      try {
        const res = await this.pool.query(
          'SELECT data FROM app_documents WHERE collection = $1 AND id = $2',
          [collection, id]
        );
        if (res.rows.length > 0) {
          return res.rows[0].data as T;
        }
        return null;
      } catch (err) {
        console.warn(`[PostgresDatabaseService read] Error on ${collection}/${id}:`, err);
      }
    }

    const col = this.getMemoryCol(collection);
    const item = col.get(id);
    return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
  }

  public async write<T extends { id: string }>(collection: string, data: T): Promise<T> {
    const col = this.getMemoryCol(collection);
    col.set(data.id, JSON.parse(JSON.stringify(data)));

    if (this.initPromise) await this.initPromise;

    if (this.pool && this.isConnected) {
      try {
        await this.pool.query(
          `INSERT INTO app_documents (collection, id, data, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (collection, id)
           DO UPDATE SET data = $3, updated_at = NOW()`,
          [collection, data.id, JSON.stringify(data)]
        );
      } catch (err) {
        console.warn(`[PostgresDatabaseService write] Error on ${collection}:`, err);
      }
    }

    return data;
  }

  public async query<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]> {
    if (this.initPromise) await this.initPromise;

    if (this.pool && this.isConnected) {
      try {
        const res = await this.pool.query(
          'SELECT data FROM app_documents WHERE collection = $1',
          [collection]
        );
        const items = res.rows.map((r: { data: unknown }) => r.data as T);
        return filter ? items.filter(filter) : items;
      } catch (err) {
        console.warn(`[PostgresDatabaseService query] Error on ${collection}:`, err);
      }
    }

    const col = this.getMemoryCol(collection);
    const all = Array.from(col.values()).map((v) => JSON.parse(JSON.stringify(v)) as T);
    return filter ? all.filter(filter) : all;
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const col = this.getMemoryCol(collection);
    col.delete(id);

    if (this.initPromise) await this.initPromise;

    if (this.pool && this.isConnected) {
      try {
        await this.pool.query(
          'DELETE FROM app_documents WHERE collection = $1 AND id = $2',
          [collection, id]
        );
      } catch (err) {
        console.warn(`[PostgresDatabaseService delete] Error on ${collection}:`, err);
      }
    }

    return true;
  }

  public async transaction<T>(operations: () => Promise<T>): Promise<T> {
    return await operations();
  }

  public async healthCheck(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
    latencyMs: number;
    provider: string;
  }> {
    if (!this.pool || !this.isConnected) {
      return {
        status: 'DEGRADED',
        latencyMs: 0.5,
        provider: 'postgres (memory-fallback)',
      };
    }

    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return {
        status: 'HEALTHY',
        latencyMs: Date.now() - start,
        provider: 'neon-postgres',
      };
    } catch {
      return {
        status: 'UNAVAILABLE',
        latencyMs: Date.now() - start,
        provider: 'neon-postgres',
      };
    }
  }
}
