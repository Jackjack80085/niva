import {EventRegistrationDialog} from './EventRegistrationDialog';
import {ArrowRight} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import type { PracticeEvent } from '../../types';
export function EventsCommunitySection() {
  const [registering,setRegistering]=useState(false);
  const [event,setEvent]=useState<PracticeEvent|null>(null);
  useEffect(()=>{let active=true;const refresh=()=>api<{event:PracticeEvent|null}>('/events').then(data=>{if(active&&!registering)setEvent(data.event);}).catch(()=>{if(active)setEvent(null);});void refresh();const timer=window.setInterval(refresh,60_000);const visible=()=>{if(!document.hidden)void refresh();};document.addEventListener('visibilitychange',visible);return()=>{active=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[registering]);
  if(!event)return null;
  return <section id="events-community" className="public-events-section"><div className="public-events-inner"><div><p className="eyebrow">{event.kind==='community'?'A SPACE TO CONNECT':'AN INVITATION TO GATHER'}</p><h2>{event.heading}</h2><p className="event-description">{event.description}</p></div><div className="public-event-details"><p className="eyebrow">THE DETAILS</p><div className="event-feature-details">{event.details}</div><div className="event-feature-price"><span>{event.kind==='community'?'Community gathering':'Event'} · INR</span><strong>{event.price===0?'Free':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(event.price)}</strong></div><button type="button" className="event-register-cta" onClick={()=>setRegistering(true)}>{event.price===0?'Register for free':'Register & Pay'}<ArrowRight size={16} aria-hidden="true"/></button></div></div>{registering&&<EventRegistrationDialog event={event} onClose={()=>setRegistering(false)}/>}</section>;
}
