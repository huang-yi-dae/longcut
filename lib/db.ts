/**
 * Local SQLite backend for LongCut (single-user, local deployment).
 *
 * Replaces Supabase with Node's built-in `node:sqlite` (zero external deps).
 * Exposes:
 *   - `db`        : the DatabaseSync instance (for direct SQL if needed)
 *   - `createClient()` / `createServiceRoleClient()` : a minimal Supabase-compatible
 *                   client so existing route/action code keeps working unchanged.
 *
 * All data is stored in ./data/local.db (gitignored).
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { LOCAL_USER_ID, LOCAL_USER_EMAIL, LOCAL_USER } from './local-user';
export { LOCAL_USER_ID, LOCAL_USER_EMAIL, LOCAL_USER };

// node:sqlite types are provided by types/node-sqlite.d.ts (ambient declaration).

const DATA_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'local.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  free_generations_used INTEGER DEFAULT 0,
  topic_generation_mode TEXT DEFAULT 'smart',
  stripe_customer_id TEXT,
  subscription_tier TEXT DEFAULT 'free',
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  subscription_current_period_start TEXT,
  subscription_current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  topup_credits INTEGER DEFAULT 0,
  newsletter_subscribed INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS video_analyses (
  id TEXT PRIMARY KEY,
  youtube_id TEXT UNIQUE NOT NULL,
  slug TEXT,
  title TEXT NOT NULL,
  author TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  transcript TEXT,
  topics TEXT,
  summary TEXT,
  suggested_questions TEXT,
  model_used TEXT,
  language TEXT,
  available_languages TEXT,
  created_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS user_videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  accessed_at TEXT,
  is_favorite INTEGER DEFAULT 0,
  folder_id TEXT,
  notes TEXT,
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS user_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  note_text TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS favorite_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS video_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  identifier TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  video_id TEXT,
  counted_toward_limit INTEGER DEFAULT 1,
  subscription_tier TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS image_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  youtube_id TEXT NOT NULL,
  video_id TEXT,
  counted_toward_limit INTEGER DEFAULT 1,
  subscription_tier TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  key TEXT,
  identifier TEXT,
  timestamp TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT
);
`;

// Per-table JSON (stored as TEXT) and boolean (stored as 0/1) columns.
const TABLE_JSON: Record<string, string[]> = {
  video_analyses: ['transcript', 'topics', 'summary', 'suggested_questions', 'available_languages'],
  user_notes: ['metadata'],
  audit_logs: ['details'],
};
const TABLE_BOOL: Record<string, string[]> = {
  user_videos: ['is_favorite'],
  video_generations: ['counted_toward_limit'],
  image_generations: ['counted_toward_limit'],
  profiles: ['cancel_at_period_end', 'newsletter_subscribed'],
};
const TABLE_HAS_ID = new Set([
  'profiles',
  'video_analyses',
  'user_videos',
  'user_notes',
  'favorite_folders',
  'video_generations',
  'image_generations',
  'rate_limits',
  'audit_logs',
]);

const nowIso = () => new Date().toISOString();

function initDb(): DatabaseSync {
  mkdirSync(DATA_DIR, { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec('PRAGMA busy_timeout = 5000;');
  database.exec('PRAGMA synchronous = NORMAL;');
  database.exec('PRAGMA foreign_keys = OFF;');
  database.exec(SCHEMA);

  // Seed the single local user (always logged in).
  database
    .prepare(
      `INSERT OR IGNORE INTO profiles
        (id, email, subscription_tier, topup_credits, free_generations_used,
         topic_generation_mode, newsletter_subscribed, created_at, updated_at)
       VALUES (?, ?, 'pro', 999999, 0, 'smart', 1, ?, ?)`
    )
    .run(LOCAL_USER_ID, LOCAL_USER_EMAIL, nowIso(), nowIso());

  // Seed the default favorite folder.
  const existing = database
    .prepare(`SELECT id FROM favorite_folders WHERE user_id = ? AND name = ?`)
    .get(LOCAL_USER_ID, '默认收藏夹');
  if (!existing) {
    database
      .prepare(`INSERT INTO favorite_folders (id, user_id, name, created_at) VALUES (?, ?, ?, ?)`)
      .run(randomUUID(), LOCAL_USER_ID, '默认收藏夹', nowIso());
  }

  return database;
}

// Lazy singleton. The SQLite file is opened on the FIRST real query, NOT at
// module import time. This avoids "database is locked" (errcode 5) when Next.js
// build evaluates route modules across parallel worker threads — each would
// otherwise open its own connection to the same file during import.
let _db: DatabaseSync | null = null;
function getDbInstance(): DatabaseSync {
  if (!_db) _db = initDb();
  return _db;
}

// Proxy that forwards property/method access to the lazily-created instance.
// Methods are bound to the real instance so native `this` works (node:sqlite
// relies on it internally).
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const instance = getDbInstance();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
}) as unknown as DatabaseSync;

// (LOCAL_USER_ID / LOCAL_USER_EMAIL / LOCAL_USER are re-exported from ./local-user above.)

// ---------------------------------------------------------------------------
// Supabase-compatible query builder shim
// ---------------------------------------------------------------------------

type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is';
interface FilterFragment {
  sql: string;
  params: unknown[];
}

const SQL_OP: Record<FilterOp, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  ilike: 'LIKE',
  is: 'IS',
};

class QueryBuilder {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private selectCols = '*';
  private head = false;
  private countExact = false;
  private selectCalled = false;
  private filters: FilterFragment[] = [];
  private orGroups: FilterFragment[][] = [];
  private orderClauses: { col: string; dir: 'ASC' | 'DESC' }[] = [];
  private limitN: number | null = null;
  private offset = 0;
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private onConflict: string | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(private database: DatabaseSync, private table: string) {}

  select(columns?: string, opts?: { count?: 'exact'; head?: boolean }): this {
    if (typeof columns === 'object' && columns !== null) {
      opts = columns as { count?: 'exact'; head?: boolean };
      columns = '*';
    }
    this.selectCalled = true;
    this.selectCols = columns && columns !== '*' ? columns : '*';
    if (opts?.count === 'exact') this.countExact = true;
    if (opts?.head) this.head = true;
    return this;
  }

  private addFilter(col: string, op: FilterOp, val: unknown): this {
    this.filters.push(this.opToSql(col, op, val, false));
    return this;
  }
  eq(c: string, v: unknown) { return this.addFilter(c, 'eq', v); }
  neq(c: string, v: unknown) { return this.addFilter(c, 'neq', v); }
  gt(c: string, v: unknown) { return this.addFilter(c, 'gt', v); }
  gte(c: string, v: unknown) { return this.addFilter(c, 'gte', v); }
  lt(c: string, v: unknown) { return this.addFilter(c, 'lt', v); }
  lte(c: string, v: unknown) { return this.addFilter(c, 'lte', v); }

  in(c: string, arr: unknown[]): this {
    const placeholders = arr.map(() => '?').join(',');
    this.filters.push({ sql: `${c} IN (${placeholders})`, params: arr });
    return this;
  }

  not(c: string, op: FilterOp, val: unknown): this {
    if (op === 'is') {
      const isNull = val === null || val === 'null';
      this.filters.push({ sql: `${c} IS NOT NULL`, params: [] });
      return this;
    }
    this.filters.push(this.opToSql(c, op, val, true));
    return this;
  }

  or(condString: string): this {
    const parts = condString.split(',');
    const group: FilterFragment[] = [];
    for (const part of parts) {
      const segs = part.split('.');
      const col = segs[0];
      const op = segs[1] as FilterOp;
      const val = segs.slice(2).join('.');
      group.push(this.opToSql(col, op, val, false));
    }
    this.orGroups.push(group);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderClauses.push({ col, dir: opts?.ascending === false ? 'DESC' : 'ASC' });
    return this;
  }
  limit(n: number): this { this.limitN = n; return this; }
  range(start: number, end: number): this { this.offset = start; this.limitN = end - start + 1; return this; }
  single(): this { this.isSingle = true; return this; }
  maybeSingle(): this { this.isMaybeSingle = true; return this; }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]): this {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }
  update(payload: Record<string, unknown>): this {
    this.op = 'update';
    this.payload = payload;
    return this;
  }
  upsert(payload: Record<string, unknown>, opts?: { onConflict?: string }): this {
    this.op = 'upsert';
    this.payload = payload;
    this.onConflict = opts?.onConflict ?? null;
    return this;
  }
  delete(): this { this.op = 'delete'; return this; }

  private opToSql(col: string, op: FilterOp, val: unknown, negate = false): FilterFragment {
    if (op === 'is') {
      const isNull = val === null || val === 'null';
      if (isNull) {
        return { sql: `${col} ${negate ? 'IS NOT' : 'IS'} NULL`, params: [] };
      }
      return { sql: `${col} ${negate ? 'IS NOT' : 'IS'} ?`, params: [val] };
    }
    const sqlOp = SQL_OP[op];
    return { sql: `${col} ${negate ? `NOT ${sqlOp}` : sqlOp} ?`, params: [val] };
  }

  private where(): FilterFragment {
    const clauses: string[] = [];
    const params: unknown[] = [];
    for (const f of this.filters) {
      clauses.push(f.sql);
      params.push(...f.params);
    }
    for (const grp of this.orGroups) {
      const parts = grp.map((g) => g.sql);
      clauses.push(`(${parts.join(' OR ')})`);
      for (const g of grp) params.push(...g.params);
    }
    return clauses.length ? { sql: ' WHERE ' + clauses.join(' AND '), params } : { sql: '', params: [] };
  }

  private serialize(value: unknown, col: string): unknown {
    if (TABLE_JSON[this.table]?.includes(col) && value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (TABLE_BOOL[this.table]?.includes(col) && typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  }

  private parseRow(row: Record<string, unknown>): Record<string, unknown> {
    const obj: Record<string, unknown> = { ...row };
    for (const c of TABLE_JSON[this.table] ?? []) {
      if (obj[c] != null && typeof obj[c] === 'string') {
        try {
          obj[c] = JSON.parse(obj[c] as string);
        } catch {
          /* leave as string */
        }
      }
    }
    for (const c of TABLE_BOOL[this.table] ?? []) {
      if (obj[c] !== undefined && obj[c] !== null) obj[c] = !!obj[c];
    }
    return obj;
  }

  private selectBack(ids: string[]): unknown {
    if (this.isSingle || this.isMaybeSingle) {
      const id = ids[ids.length - 1];
      const row = id ? this.database.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id) : undefined;
      return row ? this.parseRow(row as Record<string, unknown>) : null;
    }
    const rows = ids.length
      ? this.database.prepare(`SELECT * FROM ${this.table} WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids)
      : [];
    return (rows as Record<string, unknown>[]).map((r) => this.parseRow(r));
  }

  private execute(): { data: unknown; error: { message: string; code?: string } | null; count?: number | null } {
    if (this.op === 'select') return this.execSelect();
    if (this.op === 'insert') return this.execInsert();
    if (this.op === 'update') return this.execUpdate();
    if (this.op === 'upsert') return this.execUpsert();
    if (this.op === 'delete') return this.execDelete();
    return { data: null, error: null };
  }

  private execSelect() {
    const where = this.where();
    if (this.countExact) {
      const row = this.database.prepare(`SELECT COUNT(*) as count FROM ${this.table}${where.sql}`).get(...where.params) as { count: number };
      return { data: null, error: null, count: row?.count ?? 0 };
    }
    let sql = `SELECT ${this.selectCols} FROM ${this.table}${where.sql}`;
    if (this.orderClauses.length) {
      sql += ' ORDER BY ' + this.orderClauses.map((o) => `${o.col} ${o.dir}`).join(', ');
    }
    if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
    if (this.offset) sql += ` OFFSET ${this.offset}`;
    const raw = this.database.prepare(sql).all(...where.params) as Record<string, unknown>[];
    const rows = raw.map((r) => this.parseRow(r));
    if (this.isSingle) {
      if (rows.length === 0) return { data: null, error: { message: 'not found', code: 'PGRST116' }, count: null };
      if (rows.length > 1) return { data: null, error: { message: 'multiple rows', code: 'PGRST116' }, count: null };
      return { data: rows[0], error: null, count: null };
    }
    if (this.isMaybeSingle) return { data: rows[0] ?? null, error: null, count: null };
    return { data: rows, error: null, count: null };
  }

  private execInsert() {
    const payloads = Array.isArray(this.payload) ? this.payload : [this.payload as Record<string, unknown>];
    const ids: string[] = [];
    for (const p of payloads) {
      const pp = { ...p };
      if (TABLE_HAS_ID.has(this.table) && pp.id == null) pp.id = randomUUID();
      const cols = Object.keys(pp);
      const vals = cols.map((c) => this.serialize(pp[c], c));
      this.database
        .prepare(`INSERT INTO ${this.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
        .run(...vals);
      ids.push(pp.id as string);
    }
    if (this.selectCalled || this.isSingle || this.isMaybeSingle) {
      const data = Array.isArray(this.payload) ? this.selectBack(ids) : this.selectBack(ids);
      return { data, error: null };
    }
    return { data: null, error: null };
  }

  private execUpdate() {
    const pp = { ...(this.payload as Record<string, unknown>) };
    const setCols = Object.keys(pp).filter((c) => c !== 'id');
    const setVals = setCols.map((c) => this.serialize(pp[c], c));
    const where = this.where();
    this.database
      .prepare(`UPDATE ${this.table} SET ${setCols.map((c) => `${c} = ?`).join(', ')}${where.sql}`)
      .run(...setVals, ...where.params);
    if (this.selectCalled || this.isSingle || this.isMaybeSingle) {
      const raw = this.database.prepare(`SELECT * FROM ${this.table}${where.sql}`).all(...where.params) as Record<string, unknown>[];
      const rows = raw.map((r) => this.parseRow(r));
      const data = this.isSingle || this.isMaybeSingle ? (rows[0] ?? null) : rows;
      return { data, error: null };
    }
    return { data: null, error: null };
  }

  private execUpsert() {
    const pp = { ...(this.payload as Record<string, unknown>) };
    const conflictCols = (this.onConflict ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (TABLE_HAS_ID.has(this.table) && pp.id == null) {
      pp.id = randomUUID();
    }
    const cols = Object.keys(pp);
    const vals = cols.map((c) => this.serialize(pp[c], c));
    const updateCols = cols.filter((c) => !conflictCols.includes(c));
    const doUpdate = updateCols.length
      ? ` DO UPDATE SET ${updateCols.map((c) => `${c} = excluded.${c}`).join(', ')}`
      : ' DO NOTHING';
    const conflictSql = this.onConflict ? ` ON CONFLICT(${this.onConflict})` : '';
    this.database
      .prepare(`INSERT INTO ${this.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})${conflictSql}${doUpdate}`)
      .run(...vals);

    let whereSql = '';
    let params: unknown[] = [];
    if (conflictCols.length) {
      whereSql = ' WHERE ' + conflictCols.map((c) => `${c} = ?`).join(' AND ');
      params = conflictCols.map((c) => pp[c]);
    } else if (pp.id != null) {
      whereSql = ' WHERE id = ?';
      params = [pp.id];
    }
    if (whereSql) {
      const raw = this.database.prepare(`SELECT * FROM ${this.table}${whereSql}`).all(...params) as Record<string, unknown>[];
      const rows = raw.map((r) => this.parseRow(r));
      const data = this.isSingle || this.isMaybeSingle ? (rows[0] ?? null) : rows;
      return { data, error: null };
    }
    return { data: null, error: null };
  }

  private execDelete() {
    const where = this.where();
    this.database.prepare(`DELETE FROM ${this.table}${where.sql}`).run(...where.params);
    return { data: null, error: null };
  }

  // Make the builder awaitable: `await supabase.from('x').select()...`
  then<T>(onFulfilled?: (value: unknown) => T | PromiseLike<T>): Promise<T> {
    try {
      const res = this.execute();
      const normalized = {
        data: res.data,
        error: res.error ?? null,
        count: 'count' in res ? res.count : null,
        status: res.error ? 400 : 200,
      };
      return Promise.resolve(onFulfilled ? onFulfilled(normalized) : (normalized as unknown as T));
    } catch (e) {
      const err = { message: e instanceof Error ? e.message : String(e) };
      return Promise.reject(err);
    }
  }
}

function createLocalClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: LOCAL_USER }, error: null }),
      getSession: async () => ({
        data: {
          session: {
            user: LOCAL_USER,
            access_token: 'local',
            token_type: 'bearer',
            expires_in: 0,
            expires_at: 0,
            refresh_token: '',
          },
        },
        error: null,
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: LOCAL_USER, session: null }, error: null }),
      signUp: async () => ({ data: { user: LOCAL_USER }, error: null }),
    },
    from: (table: string) => new QueryBuilder(db, table),
    rpc: async () => ({ data: null, error: null }),
  };
}

// Public API used across the codebase.
export function createClient(): any {
  return createLocalClient();
}

export function createServiceRoleClient(): any {
  return createLocalClient();
}
