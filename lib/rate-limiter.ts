import { NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier?: string; // Custom identifier (user ID, IP, etc.)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until next request allowed
}

/**
 * Local single-user deployment: rate limiting is disabled. Every request is
 * allowed so the app behaves as a personal local tool. The presets below are
 * retained for reference / if remote deployment is ever re-enabled.
 */
export class RateLimiter {
  static async peek(_key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  static async check(_key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  static async reset(_key: string, _identifier?: string): Promise<void> {
    // No-op locally.
  }
}

// Preset configurations for different endpoints
export const RATE_LIMITS = {
  ANON_GENERATION: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 1 },
  ANON_CHAT: { windowMs: 60 * 1000, maxRequests: 10 },
  AUTH_GENERATION: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  AUTH_VIDEO_GENERATION: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 },
  AUTH_CHAT: { windowMs: 60 * 1000, maxRequests: 30 },
  SUGGESTED_QUESTIONS: { windowMs: 60 * 1000, maxRequests: 20 },
  VIDEO_GENERATION_FREE_UNREGISTERED: { windowMs: 30 * 24 * 60 * 60 * 1000, maxRequests: 0 },
  VIDEO_GENERATION_FREE_REGISTERED: { windowMs: 30 * 24 * 60 * 60 * 1000, maxRequests: 3 },
  VIDEO_GENERATION_PRO: { windowMs: 30 * 24 * 60 * 60 * 1000, maxRequests: 100 },
  API_GENERAL: { windowMs: 60 * 1000, maxRequests: 60 },
  AUTH_ATTEMPT: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  ANON_TRANSLATION: { windowMs: 60 * 1000, maxRequests: 100 },
  AUTH_TRANSLATION: { windowMs: 60 * 1000, maxRequests: 500 },
  READ_ONLY: { windowMs: 60 * 1000, maxRequests: 100 },
};

// Helper function for API responses
export function rateLimitResponse(_result: RateLimitResult): NextResponse | null {
  return null; // Request always allowed locally.
}

export function getPlanLimiter(
  tier: 'free' | 'pro' | 'anonymous'
): RateLimitConfig {
  switch (tier) {
    case 'pro':
      return RATE_LIMITS.VIDEO_GENERATION_PRO;
    case 'free':
      return RATE_LIMITS.VIDEO_GENERATION_FREE_REGISTERED;
    default:
      return RATE_LIMITS.VIDEO_GENERATION_FREE_UNREGISTERED;
  }
}
