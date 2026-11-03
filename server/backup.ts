import { config as dotenv } from 'dotenv';
import { mkdirSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Store } from './store';
dotenv({path:'.env.local',quiet:true});dotenv({quiet:true});
if(process.env.NODE_ENV==='production'&&!process.env.DATA_ENCRYPTION_KEY)throw new Error('Production backups require the external encryption key.');
const store=new Store(process.env.DATABASE_PATH||'data/niva.sqlite',process.env.DATA_ENCRYPTION_KEY);
try{const dir=resolve(process.env.BACKUP_DIR||'data/backups');mkdirSync(dir,{recursive:true,mode:0o700});const file=resolve(dir,`niva-${new Date().toISOString().replaceAll(':','-')}-${randomBytes(4).toString('hex')}.sqlite`);store.db.prepare('VACUUM INTO ?').run(file);chmodSync(file,0o600);console.log('Encrypted database snapshot created. Keep its encryption key separately.');}finally{store.close();}
