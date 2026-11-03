import { createCodec, encryptionKey } from './encryption';
import { mkdirSync, chmodSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import type { Appointment } from '../src/types';
import { INITIAL_WEEKLY_AVAILABILITY } from '../src/data/initialData';
import { SqliteDatabase, postgresDatabase, type Database } from './database';

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
export type Booking = Appointment & { accessHash: string; startMs: number; endMs: number; orderId?: string; paymentId?: string; calendarEventId?: string; calendarStatus: 'waiting_payment' | 'queued' | 'synced' | 'conflict'; };
export type Job = { id: number; kind: string; bookingId: string; payload: string; attempts: number; status: string; leaseToken: string };

export class Store {
  readonly db: Database;
  readonly ready: Promise<void>;
  encode: (value: unknown) => string;
  decode: <T>(value: string) => T;
  constructor(path: string, configuredKey?: string, database?: Database) {
    const remote = !!database || /^postgres(?:ql)?:/.test(path);
    if (remote && !configuredKey) throw new Error('Postgres requires DATA_ENCRYPTION_KEY.');
    if (!remote && path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
      try { writeFileSync(path, '', { flag: 'wx', mode: 0o600 }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
      chmodSync(path, 0o600);
    }
    const codec = createCodec(encryptionKey(remote ? ':memory:' : path, configuredKey));
    this.encode = codec.encode; this.decode = codec.decode;
    this.db = database || (remote ? postgresDatabase(path) : new SqliteDatabase(path));
    this.ready = this.initialize();
  }
  private async initialize() {
    const pg = this.db.dialect === 'postgres';
    if (!pg) await this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON;');
    const id = pg ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY';
    await this.db.transaction(async () => {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, access_hash TEXT UNIQUE NOT NULL, start_ms BIGINT NOT NULL, end_ms BIGINT NOT NULL, data TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS booking_time ON bookings(start_ms,end_ms);
        CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires BIGINT NOT NULL);
        CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS jobs(id ${id}, job_key TEXT UNIQUE NOT NULL, kind TEXT NOT NULL, booking_id TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_run BIGINT NOT NULL DEFAULT 0, last_error TEXT, lease_until BIGINT NOT NULL DEFAULT 0, lease_token TEXT);
        CREATE TABLE IF NOT EXISTS audit(id ${id},booking_id TEXT,action TEXT NOT NULL,created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL);
        CREATE TABLE IF NOT EXISTS lookup_codes(id TEXT PRIMARY KEY,email TEXT NOT NULL,code_hash TEXT NOT NULL,expires BIGINT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,booking_ids TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS access_grants(token_hash TEXT PRIMARY KEY,booking_id TEXT NOT NULL,expires BIGINT NOT NULL);
        CREATE TABLE IF NOT EXISTS event_registrations(id TEXT PRIMARY KEY, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS idempotency(key TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, response TEXT NOT NULL);`);
      if (!pg) {
        const columns = await this.db.prepare('PRAGMA table_info(jobs)').all();
        if (!columns.some(c => c.name === 'lease_until')) await this.db.exec('ALTER TABLE jobs ADD COLUMN lease_until BIGINT NOT NULL DEFAULT 0;');
        if (!columns.some(c => c.name === 'lease_token')) await this.db.exec('ALTER TABLE jobs ADD COLUMN lease_token TEXT;');
      }
      const check = await this.db.prepare("SELECT value FROM settings WHERE key='encryption_check'").get();
      if (check && this.decode<string>(check.value) !== 'niva-key-check-v1') throw new Error('Database key verification failed.');
      if (!check) await this.db.prepare('INSERT INTO settings VALUES(?,?)').run('encryption_check', this.encode('niva-key-check-v1'));
      for (const [key, value] of [
        ['hours', INITIAL_WEEKLY_AVAILABILITY], ['blocks', []],
        ['event', { heading: '', description: '', details: '', price: 0, kind: 'event', enabled: false, updatedAt: null }],
      ]) await this.db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO NOTHING').run(key, this.encode(value));
    });
    if (!pg) await this.migrateEncryptedRecords();
  }
  private async migrateEncryptedRecords() {
    let changed = false;
    await this.db.transaction(async () => {
      for (const [table, column, key] of [
        ['bookings', 'data', 'id'], ['event_registrations', 'data', 'id'], ['settings', 'value', 'key'],
        ['jobs', 'payload', 'id'], ['idempotency', 'response', 'key'], ['lookup_codes', 'booking_ids', 'id'],
      ]) {
        for (const row of await this.db.prepare(`SELECT ${key} AS record_key,${column} AS value FROM ${table}`).all()) {
          if (!row.value.startsWith('enc:')) {
            await this.db.prepare(`UPDATE ${table} SET ${column}=? WHERE ${key}=?`).run(this.encode(this.decode(row.value)), row.record_key);
            changed = true;
          }
        }
      }
      for (const row of await this.db.prepare('SELECT id,email,code_hash FROM lookup_codes').all()) {
        if (row.email !== '') { await this.db.prepare("UPDATE lookup_codes SET email='' WHERE id=?").run(row.id); changed = true; }
        if (!row.code_hash.startsWith('enc:')) { await this.db.prepare('UPDATE lookup_codes SET code_hash=? WHERE id=?').run(this.encode(row.code_hash), row.id); changed = true; }
      }
    });
    if (changed) await this.db.exec('PRAGMA wal_checkpoint(TRUNCATE); VACUUM; PRAGMA wal_checkpoint(TRUNCATE);');
  }
  async transaction<T>(fn: () => Promise<T>): Promise<T> { await this.ready; return this.db.transaction(fn); }
  async get(id: string): Promise<Booking | undefined> {
    await this.ready; const row = await this.db.prepare('SELECT data FROM bookings WHERE id=?').get(id);
    return row ? this.decode<Booking>(row.data) : undefined;
  }
  async list(): Promise<Booking[]> { await this.ready; return (await this.db.prepare('SELECT data FROM bookings ORDER BY start_ms').all()).map(row => this.decode<Booking>(row.data)); }
  async put(booking: Booking) {
    await this.ready;
    await this.db.prepare('INSERT INTO bookings VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,start_ms=excluded.start_ms,end_ms=excluded.end_ms').run(booking.id, booking.accessHash, booking.startMs, booking.endMs, this.encode(booking));
  }
  async setting<T>(key: string): Promise<T> { await this.ready; return this.decode<T>((await this.db.prepare('SELECT value FROM settings WHERE key=?').get(key))!.value); }
  async setSetting(key: string, value: unknown) { await this.ready; await this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, this.encode(value)); }
  async job(kind: string, bookingId: string, payload: unknown, key = `${kind}:${bookingId}`) {
    await this.ready; await this.db.prepare('INSERT INTO jobs(job_key,kind,booking_id,payload) VALUES(?,?,?,?) ON CONFLICT(job_key) DO NOTHING').run(key, kind, bookingId, this.encode(payload));
  }
  async audit(id: string, action: string) { await this.ready; await this.db.prepare('INSERT INTO audit(booking_id,action,created_at) VALUES(?,?,?)').run(id, action, new Date().toISOString()); }
  async claimJob(): Promise<Job | undefined> {
    return this.transaction(async () => {
      const now = Date.now();
      const row = await this.db.prepare("SELECT * FROM jobs WHERE (status='pending' AND next_run<=?) OR (status='running' AND lease_until<?) ORDER BY id LIMIT 1").get(now, now);
      if (!row) return;
      const token = secret();
      await this.db.prepare("UPDATE jobs SET status='running',lease_until=?,lease_token=? WHERE id=?").run(now + 120_000, token, row.id);
      return { ...row, id: Number(row.id), bookingId: row.booking_id, leaseToken: token } as Job;
    });
  }
  async finishJob(job: Job, status: string, nextRun = 0, error: string | null = null) {
    await this.db.prepare('UPDATE jobs SET status=?,next_run=?,last_error=?,lease_until=0,lease_token=NULL,attempts=attempts+? WHERE id=? AND lease_token=?').run(status, nextRun, error, status === 'done' ? 0 : 1, job.id, job.leaseToken);
  }
  async close() { try { await this.ready; } finally { await this.db.close(); } }
}
export function publicBooking(b: Booking): Appointment & { calendarStatus: string } { const { accessHash, startMs, endMs, orderId, paymentId, calendarEventId, ...safe } = b; return safe; }
