/**
 * Local Storage Adapter
 * Implements IStorageService for artifacts, snapshots, and audit export
 */
import { IStorageService } from '../../../services/interfaces';
import { sha256 } from '../../../crypto/hashing';

export class LocalStorageService implements IStorageService {
  private files: Map<string, { content: string; metadata?: Record<string, string>; hash: string }> = new Map();

  public async upload(
    path: string,
    content: string | Uint8Array,
    metadata?: Record<string, string>
  ): Promise<{ uri: string; hash: string }> {
    const stringContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
    const hash = await sha256(stringContent);
    this.files.set(path, { content: stringContent, metadata, hash });
    return {
      uri: `local://storage/${path}`,
      hash,
    };
  }

  public async retrieve(path: string): Promise<string | null> {
    const file = this.files.get(path);
    if (!file) return null;
    return file.content;
  }

  public async delete(path: string): Promise<boolean> {
    return this.files.delete(path);
  }

  public async healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }> {
    return {
      status: 'HEALTHY',
      provider: 'local-memory',
    };
  }
}
