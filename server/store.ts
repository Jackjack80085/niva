import {createCodec,encryptionKey} from './encryption';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import type { Appointment } from '../src/types';
import { INITIAL_WEEKLY_AVAILABILITY } from '../src/data/initialData';

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
export type Booking = Appointment & { accessHash: string; startMs: number; endMs: number; orderId?: string; paymentId?: string; calendarEventId?: string; calendarStatus: 'waiting_payment' | 'queued' | 'synced' | 'conflict'; };
export type Job = { id: number; kind: string; bookingId: string; payload: string; attempts: number; status: string; };
export class Store {
  db: DatabaseSync;
  encode: (value:unknown)=>string;
  decode: <T>(value:string)=>T;
  constructor(path: string, configuredKey?:string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const codec=createCodec(encryptionKey(path,configuredKey));this.encode=codec.encode;this.decode=codec.decode;
    if(path!==':memory:'){try{writeFileSync(path,'',{flag:'wx',mode:0o600});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}chmodSync(path,0o600);}
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, access_hash TEXT UNIQUE NOT NULL, start_ms INTEGER NOT NULL, end_ms INTEGER NOT NULL, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS booking_time ON bookings(start_ms,end_ms);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY, job_key TEXT UNIQUE NOT NULL, kind TEXT NOT NULL, booking_id TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_run INTEGER NOT NULL DEFAULT 0, last_error TEXT);
      CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,booking_id TEXT,action TEXT NOT NULL,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS lookup_codes(id TEXT PRIMARY KEY,email TEXT NOT NULL,code_hash TEXT NOT NULL,expires INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,booking_ids TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS access_grants(token_hash TEXT PRIMARY KEY,booking_id TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS event_registrations(id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS idempotency(key TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, response TEXT NOT NULL);`);
    this.migrateEncryptedRecords();
    this.db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('hours',this.encode(INITIAL_WEEKLY_AVAILABILITY));
    this.db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('blocks',this.encode([]));
    this.db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('event',this.encode({heading:'',description:'',details:'',price:0,kind:'event',enabled:false,updatedAt:null}));
  }
  private migrateEncryptedRecords() {
    const check=this.db.prepare("SELECT value FROM settings WHERE key='encryption_check'").get();
    if(check&&this.decode<string>(check.value as string)!=='niva-key-check-v1')throw new Error('Database key verification failed.');
    let changed=false;
    this.transaction(()=>{
      for(const [table,column] of [['bookings','data'],['event_registrations','data'],['settings','value'],['jobs','payload'],['idempotency','response'],['lookup_codes','booking_ids']] as const){
        for(const row of this.db.prepare(`SELECT rowid,${column} AS value FROM ${table}`).all()){
          if(!(row.value as string).startsWith('enc:')){this.db.prepare(`UPDATE ${table} SET ${column}=? WHERE rowid=?`).run(this.encode(this.decode(row.value as string)),row.rowid!);changed=true;}
        }
      }
      for(const row of this.db.prepare('SELECT id,email,code_hash FROM lookup_codes').all()){if(row.email!==''){this.db.prepare("UPDATE lookup_codes SET email='' WHERE id=?").run(row.id!);changed=true;}if(!(row.code_hash as string).startsWith('enc:')){this.db.prepare('UPDATE lookup_codes SET code_hash=? WHERE id=?').run(this.encode(row.code_hash),row.id!);changed=true;}}
      if(!check)this.db.prepare('INSERT INTO settings VALUES(?,?)').run('encryption_check',this.encode('niva-key-check-v1'));
    });
    if(changed){this.db.exec('PRAGMA wal_checkpoint(TRUNCATE); VACUUM; PRAGMA wal_checkpoint(TRUNCATE);');}
  }
  transaction<T>(fn: () => T): T { this.db.exec('BEGIN IMMEDIATE'); try { const value=fn(); this.db.exec('COMMIT'); return value; } catch(error) {this.db.exec('ROLLBACK'); throw error;} }
  get(id: string): Booking | undefined {const row=this.db.prepare('SELECT data FROM bookings WHERE id=?').get(id); return row ? this.decode<Booking>(row.data as string) : undefined;}
  list(): Booking[] { return this.db.prepare('SELECT data FROM bookings ORDER BY start_ms').all().map(row => this.decode<Booking>(row.data as string)); }
  put(booking: Booking) { this.db.prepare('INSERT INTO bookings VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,start_ms=excluded.start_ms,end_ms=excluded.end_ms').run(booking.id,booking.accessHash,booking.startMs,booking.endMs,this.encode(booking)); }
  setting<T>(key:string):T { return this.decode<T>(this.db.prepare('SELECT value FROM settings WHERE key=?').get(key)!.value as string); }
  setSetting(key:string,value:unknown) {this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,this.encode(value));}
  job(kind:string, bookingId:string, payload:unknown, key=`${kind}:${bookingId}`) {this.db.prepare('INSERT OR IGNORE INTO jobs(job_key,kind,booking_id,payload) VALUES(?,?,?,?)').run(key,kind,bookingId,this.encode(payload));}
  audit(id:string,action:string) {this.db.prepare('INSERT INTO audit(booking_id,action,created_at) VALUES(?,?,?)').run(id,action,new Date().toISOString());}
  close() {this.db.close();}
}
export function publicBooking(b:Booking): Appointment & {calendarStatus:string} {const {accessHash,startMs,endMs,orderId,paymentId,calendarEventId,...safe}=b; return safe;}
