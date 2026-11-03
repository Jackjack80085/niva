import {api} from '../../utils/api';
import React, {useEffect, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {SERVICES} from '../../data/initialData';
import {Appointment} from '../../types';
import {ServicePicker} from './ServicePicker';
import {BookingCalendar} from './BookingCalendar';
import {ApprovedAppointment} from './ApprovedAppointment';
import {AppointmentStatusLookup} from './AppointmentStatusLookup';
import {AppointmentStatusCard} from './AppointmentStatusCard';
import {InternationalPhone} from './InternationalPhone';
import {parsePhoneNumberFromString, CountryCode, getCountryCallingCode} from 'libphonenumber-js';
import {ArrowLeft, Video, CheckCircle2, Clock3} from 'lucide-react';

export const BookingWorkspace = () => {
 const {setActiveView, bookingInitialPreselection, bookAppointment, isSlotAvailable, appointments, patientBookingId, clearPatientBooking, selectPatientBooking, refreshPatientBooking} = useApp();
 const [checkingStatus, setCheckingStatus] = useState(false);
 const [serviceId,setServiceId] = useState(bookingInitialPreselection?.serviceId || SERVICES[0].id);
 const service = SERVICES.find(s => s.id === serviceId) || SERVICES[0];
 const [date,setDate] = useState(''); const [time,setTime] = useState(''); const [error,setError] = useState('');
 const [result,setResult] = useState<Appointment|null>(() => appointments.find(a => a.id === patientBookingId) || null);
 const [submitting,setSubmitting] = useState(false);
 const [month,setMonth] = useState(() => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).format(new Date()).slice(0,7));
 const [availability,setAvailability] = useState<Record<string,string[]>>({});
 const [availabilityError,setAvailabilityError] = useState('');
 useEffect(()=>{let active=true;setAvailability({});setAvailabilityError('');api<{byDate:Record<string,string[]>}>(`/availability?month=${month}&serviceId=${service.id}`).then(data=>{if(active)setAvailability(data.byDate);}).catch(err=>{if(active)setAvailabilityError(err.message);});return()=>{active=false;};},[month,service.id]);
 const slots = availability[date] || [];

 useEffect(() => {
   if (!result) {const saved=appointments.find(entry=>entry.id===patientBookingId);if(saved)setResult(saved);return;}
   const match = appointments.find((entry) =>
     entry.referenceNo === result.referenceNo ||
     (entry.patientEmail === result.patientEmail && entry.date === result.date && entry.time === result.time)
   );
   if (match && JSON.stringify(match) !== JSON.stringify(result)) {
     setResult(match);
   }
 }, [appointments, result, patientBookingId]);

 const approved = result && ['confirmed', 'upcoming'].includes(result.status);
 const statusTitle = !result ? '' : ({pending:'Your request is received.', confirmed:'Your request is approved.', upcoming:'Your request is approved.', rejected:'Your request was declined.', cancelled:'Your appointment was cancelled.', completed:'Your consultation is complete.', blocked:'This time is unavailable.'}[result.status]);
 const startAnotherRequest = () => {
   setCheckingStatus(false); clearPatientBooking(); setResult(null); setDate(''); setTime(''); setError('');
 };

 return <div className="booking-page"><header><button onClick={()=>setActiveView('patient-home')}><ArrowLeft size={16}/> Back to website</button><span>DR. NIVA JACOB</span></header><main className="booking-grid"><aside><p className="eyebrow">CARE, WHERE YOU ARE</p><h1>A little time.<br/>A meaningful step.</h1><p>Online psychiatric care and therapy, from a space where you feel comfortable.</p><section className="practice-card consultation-guide" aria-labelledby="consultation-guide-title">
 <div className="consultation-guide-heading"><span className="consultation-guide-icon"><Video size={22} aria-hidden="true"/></span><div><p className="eyebrow">THE ONLINE EXPERIENCE</p><h3 id="consultation-guide-title">Care, without the commute.</h3></div></div>
 <p className="consultation-guide-intro">Thoughtful care, wherever you feel at ease.</p>
 <ol className="consultation-guide-steps">
  <li><span className="consultation-step-number" aria-hidden="true">01</span><div><h4>Find your time</h4><p>Share your details and choose a service and preferred slot.</p></div></li>
  <li><span className="consultation-step-number" aria-hidden="true">02</span><div><h4>A considered review</h4><p>Your request is reviewed before you’re invited to pay.</p></div></li>
  <li><span className="consultation-step-number" aria-hidden="true">03</span><div><h4>Pay to confirm</h4><p>Complete payment to confirm your appointment.</p></div></li>
 </ol>
 <div className="consultation-guide-timezone"><Clock3 size={15} aria-hidden="true"/><span>All appointment times are in <strong>IST</strong></span><span className="consultation-timezone-offset">UTC +5:30</span></div>
</section></aside><section className="practice-card">{checkingStatus ? <AppointmentStatusLookup onFound={appointment => {selectPatientBooking(appointment.id); setResult(appointment); setCheckingStatus(false);}} onBack={() => setCheckingStatus(false)}/> : result ? result.status === 'pending' ? <AppointmentStatusCard appointment={result} onCheck={() => refreshPatientBooking(result.id).then(setResult)} onBookAgain={startAnotherRequest} onReturn={() => setActiveView('patient-home')}/> : approved ? <ApprovedAppointment appointment={result} onReturn={() => setActiveView('patient-home')} onBookAgain={startAnotherRequest}/> : <div className="space-y-5" aria-live="polite"><CheckCircle2 size={40}/><p className="eyebrow">REQUEST STATUS</p><h2>{statusTitle}</h2><p>{result.patientName}, your requested consultation is {result.date} at {result.time} IST.</p><p>Reference: <strong>{result.referenceNo}</strong></p><p>{result.status === 'rejected' || result.status === 'cancelled' ? 'No payment is due. You can request another time.' : 'Contact the practice if you need help with this appointment.'}</p><button className="primary" onClick={()=>setActiveView('patient-home')}>Return to website</button><button type="button" onClick={startAnotherRequest}>Request another appointment</button></div> : <form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try {const country=String(f.get('phoneCountry')) as CountryCode;const raw=String(f.get('phoneNational'));const phone=parsePhoneNumberFromString(raw,country);if(!phone?.isPossible()||phone.countryCallingCode!==getCountryCallingCode(country)){setError('Enter a valid phone number for the selected country code.');return;}setSubmitting(true);const nextAppointment = await bookAppointment({patientName:String(f.get('name')).trim(),patientEmail:String(f.get('email')).trim().toLowerCase(),patientPhone:phone.number,patientType:'new-patient',serviceId:service.id,consultingFor:service.name,clinicId:'online',date,time,durationMin:service.durationMin,fee:service.fee,reason:String(f.get('reason'))});setResult(nextAppointment);}catch(err){setError((err as Error).message);setTime('');}finally{setSubmitting(false);}}} className="space-y-5"><p className="eyebrow">REQUEST AN APPOINTMENT</p><h2>Make space for yourself.</h2><div className="booking-section-title"><span>YOUR DETAILS</span><p>So we can get in touch about your appointment.</p></div><div className="form-grid"><label>Full name<input name="name" autoComplete="name" placeholder="Your full name" required maxLength={100}/></label><label>Email<input name="email" autoComplete="email" placeholder="you@example.com" type="email" required/></label><InternationalPhone/></div><ServicePicker services={SERVICES} value={serviceId} onChange={id=>{setServiceId(id);setTime('');}}/>{availabilityError&&<p className="error" role="alert">{availabilityError}</p>}<BookingCalendar value={date} onChange={next=>{setDate(next);setTime('');}} onMonthChange={setMonth} available={day=>!!availability[day]?.length}/>{date && <fieldset><legend>Choose your time <span className="field-hint">All times in IST</span></legend><div className="slot-grid">{slots.map(t=><button type="button" key={t} className={time===t?'selected':''} onClick={()=>setTime(t)}>{t}</button>)}</div>{!slots.length&&<p>No available times on this date. Please choose another day.</p>}</fieldset>}<label>Anything you would like us to know? <span className="field-hint">Optional</span><textarea name="reason" maxLength={1000} placeholder="A brief reason for your visit. You can discuss details during the session."/></label><label className="check-label booking-consent"><input type="checkbox" required/> I agree to be contacted about this online appointment.</label>{error&&<p role="alert" className="error">{error}</p>}<button className="primary booking-submit" disabled={submitting || !time || !slots.includes(time)}><span>{submitting ? 'Submitting…' : 'Request appointment'} <span aria-hidden="true">→</span></span><strong>{service.formattedFee}</strong></button><button type="button" className="booking-status-trigger" onClick={() => setCheckingStatus(true)}>Check appointment status</button></form>}{!checkingStatus && result && <button type="button" className="booking-status-trigger" onClick={() => setCheckingStatus(true)}>Check appointment status</button>}</section></main></div>;
};
