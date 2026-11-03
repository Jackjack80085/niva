import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { ipAddress, waitUntil } from '@vercel/functions';
import { createApp } from './app';
import { securityHeaders } from './firewall';
import { hash } from './store';
import type { Config } from './providers';

type Environment = Record<string, string | undefined>;
type System = Awaited<ReturnType<typeof createApp>>;
export function vercelConfig(env: Environment): Config {
  const database = env.DATABASE_URL || env.POSTGRES_URL;
  if (!database || !/^postgres(?:ql)?:\/\//.test(database)) throw new Error('DATABASE_URL is required.');
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must have at least 12 characters.');
  if (!/^[a-f0-9]{64}$/i.test(env.DATA_ENCRYPTION_KEY || '')) throw new Error('DATA_ENCRYPTION_KEY is required.');
  const appUrl = env.VERCEL_ENV === 'preview' && env.VERCEL_URL ? `https://${env.VERCEL_URL}` : env.APP_URL;
  if (!appUrl || new URL(appUrl).protocol !== 'https:') throw new Error('APP_URL must be an HTTPS origin.');
  return {
    production: true, appUrl: new URL(appUrl).origin, databasePath: database,
    adminPassword: env.ADMIN_PASSWORD, encryptionKey: env.DATA_ENCRYPTION_KEY,
    gatewaySecret: hash(`niva-vercel-boundary:${env.DATA_ENCRYPTION_KEY}`),
    enablePayments: env.ENABLE_PAYMENTS === 'true', enableCalendar: env.ENABLE_CALENDAR === 'true', enableEmail: env.ENABLE_EMAIL === 'true',
    razorpayKey: env.RAZORPAY_KEY_ID, razorpaySecret: env.RAZORPAY_KEY_SECRET, webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    resendKey: env.RESEND_API_KEY, mailFrom: env.MAIL_FROM,
    calendarId: env.GOOGLE_CALENDAR_ID, googleClientId: env.GOOGLE_CLIENT_ID, googleClientSecret: env.GOOGLE_CLIENT_SECRET, googleRefreshToken: env.GOOGLE_REFRESH_TOKEN,
  };
}
function authorized(value: string | undefined, expected: string | undefined) {
  return !!expected && timingSafeEqual(Buffer.from(hash(value || ''), 'hex'), Buffer.from(hash(`Bearer ${expected}`), 'hex'));
}

// A Vercel Function exports a handler; it must not listen on a port or write a
// database to /tmp. The same durable Postgres database is used on every instance.
export function createVercelHandler(
  env: Environment = process.env,
  factory: (config: Config) => Promise<System> = createApp,
  background: (job: Promise<unknown>) => void = waitUntil,
) {
  let instance: Promise<System> | undefined;
  let lastJobs = 0;
  return async (req: IncomingMessage, res: ServerResponse) => {
    for (const [key, value] of Object.entries(securityHeaders(true))) res.setHeader(key, value);
    res.setHeader('Cache-Control', 'no-store');
    const reply = (status: number, data: unknown) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(data)); };
    const path = (req.url || '').split('?')[0];
    if (!path.startsWith('/api/')) return reply(404, { error: 'Endpoint not found.' });
    try {
      const config = vercelConfig(env);
      const allowedHosts = new Set([new URL(config.appUrl).host, env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean));
      if (!allowedHosts.has(req.headers.host)) return reply(403, { error: 'This host is not allowed.' });
      if (!instance) instance = factory(config).catch(error => { instance = undefined; throw error; });
      const system = await instance;
      if (path === '/api/cron/jobs') {
        if (req.method !== 'GET' || !authorized(req.headers.authorization, env.CRON_SECRET)) return reply(401, { error: 'Unauthorized.' });
        await system.runJobs();
        return reply(200, { ok: true });
      }
      // Vercel supplies the client address. Never trust the caller's private
      // gateway headers, which otherwise let one client evade rate limiting.
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
      req.headers['x-niva-client-ip'] = ipAddress(headers) || req.socket.remoteAddress || 'unknown';
      req.headers['x-niva-gateway'] = config.gatewaySecret;
      await new Promise<void>((resolve, reject) => {
        res.once('finish', () => {
          if (res.statusCode < 400 && path !== '/api/health' && path !== '/api/config' && (req.method !== 'GET' || Date.now() - lastJobs > 20_000)) {
            lastJobs = Date.now();
            background(system.runJobs().catch(() => console.error('Background delivery will be retried.')));
          }
          resolve();
        });
        res.once('close', resolve);
        system.app(req as any, res as any, reject);
      });
    } catch {
      console.error('The booking backend could not initialize or complete this invocation. Check its server-side configuration and database connection.');
      if (!res.headersSent) reply(503, { error: 'The booking service is temporarily unavailable. Please contact the practice or try again shortly.' });
      else if (!res.writableEnded) res.end();
    }
  };
}
export default createVercelHandler();
