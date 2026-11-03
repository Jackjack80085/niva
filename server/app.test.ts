import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app';
import { Store } from './store';
import { AppError, createProviders, type Config } from './providers';

const config:Config={appUrl:'http://localhost:3000',production:false,adminPassword:'test-password-long',databasePath:':memory:',razorpayKey:'test-key',razorpaySecret:'test-secret',webhookSecret:'webhook-secret'};
const futureMonday=()=>{const d=new Date(Date.now()+7*86400_000);while(d.getUTCDay()!==1)d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
const payload=()=>({patientName:'Sample Patient',patientEmail:'sample@example.com',patientPhone:'+919876543210',serviceId:'consultation',date:futureMonday(),time:'09:00',fee:1,durationMin:1,status:'confirmed',paymentStatus:'paid'});
async function fixture(options:{calendar?:boolean;payments?:boolean;database?:string}={}) {
  const store=new Store(options.database||':memory:');const sent:any[]=[];let syncs=0;let payment:any;
  const providers={...createProviders(config),calendarConfigured:options.calendar??false,paymentConfigured:options.payments??true,mailConfigured:true,
    busy:async()=>[],listEvents:async()=>[],createOrder:async()=>({id:'order_123'}),getPayment:async()=>payment,
    sendMail:async(...args:any[])=>{sent.push(args);},
    syncBooking:async(b:any)=>{if(!options.calendar)throw new AppError(503,'Google Calendar is not connected yet.');syncs++;return {id:'event_'+b.id,start:{},end:{},hangoutLink:'https://meet.google.com/test'};},
  };
  if(options.payments===false)providers.createOrder=async()=>{throw new AppError(503,'Live payments are not configured yet.');};
  const system=createApp(config,store,providers);const server=system.app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${(server.address() as any).port}`;let cookie='';
  const request=async(path:string,method='GET',body?:unknown,headers:Record<string,string>={})=>{
    const response=await fetch(base+'/api'+path,{method,headers:{Origin:config.appUrl,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
    const value=await response.json();return {status:response.status,value,response};
  };
  const login=async()=>{const result=await request('/admin/login','POST',{password:config.adminPassword});assert.equal(result.status,200);cookie=result.response.headers.get('set-cookie')!.split(';')[0];};
  const book=()=>request('/appointments','POST',payload(),{'Idempotency-Key':randomUUID()});
  const auth=(result:any)=>({Authorization:'Bearer '+result.value.accessToken});
  return {...system,request,login,book,auth,sent,setPayment:(value:any)=>{payment=value;},syncCount:()=>syncs,close:async()=>{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));store.close();}};
}

test('admin endpoints require a server session and reject foreign-origin writes',async()=>{const f=await fixture();try{
  assert.equal((await f.request('/admin/appointments')).status,401);
  assert.equal((await f.request('/admin/login','POST',{password:config.adminPassword},{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await f.request('/admin/login','POST',{password:'wrong'})).status,401);
  await f.login();assert.equal((await f.request('/admin/appointments')).status,200);
  await f.request('/admin/logout','POST',{});assert.equal((await f.request('/admin/appointments')).status,401);
}finally{await f.close();}});

test('server prices bookings, prevents overlap and requires a private patient credential',async()=>{const f=await fixture();try{
  const first=await f.book();assert.equal(first.status,201);assert.equal(first.value.appointment.fee,1500);assert.equal(first.value.appointment.durationMin,20);assert.equal(first.value.appointment.status,'pending');assert.equal(first.value.appointment.paymentStatus,'pending');assert.equal(first.value.appointment.accessHash,undefined);
  assert.equal((await f.book()).status,409);
  assert.equal((await f.request('/appointments/'+first.value.appointment.id)).status,404);
  assert.equal((await f.request('/appointments/'+first.value.appointment.id,'GET',undefined,f.auth(first))).status,200);
  const slots=await f.request(`/availability?month=${futureMonday().slice(0,7)}&serviceId=consultation`);assert.equal(slots.status,200);assert.ok(!slots.value.byDate[futureMonday()].includes('09:00'));
  const invalid=await f.request('/appointments','POST',{...payload(),date:'2026-02-31'},{'Idempotency-Key':randomUUID()});assert.equal(invalid.status,400);
}finally{await f.close();}});

test('booking retries are idempotent and concurrent requests cannot share a slot',async()=>{const f=await fixture();try{
  const key=randomUUID();const first=await f.request('/appointments','POST',payload(),{'Idempotency-Key':key});const retry=await f.request('/appointments','POST',payload(),{'Idempotency-Key':key});assert.equal(retry.value.appointment.id,first.value.appointment.id);assert.equal(f.store.list().length,1);
  assert.equal((await f.request('/appointments','POST',{...payload(),time:'10:00'},{'Idempotency-Key':key})).status,409);
  const outcomes=await Promise.all([f.request('/appointments','POST',{...payload(),time:'11:00'},{'Idempotency-Key':randomUUID()}),f.request('/appointments','POST',{...payload(),time:'11:00'},{'Idempotency-Key':randomUUID()})]);assert.deepEqual(outcomes.map(r=>r.status).sort(),[201,409]);
}finally{await f.close();}});

test('approval is persisted once, emails once, and never reserves the calendar',async()=>{const f=await fixture();try{
  const b=await f.book(),id=b.value.appointment.id;
  assert.equal((await f.request(`/appointments/${id}/payment/order`,'POST',{},f.auth(b))).status,409);
  await f.login();for(let i=0;i<2;i++)assert.equal((await f.request(`/admin/appointments/${id}/decision`,'POST',{decision:'approve'})).status,200);
  await f.runJobs();assert.equal(f.sent.length,1);assert.equal(f.syncCount(),0);assert.match(f.sent[0][2],/#booking\?appointment=/);
  assert.equal((await f.request(`/admin/appointments/${id}/decision`,'POST',{decision:'decline'})).status,409);
}finally{await f.close();}});

test('only a captured, correctly priced payment queues one calendar confirmation',async()=>{const f=await fixture({calendar:true});try{
  const b=await f.book(),id=b.value.appointment.id;await f.login();await f.request(`/admin/appointments/${id}/decision`,'POST',{decision:'approve'});
  assert.equal((await f.request(`/appointments/${id}/payment/order`,'POST',{},f.auth(b))).status,200);
  const signature=createHmac('sha256',config.razorpaySecret!).update('order_123|pay_123').digest('hex');
  f.setPayment({id:'pay_123',order_id:'order_123',status:'authorized',amount:150000,currency:'INR'});
  assert.equal((await f.request(`/appointments/${id}/payment/verify`,'POST',{paymentId:'pay_123',signature},f.auth(b))).status,400);
  f.setPayment({id:'pay_123',order_id:'order_123',status:'captured',amount:1,currency:'INR'});
  assert.equal((await f.request(`/appointments/${id}/payment/verify`,'POST',{paymentId:'pay_123',signature},f.auth(b))).status,400);
  f.setPayment({id:'pay_123',order_id:'order_123',status:'captured',amount:150000,currency:'INR'});
  assert.equal((await f.request(`/appointments/${id}/payment/verify`,'POST',{paymentId:'pay_123',signature:'0'.repeat(64)},f.auth(b))).status,400);
  for(let i=0;i<2;i++)assert.equal((await f.request(`/appointments/${id}/payment/verify`,'POST',{paymentId:'pay_123',signature},f.auth(b))).status,200);
  const event={event:'payment.captured',payload:{payment:{entity:{id:'pay_123',order_id:'order_123'}}}};const webhookSignature=createHmac('sha256',config.webhookSecret!).update(JSON.stringify(event)).digest('hex');
  assert.equal((await f.request('/webhooks/razorpay','POST',event,{'x-razorpay-signature':'bad'})).status,401);
  assert.equal((await f.request('/webhooks/razorpay','POST',event,{'x-razorpay-signature':webhookSignature})).status,200);
  await f.runJobs();await f.runJobs();assert.equal(f.syncCount(),1);assert.equal(f.store.get(id)!.calendarStatus,'synced');assert.equal(f.store.db.prepare("SELECT COUNT(*) AS count FROM jobs WHERE kind='calendar_booking'").get()!.count,1);
}finally{await f.close();}});

test('missing calendar credentials keep paid sync jobs blocked and retryable, not falsely confirmed',async()=>{const f=await fixture();try{
  const b=await f.book(),id=b.value.appointment.id;await f.login();await f.request(`/admin/appointments/${id}/decision`,'POST',{decision:'approve'});await f.request(`/appointments/${id}/payment/order`,'POST',{},f.auth(b));f.setPayment({id:'pay_123',order_id:'order_123',status:'captured',amount:150000,currency:'INR'});const signature=createHmac('sha256',config.razorpaySecret!).update('order_123|pay_123').digest('hex');await f.request(`/appointments/${id}/payment/verify`,'POST',{paymentId:'pay_123',signature},f.auth(b));await f.runJobs();
  assert.equal(f.store.get(id)!.calendarStatus,'queued');assert.equal(f.store.db.prepare("SELECT status FROM jobs WHERE kind='calendar_booking'").get()!.status,'blocked');assert.equal((await f.request('/admin/calendar?start='+futureMonday())).value.connected,false);
}finally{await f.close();}});

test('email verification is required to recover a booking on another device',async()=>{const f=await fixture();try{
  await f.book();const challenge=await f.request('/lookup/start','POST',{name:payload().patientName,email:payload().patientEmail,phone:payload().patientPhone});assert.equal(challenge.status,202);assert.equal(challenge.value.results,undefined);
  const job=f.store.db.prepare("SELECT payload FROM jobs WHERE kind='lookup_email'").get()!;const code=f.store.decode<any>(job.payload as string).code;
  assert.equal((await f.request('/lookup/verify','POST',{challengeId:challenge.value.challengeId,code:'000000'})).status,400);
  const verified=await f.request('/lookup/verify','POST',{challengeId:challenge.value.challengeId,code});assert.equal(verified.status,200);assert.equal(verified.value.results.length,1);
  assert.equal((await f.request('/lookup/verify','POST',{challengeId:challenge.value.challengeId,code})).status,400);
}finally{await f.close();}});

test('bookings survive a database restart',async()=>{const dir=mkdtempSync(join(tmpdir(),'niva-api-'));const path=join(dir,'test.sqlite');let f=await fixture({database:path});try{
  const b=await f.book();const id=b.value.appointment.id;await f.close();f=await fixture({database:path});assert.equal((await f.request('/appointments/'+id,'GET',undefined,f.auth(b))).status,200);assert.equal(f.store.list().length,1);
}finally{await f.close();rmSync(dir,{recursive:true,force:true});}});

test('availability blocks preserve appointment requests and sync jobs are retryable',async()=>{const f=await fixture();try{
  const b=await f.book();await f.login();const start=new Date(`${futureMonday()}T09:00:00+05:30`).toISOString();const end=new Date(`${futureMonday()}T10:00:00+05:30`).toISOString();
  assert.equal((await f.request('/admin/blocks','POST',{start,end})).status,409);
  const laterStart=new Date(`${futureMonday()}T12:00:00+05:30`).toISOString(),laterEnd=new Date(`${futureMonday()}T13:00:00+05:30`).toISOString();
  const block=await f.request('/admin/blocks','POST',{start:laterStart,end:laterEnd});assert.equal(block.status,201);assert.equal(f.store.get(b.value.appointment.id)!.status,'pending');
  const slots=await f.request(`/availability?month=${futureMonday().slice(0,7)}&serviceId=consultation`);assert.ok(!slots.value.byDate[futureMonday()].includes('12:00'));
  assert.equal((await f.request('/admin/blocks/'+block.value.block.id,'DELETE')).status,200);
  assert.equal(f.store.setting<any[]>('blocks').length,0);
}finally{await f.close();}});

test('unconfigured payment and calendar endpoints return explicit setup status',async()=>{const f=await fixture({payments:false});try{
  const b=await f.book();await f.login();await f.request(`/admin/appointments/${b.value.appointment.id}/decision`,'POST',{decision:'approve'});
  assert.equal((await f.request(`/appointments/${b.value.appointment.id}/payment/order`,'POST',{},f.auth(b))).status,503);
  assert.deepEqual((await f.request('/admin/calendar?start='+futureMonday())).value,{connected:false,events:[]});
}finally{await f.close();}});

test('event drafts stay private and only the authenticated admin can publish or hide them',async()=>{const f=await fixture();try{
  const content={heading:'A community conversation',description:'A space to connect.',details:'Saturday · 4 pm IST\nOnline',price:499.50,kind:'community'};
  assert.equal((await f.request('/admin/event','PUT',content)).status,401);
  assert.equal((await f.request('/admin/event/visibility','PATCH',{enabled:true})).status,401);
  assert.equal((await f.request('/events')).value.event,null);
  await f.login();
  assert.equal((await f.request('/admin/event/visibility','PATCH',{enabled:true})).status,400);
  assert.equal((await f.request('/admin/event','PUT',{...content,price:-1})).status,400);
  assert.equal((await f.request('/admin/event','PUT',{...content,price:1.001})).status,400);
  assert.equal((await f.request('/admin/event','PUT',content)).status,200);
  assert.equal((await f.request('/events')).value.event,null);
  assert.equal((await f.request('/admin/event/visibility','PATCH',{enabled:true})).status,200);
  assert.equal((await f.request('/events')).value.event.price,499.50);
  assert.equal((await f.request('/admin/event','PUT',{...content,heading:''})).status,400);
  assert.equal((await f.request('/admin/event/visibility','PATCH',{enabled:false})).status,200);
  assert.equal((await f.request('/events')).value.event,null);
  assert.equal((await f.request('/admin/event')).value.event.heading,content.heading);
}finally{await f.close();}});

test('event content and visibility survive a database restart',async()=>{const dir=mkdtempSync(join(tmpdir(),'niva-event-'));const path=join(dir,'test.sqlite');let f=await fixture({database:path});try{
  await f.login();await f.request('/admin/event','PUT',{heading:'A free gathering',description:'Description',details:'Details',price:0,kind:'event'});await f.request('/admin/event/visibility','PATCH',{enabled:true});await f.close();f=await fixture({database:path});const event=(await f.request('/events')).value.event;assert.equal(event.heading,'A free gathering');assert.equal(event.price,0);assert.equal(event.enabled,true);
}finally{await f.close();rmSync(dir,{recursive:true,force:true});}});

test('free event registrations persist and paid registrations require a verified capture',async()=>{const f=await fixture();try{
  const details={heading:'Sample event',description:'Description',details:'Online · 4 pm IST',price:0,kind:'event'};
  await f.login();await f.request('/admin/event','PUT',details);const published=await f.request('/admin/event/visibility','PATCH',{enabled:true});
  const attendee={name:'Event Preview',email:'event@example.com',phone:'+919876543210',eventVersion:published.value.event.updatedAt,price:1,status:'registered'};
  const key=randomUUID();const free=await f.request('/events/register','POST',attendee,{'Idempotency-Key':key});assert.equal(free.status,201);assert.equal(free.value.registration.status,'registered');assert.equal(free.value.registration.price,0);assert.equal(free.value.registration.paymentStatus,'not_required');assert.equal(free.value.registration.accessHash,undefined);
  const repeated=await f.request('/events/register','POST',attendee,{'Idempotency-Key':key});assert.equal(repeated.value.registration.id,free.value.registration.id);
  assert.equal((await f.request('/events/registrations/'+free.value.registration.id)).status,404);
  assert.equal((await f.request('/events/registrations/'+free.value.registration.id,'GET',undefined,{Authorization:'Bearer '+free.value.accessToken})).status,200);
  await f.request('/admin/event','PUT',{...details,price:800});const version=(await f.request('/admin/event')).value.event.updatedAt;
  const stale=await f.request('/events/register','POST',{...attendee,eventVersion:'old-version'},{'Idempotency-Key':randomUUID()});assert.equal(stale.status,409);
  const paid=await f.request('/events/register','POST',{...attendee,eventVersion:version},{'Idempotency-Key':randomUUID()});assert.equal(paid.value.registration.price,800);assert.equal(paid.value.registration.status,'awaiting_payment');
  const id=paid.value.registration.id,auth={Authorization:'Bearer '+paid.value.accessToken};
  assert.equal((await f.request(`/events/registrations/${id}/payment/order`,'POST',{},auth)).status,200);
  const signature=createHmac('sha256',config.razorpaySecret!).update('order_123|pay_event').digest('hex');
  f.setPayment({id:'pay_event',order_id:'order_123',status:'captured',amount:1,currency:'INR'});
  assert.equal((await f.request(`/events/registrations/${id}/payment/verify`,'POST',{paymentId:'pay_event',signature},auth)).status,400);
  f.setPayment({id:'pay_event',order_id:'order_123',status:'captured',amount:80000,currency:'INR'});
  assert.equal((await f.request(`/events/registrations/${id}/payment/verify`,'POST',{paymentId:'pay_event',signature:'bad'},auth)).status,400);
  const verified=await f.request(`/events/registrations/${id}/payment/verify`,'POST',{paymentId:'pay_event',signature},auth);assert.equal(verified.status,200);assert.equal(verified.value.registration.status,'registered');
  const webhook={event:'payment.captured',payload:{payment:{entity:{id:'pay_event',order_id:'order_123'}}}};const signed=createHmac('sha256',config.webhookSecret!).update(JSON.stringify(webhook)).digest('hex');assert.equal((await f.request('/webhooks/razorpay','POST',webhook,{'x-razorpay-signature':signed})).status,200);
  assert.equal(f.store.db.prepare("SELECT COUNT(*) AS count FROM jobs WHERE kind='event_registration_email' AND booking_id=?").get(id)!.count,1);
  await f.runJobs();assert.equal(f.syncCount(),0);assert.equal((await f.request('/admin/event/registrations')).value.registrations.length,2);
}finally{await f.close();}});

test('hidden events reject registration and payment setup fails explicitly without credentials',async()=>{const f=await fixture({payments:false});try{
  const attendee={name:'Event Preview',email:'event@example.com',phone:'+919876543210',eventVersion:'x'};
  assert.equal((await f.request('/events/register','POST',attendee,{'Idempotency-Key':randomUUID()})).status,409);
  await f.login();await f.request('/admin/event','PUT',{heading:'Event',description:'Description',details:'Details',price:500,kind:'event'});const event=(await f.request('/admin/event/visibility','PATCH',{enabled:true})).value.event;
  const saved=await f.request('/events/register','POST',{...attendee,eventVersion:event.updatedAt},{'Idempotency-Key':randomUUID()});assert.equal(saved.status,201);
  assert.equal((await f.request(`/events/registrations/${saved.value.registration.id}/payment/order`,'POST',{}, {Authorization:'Bearer '+saved.value.accessToken})).status,503);
  await f.request('/admin/event/visibility','PATCH',{enabled:false});assert.equal((await f.request(`/events/registrations/${saved.value.registration.id}/payment/order`,'POST',{}, {Authorization:'Bearer '+saved.value.accessToken})).status,409);
}finally{await f.close();}});
