/**
 * Shared local-user identity for single-user local deployment.
 *
 * This module is intentionally free of any Node-only imports (no node:sqlite)
 * so it can be safely imported by both server and client (browser) code.
 */
export const LOCAL_USER_ID = 'local-user';
export const LOCAL_USER_EMAIL = 'local@localhost';

type UserMeta = {
  avatar_url?: string;
  [key: string]: unknown;
};

export const LOCAL_USER = {
  id: LOCAL_USER_ID,
  email: LOCAL_USER_EMAIL,
  app_metadata: { provider: 'local' } as UserMeta,
  user_metadata: {} as UserMeta,
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};
