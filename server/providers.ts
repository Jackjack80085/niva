import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Booking } from './store';
export type Config = {
  encryptionKey?:string; gatewaySecret?:string; enablePayments?:boolean; enableCalendar?:boolean; enableEmail?:boolean;
  appUrl: string; adminPassword: string; production: boolean; databasePath: string;
  razorpayKey?: string; razorpaySecret?: string; webhookSecret?: string;
  resendKey?: string; mailFrom?: string;
  calendarId?: string; googleClientId?: string; googleClientSecret?: string; googleRefreshToken?: string;
};
export class AppError extends Error { constructor(public status:number,message:string){super(message);} }
export const requireValue = (condition:unknown,status:number,message:string) => {if(!condition) throw new AppError(status,message);};
export const validHmac = (body:string|Buffer,signature:string|undefined,key:string) => {
  if(typeof signature!=='string' || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature,'hex'),createHmac('sha256',key).update(body).digest());
};
export type CalendarEvent = {id:string;summary?:string;start:{dateTime?:string;date?:string};end:{dateTime?:string;date?:string};htmlLink?:string;hangoutLink?:string;status?:string};
export function createProviders(config:Config, http:typeof fetch=fetch) {
  async function json(url:string,init:RequestInit={}) {
    const response=await http(url,{...init,redirect:'error',signal:AbortSignal.timeout(15_000)});
    if(init.method==='DELETE' && (response.status===404||response.status===204)) return {};
    if(!response.ok) throw new AppError(502,`Provider request failed (${response.status}).`);
    return response.json() as Promise<any>;
  }
  const calendarConfigured=config.enableCalendar!==false&&!!(config.calendarId&&config.googleClientId&&config.googleClientSecret&&config.googleRefreshToken);
  let googleToken={value:'',expires:0};
  async function google(path:string,init:RequestInit={}) {
    requireValue(calendarConfigured,503,'Google Calendar is not connected yet.');
    if(googleToken.expires<Date.now()) {
      const data=await json('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.googleClientId!,client_secret:config.googleClientSecret!,refresh_token:config.googleRefreshToken!,grant_type:'refresh_token'})});
      googleToken={value:data.access_token,expires:Date.now()+(Number(data.expires_in)-60)*1000};
    }
    return json(`https://www.googleapis.com/calendar/v3/${path}`,{...init,headers:{'Content-Type':'application/json',Authorization:`Bearer ${googleToken.value}`,...init.headers}});
  }
  const calendarPath=`calendars/${encodeURIComponent(config.calendarId||'')}/events`;
  async function listEvents(start:string,end:string):Promise<CalendarEvent[]> {
    let pageToken='';const events:CalendarEvent[]=[];
    do {const params=new URLSearchParams({timeMin:start,timeMax:end,singleEvents:'true',orderBy:'startTime',showDeleted:'false',maxResults:'2500',timeZone:'Asia/Kolkata',...(pageToken?{pageToken}:{})});const data=await google(`${calendarPath}?${params}`);events.push(...(data.items||[]));pageToken=data.nextPageToken||'';}while(pageToken);
    return events.filter(event=>event.status!=='cancelled');
  }
  async function busy(start:number,end:number) {
    const data=await google('freeBusy',{method:'POST',body:JSON.stringify({timeMin:new Date(start).toISOString(),timeMax:new Date(end).toISOString(),items:[{id:config.calendarId}]})});
    const calendar=data.calendars?.[config.calendarId!];requireValue(calendar&&!calendar.errors,502,'Could not check Google Calendar availability.');
    return calendar.busy as {start:string;end:string}[];
  }
  async function syncBooking(booking:Booking) {
    // A deterministic Google event ID makes retries safe, including a timeout after insertion.
    const eventId='b'+booking.id.replaceAll('-','');
    const existing=(await listEvents(new Date(booking.startMs-1).toISOString(),new Date(booking.endMs+1).toISOString())).find(event=>event.id===eventId);
    if(existing) return existing;
    requireValue(!(await busy(booking.startMs,booking.endMs)).length,409,'This paid appointment conflicts with Google Calendar. Staff review is required.');
    return await google(calendarPath+'?sendUpdates=all&conferenceDataVersion=1',{method:'POST',body:JSON.stringify({id:eventId,summary:'Online consultation',start:{dateTime:new Date(booking.startMs).toISOString(),timeZone:'Asia/Kolkata'},end:{dateTime:new Date(booking.endMs).toISOString(),timeZone:'Asia/Kolkata'},attendees:[{email:booking.patientEmail}],extendedProperties:{private:{nivaBookingId:booking.id}},conferenceData:{createRequest:{requestId:eventId,conferenceSolutionKey:{type:'hangoutsMeet'}}}})}) as CalendarEvent;
  }
  const paymentConfigured=config.enablePayments!==false&&!!(config.razorpayKey&&config.razorpaySecret);
  async function razorpay(path:string,init:RequestInit={}) {
    requireValue(paymentConfigured,503,'Live payments are not configured yet.');
    return json(`https://api.razorpay.com/v1/${path}`,{...init,headers:{'Content-Type':'application/json',Authorization:'Basic '+Buffer.from(`${config.razorpayKey}:${config.razorpaySecret}`).toString('base64')}});
  }
  return {
    calendarConfigured,paymentConfigured,mailConfigured:config.enableEmail!==false&&!!(config.resendKey&&config.mailFrom),listEvents,busy,syncBooking,
    async syncBlock(block:{id:string;start:string;end:string},remove:boolean) {
      const id='a'+block.id.replaceAll('-','');
      if(remove){await google(`${calendarPath}/${id}`,{method:'DELETE'});return;}
      const events=await listEvents(block.start,block.end);
      if(events.some(event=>event.id===id))return;
      await google(calendarPath,{method:'POST',body:JSON.stringify({id,summary:'Unavailable',start:{dateTime:block.start,timeZone:'Asia/Kolkata'},end:{dateTime:block.end,timeZone:'Asia/Kolkata'},transparency:'opaque',extendedProperties:{private:{nivaBlockId:block.id}}})});
    },
    createOrder:(booking:Pick<Booking,'fee'|'referenceNo'>)=>razorpay('orders',{method:'POST',body:JSON.stringify({amount:booking.fee*100,currency:'INR',receipt:booking.referenceNo})}),
    getPayment:(id:string)=>razorpay(`payments/${encodeURIComponent(id)}`),
    async sendMail(to:string,subject:string,text:string,idempotencyKey:string) {
      requireValue(config.enableEmail!==false&&config.resendKey&&config.mailFrom,503,'Email delivery is not configured yet.');
      await json('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.resendKey}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({from:config.mailFrom,to:[to],subject,text})});
    },
  };
}
export type Providers=ReturnType<typeof createProviders>;
