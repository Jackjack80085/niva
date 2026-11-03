import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { PostgresDatabase, postgresSql, type QueryClient, type QueryPool, type QueryResult } from './database';
import { Store, hash, type Booking } from './store';

// PGlite executes actual PostgreSQL schema, parameter binding, conflict and
// transaction SQL. Its one connection is serialized here to model the pool's
// checked-out-client contract. Hosted TLS and cross-process advisory-lock
// scheduling still need a real PostgreSQL smoke test at deployment time.
class PGlitePool implements QueryPool {
  readonly engine = new PGlite();
  readonly statements: string[] = [];
  private tail: Promise<void> = Promise.resolve();

  private async acquire() {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    return release;
  }
  private async execute(text: string, values: any[] = []): Promise<QueryResult> {
    this.statements.push(text);
    if (values.length) {
      const result = await this.engine.query(text, values);
      return { rows: result.rows as Record<string, any>[], rowCount: result.affectedRows };
    }
    const results = await this.engine.exec(text);
    const result = results.at(-1);
    return { rows: result?.rows as Record<string, any>[] || [], rowCount: result?.affectedRows || 0 };
  }
  async query(text: string, values: any[] = []) {
    const release = await this.acquire();
    try { return await this.execute(text, values); }
    finally { release(); }
  }
  async connect(): Promise<QueryClient> {
    const release = await this.acquire();
    return { query: (text, values) => this.execute(text, values), release };
  }
  // Individual Store instances close their logical pool. The test owns and
  // closes the shared engine after every simulated function instance is done.
  async end() {}
}

function booking(id: string, name = 'Private Patient'): Booking {
  return {
    id, accessHash: hash('private-access-' + id), referenceNo: 'APT-' + id,
    patientName: name, patientEmail: 'private-patient@example.com', patientPhone: '+919876543210',
    date: '2027-01-04', time: '09:00', serviceId: 'consultation', consultingFor: 'Consultation',
    durationMin: 20, fee: 1500, reason: 'Confidential note', status: 'pending', paymentStatus: 'pending',
    clinicId: 'online', patientType: 'new-patient', createdAt: '2026-11-03T12:00:00Z',
    startMs: 1799033400000, endMs: 1799034600000, calendarStatus: 'waiting_payment',
  };
}

async function fixture() {
  const pool = new PGlitePool(), key = randomBytes(32).toString('hex');
  const stores: Store[] = [];
  const instance = async (encryptionKey = key) => {
    const store = new Store(':memory:', encryptionKey, new PostgresDatabase(pool));
    stores.push(store);
    await store.ready;
    return store;
  };
  return {
    pool, key, instance,
    close: async () => {
      await Promise.all(stores.map(store => store.close().catch(() => {})));
      await pool.engine.close();
    },
  };
}

test('Postgres creates the schema and shares encrypted records, settings and sessions across new instances', async () => {
  const f = await fixture();
  try {
    const first = await f.instance();
    await first.put(booking('shared'));
    await first.setSetting('event', { heading: 'An upcoming gathering', enabled: true, price: 2000 });
    const tokenHash = hash('opaque-cookie');
    const expiry = Date.now() + 8 * 3600_000;
    await first.db.prepare('INSERT INTO sessions VALUES(?,?)').run(tokenHash, expiry);
    await first.db.prepare('INSERT INTO idempotency VALUES(?,?,?)').run('request-key', 'input-hash', first.encode({ accessToken: 'private-token', appointmentId: 'shared' }));
    await first.close();

    const second = await f.instance();
    assert.equal((await second.get('shared'))?.patientName, 'Private Patient');
    assert.equal((await second.setting<{ heading: string }>('event')).heading, 'An upcoming gathering');
    assert.ok(await second.db.prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires>?').get(tokenHash, Date.now()));
    const raw = (await second.db.prepare('SELECT data FROM bookings WHERE id=?').get('shared'))!.data;
    assert.match(raw, /^enc:v1:/);
    assert.ok(!raw.includes('private-patient@example.com'));
    assert.ok(!raw.includes('Confidential note'));
    const retry = (await second.db.prepare('SELECT response FROM idempotency WHERE key=?').get('request-key'))!.response;
    assert.match(retry, /^enc:v1:/);
    assert.deepEqual(second.decode(retry), { accessToken: 'private-token', appointmentId: 'shared' });
    const tables = await second.db.prepare("SELECT table_name FROM information_schema.tables WHERE table_schema='public'").all();
    assert.deepEqual(tables.map(row => row.table_name).sort(), ['access_grants', 'audit', 'bookings', 'event_registrations', 'idempotency', 'jobs', 'lookup_codes', 'rate_limits', 'sessions', 'settings']);
    await assert.rejects(f.instance(randomBytes(32).toString('hex')));
  } finally { await f.close(); }
});

test('Postgres uses one checked-out client for transactions, rolls back failures, and serializes shared mutations', async () => {
  const f = await fixture();
  try {
    const first = await f.instance(), second = await f.instance();
    await first.setSetting('counter', 0);
    await assert.rejects(first.transaction(async () => {
      await first.setSetting('counter', 100);
      await first.put(booking('rolled-back'));
      throw new Error('Intentional transaction failure');
    }), /Intentional transaction failure/);
    assert.equal(await second.setting('counter'), 0);
    assert.equal(await second.get('rolled-back'), undefined);

    await Promise.all(Array.from({ length: 12 }, (_, index) => {
      const store = index % 2 ? first : second;
      return store.transaction(async () => {
        const value = await store.setting<number>('counter');
        await Promise.resolve();
        await store.setSetting('counter', value + 1);
      });
    }));
    assert.equal(await second.setting('counter'), 12);
    assert.ok(f.pool.statements.some(sql => /pg_advisory_xact_lock/.test(sql)));
    assert.ok(f.pool.statements.includes('ROLLBACK'));
  } finally { await f.close(); }
});

test('Postgres job claims are shared and idempotent, and expired leases reject stale completions', async () => {
  const f = await fixture();
  try {
    const first = await f.instance(), second = await f.instance();
    await Promise.all([
      first.job('approval_email', 'shared', { token: 'private-token' }),
      second.job('approval_email', 'shared', { token: 'private-token' }),
    ]);
    const raw = await first.db.prepare('SELECT * FROM jobs').all();
    assert.equal(raw.length, 1);
    assert.match(raw[0].payload, /^enc:v1:/);
    const claims = await Promise.all([first.claimJob(), second.claimJob()]);
    assert.equal(claims.filter(Boolean).length, 1);
    const original = claims.find(Boolean)!;
    assert.equal(original.bookingId, 'shared');
    assert.equal(typeof original.id, 'number');
    assert.deepEqual(first.decode(original.payload), { token: 'private-token' });
    assert.equal(await second.claimJob(), undefined);

    await first.db.prepare('UPDATE jobs SET lease_until=? WHERE id=?').run(Date.now() - 1, original.id);
    const recovered = (await second.claimJob())!;
    assert.equal(recovered.id, original.id);
    assert.notEqual(recovered.leaseToken, original.leaseToken);
    await first.finishJob(original, 'done');
    assert.equal((await first.db.prepare('SELECT status FROM jobs WHERE id=?').get(original.id))!.status, 'running');
    await second.finishJob(recovered, 'done');
    assert.equal((await first.db.prepare('SELECT status FROM jobs WHERE id=?').get(original.id))!.status, 'done');
    assert.equal(await first.claimJob(), undefined);
  } finally { await f.close(); }
});

test('Postgres binds values without changing literal question marks or interpreting patient input as SQL', async () => {
  assert.equal(postgresSql("SELECT '?' AS literal, ? AS value, 'it''s ?' AS text, ? AS last"), "SELECT '?' AS literal, $1 AS value, 'it''s ?' AS text, $2 AS last");
  const f = await fixture();
  try {
    const store = await f.instance();
    const name = "Robert'); DROP TABLE bookings;-- ?";
    await store.put(booking('bound-input', name));
    assert.equal((await store.get('bound-input'))!.patientName, name);
    assert.equal((await store.list()).length, 1);
  } finally { await f.close(); }
});
