import { useState } from 'react';
import { Search, Calendar, Clock3 } from 'lucide-react';
import { Appointment } from '../../types';

export function AppointmentStatusCard({appointment, onCheck, onBookAgain, onReturn}: {
  appointment: Appointment; onCheck: () => Promise<unknown>; onBookAgain: () => void; onReturn: () => void;
}) {
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [checked, setChecked] = useState(false);
  return (
    <section className="appointment-status-card" aria-labelledby="appointment-status-title">
      <div className="appointment-status-heading"><span><Search size={19} aria-hidden="true"/></span><div><p className="eyebrow">REQUEST RECEIVED</p><h2 id="appointment-status-title">Appointment status</h2></div></div>
      <p className="muted">Reference {appointment.referenceNo} · {appointment.date} at {appointment.time} IST</p>
      <div className="appointment-status-details">
        <label>Full name<input value={appointment.patientName} readOnly autoComplete="off"/></label>
        <label>Email<input value={appointment.patientEmail} readOnly autoComplete="off"/></label>
        <label>Phone number<input value={appointment.patientPhone} readOnly autoComplete="off"/></label>
      </div>
      <div className="appointment-status-pending" role="status"><Clock3 size={19} aria-hidden="true"/><div><strong>Awaiting admin approval</strong><p>{checked ? 'Your request is under review. No payment is due until approval.' : 'Your request has been submitted for review. No payment is due now.'}</p></div></div>
      {error&&<p className="error" role="alert">{error}</p>}<div className="appointment-status-actions"><button type="button" className="primary" disabled={busy} onClick={async () => {setBusy(true);setError('');try{await onCheck();setChecked(true);}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}><Search size={15} aria-hidden="true"/> Check status</button><button type="button" onClick={onBookAgain}><Calendar size={15} aria-hidden="true"/> Book again</button></div>
      <button type="button" className="appointment-status-return" onClick={onReturn}>Return to website</button>
    </section>
  );
}
