import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviders, type Config } from './providers';
const config:Config={production:false,appUrl:'http://localhost:3000',adminPassword:'test-password',databasePath:':memory:',calendarId:'bookings@example.com',googleClientId:'client',googleClientSecret:'secret',googleRefreshToken:'refresh'};
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});

test('calendar adapter refreshes tokens on the server and paginates week events',async()=>{
  const requests:{url:string;init:RequestInit}[]=[];
  const http:typeof fetch=async(input,init={})=>{const url=String(input);requests.push({url,init});if(url.includes('oauth2.googleapis.com'))return response({access_token:'access',expires_in:3600});return url.includes('pageToken=second')?response({items:[{id:'two',start:{},end:{}}]}):response({items:[{id:'one',start:{},end:{}}],nextPageToken:'second'});};
  const api=createProviders(config,http);const events=await api.listEvents('2026-11-02T00:00:00Z','2026-11-09T00:00:00Z');assert.equal(events.length,2);assert.equal(requests.filter(r=>r.url.includes('oauth2.googleapis.com')).length,1);assert.ok(requests[1].url.includes('singleEvents=true'));assert.ok(requests[1].url.includes('timeZone=Asia%2FKolkata'));assert.ok((requests[1].init.headers as any).Authorization.includes('access'));
});

test('calendar errors fail closed instead of showing every slot available',async()=>{
  const http:typeof fetch=async input=>String(input).includes('oauth2.googleapis.com')?response({access_token:'a',expires_in:3600}):response({calendars:{'bookings@example.com':{errors:[{reason:'notFound'}]}}});
  await assert.rejects(createProviders(config,http).busy(Date.now(),Date.now()+60000),/Could not check/);
});

test('retrying an inserted booking reuses its app-owned event without writing again',async()=>{
  let writes=0;const id='12345678-1234-1234-1234-123456789abc';const eventId='b'+id.replaceAll('-','');
  const http:typeof fetch=async(input,init={})=>{if(String(input).includes('oauth2.googleapis.com'))return response({access_token:'a',expires_in:3600});if(init.method==='POST')writes++;return response({items:[{id:eventId,start:{},end:{}}]});};
  const event=await createProviders(config,http).syncBooking({id,startMs:Date.now(),endMs:Date.now()+60000} as any);assert.equal(event.id,eventId);assert.equal(writes,0);
});

test('removing a block addresses only its deterministic app-owned event',async()=>{
  let deleted='';const id='12345678-1234-1234-1234-123456789abc';
  const http:typeof fetch=async(input,init={})=>{if(String(input).includes('oauth2.googleapis.com'))return response({access_token:'a',expires_in:3600});if(init.method==='DELETE'){deleted=String(input);return new Response(null,{status:204});}throw new Error('Unexpected request');};
  await createProviders(config,http).syncBlock({id,start:'2026-11-03T09:00:00Z',end:'2026-11-03T10:00:00Z'},true);assert.ok(deleted.endsWith('/a'+id.replaceAll('-','')));
});
