import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
export function encryptionKey(databasePath:string,configured?:string):Buffer {
  if(configured){if(!/^[a-f0-9]{64}$/i.test(configured))throw new Error('DATA_ENCRYPTION_KEY must be 64 hexadecimal characters.');return Buffer.from(configured,'hex');}
  if(databasePath===':memory:')return randomBytes(32);
  const keyPath=databasePath+'.key';
  try{writeFileSync(keyPath,randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
  chmodSync(keyPath,0o600);const key=readFileSync(keyPath,'utf8').trim();
  if(!/^[a-f0-9]{64}$/i.test(key))throw new Error('The database encryption key is invalid.');
  return Buffer.from(key,'hex');
}
export function createCodec(key:Buffer) {
  return {
    encode(value:unknown) {
      const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
      cipher.setAAD(Buffer.from('niva-private-record:v1'));
      const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
      return ['enc','v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join(':');
    },
    decode<T>(value:string):T {
      // Legacy plaintext is accepted only to migrate an existing local database on startup.
      if(!value.startsWith('enc:'))return JSON.parse(value) as T;
      const [prefix,version,nonce,tag,data,...extra]=value.split(':');
      if(prefix!=='enc'||version!=='v1'||!nonce||!tag||!data||extra.length)throw new Error('Invalid encrypted record.');
      const iv=Buffer.from(nonce,'base64url'),authTag=Buffer.from(tag,'base64url');
      if(iv.length!==12||authTag.length!==16)throw new Error('Invalid encrypted record.');
      const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(Buffer.from('niva-private-record:v1'));decipher.setAuthTag(authTag);
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8')) as T;
    },
  };
}
