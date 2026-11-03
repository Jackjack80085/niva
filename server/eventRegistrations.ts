import { randomUUID } from 'node:crypto';
import { Router, type Request, type RequestHandler } from 'express';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { EventRegistration, PracticeEvent } from '../src/types';
import { Store, hash, secret } from './store';
import { AppError, requireValue, validHmac, type Config, type Providers } from './providers';

type StoredRegistration=EventRegistration & {accessHash:string;orderId?:string;paymentId?:string};
export const getRegistration=(store:Store,id:string):StoredRegistration|undefined=>{const row=store.db.prepare('SELECT data FROM event_registrations WHERE id=?').get(id);return row?store.decode<StoredRegistration>(row.data as string):undefined;};
const put=(store:Store,r:StoredRegistration)=>store.db.prepare('INSERT INTO event_registrations VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(r.id,store.encode(r));
const publicRegistration=(r:StoredRegistration):EventRegistration=>{const {accessHash,orderId,paymentId,...safe}=r;return safe;};
export const listRegistrations=(store:Store)=>store.db.prepare('SELECT data FROM event_registrations ORDER BY rowid DESC').all().map(row=>store.decode<StoredRegistration>(row.data as string) as StoredRegistration);
export function completeEventPayment(store:Store,registrationId:string,payment:any) {
  store.transaction(()=>{const r=getRegistration(store,registrationId);requireValue(r&&r.orderId===payment?.order_id&&payment.status==='captured'&&payment.amount===Math.round(r.price*100)&&payment.currency==='INR',400,'Payment has not been captured for this event at the expected price.');
    if(r!.paymentStatus==='paid'){requireValue(r!.paymentId===payment.id,409,'A different payment is already recorded.');return;}
    r!.status='registered';r!.paymentStatus='paid';r!.paymentId=payment.id;put(store,r!);store.job('event_registration_email',r!.id,{});store.audit(r!.id,'event_payment_captured');
  });
}
export function eventRegistrationRoutes({store,providers,config,admin,rate}:{store:Store;providers:Providers;config:Config;admin:RequestHandler;rate:(req:Request,bucket:string,limit?:number)=>void}) {
  const router=Router();const locks=new Set<string>();
  const handler=(fn:(req:any,res:any)=>Promise<unknown>):RequestHandler=>(req,res,next)=>{Promise.resolve(fn(req,res)).catch(next);};
  const access=(req:Request)=>{const r=getRegistration(store,String(req.params.id));const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):'';requireValue(r&&token&&hash(token)===r.accessHash,404,'Registration not found or access link is invalid.');return r!;};
  router.get('/admin/event/registrations',admin,(_req,res)=>res.json({registrations:listRegistrations(store).map(publicRegistration)}));
  router.post('/events/register',handler(async(req,res)=>{
    rate(req,'event_registration',20);const event=store.setting<PracticeEvent>('event');requireValue(event.enabled,409,'Registration is currently closed.');
    const {name,email,phone,eventVersion}=req.body;
    requireValue(typeof name==='string'&&name.trim()&&name.length<=100&&typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),400,'Enter a valid name and email.');
    const parsed=typeof phone==='string'?parsePhoneNumberFromString(phone):undefined;requireValue(parsed?.isPossible(),400,'Enter a valid international phone number.');
    const key=req.get('Idempotency-Key');requireValue(key&&/^[a-zA-Z0-9_-]{16,100}$/.test(key),400,'A registration request key is required.');
    const inputHash=hash(JSON.stringify([name,email,parsed!.number,eventVersion]));
    const previous=store.db.prepare('SELECT payload_hash,response FROM idempotency WHERE key=?').get('event:'+key);
    if(previous){requireValue(previous.payload_hash===inputHash,409,'This registration request key has already been used.');return res.status(201).json(store.decode(previous.response as string));}
    requireValue(eventVersion===event.updatedAt,409,'The event details or price changed. Refresh the page before registering.');
    const token=secret();const registration:StoredRegistration={id:randomUUID(),referenceNo:'EVT-'+randomUUID().slice(0,8).toUpperCase(),name:name.trim(),email:email.trim().toLowerCase(),phone:parsed!.number,event,price:event.price,status:event.price===0?'registered':'awaiting_payment',paymentStatus:event.price===0?'not_required':'pending',createdAt:new Date().toISOString(),accessHash:hash(token)};
    const response={registration:publicRegistration(registration),accessToken:token};
    store.transaction(()=>{put(store,registration);store.db.prepare('INSERT INTO idempotency VALUES(?,?,?)').run('event:'+key,inputHash,store.encode(response));store.audit(registration.id,'event_registration_created');if(registration.price===0)store.job('event_registration_email',registration.id,{});});res.status(201).json(response);
  }));
  router.get('/events/registrations/:id',(req,res,next)=>{try{res.json({registration:publicRegistration(access(req))});}catch(error){next(error);}});
  router.post('/events/registrations/:id/payment/order',handler(async(req,res)=>{
    const r=access(req);requireValue(r.status==='awaiting_payment'&&r.price>0,409,'This registration does not require payment.');
    requireValue(!locks.has(r.id),409,'Payment setup is in progress. Please retry.');locks.add(r.id);
    try{const current=store.setting<PracticeEvent>('event');requireValue(current.enabled&&current.updatedAt===r.event.updatedAt,409,'This event has changed or registration is closed. Contact the practice before paying.');
      let id=r.orderId;if(!id){const order=await providers.createOrder({fee:r.price,referenceNo:r.referenceNo});id=order.id;r.orderId=id;put(store,r);}
      res.json({orderId:id,key:config.razorpayKey,amount:Math.round(r.price*100),currency:'INR'});
    }finally{locks.delete(r.id);}
  }));
  router.post('/events/registrations/:id/payment/verify',handler(async(req,res)=>{
    const r=access(req);const {paymentId,signature}=req.body;
    requireValue(config.razorpaySecret&&r.orderId&&typeof paymentId==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(paymentId)&&validHmac(`${r.orderId}|${paymentId}`,signature,config.razorpaySecret),400,'Invalid event payment verification.');
    completeEventPayment(store,r.id,await providers.getPayment(paymentId));res.json({registration:publicRegistration(getRegistration(store,r.id)!)});
  }));
  return router;
}
