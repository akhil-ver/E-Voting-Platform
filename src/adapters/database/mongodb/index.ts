/**
 * MongoDB Database Adapter (MongoDB Atlas / Local MongoDB)
 * Implements IDatabaseService with connection pooling and in-memory fallback
 */
import { MongoClient, Db } from 'mongodb';
import { IDatabaseService } from '../../../services/interfaces';

export class MongoDatabaseService implements IDatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private memoryFallbackStore: Map<string, Map<string, unknown>> = new Map();

  constructor() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'evoting_db';

    if (uri) {
      this.initConnection(uri, dbName).catch((err) => {
        console.warn('[MongoDatabaseService] Initial connection error, operating with memory fallback:', err.message);
      });
    }
  }

  private async initConnection(uri: string, dbName: string): Promise<void> {
    try {
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      console.log(`[MongoDatabaseService] Connected to MongoDB database: ${dbName}`);
    } catch (err) {
      this.isConnected = false;
      console.warn('[MongoDatabaseService] MongoDB connection failed:', err);
    }
  }

  private getMemoryCol(collection: string): Map<string, unknown> {
    if (!this.memoryFallbackStore.has(collection)) {
      this.memoryFallbackStore.set(collection, new Map());
    }
    return this.memoryFallbackStore.get(collection)!;
  }

  public async read<T>(collection: string, id: string): Promise<T | null> {
    if (this.db && this.isConnected) {
      try {
        const doc = await this.db.collection(collection).findOne({ _id: id as any });
        if (doc) {
          const { _id, ...rest } = doc;
          return { id: _id, ...rest } as unknown as T;
        }
        return null;
      } catch (err) {
        console.warn(`[MongoDatabaseService read] Error on ${collection}/${id}:`, err);
      }
    }

    const col = this.getMemoryCol(collection);
    const item = col.get(id);
    return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
  }

  public async write<T extends { id: string }>(collection: string, data: T): Promise<T> {
    const col = this.getMemoryCol(collection);
    col.set(data.id, JSON.parse(JSON.stringify(data)));

    if (this.db && this.isConnected) {
      try {
        const { id, ...rest } = data;
        await this.db.collection(collection).updateOne(
          { _id: id as any },
          { $set: { _id: id, ...rest, updatedAt: new Date() } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(`[MongoDatabaseService write] Error on ${collection}:`, err);
      }
    }

    return data;
  }

  public async query<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]> {
    if (this.db && this.isConnected) {
      try {
        const docs = await this.db.collection(collection).find({}).toArray();
        const items = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: _id, ...rest } as unknown as T;
        });
        return filter ? items.filter(filter) : items;
      } catch (err) {
        console.warn(`[MongoDatabaseService query] Error on ${collection}:`, err);
      }
    }

    const col = this.getMemoryCol(collection);
    const all = Array.from(col.values()).map((v) => JSON.parse(JSON.stringify(v)) as T);
    return filter ? all.filter(filter) : all;
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const col = this.getMemoryCol(collection);
    col.delete(id);

    if (this.db && this.isConnected) {
      try {
        await this.db.collection(collection).deleteOne({ _id: id as any });
      } catch (err) {
        console.warn(`[MongoDatabaseService delete] Error on ${collection}:`, err);
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
    if (!this.db || !this.isConnected) {
      return {
        status: 'DEGRADED',
        latencyMs: 0.5,
        provider: 'mongodb (memory fallback/connecting)',
      };
    }

    const start = Date.now();
    try {
      await this.db.command({ ping: 1 });
      return {
        status: 'HEALTHY',
        latencyMs: Date.now() - start,
        provider: 'mongodb-atlas',
      };
    } catch {
      return {
        status: 'UNAVAILABLE',
        latencyMs: Date.now() - start,
        provider: 'mongodb-atlas',
      };
    }
  }
}
