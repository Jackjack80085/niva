import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1zc_SN2z1fEhc_CE9cuD3KDHMYIWV1yvYd0DUrloUNbpE__Ogz9VQpG2sLZgd7_3Z33C276tr7';

export function GoogleCalendarBooking() {
  const { setActiveView } = useApp();

  return (
    <div className="booking-page">
      <header>
        <button onClick={() => setActiveView('patient-home')}><ArrowLeft size={16} /> Back to website</button>
        <span>DR. NIVA JACOB</span>
      </header>
      <main className="google-booking-main">
        <div className="google-booking-heading">
          <div>
            <p className="eyebrow">BOOK AN APPOINTMENT</p>
            <h1>Make space for yourself.</h1>
            <p>Choose an available time and complete your booking with Google Calendar. Check the time zone shown in the calendar.</p>
          </div>
          <a className="google-booking-link" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            Open in Google Calendar <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
        <iframe
          className="google-booking-frame"
          src={`${BOOKING_URL}?gv=true`}
          title="Book an appointment with Dr. Niva Jacob using Google Calendar"
        />
        <p className="muted">If the calendar does not load, use “Open in Google Calendar” above to book in a new tab.</p>
      </main>
    </div>
  );
}
