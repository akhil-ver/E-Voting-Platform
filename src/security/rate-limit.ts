/**
 * Rate Limiter Token Bucket Implementation
 * Mitigates denial-of-service and credential stuffing attacks on simulated API endpoints
 */

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
  limit: number;
}

export class TokenBucketRateLimiter {
  private requests: Map<string, { count: number; windowStart: number }> = new Map();
  private maxRequests: number;
  private windowSizeMs: number;

  constructor(maxRequests = 30, windowSizeMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowSizeMs = windowSizeMs;
  }

  public check(key: string): RateLimitStatus {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now - entry.windowStart > this.windowSizeMs) {
      this.requests.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTimeMs: now + this.windowSizeMs,
        limit: this.maxRequests,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs: entry.windowStart + this.windowSizeMs,
        limit: this.maxRequests,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTimeMs: entry.windowStart + this.windowSizeMs,
      limit: this.maxRequests,
    };
  }

  public reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const globalRateLimiter = new TokenBucketRateLimiter(500, 60000);
