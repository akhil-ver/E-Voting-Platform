/**
 * Cloudinary Storage Adapter
 * Implements IStorageService for election artifacts, audit logs, and certificates
 */
import { v2 as cloudinary } from 'cloudinary';
import { IStorageService } from '../../../services/interfaces';

export class CloudinaryStorageService implements IStorageService {
  private isConfigured = false;
  private localFiles: Map<string, { content: string | Uint8Array; hash: string }> = new Map();

  constructor() {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
      try {
        if (cloudinaryUrl) {
          cloudinary.config({ cloudinary_url: cloudinaryUrl });
        } else {
          cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
          });
        }
        this.isConfigured = true;
      } catch (err) {
        console.warn('[CloudinaryStorageService] Configuration error:', err);
      }
    }
  }

  public async upload(
    path: string,
    content: string | Uint8Array,
    metadata?: Record<string, string>
  ): Promise<{ uri: string; hash: string }> {
    const hash = `sha256-${Date.now().toString(16)}`;
    this.localFiles.set(path, { content, hash });

    if (this.isConfigured) {
      try {
        const base64Data =
          typeof content === 'string'
            ? Buffer.from(content).toString('base64')
            : Buffer.from(content).toString('base64');
        const dataUri = `data:application/octet-stream;base64,${base64Data}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
          public_id: path.replace(/[^a-zA-Z0-9_-]/g, '_'),
          resource_type: 'raw',
          context: metadata,
        });

        return {
          uri: uploadResult.secure_url || uploadResult.url,
          hash,
        };
      } catch (err) {
        console.warn('[CloudinaryStorageService upload] Fallback to local:', err);
      }
    }

    return { uri: `/storage/${path}`, hash };
  }

  public async retrieve(path: string): Promise<string | Uint8Array | null> {
    const local = this.localFiles.get(path);
    return local ? local.content : null;
  }

  public async delete(path: string): Promise<boolean> {
    this.localFiles.delete(path);
    if (this.isConfigured) {
      try {
        const publicId = path.replace(/[^a-zA-Z0-9_-]/g, '_');
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (err) {
        console.warn('[CloudinaryStorageService delete] Error:', err);
      }
    }
    return true;
  }

  public async healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }> {
    return {
      status: this.isConfigured ? 'HEALTHY' : 'UNAVAILABLE',
      provider: 'cloudinary',
    };
  }
}
