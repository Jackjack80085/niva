import { AsyncLocalStorage } from 'node:async_hooks';
import { DatabaseSync } from 'node:sqlite';
import { Pool, type PoolClient, type PoolConfig } from 'pg';
import { attachDatabasePool } from '@vercel/functions';

export type Row = Record<string, any>;
export type QueryResult = { rows: Row[]; rowCount?: number | null };
export interface QueryClient {
  query(text: string, values?: any[]): Promise<QueryResult>;
  release(): void;
}
export interface QueryPool {
  query(text: string, values?: any[]): Promise<QueryResult>;
  connect(): Promise<QueryClient>;
  end(): Promise<void>;
}
export interface Database {
  dialect: 'sqlite' | 'postgres';
  prepare(sql: string): {
    get(...values: any[]): Promise<Row | undefined>;
    all(...values: any[]): Promise<Row[]>;
    run(...values: any[]): Promise<{ changes: number }>;
  };
  exec(sql: string): Promise<void>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

// SQLite remains useful locally. A single connection must never admit another
// request between BEGIN and COMMIT, even when the transaction callback awaits.
export class SqliteDatabase implements Database {
  readonly dialect = 'sqlite' as const;
  private raw: DatabaseSync;
  private context = new AsyncLocalStorage<boolean>();
  private tail: Promise<unknown> = Promise.resolve();
  constructor(path: string) { this.raw = new DatabaseSync(path); }
  private queue<T>(fn: () => T | Promise<T>): Promise<T> {
    if (this.context.getStore()) return Promise.resolve().then(fn);
    const work = this.tail.then(fn);
    this.tail = work.catch(() => {});
    return work;
  }
  prepare(sql: string) {
    return {
      get: (...values: any[]) => this.queue(() => this.raw.prepare(sql).get(...values) as Row | undefined),
      all: (...values: any[]) => this.queue(() => this.raw.prepare(sql).all(...values) as Row[]),
      run: (...values: any[]) => this.queue(() => ({ changes: Number(this.raw.prepare(sql).run(...values).changes) })),
    };
  }
  async exec(sql: string) { await this.queue(() => this.raw.exec(sql)); }
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.context.getStore()) return fn();
    return this.queue(() => this.context.run(true, async () => {
      this.raw.exec('BEGIN IMMEDIATE');
      try { const result = await fn(); this.raw.exec('COMMIT'); return result; }
      catch (error) { this.raw.exec('ROLLBACK'); throw error; }
    }));
  }
  async close() { await this.queue(() => this.raw.close()); }
}

// Only parameter placeholders outside string literals are converted. Values
// always remain bound parameters; application input never becomes SQL text.
export function postgresSql(sql: string): string {
  let quoted = false, index = 0, output = '';
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      output += ch;
      if (quoted && sql[i + 1] === "'") { output += sql[++i]; continue; }
      quoted = !quoted;
    } else output += ch === '?' && !quoted ? `$${++index}` : ch;
  }
  return output;
}

export class PostgresDatabase implements Database {
  readonly dialect = 'postgres' as const;
  private context = new AsyncLocalStorage<QueryClient>();
  constructor(private pool: QueryPool) {}
  private query(sql: string, values: any[] = []) {
    return (this.context.getStore() || this.pool).query(postgresSql(sql), values);
  }
  prepare(sql: string) {
    return {
      get: async (...values: any[]) => (await this.query(sql, values)).rows[0],
      all: async (...values: any[]) => (await this.query(sql, values)).rows,
      run: async (...values: any[]) => ({ changes: (await this.query(sql, values)).rowCount || 0 }),
    };
  }
  async exec(sql: string) { await this.query(sql); }
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.context.getStore()) return fn();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Shared across function instances. Protect interval checks, settings and
      // idempotency using one database transaction, not an in-process mutex.
      await client.query("SELECT pg_advisory_xact_lock(731648920147::bigint)");
      const value = await this.context.run(client, fn);
      await client.query('COMMIT');
      return value;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
  async close() { await this.pool.end(); }
}

export function postgresDatabase(connectionString: string) {
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must be a Postgres connection string.');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  // Avoid pg's sslmode=require replacing the verified TLS configuration.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  const options: PoolConfig = {
    connectionString: url.toString(), max: 3, idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000, statement_timeout: 20000,
    ssl: local ? false : { rejectUnauthorized: true },
  };
  const pool = new Pool(options);
  // Never log errors with connection details or query parameters.
  pool.on('error', () => console.error('A database connection was interrupted.'));
  if (process.env.VERCEL) attachDatabasePool(pool);
  return new PostgresDatabase(pool);
}
