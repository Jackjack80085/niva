import { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { Appointment } from '../../types';
import { InternationalPhone } from './InternationalPhone';
import { api, savedAccess, loadBooking, rememberAccess } from '../../utils/api';

export function AppointmentStatusLookup({onFound, onBack}: {onFound: (appointment: Appointment) => void; onBack: () => void}) {
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState('');
  const [busy, setBusy] = useState(false);
  return <div>
    <p className="eyebrow">CHECK YOUR REQUEST</p><h2>Appointment status</h2>
    <p className="muted">{challenge ? 'If the details match, a verification code has been emailed. Enter it below.' : 'Enter the details used for your booking request.'}</p>
    <form className="space-y-5 appointment-status-lookup" onSubmit={async event => {
      event.preventDefault();const data=new FormData(event.currentTarget);setBusy(true);setError('');
      try {
        if(challenge){
          const response=await api<{results:{appointment:Appointment;accessToken:string}[]}>('/lookup/verify',{method:'POST',body:JSON.stringify({challengeId:challenge,code:String(data.get('code'))})});
          for(const result of response.results)rememberAccess(result.appointment.id,result.accessToken);
          const latest=response.results.sort((a,b)=>b.appointment.createdAt.localeCompare(a.appointment.createdAt))[0];
          if(latest)onFound(latest.appointment);else setError('No matching request was found.');
        } else {
          const phone=parsePhoneNumberFromString(String(data.get('phoneNational')),String(data.get('phoneCountry')) as CountryCode);
          if(!phone?.isPossible())throw new Error('Enter a valid phone number.');
          const name=String(data.get('name')).trim(),email=String(data.get('email')).trim().toLowerCase();
          const existing=await Promise.all(Object.keys(savedAccess()).map(id=>loadBooking(id).catch(()=>null)));
          const matching=existing.filter((a):a is Appointment=>!!a&&a.patientName.toLowerCase()===name.toLowerCase()&&a.patientEmail===email&&a.patientPhone===phone.number).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
          if(matching[0]){onFound(matching[0]);return;}
          const response=await api<{challengeId:string}>('/lookup/start',{method:'POST',body:JSON.stringify({name,email,phone:phone.number})});setChallenge(response.challengeId);
        }
      }catch(err){setError((err as Error).message);}finally{setBusy(false);}
    }}>
      {challenge ? <label>Email verification code<input name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="Six-digit code"/></label> : <><label>Full name<input name="name" autoComplete="name" required maxLength={100} placeholder="Your full name"/></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label><InternationalPhone/></>}
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary" disabled={busy}><Search size={15} aria-hidden="true"/> {busy?'Checking…':challenge?'Verify code':'Check status'}</button>
      {challenge&&<button type="button" onClick={()=>{setChallenge('');setError('');}}>Use different details</button>}
    </form>
    <button type="button" className="appointment-status-return" onClick={onBack}><ArrowLeft size={14} aria-hidden="true"/> Back to booking</button>
  </div>;
}
