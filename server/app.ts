import {apiFirewall} from './firewall';
import {eventRegistrationRoutes, completeEventPayment, listRegistrations, getRegistration} from './eventRegistrations';
import express, { type Request, type Response, type NextFunction } from 'express';
import { randomUUID, randomInt, timingSafeEqual } from 'node:crypto';
import { SERVICES } from '../src/data/initialData';
import type { DayAvailability, PracticeEvent } from '../src/types';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Store, hash, secret, publicBooking, type Booking, type Job } from './store';
import { AppError, requireValue, validHmac, createProviders, type Config, type Providers } from './providers';

type Block={id:string;start:string;end:string;googleEventId?:string;syncStatus:string};
const asyncRoute=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>{Promise.resolve(fn(req,res)).catch(next);};
const dateKey=(ms:number)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(ms);
const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
const asDate=(date:string,time:string)=>new Date(`${date}T${time}:00+05:30`).getTime();
const safeId=(value:unknown)=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(value);
const validDate=(date:unknown):date is string=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(asDate(date,'12:00'))&&dateKey(asDate(date,'12:00'))===date;
const bearer=(req:Request)=>req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):'';
export function createApp(config:Config,store=new Store(config.databasePath,config.encryptionKey),providers:Providers=createProviders(config)) {
  requireValue(config.adminPassword&&(!config.production||config.adminPassword.length>=12),500,'Set ADMIN_PASSWORD to at least 12 characters in production.');
  const app=express(); app.use(apiFirewall(config.gatewaySecret,config.production)); app.disable('x-powered-by'); app.set('trust proxy',false);
  const origin=new URL(config.appUrl).origin;
  const locks=new Set<string>();
  async function locked<T>(key:string,fn:()=>Promise<T>) {requireValue(!locks.has(key),409,'Another operation is in progress. Please retry.');locks.add(key);try{return await fn();}finally{locks.delete(key);}}
  function rate(req:Request,bucket:string,limit=30) {
    const key=hash(`${bucket}:${config.gatewaySecret||''}:${config.gatewaySecret?req.get('x-niva-client-ip'):req.socket.remoteAddress}`);const now=Date.now();
    store.db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(now);
    const row=store.db.prepare('SELECT count FROM rate_limits WHERE key=?').get(key);
    requireValue(!row||Number(row.count)<limit,429,'Too many attempts. Please try again later.');
    store.db.prepare('INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+15*60_000);
  }
  const admin=(req:Request,res:Response,next:NextFunction)=>{
    try {const cookie=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('niva_session='))?.slice(13)||'';
      requireValue(cookie&&store.db.prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires>?').get(hash(cookie),Date.now()),401,'Please sign in to the admin dashboard.'); next();
    }catch(error){next(error);}
  };
  function patient(req:Request):Booking {
    const id=String(req.params.id);const booking=store.get(id);const token=bearer(req);
    const granted=token&&store.db.prepare('SELECT booking_id FROM access_grants WHERE token_hash=? AND booking_id=? AND expires>?').get(hash(token),id,Date.now());
    requireValue(booking&&token&&(hash(token)===booking.accessHash||granted),404,'Appointment not found or access link is invalid.');
    return booking!;
  }
  app.use((req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');next();});
  // Validate signatures against the exact bytes, before JSON parsing or CSRF checks.
  app.post('/api/webhooks/razorpay',express.raw({type:'application/json',limit:'128kb',inflate:false}),asyncRoute(async(req,res)=>{
    requireValue(config.webhookSecret,503,'Payment webhooks are not configured.');
    requireValue(Buffer.isBuffer(req.body)&&validHmac(req.body,req.get('x-razorpay-signature'),config.webhookSecret!),401,'Invalid webhook signature.');
    let event:any;try{event=JSON.parse(req.body.toString());}catch{throw new AppError(400,'Invalid webhook JSON.');}
    if(event.event==='payment.captured') {
      const payment=event.payload?.payment?.entity;
      requireValue(safeId(payment?.order_id)&&safeId(payment?.id),400,'Invalid payment event.');
      const booking=store.list().find(b=>b.orderId===payment.order_id);
      const registration=booking?undefined:listRegistrations(store).find(r=>r.orderId===payment.order_id);
      requireValue(booking||registration,404,'Unknown order.');
      const verified=await providers.getPayment(payment.id);
      if(booking)completePayment(booking.id,verified);else completeEventPayment(store,registration!.id,verified);
    }
    res.json({received:true});
  }));
  app.use(express.json({limit:'32kb',inflate:false}));
  app.use((req,res,next)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==origin)return res.status(403).json({error:'Request origin is not allowed.'});next();});
  app.get('/api/health',(_req,res)=>res.json({ok:true}));
  app.get('/api/config',(_req,res)=>res.json({calendarConnected:providers.calendarConfigured,paymentsConnected:providers.paymentConfigured,emailConnected:providers.mailConfigured}));
  app.post('/api/admin/login',(req,res,next)=>{try{rate(req,'login',10);requireValue(typeof req.body.password==='string'&&req.body.password.length<=256,400,'Enter your admin password.');const supplied=Buffer.from(hash(req.body.password),'hex');requireValue(timingSafeEqual(supplied,Buffer.from(hash(config.adminPassword),'hex')),401,'Incorrect admin password.');const token=secret();store.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());store.db.prepare('INSERT INTO sessions VALUES(?,?)').run(hash(token),Date.now()+8*3600_000);res.cookie('niva_session',token,{httpOnly:true,secure:config.production,sameSite:'strict',maxAge:8*3600_000,path:'/api'});res.json({authenticated:true});}catch(error){next(error);}});
  app.get('/api/admin/session',admin,(_req,res)=>res.json({authenticated:true}));
  app.post('/api/admin/logout',admin,(req,res)=>{const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('niva_session='))?.slice(13)||'';store.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));res.clearCookie('niva_session',{path:'/api'});res.json({ok:true});});
  function localAvailable(date:string,time:string,duration:number,excludeId?:string) {
    const start=asDate(date,time),end=start+duration*60_000;
    const day=new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US',{weekday:'long',timeZone:'UTC'});
    const hours=store.setting<DayAvailability[]>('hours').find(h=>h.day===day);
    if(!hours?.enabled||start<Date.now()+15*60_000||start>Date.now()+180*86400_000||minutes(time)<minutes(hours.startTime)||minutes(time)+duration>minutes(hours.endTime))return false;
    if(store.setting<Block[]>('blocks').some(b=>Date.parse(b.start)<end&&Date.parse(b.end)>start))return false;
    return !store.list().some(b=>b.id!==excludeId&&!['rejected','cancelled'].includes(b.status)&&b.startMs<end&&b.endMs>start);
  }
  async function externalAvailable(start:number,end:number) {return !providers.calendarConfigured||!(await providers.busy(start,end)).length;}
  app.get('/api/availability',asyncRoute(async(req,res)=>{
    rate(req,'availability',120);
    const month=String(req.query.month||''),service=SERVICES.find(s=>s.id===req.query.serviceId);
    requireValue(/^\d{4}-\d{2}$/.test(month)&&validDate(month+'-01')&&service,400,'Choose a valid month and service.');
    const start=asDate(month+'-01','00:00');requireValue(start>Date.now()-32*86400_000&&start<Date.now()+181*86400_000,400,'Month is outside the booking window.');
    const endDate=new Date(month+'-01T12:00:00Z');endDate.setUTCMonth(endDate.getUTCMonth()+1);const end=asDate(endDate.toISOString().slice(0,10),'00:00');
    const busy=providers.calendarConfigured?await providers.busy(start,end):[];
    const byDate:Record<string,string[]>={};
    for(let day=1;day<=31;day++){const date=month+'-'+String(day).padStart(2,'0');if(!validDate(date))break;byDate[date]=[];for(let i=0;i<48;i++){const time=`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`,ms=asDate(date,time);if(localAvailable(date,time,service!.durationMin)&&!busy.some(b=>Date.parse(b.start)<ms+service!.durationMin*60000&&Date.parse(b.end)>ms))byDate[date].push(time);}}
    res.json({byDate,source:providers.calendarConfigured?'google-calendar':'application-hours',timeZone:'Asia/Kolkata'});
  }));
  app.post('/api/appointments',asyncRoute(async(req,res)=>{
    rate(req,'bookings',20);
    const {patientName,patientEmail,patientPhone,date,time,serviceId,reason=''}=req.body;
    requireValue(typeof patientName==='string'&&patientName.trim().length>0&&patientName.length<=100&&typeof patientEmail==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)&&patientEmail.length<=254,400,'Enter a valid name and email.');
    const phone=typeof patientPhone==='string'?parsePhoneNumberFromString(patientPhone):undefined;
    requireValue(phone?.isPossible(),400,'Enter a valid international phone number.');
    const service=SERVICES.find(s=>s.id===serviceId);requireValue(service&&validDate(date)&&typeof time==='string'&&/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(time)&&typeof reason==='string'&&reason.length<=1000,400,'Choose a valid service, date and time.');
    const key=req.get('Idempotency-Key');requireValue(key&&/^[a-zA-Z0-9_-]{16,100}$/.test(key),400,'A booking request key is required.');
    const inputHash=hash(JSON.stringify([patientName,patientEmail,phone!.number,date,time,serviceId,reason]));
    const previous=store.db.prepare('SELECT payload_hash,response FROM idempotency WHERE key=?').get(key!);
    if(previous){requireValue(previous.payload_hash===inputHash,409,'This request key has already been used.');return res.status(201).json(store.decode(previous.response as string));}
    requireValue(localAvailable(date,time,service!.durationMin)&&await externalAvailable(asDate(date,time),asDate(date,time)+service!.durationMin*60000),409,'This time is no longer available. Choose another slot.');
    const accessToken=secret();const booking:Booking={id:randomUUID(),referenceNo:'APT-'+randomUUID().slice(0,8).toUpperCase(),patientName:patientName.trim(),patientEmail:patientEmail.trim().toLowerCase(),patientPhone:phone!.number,date,time,serviceId:service!.id,consultingFor:service!.name,durationMin:service!.durationMin,fee:service!.fee,reason,status:'pending',paymentStatus:'pending',clinicId:'online',patientType:'new-patient',createdAt:new Date().toISOString(),accessHash:hash(accessToken),startMs:asDate(date,time),endMs:asDate(date,time)+service!.durationMin*60000,calendarStatus:'waiting_payment'};
    const response={appointment:publicBooking(booking),accessToken};
    store.transaction(()=>{requireValue(localAvailable(date,time,service!.durationMin),409,'This time is no longer available.');store.put(booking);store.db.prepare('INSERT INTO idempotency VALUES(?,?,?)').run(key!,inputHash,store.encode(response));store.audit(booking.id,'request_created');});
    res.status(201).json(response);
  }));
  app.get('/api/appointments/:id',(req,res,next)=>{try{res.json({appointment:publicBooking(patient(req))});}catch(error){next(error);}});
  app.post('/api/lookup/start',asyncRoute(async(req,res)=>{
    rate(req,'lookup',10);requireValue(providers.mailConfigured,503,'Email verification is not configured yet. Use your booking access link on this device.');
    const {name,email,phone}=req.body;requireValue(typeof name==='string'&&typeof email==='string'&&typeof phone==='string'&&name.length<=100&&email.length<=254&&phone.length<=30,400,'Enter your booking details.');
    const normalized=parsePhoneNumberFromString(phone)?.number;
    const ids=store.list().filter(b=>b.patientName.toLowerCase()===name.trim().toLowerCase()&&b.patientEmail===email.trim().toLowerCase()&&b.patientPhone===normalized).map(b=>b.id);
    const id=randomUUID(),code=String(randomInt(100000,1000000));
    store.db.prepare('DELETE FROM lookup_codes WHERE expires<?').run(Date.now());
    store.db.prepare('INSERT INTO lookup_codes VALUES(?,?,?,?,0,?)').run(id,'',store.encode(hash(id+code)),Date.now()+10*60_000,store.encode(ids));
    if(ids.length)store.job('lookup_email','',{to:email.trim().toLowerCase(),code},'lookup:'+id);
    res.status(202).json({challengeId:id,message:'If the details match a booking, a verification code will be emailed.'});
  }));
  app.post('/api/lookup/verify',(req,res,next)=>{try{
    rate(req,'lookup_verify',20);const {challengeId,code}=req.body;requireValue(typeof challengeId==='string'&&typeof code==='string'&&/^\d{6}$/.test(code),400,'Enter the six-digit verification code.');
    const row=store.db.prepare('SELECT * FROM lookup_codes WHERE id=?').get(challengeId);
    requireValue(row&&Number(row.expires)>Date.now()&&Number(row.attempts)<5,400,'Verification code is invalid or expired.');
    store.db.prepare('UPDATE lookup_codes SET attempts=attempts+1 WHERE id=?').run(challengeId);
    requireValue(store.decode<string>(row!.code_hash as string)===hash(challengeId+code),400,'Verification code is invalid or expired.');
    const results=store.decode<string[]>(row!.booking_ids as string).map(id=>{const token=secret();store.db.prepare('INSERT INTO access_grants VALUES(?,?,?)').run(hash(token),id,Date.now()+30*86400_000);return {appointment:publicBooking(store.get(id)!),accessToken:token};});
    store.db.prepare('DELETE FROM lookup_codes WHERE id=?').run(challengeId);res.json({results});
  }catch(error){next(error);}});
  app.get('/api/admin/appointments',admin,(_req,res)=>res.json({appointments:store.list().map(publicBooking)}));
  app.post('/api/admin/appointments/:id/decision',admin,asyncRoute(async(req,res)=>{
    const {decision}=req.body;requireValue(['approve','decline'].includes(decision),400,'Choose approve or decline.');
    const id=String(req.params.id);const token=secret();
    store.transaction(()=>{const b=store.get(id);requireValue(b,404,'Request not found.');const status=decision==='approve'?'confirmed':'rejected';
      if(b!.status===status)return;
      requireValue(b!.status==='pending',409,'This request has already been reviewed.');
      requireValue(decision!=='approve'||b!.startMs>Date.now(),409,'The appointment time has passed.');
      b!.status=status;store.put(b!);store.audit(id,decision);
      if(decision==='approve'){store.db.prepare('INSERT INTO access_grants VALUES(?,?,?)').run(hash(token),id,Date.now()+30*86400_000);store.job('approval_email',id,{token});}
      else store.job('decline_email',id,{});
    });res.json({appointment:publicBooking(store.get(id)!)});
  }));
  app.get('/api/admin/jobs',admin,(_req,res)=>res.json({jobs:store.db.prepare('SELECT id,kind,booking_id,status,attempts,last_error FROM jobs ORDER BY id DESC LIMIT 100').all()}));
  app.post('/api/admin/jobs/retry',admin,(_req,res)=>{store.db.prepare("UPDATE jobs SET status='pending',next_run=0 WHERE status IN ('blocked','failed')").run();res.json({ok:true});});
  app.get('/api/admin/calendar',admin,asyncRoute(async(req,res)=>{
    const start=String(req.query.start||'');requireValue(validDate(start),400,'Choose a valid week start.');
    if(!providers.calendarConfigured)return res.json({connected:false,events:[]});
    const end=asDate(start,'00:00')+7*86400_000;
    const events=await providers.listEvents(new Date(asDate(start,'00:00')).toISOString(),new Date(end).toISOString());
    res.json({connected:true,events,updatedAt:new Date().toISOString()});
  }));
  // A single optional event/community feature. Drafts never reach the public endpoint.
  const eventReady=(event:PracticeEvent)=>!!(event.heading.trim()&&event.description.trim()&&event.details.trim());
  app.get('/api/events',(_req,res)=>{const event=store.setting<PracticeEvent>('event');res.json({event:event.enabled?event:null});});
  app.get('/api/admin/event',admin,(_req,res)=>res.json({event:store.setting('event')}));
  app.put('/api/admin/event',admin,(req,res,next)=>{try{
    const {heading,description,details,price,kind}=req.body;
    requireValue(typeof heading==='string'&&heading.length<=120&&typeof description==='string'&&description.length<=3000&&typeof details==='string'&&details.length<=3000&&typeof price==='number'&&Number.isFinite(price)&&price>=0&&price<=1000000&&Math.abs(price*100-Math.round(price*100))<0.000001&&['event','community'].includes(kind),400,'Enter valid event fields and a price with up to two decimal places.');
    const event:PracticeEvent={heading:heading.trim(),description:description.trim(),details:details.trim(),price,kind,enabled:store.setting<PracticeEvent>('event').enabled,updatedAt:new Date().toISOString()};
    requireValue(!event.enabled||eventReady(event),400,'Published events need a heading, description and details.');
    store.transaction(()=>{store.setSetting('event',event);store.audit('event-settings','event_updated');});res.json({event});
  }catch(error){next(error);}});
  app.patch('/api/admin/event/visibility',admin,(req,res,next)=>{try{
    requireValue(typeof req.body.enabled==='boolean',400,'Choose whether the event should be visible.');
    const event=store.setting<PracticeEvent>('event');
    requireValue(!req.body.enabled||eventReady(event),400,'Save a heading, description and details before turning this on.');
    event.enabled=req.body.enabled;event.updatedAt=new Date().toISOString();
    store.transaction(()=>{store.setSetting('event',event);store.audit('event-settings',event.enabled?'event_published':'event_hidden');});res.json({event});
  }catch(error){next(error);}});
  app.get('/api/admin/availability',admin,(_req,res)=>res.json({hours:store.setting('hours'),blocks:store.setting('blocks')}));
  app.put('/api/admin/availability',admin,(req,res,next)=>{try{
    const hours=req.body.hours;const validTime=(value:unknown)=>typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
    const names=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    requireValue(Array.isArray(hours)&&hours.length===7&&new Set(hours.map(h=>h.day)).size===7&&hours.every(h=>names.includes(h.day)&&typeof h.enabled==='boolean'&&validTime(h.startTime)&&validTime(h.endTime)&&h.startTime<h.endTime),400,'Supply seven valid day schedules.');
    store.setSetting('hours',hours.map((h:DayAvailability)=>({day:h.day,enabled:h.enabled,startTime:h.startTime,endTime:h.endTime,clinicId:'online',slotDurationMin:30})));
    res.json({ok:true,syncMode:'application-hours',message:'Custom booking hours updated. Google Appointment Schedule hours must be edited in Google.'});
  }catch(error){next(error);}});
  app.post('/api/admin/blocks',admin,(req,res,next)=>{try{const start=Date.parse(req.body.start),end=Date.parse(req.body.end);requireValue(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&start>Date.now()&&end-start<=366*86400_000,400,'Choose a valid future interval.');
    requireValue(!store.list().some(b=>!['rejected','cancelled'].includes(b.status)&&b.startMs<end&&b.endMs>start),409,'This block overlaps an appointment request.');
    const block:Block={id:randomUUID(),start:new Date(start).toISOString(),end:new Date(end).toISOString(),syncStatus:'queued'};
    store.transaction(()=>{store.setSetting('blocks',[...store.setting<Block[]>('blocks'),block]);store.job('block_sync',block.id,{block});});res.status(201).json({block});
  }catch(error){next(error);}});
  app.delete('/api/admin/blocks/:id',admin,(req,res,next)=>{try{const blocks=store.setting<Block[]>('blocks'),block=blocks.find(b=>b.id===req.params.id);requireValue(block,404,'Block not found.');store.transaction(()=>{store.setSetting('blocks',blocks.filter(b=>b.id!==block!.id));store.job('block_delete',block!.id,{block});});res.json({ok:true});}catch(error){next(error);}});
  app.post('/api/appointments/:id/payment/order',asyncRoute(async(req,res)=>{
    const b=patient(req);requireValue(b.status==='confirmed'&&b.paymentStatus!=='paid'&&b.startMs>Date.now(),409,'Payment is available only for an approved future appointment.');
    const order=await locked('order:'+b.id,async()=>{const fresh=store.get(b.id)!;if(fresh.orderId)return {id:fresh.orderId};requireValue(await externalAvailable(b.startMs,b.endMs),409,'The calendar slot has changed. Contact the practice before paying.');const order=await providers.createOrder(fresh);fresh.orderId=order.id;store.put(fresh);return order;});
    res.json({orderId:order.id,key:config.razorpayKey,amount:b.fee*100,currency:'INR'});
  }));
  function completePayment(id:string,payment:any) {
    store.transaction(()=>{const b=store.get(id)!;requireValue(b.orderId===payment.order_id&&payment.status==='captured'&&payment.amount===b.fee*100&&payment.currency==='INR',400,'Payment has not been captured for the expected amount.');
      if(b.paymentStatus==='paid'){requireValue(b.paymentId===payment.id,409,'A different payment already exists.');return;}
      requireValue(b.status==='confirmed',409,'Appointment is not approved.');b.paymentStatus='paid';b.paymentId=payment.id;b.calendarStatus='queued';store.put(b);store.job('calendar_booking',id,{});store.audit(id,'payment_captured');
    });
  }
  app.post('/api/appointments/:id/payment/verify',asyncRoute(async(req,res)=>{const b=patient(req);const {paymentId,signature}=req.body;requireValue(config.razorpaySecret&&b.orderId&&safeId(paymentId)&&validHmac(`${b.orderId}|${paymentId}`,signature,config.razorpaySecret),400,'Invalid payment verification.');completePayment(b.id,await providers.getPayment(paymentId));res.json({appointment:publicBooking(store.get(b.id)!)});}));
  app.use('/api',eventRegistrationRoutes({store,providers,config,admin,rate}));
  app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint not found.'}));
  app.use((error:any,_req:Request,res:Response,_next:NextFunction)=>{res.status(error instanceof AppError?error.status:[400,413,415].includes(error.status)?error.status:500).json({error:error instanceof AppError?error.message:error.status===400?'Invalid request body.':error.status===413?'Request body is too large.':error.status===415?'Unsupported request encoding.':'The request could not be completed. Please try again.'});});

  let working=false;
  async function runJobs() {
    if(working)return;working=true;
    try{const jobs=store.db.prepare("SELECT *,booking_id AS bookingId FROM jobs WHERE status='pending' AND next_run<=? ORDER BY id LIMIT 20").all(Date.now()) as unknown as Job[];
      for(const job of jobs){try{
        const payload=store.decode<any>(job.payload),b=store.get(job.bookingId);
        if(job.kind==='calendar_booking') {requireValue(b?.paymentStatus==='paid',409,'Payment is required before calendar confirmation.');const event=await providers.syncBooking(b!);const fresh=store.get(job.bookingId)!;fresh.calendarEventId=event.id;fresh.calendarStatus='synced';fresh.meetingUrl=event.hangoutLink;store.transaction(()=>{store.put(fresh);store.job('confirmation_email',fresh.id,{});});}
        else if(job.kind==='block_sync'||job.kind==='block_delete') {if(job.kind==='block_delete'||store.setting<Block[]>('blocks').some(block=>block.id===job.bookingId)) await providers.syncBlock(payload.block,job.kind==='block_delete');const blocks=store.setting<Block[]>('blocks');store.setSetting('blocks',blocks.map(block=>block.id===job.bookingId?{...block,syncStatus:'synced'}:block));}
        else if(job.kind==='event_registration_email'){const r=getRegistration(store,job.bookingId);requireValue(r?.status==='registered',409,'Event registration is not confirmed.');await providers.sendMail(r!.email,'Your event registration is confirmed',`You are registered for ${r!.event.heading}.\n\n${r!.event.details}\n\nReference: ${r!.referenceNo}`, 'niva-event-'+job.id);}
        else {
          let to=b?.patientEmail||payload.to,subject='',text='';
          if(job.kind==='lookup_email'){subject='Your appointment verification code';text=`Your code is ${payload.code}. It expires in 10 minutes. If you did not request it, ignore this email.`;}
          else if(job.kind==='approval_email'){subject='Your appointment request is approved';text=`Your appointment request has been approved. Continue to payment using your private access link:\n${config.appUrl.replace(/\/$/,'')}/#booking?appointment=${b!.id}&token=${payload.token}\nYour calendar booking is confirmed after successful payment.`;}
          else if(job.kind==='decline_email'){subject='Update on your appointment request';text='Your requested appointment time was not approved. Please contact the practice or request another time.';}
          else if(job.kind==='confirmation_email'){subject='Your appointment is confirmed';text=`Your appointment is confirmed for ${b!.date} at ${b!.time} IST.${b!.meetingUrl?'\nJoin: '+b!.meetingUrl:''}`;}
          else throw new AppError(400,'Unknown job.');
          await providers.sendMail(to,subject,text,'niva-job-'+job.id);
        }
        store.db.prepare("UPDATE jobs SET status='done',last_error=NULL WHERE id=?").run(job.id);
      }catch(error){const e=error as AppError;const blocked=e.status===503||e.status===409;store.db.prepare('UPDATE jobs SET status=?,attempts=attempts+1,next_run=?,last_error=? WHERE id=?').run(blocked?'blocked':job.attempts>=7?'failed':'pending',Date.now()+Math.min(3600_000,30_000*2**job.attempts),e instanceof AppError?e.message:'Provider temporarily unavailable.',job.id);if(e.status===409&&job.kind==='calendar_booking'){const b=store.get(job.bookingId)!;b.calendarStatus='conflict';store.put(b);}}
      }
    }finally{working=false;}
  }
  return {app,store,runJobs};
}
