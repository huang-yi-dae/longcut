import crypto from 'crypto'

export type GuestAccessState = {
  token: string
  tokenNeedsSet: boolean
  used: boolean
  identifiers: string[]
}

/**
 * Local single-user deployment: there are no guests — every visitor is the
 * fixed local user. Access is always granted and usage is never recorded.
 */
export async function getGuestAccessState(_opts?: { supabase?: unknown }): Promise<GuestAccessState> {
  return {
    token: crypto.randomUUID(),
    tokenNeedsSet: false,
    used: false,
    identifiers: [],
  }
}

export function setGuestCookies(_response?: unknown, _state?: unknown, _extra?: unknown): void {
  // No-op locally.
}

export async function recordGuestUsage(_state?: unknown, _opts?: { supabase?: unknown }): Promise<void> {
  // No-op locally.
}
