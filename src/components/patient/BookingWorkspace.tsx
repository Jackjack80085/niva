import React, {useEffect, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {SERVICES} from '../../data/initialData';
import {Appointment} from '../../types';
import {ServicePicker} from './ServicePicker';
import {BookingCalendar} from './BookingCalendar';
import {InternationalPhone} from './InternationalPhone';
import {parsePhoneNumberFromString, CountryCode, getCountryCallingCode} from 'libphonenumber-js';
import {ArrowLeft, Video, CheckCircle2, Check} from 'lucide-react';

const readLatestAppointment = (): Appointment | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('niva_latest_appointment');
    return raw ? JSON.parse(raw) as Appointment : null;
  } catch {
    return null;
  }
};

export const BookingWorkspace = () => {
 const {setActiveView, bookingInitialPreselection, bookAppointment, isSlotAvailable, appointments} = useApp();
 const [serviceId,setServiceId] = useState(bookingInitialPreselection?.serviceId || SERVICES[0].id);
 const service = SERVICES.find(s => s.id === serviceId) || SERVICES[0];
 const selectedServiceLabel = service?.name || 'Consultation';
 const [date,setDate] = useState(''); const [time,setTime] = useState(''); const [error,setError] = useState('');
 const [paymentError, setPaymentError] = useState('');
 const [result,setResult] = useState<Appointment|null>(() => readLatestAppointment());
 const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const slots = Array.from({length:48},(_,i)=>`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`).filter(t=> date && isSlotAvailable(date,t,'online',service.durationMin));

 useEffect(() => {
   if (typeof window === 'undefined') return;
   if (result) {
     window.localStorage.setItem('niva_latest_appointment', JSON.stringify(result));
   }
 }, [result]);

 useEffect(() => {
   if (!result) return;
   const match = appointments.find((entry) =>
     entry.referenceNo === result.referenceNo ||
     (entry.patientEmail === result.patientEmail && entry.date === result.date && entry.time === result.time)
   );
   if (match && JSON.stringify(match) !== JSON.stringify(result)) {
     setResult(match);
   }
 }, [appointments, result]);

 const handleRazorpayCheckout = () => {
   if (!result) return;
   if (!['confirmed', 'upcoming'].includes(result.status)) {
     setPaymentError('Payment opens only after the doctor has qualified the client and approved the request.');
     return;
   }

   const RazorpayCtor = (window as any).Razorpay;
   if (!RazorpayCtor) {
     setPaymentError('Razorpay checkout is not connected yet. Add your Razorpay key and checkout script before enabling live payments.');
     return;
   }

   const rzp = new RazorpayCtor({
     key: 'rzp_test_123456789',
     amount: Number(result.fee || 0) * 100,
     currency: 'INR',
     name: 'Dr. Niva Jacob',
     description: result.consultingFor || result.serviceId,
     handler: function () {
       const nextResult = { ...result, paymentStatus: 'paid' as const };
       setResult(nextResult);
       if (typeof window !== 'undefined') {
         window.localStorage.setItem('niva_latest_appointment', JSON.stringify(nextResult));
       }
     },
     theme: { color: '#332b27' },
   });
   rzp.open();
   setPaymentError('');
 };

 return <div className="booking-page"><header><button onClick={()=>setActiveView('patient-home')}><ArrowLeft size={16}/> Back to website</button><span>DR. NIVA JACOB</span></header><main className="booking-grid"><aside><p className="eyebrow">CARE, WHERE YOU ARE</p><h1>A little time.<br/>A meaningful step.</h1><p>Online psychiatric care and therapy, from a space where you feel comfortable.</p><div className="practice-card"><Video/><h3>Every consultation is online</h3><p>Choose a service and preferred time. Your appointment is confirmed after the doctor reviews your request.</p><p>All times are in India Standard Time (IST).</p></div><p className="muted">Local preview · Requests are saved in this browser. Email and video delivery are not connected.</p></aside><section className="practice-card">{result ? <div className="space-y-5"><CheckCircle2 size={40}/><p className="eyebrow">{result.status === 'pending' ? 'AWAITING DOCTOR APPROVAL' : 'BOOKING STATUS'}</p><h2>{result.status === 'pending' ? 'Your request is received.' : 'Your appointment is active.'}</h2><p>{result.patientName}, your preferred consultation is {result.date} at {result.time} IST.</p><p>Reference: <strong>{result.referenceNo}</strong></p>{result.status === 'pending' ? <p>Doctor screening is in progress. Payment stays locked until the doctor qualifies the request and approves it.</p> : <p>Your consultation has been approved by the doctor and is ready for payment.</p>}<p>{result.paymentStatus === 'paid' ? 'Payment completed.' : 'No payment has been captured yet.'}</p>{result.status !== 'pending' && result.paymentStatus !== 'paid' && <button type="button" className="primary" onClick={handleRazorpayCheckout}>Pay now</button>}{result.status !== 'pending' && result.paymentStatus === 'paid' && <button type="button" className="primary" onClick={()=>setActiveView('patient-home')}>Return to website</button>}{result.status === 'pending' && <button className="primary" onClick={()=>setActiveView('patient-home')}>Return to website</button>}{paymentError && <p role="alert" className="error">{paymentError}</p>}</div> : <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);try {const country=String(f.get('phoneCountry')) as CountryCode;const raw=String(f.get('phoneNational'));const phone=parsePhoneNumberFromString(raw,country);if(!phone?.isPossible()||phone.countryCallingCode!==getCountryCallingCode(country)){setError('Enter a valid phone number for the selected country code.');return;}const nextAppointment = bookAppointment({patientName:String(f.get('name')).trim(),patientEmail:String(f.get('email')).trim().toLowerCase(),patientPhone:phone.number,patientType:'new-patient',serviceId:service.id,consultingFor:service.name,clinicId:'online',date,time,durationMin:service.durationMin,fee:service.fee,reason:String(f.get('reason'))});setResult(nextAppointment);setPaymentError('');}catch(err){setError((err as Error).message);setTime('');}}} className="space-y-5"><p className="eyebrow">REQUEST AN APPOINTMENT</p><h2>Make space for yourself.</h2><div className="selected-service-banner"><div><strong>Selected care</strong><span>{selectedServiceLabel}</span></div><div className="selection-badge"><Check size={12}/> {service.durationMin} mins</div></div><ServicePicker services={SERVICES} value={serviceId} onChange={id=>{setServiceId(id);setTime('');}}/><p className="muted">{service.description}</p><BookingCalendar value={date} onChange={next=>{setDate(next);setTime('');}} available={day=>Array.from({length:48},(_,i)=>`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`).some(t=>isSlotAvailable(day,t,'online',service.durationMin))}/>{date && <fieldset><legend>Choose your time <span className="field-hint">All times in IST</span></legend><div className="slot-grid">{slots.map(t=><button type="button" key={t} className={time===t?'selected':''} onClick={()=>setTime(t)}>{t}</button>)}</div>{!slots.length&&<p>No available times on this date. Please choose another day.</p>}</fieldset>}<div className="booking-section-title"><span>YOUR DETAILS</span><p>So we can get in touch about your appointment.</p></div><div className="form-grid"><label>Full name<input name="name" autoComplete="name" placeholder="Your full name" required maxLength={100}/></label><label>Email<input name="email" autoComplete="email" placeholder="you@example.com" type="email" required/></label><InternationalPhone/></div><label>Anything you would like us to know? <span className="field-hint">Optional</span><textarea name="reason" maxLength={1000} placeholder="A brief reason for your visit. You can discuss details during the session."/></label><label className="check-label booking-consent"><input type="checkbox" required/> I agree to be contacted about this online appointment.</label>{error&&<p role="alert" className="error">{error}</p>}<button className="primary booking-submit" disabled={!time || !slots.includes(time)}><span>Request appointment <span aria-hidden="true">→</span></span><strong>{service.formattedFee}</strong></button><p className="muted">No payment now · Your request will be reviewed by the doctor.</p></form>}</section></main></div>;
};
