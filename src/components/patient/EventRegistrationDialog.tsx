import { useEffect, useRef, useState } from 'react';
import { X, Check, CreditCard, ArrowRight } from 'lucide-react';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { api } from '../../utils/api';
import { loadRazorpay } from '../../utils/razorpay';
import { InternationalPhone } from './InternationalPhone';
import type { PracticeEvent, EventRegistration } from '../../types';
const price=(amount:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(amount);
const accessKey='niva_event_registration_access';
export function EventRegistrationDialog({event,onClose}:{event:PracticeEvent;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const requestKey=useRef(crypto.randomUUID());
  const [registration,setRegistration]=useState<EventRegistration|null>(null);
  const accessToken=useRef('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [paymentsReady,setPaymentsReady]=useState(false);
  const [restoring,setRestoring]=useState(true);
  const [configLoaded,setConfigLoaded]=useState(false);
  const [emailReady,setEmailReady]=useState(false);
  useEffect(()=>{const element=dialog.current!;element.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';api<{paymentsConnected:boolean;emailConnected:boolean}>('/config').then(data=>{setPaymentsReady(data.paymentsConnected);setEmailReady(data.emailConnected);setConfigLoaded(true);}).catch(()=>{setConfigLoaded(true);});
    return()=>{element.close();document.body.style.overflow=previous;};},[]);
  useEffect(()=>{let active=true;const recover=async()=>{try{const saved=JSON.parse(sessionStorage.getItem(accessKey)||'{}') as Record<string,string>;const results=await Promise.all(Object.entries(saved).map(async([id,token])=>{try{const data=await api<{registration:EventRegistration}>(`/events/registrations/${id}`,{headers:{Authorization:'Bearer '+token}});return {...data,token};}catch{return null;}}));const latest=results.filter((result):result is {registration:EventRegistration;token:string}=>!!result&&result.registration.event.updatedAt===event.updatedAt).sort((a,b)=>b.registration.createdAt.localeCompare(a.registration.createdAt))[0];if(active&&latest){accessToken.current=latest.token;setRegistration(latest.registration);}}catch{/* Ignore unavailable browser recovery data. */}finally{if(active)setRestoring(false);}};void recover();return()=>{active=false;};},[event.updatedAt]);
  const restore=()=>{if(dialog.current?.isConnected&&!dialog.current.open)dialog.current.showModal();};
  const saveAccess=(id:string,token:string)=>{try{const saved=JSON.parse(sessionStorage.getItem(accessKey)||'{}');sessionStorage.setItem(accessKey,JSON.stringify({...saved,[id]:token}));}catch{/* The registration still exists on the server if browser storage is unavailable. */}};
  const checkout=async(r:EventRegistration)=>{
    setBusy(true);setError('');
    const headers={Authorization:'Bearer '+accessToken.current};
    try{
      const order=await api<{key:string;orderId:string;amount:number;currency:string}>(`/events/registrations/${r.id}/payment/order`,{method:'POST',headers,body:'{}'});
      await loadRazorpay();
      const payment=new (window as any).Razorpay({key:order.key,order_id:order.orderId,amount:order.amount,currency:order.currency,name:'Dr. Niva Jacob',description:r.event.heading,prefill:{name:r.name,email:r.email,contact:r.phone},theme:{color:'#332b27'},modal:{ondismiss:()=>{setBusy(false);restore();}},handler:async(response:any)=>{
        try{const verified=await api<{registration:EventRegistration}>(`/events/registrations/${r.id}/payment/verify`,{method:'POST',headers,body:JSON.stringify({paymentId:response.razorpay_payment_id,signature:response.razorpay_signature})});setRegistration(verified.registration);}catch(err){setError((err as Error).message);}finally{setBusy(false);restore();}
      }});
      payment.on('payment.failed',()=>{setError('Payment was not completed. Please try again.');setBusy(false);restore();});
      dialog.current?.close();payment.open();
    }catch(err){setError((err as Error).message);setBusy(false);restore();}
  };
  const registered=registration?.status==='registered';
  return <dialog ref={dialog} className="booking-page event-registration-dialog" aria-labelledby="event-register-title" onCancel={onClose}>
    <div className="event-register-top"><p className="eyebrow">{registered?'YOU’RE ON THE LIST':registration?'COMPLETE YOUR REGISTRATION':'JOIN THE GATHERING'}</p><button type="button" aria-label="Close event registration" onClick={onClose}><X size={19}/></button></div>
    <h2 id="event-register-title">{registered?'You’re registered.':event.heading}</h2>
    {restoring ? <p className="muted">Checking registration…</p> : registration ? <>
      {registered&&<span className="event-registration-check"><Check size={22}/></span>}
      <p className="event-register-intro">{registered?`${registration.name}, your registration for ${registration.event.heading} is confirmed.`:'Your details are saved. Complete payment to confirm your place.'}</p>
      <p className="muted">Reference: {registration.referenceNo}</p>
      <div className="event-registration-summary"><p>{registration.event.details}</p><div><span>{registered?(registration.price===0?'Registration fee':'Amount paid'):'Total to pay'}</span><strong>{registration.price===0?'Free':price(registration.price)}</strong></div></div>
      {registered ? <><p className="muted">{emailReady?'A confirmation email is queued for delivery.':'Your registration is confirmed. Email delivery is pending setup.'}</p><button type="button" className="primary event-register-submit" onClick={onClose}>Done</button></> : <><button type="button" className="primary event-register-submit" disabled={busy||!paymentsReady} onClick={()=>void checkout(registration)}><CreditCard size={16}/>{busy?'Opening checkout…':`Pay ${price(registration.price)}`}</button>{!paymentsReady&&<p className="muted">Payment setup is pending. No charge has been made and your place is not yet confirmed.</p>}<button type="button" className="event-register-refresh" disabled={busy} onClick={async()=>{setBusy(true);try{const data=await api<{registration:EventRegistration}>(`/events/registrations/${registration.id}`,{headers:{Authorization:'Bearer '+accessToken.current}});setRegistration(data.registration);}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}>Refresh payment status</button></>}
    </> : <>
      <p className="event-register-intro">Share your details to {event.price===0?'reserve your place.':'continue to payment.'}</p>
      <form className="event-register-form" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError('');try{const phone=parsePhoneNumberFromString(String(form.get('phoneNational')),String(form.get('phoneCountry')) as CountryCode);if(!phone?.isPossible())throw new Error('Enter a valid phone number.');const data=await api<{registration:EventRegistration;accessToken:string}>('/events/register',{method:'POST',headers:{'Idempotency-Key':requestKey.current},body:JSON.stringify({name:String(form.get('name')),email:String(form.get('email')),phone:phone.number,eventVersion:event.updatedAt})});accessToken.current=data.accessToken;saveAccess(data.registration.id,data.accessToken);setRegistration(data.registration);if(data.registration.price>0&&paymentsReady){await checkout(data.registration);}else setBusy(false);}catch(err){setError((err as Error).message);setBusy(false);}}}>
        <label>Full name<input name="name" autoComplete="name" required maxLength={100} placeholder="Your full name" disabled={busy}/></label>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" disabled={busy}/></label>
        <InternationalPhone/>
        <label className="check-label event-registration-consent"><input type="checkbox" required disabled={busy}/> I agree to be contacted about this {event.kind==='community'?'community gathering':'event'}.</label>
        <div className="event-registration-total"><span>Total</span><strong>{event.price===0?'Free':price(event.price)}</strong></div>
        <button type="submit" className="primary event-register-submit" disabled={busy||!configLoaded}>{busy?'Please wait…':event.price===0?'Register for free':'Register & Pay'}<ArrowRight size={15}/></button>
        {configLoaded&&event.price>0&&!paymentsReady&&<p className="muted">Payment setup is pending. Your details can be saved, but paid registration cannot be confirmed yet.</p>}
      </form>
    </>}
    {error&&<p className="error" role="alert">{error}</p>}
  </dialog>;
}
