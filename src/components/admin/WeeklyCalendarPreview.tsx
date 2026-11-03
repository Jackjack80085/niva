import {api} from '../../utils/api';
import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

const istDate = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const mondayOf = (date: string) => addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
const label = (date: string, options: Intl.DateTimeFormatOptions) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', {...options, timeZone: 'UTC'});

export function WeeklyCalendarPreview() {
  const [today, setToday] = useState(istDate);
  // null follows the current week; a selected week remains fixed during navigation.
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const week = selectedWeek || mondayOf(today);
  type CalendarEvent={id:string;summary?:string;start:{dateTime?:string;date?:string};end:{dateTime?:string;date?:string};htmlLink?:string};
  const [calendar,setCalendar]=useState<{connected:boolean;events:CalendarEvent[];updatedAt?:string}|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;setCalendar(null);setError('');const refresh=()=>api<{connected:boolean;events:CalendarEvent[];updatedAt?:string}>(`/admin/calendar?start=${week}`).then(data=>{if(active){setCalendar(data);setError('');}}).catch(err=>{if(active){setCalendar(null);setError(err.message);}});void refresh();const timer=window.setInterval(refresh,60_000);const visible=()=>{if(!document.hidden)void refresh();};document.addEventListener('visibilitychange',visible);return()=>{active=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[week]);
  const eventDay=(dateTime:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(dateTime));
  const eventsForDay=(day:string)=>(calendar?.events||[]).filter(event=>event.start.date ? event.start.date<=day&&(event.end.date||event.start.date)>day : event.start.dateTime&&eventDay(event.start.dateTime)===day);
  const days = Array.from({length: 7}, (_, index) => addDays(week, index));
  useEffect(() => {
    const timer = window.setInterval(() => setToday(istDate()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="weekly-calendar" aria-labelledby="weekly-calendar-title">
    <div className="weekly-calendar-top">
      <div><p className="eyebrow">YOUR WEEK AT A GLANCE</p><h2 id="weekly-calendar-title">Weekly appointments</h2><p className="muted">Booked sessions from Google Calendar · India Standard Time</p></div>
      <span className="calendar-connection-badge"><span/> {calendar?.connected?'Connected':error?'Unavailable':calendar?'Not connected':'Loading…'}</span>
    </div>
    <div className="weekly-calendar-toolbar">
      <div className="weekly-calendar-navigation"><button type="button" aria-label="Previous week" onClick={() => setSelectedWeek(addDays(week, -7))}><ChevronLeft size={17}/></button><button type="button" onClick={() => {setToday(istDate()); setSelectedWeek(null);}}>This week</button><button type="button" aria-label="Next week" onClick={() => setSelectedWeek(addDays(week, 7))}><ChevronRight size={17}/></button></div>
      <p aria-live="polite">{label(week, {day: 'numeric', month: 'short', year: 'numeric'})} – {label(days[6], {day: 'numeric', month: 'short', year: 'numeric'})}</p>
    </div>
    <div className="weekly-days" aria-label="Weekly calendar preview">
      {days.map(day => <div key={day} className={`weekly-day ${day === today ? 'is-today' : ''}`} aria-current={day === today ? 'date' : undefined}><span>{label(day, {weekday: 'short'})}</span><strong>{label(day, {day: 'numeric'})}</strong>{day === today && <small>Today</small>}<div className="weekly-day-placeholder">{calendar?.connected ? <small>{eventsForDay(day).length} {eventsForDay(day).length===1?'event':'events'}</small> : <><span/><span/></>}</div></div>)}
    </div>
    {error ? <p className="error" role="alert">{error}</p> : calendar?.connected ? <div className="calendar-event-list">{calendar.events.length===0 ? <p className="muted">No events in Google Calendar for this week.</p> : days.filter(day=>eventsForDay(day).length).map(day=><div key={day}><h3>{label(day,{weekday:'long',day:'numeric',month:'short'})}</h3>{eventsForDay(day).map(event=><article key={event.id}><time>{event.start.dateTime?new Date(event.start.dateTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}):'All day'}</time><strong>{event.summary||'Private event'}</strong>{event.htmlLink?.startsWith('https://')&&<a href={event.htmlLink} target="_blank" rel="noopener noreferrer">View <ArrowUpRight size={12}/></a>}</article>)}</div>)}</div> : <div className="calendar-awaiting-connection"><span className="calendar-awaiting-icon"><CalendarDays size={25} strokeWidth={1.3} aria-hidden="true"/></span><h3>Your calendar will live here.</h3><p>Once Google Calendar is connected, this view will show the selected week’s booked appointments and update as your calendar changes.</p><span className="calendar-setup-later">{calendar?'Calendar credentials pending':'Loading calendar status…'}</span></div>}
    <div className="weekly-calendar-footer"><span>{calendar?.connected ? `Auto-refreshes every minute · Last updated ${new Date(calendar.updatedAt!).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'})} IST` : 'No calendar events have been loaded.'}</span><a href="https://calendar.google.com/" target="_blank" rel="noopener noreferrer">Open Google Calendar <ArrowUpRight size={14} aria-hidden="true"/></a></div>
  </section>;
}
