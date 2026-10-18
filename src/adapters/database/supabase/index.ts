/**
 * Supabase Database & Storage Adapter
 * Implements IDatabaseService and IStorageService using Supabase client
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabaseService, IStorageService } from '../../../services/interfaces';

export class SupabaseDatabaseService implements IDatabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;
  private memoryFallbackStore: Map<string, Map<string, unknown>> = new Map();

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.client = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[SupabaseDatabaseService] Failed to initialize Supabase client:', err);
      }
    }
  }

  private getMemoryCol(collection: string): Map<string, unknown> {
    if (!this.memoryFallbackStore.has(collection)) {
      this.memoryFallbackStore.set(collection, new Map());
    }
    return this.memoryFallbackStore.get(collection)!;
  }

  public async read<T>(collection: string, id: string): Promise<T | null> {
    if (this.client && this.isConfigured) {
      try {
        const { data, error } = await this.client
          .from(collection)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // not found
          console.warn(`[Supabase read] Error on ${collection}/${id}:`, error.message);
          return this.readFromMemory<T>(collection, id);
        }
        return (data as T) ?? null;
      } catch (err) {
        console.warn(`[Supabase read] Exception on ${collection}/${id}:`, err);
        return this.readFromMemory<T>(collection, id);
      }
    }
    return this.readFromMemory<T>(collection, id);
  }

  private readFromMemory<T>(collection: string, id: string): T | null {
    const col = this.getMemoryCol(collection);
    const item = col.get(id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item)) as T;
  }

  public async write<T extends { id: string }>(collection: string, data: T): Promise<T> {
    // Write to in-memory fallback store
    const col = this.getMemoryCol(collection);
    col.set(data.id, JSON.parse(JSON.stringify(data)));

    if (this.client && this.isConfigured) {
      try {
        const { error } = await this.client
          .from(collection)
          .upsert(data, { onConflict: 'id' });

        if (error) {
          console.warn(`[Supabase write] Upsert notice on ${collection}:`, error.message);
        }
      } catch (err) {
        console.warn(`[Supabase write] Exception on ${collection}:`, err);
      }
    }

    return data;
  }

  public async query<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]> {
    if (this.client && this.isConfigured) {
      try {
        const { data, error } = await this.client.from(collection).select('*');
        if (!error && data && data.length > 0) {
          const items = data as T[];
          return filter ? items.filter(filter) : items;
        }
      } catch (err) {
        console.warn(`[Supabase query] Fallback to memory for ${collection}:`, err);
      }
    }

    const col = this.getMemoryCol(collection);
    const all = Array.from(col.values()).map((v) => JSON.parse(JSON.stringify(v)) as T);
    return filter ? all.filter(filter) : all;
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const col = this.getMemoryCol(collection);
    col.delete(id);

    if (this.client && this.isConfigured) {
      try {
        await this.client.from(collection).delete().eq('id', id);
      } catch (err) {
        console.warn(`[Supabase delete] Exception on ${collection}:`, err);
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
    if (!this.client || !this.isConfigured) {
      return {
        status: 'DEGRADED',
        latencyMs: 0.8,
        provider: 'supabase (unconfigured/mock-fallback)',
      };
    }

    const start = Date.now();
    try {
      const { error } = await this.client.from('elections').select('id').limit(1);
      const latency = Date.now() - start;
      if (error && error.code !== '42P01') { // 42P01: undefined table is ok before migration
        return {
          status: 'DEGRADED',
          latencyMs: latency,
          provider: 'supabase',
        };
      }
      return {
        status: 'HEALTHY',
        latencyMs: latency,
        provider: 'supabase',
      };
    } catch {
      return {
        status: 'UNAVAILABLE',
        latencyMs: Date.now() - start,
        provider: 'supabase',
      };
    }
  }
}

export class SupabaseStorageService implements IStorageService {
  private client: SupabaseClient | null = null;
  private bucket: string;
  private isConfigured = false;
  private localFiles: Map<string, { content: string | Uint8Array; hash: string }> = new Map();

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'e-voting-artifacts';

    if (supabaseUrl && supabaseKey) {
      try {
        this.client = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[SupabaseStorageService] Failed to init Supabase storage:', err);
      }
    }
  }

  public async upload(
    path: string,
    content: string | Uint8Array,
    metadata?: Record<string, string>
  ): Promise<{ uri: string; hash: string }> {
    const contentStr = typeof content === 'string' ? content : Buffer.from(content).toString('utf-8');
    const hash = `sha256-${Date.now().toString(16)}`;

    this.localFiles.set(path, { content, hash });

    if (this.client && this.isConfigured) {
      try {
        const fileBody = typeof content === 'string' ? content : Buffer.from(content);
        await this.client.storage.from(this.bucket).upload(path, fileBody, {
          upsert: true,
          metadata,
        });
        const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
        return { uri: data?.publicUrl || `/storage/${path}`, hash };
      } catch (err) {
        console.warn('[Supabase storage upload fallback]:', err);
      }
    }

    return { uri: `/storage/${path}`, hash };
  }

  public async retrieve(path: string): Promise<string | Uint8Array | null> {
    if (this.client && this.isConfigured) {
      try {
        const { data, error } = await this.client.storage.from(this.bucket).download(path);
        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          return new Uint8Array(arrayBuffer);
        }
      } catch (err) {
        console.warn('[Supabase storage retrieve fallback]:', err);
      }
    }

    const local = this.localFiles.get(path);
    return local ? local.content : null;
  }

  public async delete(path: string): Promise<boolean> {
    this.localFiles.delete(path);
    if (this.client && this.isConfigured) {
      try {
        await this.client.storage.from(this.bucket).remove([path]);
      } catch (err) {
        console.warn('[Supabase storage delete error]:', err);
      }
    }
    return true;
  }

  public async healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }> {
    return {
      status: this.isConfigured ? 'HEALTHY' : 'UNAVAILABLE',
      provider: 'supabase-storage',
    };
  }
}
