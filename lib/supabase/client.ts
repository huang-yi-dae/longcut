/**
 * Local single-user browser client stub.
 *
 * For local deployment there is no Supabase project. This stub mirrors the
 * small slice of the Supabase client API used by client components
 * (auth identity + a no-op query builder) without performing any network calls
 * or importing Node-only modules.
 */
import { LOCAL_USER } from '@/lib/local-user';

const localSession = {
  user: LOCAL_USER,
  access_token: 'local',
  token_type: 'bearer',
  expires_in: 0,
  expires_at: 0,
  refresh_token: '',
};

function makeBuilder(): any {
  const result = { data: null, error: null };
  const chain = () => builder;
  const builder: any = {
    select: chain,
    insert: chain,
    update: chain,
    upsert: chain,
    delete: chain,
    eq: chain,
    neq: chain,
    gt: chain,
    gte: chain,
    lt: chain,
    lte: chain,
    like: chain,
    ilike: chain,
    is: chain,
    in: chain,
    not: chain,
    or: chain,
    order: chain,
    limit: chain,
    range: chain,
    single: chain,
    maybeSingle: chain,
    then: (onFulfilled?: (value: unknown) => unknown) =>
      Promise.resolve(onFulfilled ? onFulfilled(result) : result),
  };
  return builder;
}

export function createClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: LOCAL_USER }, error: null }),
      getSession: async () => ({ data: { session: localSession }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: LOCAL_USER, session: null },
        error: null,
      }),
      signUp: async () => ({ data: { user: LOCAL_USER }, error: null }),
      signInWithOAuth: async () => ({ error: null }),
      updateUser: async () => ({ data: { user: LOCAL_USER }, error: null }),
    },
    from: () => makeBuilder(),
    rpc: async () => ({ data: null, error: null }),
  };
}
