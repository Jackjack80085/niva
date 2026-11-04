import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { randomBytes } from 'node:crypto';
import { createVercelHandler, vercelConfig } from './vercel';
import { createApp } from './app';
import { Store } from './store';

const env = () => ({ APP_URL: 'https://niva.example', DATABASE_URL: 'postgresql://example.invalid/niva', ADMIN_PASSWORD: 'a-long-random-test-password', DATA_ENCRYPTION_KEY: randomBytes(32).toString('hex'), CRON_SECRET: 'test-cron-secret' });

test('Vercel requires durable storage and strong server-only configuration, with providers off', () => {
  const value = env();
  assert.throws(() => vercelConfig({ ...value, DATABASE_URL: undefined }), /DATABASE_URL/);
  assert.throws(() => vercelConfig({ ...value, ADMIN_PASSWORD: '2026' }), /ADMIN_PASSWORD/);
  assert.throws(() => vercelConfig({ ...value, DATA_ENCRYPTION_KEY: '' }), /DATA_ENCRYPTION_KEY/);
  assert.doesNotThrow(() => vercelConfig({ ...value, ADMIN_PASSWORD: 'Abc!234567' }));
  const config = vercelConfig(value);
  assert.equal(config.production, true);
  assert.equal(config.enablePayments, false); assert.equal(config.enableCalendar, false); assert.equal(config.enableEmail, false);
  assert.equal(vercelConfig({ ...value, VERCEL_ENV: 'preview', VERCEL_URL: 'niva-preview.vercel.app' }).appUrl, 'https://niva-preview.vercel.app');
  assert.equal(vercelConfig(value).gatewaySecret, config.gatewaySecret);
});

test('Vercel function handles raw HTTP login, durable sessions, CSRF, webhook bytes and authenticated cron', async () => {
  const values = env(), store = new Store(':memory:');
  let jobs = 0;
  const factory = async (config: ReturnType<typeof vercelConfig>) => ({ ...await createApp({ ...config, webhookSecret: 'test-webhook-secret' }, store), runJobs: async () => { jobs++; } });
  const tasks: Promise<unknown>[] = [];
  let handler = createVercelHandler(values, factory, task => tasks.push(task));
  const server = createServer((req, res) => { void handler(req, res); });
  server.listen(0, '127.0.0.1'); await new Promise<void>(r => server.once('listening', r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const call = (path: string, init: RequestInit = {}) => new Promise<Response>((resolve, reject) => {
    const outgoing = request(base + path, { method: init.method || 'GET', headers: { Host: 'niva.example', Origin: values.APP_URL, 'Content-Type': 'application/json', ...init.headers as Record<string, string> } }, incoming => {
      const parts: Buffer[] = []; incoming.on('data', chunk => parts.push(chunk));
      incoming.on('end', () => resolve(new Response(Buffer.concat(parts), { status: incoming.statusCode, headers: incoming.headers as Record<string, string> })));
    });
    outgoing.on('error', reject); if (init.body) outgoing.write(init.body); outgoing.end();
  });
  try {
    assert.equal((await call('/api/admin/session')).status, 401);
    assert.equal((await call('/api/health', { headers: { Host: 'evil.example' } })).status, 403);
    assert.equal((await call('/api/admin/login', { method: 'POST', headers: { Origin: 'https://evil.example', 'x-niva-gateway': vercelConfig(values).gatewaySecret! }, body: JSON.stringify({ password: values.ADMIN_PASSWORD }) })).status, 403);
    assert.equal((await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: 'wrong' }) })).status, 401);
    const login = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: values.ADMIN_PASSWORD }) });
    assert.equal(login.status, 200); assert.deepEqual(await login.json(), { authenticated: true });
    const cookie = login.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Strict/);
    handler = createVercelHandler(values, factory, task => tasks.push(task));
    assert.equal((await call('/api/admin/session', { headers: { Cookie: cookie.split(';')[0] } })).status, 200);
    assert.equal((await call('/api/webhooks/razorpay', { method: 'POST', body: '{ "event": "not-signed" }', headers: { 'x-razorpay-signature': 'bad' } })).status, 401);
    assert.equal((await call('/api/cron/jobs')).status, 401);
    assert.equal((await call('/api/cron/jobs', { headers: { Authorization: `Bearer ${values.CRON_SECRET}` } })).status, 200);
    assert.ok(jobs > 0);
    assert.equal((await call('/api/unknown')).status, 404);
    assert.equal((await call('/api/health')).headers.get('x-frame-options'), 'DENY');
  } finally { await Promise.all(tasks); await new Promise<void>(r => server.close(() => r())); await store.close(); }
});
