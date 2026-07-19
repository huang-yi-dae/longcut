import { NextRequest, NextResponse } from 'next/server';

export interface SecurityMiddlewareConfig {
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  requireAuth?: boolean;
  maxBodySize?: number; // In bytes
  allowedMethods?: string[];
  csrfProtection?: boolean;
}

/**
 * Local single-user deployment: security enforcement (auth, rate limiting,
 * CSRF, content-size) is disabled. The middleware simply runs the handler and
 * attaches a few basic hardening headers. This keeps the route surface
 * identical while removing the remote-auth dependencies.
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  _config: SecurityMiddlewareConfig = {}
) {
  return async function securedHandler(req: NextRequest): Promise<NextResponse> {
    try {
      const response = await handler(req);

      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if origin is allowed for CORS (kept for reference).
 */
function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_BASE_URL,
    'http://localhost:3000',
    'http://localhost:8080',
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}

/**
 * Preset security configurations (retained for route signatures).
 */
export const SECURITY_PRESETS = {
  PUBLIC: {
    rateLimit: { windowMs: 60 * 1000, maxRequests: 60 },
    maxBodySize: 1024 * 1024,
    allowedMethods: ['GET', 'POST'],
  },
  AUTHENTICATED: {
    requireAuth: true,
    rateLimit: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
    maxBodySize: 5 * 1024 * 1024,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    csrfProtection: true,
  },
  AUTHENTICATED_READ_ONLY: {
    requireAuth: true,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 60 },
    maxBodySize: 1024 * 1024,
    allowedMethods: ['GET'],
    csrfProtection: false,
  },
  STRICT: {
    requireAuth: true,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 10 },
    maxBodySize: 512 * 1024,
    allowedMethods: ['POST'],
    csrfProtection: true,
  },
};
