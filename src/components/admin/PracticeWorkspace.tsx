import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarDays, ClipboardCheck, LogOut, ArrowUpRight, Check, X, Clock3, CalendarHeart } from 'lucide-react';
import { EventsCommunity } from './EventsCommunity';
import { IntegrationStatus } from './IntegrationStatus';
import { WeeklyCalendarPreview } from './WeeklyCalendarPreview';

export const PracticeWorkspace = () => {
  const app = useApp();
  const [tab, setTab] = useState<'week' | 'approvals' | 'events'>('week');
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const pending = app.appointments.filter(appointment => appointment.status === 'pending');
  const requests = app.appointments.filter(appointment => (filter === 'all' || appointment.status === filter) && `${appointment.patientName} ${appointment.patientEmail} ${appointment.referenceNo}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const staffName = app.staffId === 'doctor' ? 'Dr. Niva Jacob' : app.associates.find(staff => staff.id === app.staffId)?.name || 'Associate';

  return <div className="practice-shell approvals-workspace">
    <aside className="practice-sidebar">
      <a href="#home" onClick={() => app.setActiveView('patient-home')} className="practice-brand">Niva<span>ONLINE PRACTICE</span></a>
      <nav aria-label="Practice dashboard">
        <button type="button" className={tab === 'week' ? 'active' : ''} aria-current={tab === 'week' ? 'page' : undefined} onClick={() => setTab('week')}><CalendarDays size={18}/> This week</button>
        {app.can('appointments') && <button type="button" className={tab === 'approvals' ? 'active' : ''} aria-current={tab === 'approvals' ? 'page' : undefined} onClick={() => setTab('approvals')}><ClipboardCheck size={18}/> Approvals {pending.length > 0 && <small>{pending.length}</small>}</button>}
        {app.can('appointments') && <button type="button" className={tab === 'events' ? 'active' : ''} aria-current={tab === 'events' ? 'page' : undefined} onClick={() => setTab('events')}><CalendarHeart size={18}/> Events & Community</button>}
      </nav>
      <div className="staff-badge"><strong>{staffName}</strong><span>Appointment workspace</span><button type="button" onClick={app.logoutAdmin}><LogOut size={15}/> Sign out</button></div>
    </aside>
    <div className="practice-main">
      <header><span>Online practice · IST</span><button type="button" onClick={() => app.setActiveView('patient-home')}>View website <ArrowUpRight size={15}/></button></header>
      <main>
        <div className="workspace-heading"><div><p className="eyebrow">A LITTLE SPACE TO STAY ORGANIZED</p><h1>{tab === 'week' ? 'Your week, in view.' : tab === 'events' ? 'Events & Community' : 'Appointment approvals'}</h1></div><span>{new Date().toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'})}</span></div>
        {tab === 'week' ? <>
          {app.can('appointments') && <button type="button" className="pending-requests-card" onClick={() => {setFilter('pending'); setTab('approvals');}}><span className="pending-requests-icon"><ClipboardCheck size={21} strokeWidth={1.5}/></span><span><strong>{pending.length} {pending.length === 1 ? 'request' : 'requests'} awaiting review</strong><small>Review appointment requests before payment.</small></span><ArrowUpRight size={18}/></button>}
          <WeeklyCalendarPreview/><IntegrationStatus/>
        </> : !app.can('appointments') ? <div className="practice-card">Appointment approval access is restricted.</div> : tab === 'events' ? <EventsCommunity/> : <>
          <div className="approval-session-note"><Clock3 size={15} aria-hidden="true"/><p>Requests are saved on the server. Approval queues an email; calendar reservation happens only after verified payment.</p></div>
          <div className="toolbar"><input aria-label="Search requests" placeholder="Search name, email or reference" value={search} onChange={event => setSearch(event.target.value)}/><select aria-label="Filter requests by status" value={filter} onChange={event => setFilter(event.target.value)}><option value="pending">Awaiting review</option><option value="confirmed">Approved</option><option value="rejected">Declined</option><option value="all">All requests</option></select></div>
          <div className="appointment-list">{requests.map(appointment => <article className="practice-card approval-request" key={appointment.id}>
            <div className="appointment-top"><div><span className={`status-pill ${appointment.status}`}>{appointment.status === 'confirmed' ? appointment.paymentStatus==='paid' ? appointment.calendarStatus==='synced'?'Paid · calendar confirmed':'Paid · calendar pending' : 'Approved · awaiting payment' : appointment.status === 'rejected' ? 'Declined' : appointment.status === 'pending' ? 'Awaiting review' : appointment.status}</span><h2>{appointment.patientName}</h2><p>{appointment.consultingFor || appointment.serviceId} · {appointment.durationMin} min · Online</p><p className="muted">{appointment.patientEmail} · {appointment.patientPhone}</p></div><div><strong>{new Date(`${appointment.date}T12:00:00+05:30`).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'})}</strong><p>{appointment.time} IST</p><small>{appointment.referenceNo}</small></div></div>
            {appointment.reason && <p className="approval-request-reason">{appointment.reason}</p>}
            {appointment.status === 'pending' && <div className="quick-actions"><button type="button" className="primary" onClick={() => app.updateAppointmentStatus(appointment.id, 'confirmed')}><Check size={15}/> Approve request</button><button type="button" onClick={() => app.updateAppointmentStatus(appointment.id, 'rejected')}><X size={15}/> Decline</button></div>}
            {appointment.status === 'confirmed' && <p className="muted">{appointment.paymentStatus==='paid' ? appointment.calendarStatus==='synced'?'Payment verified and Google Calendar synchronized.':appointment.calendarStatus==='conflict'?'Payment verified, but Google Calendar has a conflict. Review this booking before confirming.':'Payment verified. Calendar synchronization is queued.' : 'Approved. Payment is the next step; calendar reservation follows successful payment.'}</p>}
          </article>)}{requests.length === 0 && <div className="practice-card approvals-empty"><ClipboardCheck size={28} strokeWidth={1.2}/><h2>{filter === 'pending' && !search ? 'All caught up.' : 'No matching requests.'}</h2><p className="muted">{filter === 'pending' && !search ? 'New requests will appear here for your review.' : 'Try another filter or search.'}</p></div>}</div>
        </>}
      </main>
    </div>
  </div>;
};
