import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarHeart } from 'lucide-react';
import { api } from '../../utils/api';
import type { PracticeEvent } from '../../types';

export function EventsCommunity() {
  const [saved,setSaved]=useState<PracticeEvent|null>(null);
  const [draft,setDraft]=useState<PracticeEvent|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  useEffect(()=>{let active=true;api<{event:PracticeEvent}>('/admin/event').then(data=>{if(active){setSaved(data.event);setDraft(data.event);}}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[]);
  const update=(changes:Partial<PracticeEvent>)=>{setDraft(prev=>prev?{...prev,...changes}:prev);setMessage('');};
  const dirty=!!(saved&&draft&&(['heading','description','details','price','kind'] as const).some(key=>saved[key]!==draft[key]));
  if(!draft||!saved)return <div className="practice-card">{error?<p className="error" role="alert">{error}</p>:<p className="muted">Loading event settings…</p>}</div>;
  const toggle=async()=>{setBusy(true);setError('');setMessage('');try{const data=await api<{event:PracticeEvent}>('/admin/event/visibility',{method:'PATCH',body:JSON.stringify({enabled:!saved.enabled})});setSaved(data.event);setDraft(prev=>prev?{...prev,enabled:data.event.enabled}:prev);setMessage(data.event.enabled?'Visible on the website.':'Hidden from the website. Your saved content is kept.');}catch(err){setError((err as Error).message);}finally{setBusy(false);}};
  return <div className="events-editor">
    <div className="practice-card event-visibility"><span className="event-visibility-icon"><CalendarHeart size={23} strokeWidth={1.4}/></span><div><h2>Make room for something shared.</h2><p className="muted">Switch this section on when you’re hosting an event or community gathering.</p></div><div className="event-toggle-wrap"><span>{saved.enabled?'Visible on website':dirty?'Save details before turning on':'Hidden from website'}</span><button type="button" role="switch" aria-label="Show events and community section on website" aria-checked={saved.enabled} className="event-toggle" disabled={busy||(!saved.enabled&&dirty)} onClick={()=>void toggle()}><span/></button></div></div>
    <div className="event-editor-grid"><form className="practice-card event-editor-form" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');setMessage('');try{const data=await api<{event:PracticeEvent}>('/admin/event',{method:'PUT',body:JSON.stringify(draft)});setSaved(data.event);setDraft(data.event);setMessage(data.event.enabled?'Changes saved and visible on the website.':'Draft saved. Turn on visibility when you’re ready.');}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}>
      <p className="eyebrow">THE DETAILS</p><h2>Create your gathering</h2>
      <label>Type<select value={draft.kind} disabled={busy} onChange={e=>update({kind:e.target.value as PracticeEvent['kind']})}><option value="event">Event</option><option value="community">Community</option></select></label>
      <label>Heading<input value={draft.heading} disabled={busy} maxLength={120} placeholder="Give your gathering a name" onChange={e=>update({heading:e.target.value})}/></label>
      <label>Description<textarea value={draft.description} disabled={busy} maxLength={3000} rows={5} placeholder="What is it about, and who is it for?" onChange={e=>update({description:e.target.value})}/></label>
      <label>Event details<textarea value={draft.details} disabled={busy} maxLength={3000} rows={5} placeholder={'Date & time (with time zone)\nOnline or venue details\nWhat to expect and how to join'} onChange={e=>update({details:e.target.value})}/></label>
      <label>Price · INR<input type="number" min="0" max="1000000" step="0.01" required disabled={busy} value={draft.price} onChange={e=>update({price:e.target.value===''?0:Number(e.target.value)})}/><small>Use 0 for a free event. Visitors can register and pay this amount when payment credentials are configured.</small></label>
      {error&&<p role="alert" className="error">{error}</p>}{message&&<p role="status" className="event-save-message">{message}</p>}
      <div className="event-save-row"><button type="submit" className="primary" disabled={busy}>{busy?'Saving…':'Save details'}</button><span>{dirty?'Unsaved changes':saved.updatedAt?'All changes saved':'Start with a draft'}</span></div>
    </form>
    <aside className="event-preview-panel"><div className="event-preview-label"><span>WEBSITE PREVIEW</span><span>{dirty?'Unsaved preview':saved.enabled?'Live':'Draft'}</span></div><article className="event-feature-preview"><p className="eyebrow">{draft.kind==='community'?'A SPACE TO CONNECT':'AN INVITATION TO GATHER'}</p><h3>{draft.heading||'Your next gathering starts here.'}</h3><p className="event-description">{draft.description||'Your description will appear here.'}</p><div className="event-feature-details">{draft.details||'Add a date, time, location and details on how to join.'}</div><div className="event-feature-price"><span>{draft.kind==='community'?'Community gathering':'Event'} · INR</span><strong>{draft.price===0?'Free':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(draft.price)}</strong></div><button type="button" className="event-preview-cta" disabled>{draft.price===0?'Register for free':'Register & Pay'}</button></article><p className="muted">When switched off, this section is hidden from the website and your details remain saved.</p><a href="/#events-community" target="_blank" rel="noopener noreferrer">View website <ArrowUpRight size={13}/></a></aside></div>
  </div>;
}
