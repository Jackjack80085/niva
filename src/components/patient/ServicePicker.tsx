import React, {useEffect, useRef, useState} from 'react';
import {Check, ChevronDown, Search, Clock, Video} from 'lucide-react';
import {Service, ServiceType} from '../../types';

export function ServicePicker({services, value, onChange}: {services: Service[]; value: ServiceType; onChange: (id: ServiceType) => void}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = services.find(service => service.id === value) || services[0];
  const filtered = services.filter(service => `${service.name} ${service.tagline}`.toLowerCase().includes(query.toLowerCase()));
  const close = () => {setOpen(false); trigger.current?.focus();};
  const choose = (id: ServiceType) => {onChange(id); close();};
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => {if (!root.current?.contains(event.target as Node)) setOpen(false);};
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => {if (open) root.current?.querySelector(`[data-service-index="${active}"]`)?.scrollIntoView({block:'nearest'});}, [active, open]);
  return <div className="service-picker" ref={root} onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);}}>
    <span className="service-field-label" id="consultation-label">Consultation</span>
    <button ref={trigger} type="button" className={`service-trigger ${open ? 'is-open' : ''}`} aria-haspopup="listbox" aria-expanded={open} aria-controls="consultation-options" aria-labelledby="consultation-label selected-service" onClick={() => {setQuery(''); setActive(Math.max(0, services.findIndex(service => service.id === value)));setOpen(!open);}} onKeyDown={event => {if (['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();setQuery('');setActive(0);setOpen(true);}}}>
      <span className="service-icon"><Video size={19}/></span>
      <span className="service-selected"><strong id="selected-service">{selected.name}</strong><span><Clock size={12}/>{selected.durationMin} minutes <i/>Online consultation</span></span>
      <span className="service-trigger-fee">{selected.formattedFee}</span><ChevronDown size={18} className="service-chevron"/>
    </button>
    {open && <div className="service-menu">
      <div className="service-search"><Search size={16}/><input ref={search} aria-label="Search consultations" placeholder="Find the right consultation…" value={query} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="consultation-options" aria-activedescendant={filtered[active] ? `service-option-${filtered[active].id}` : undefined} onChange={event => {setQuery(event.target.value);setActive(0);}} onKeyDown={event => {
        if (event.key === 'Escape'){event.preventDefault();close();}
        if (event.key === 'ArrowDown'){event.preventDefault();setActive(index => Math.min(index + 1, filtered.length - 1));}
        if (event.key === 'ArrowUp'){event.preventDefault();setActive(index => Math.max(index - 1, 0));}
        if (event.key === 'Enter'){event.preventDefault();if(filtered[active]) choose(filtered[active].id);}
      }}/></div>
      <div className="service-menu-caption"><span>CHOOSE YOUR CARE</span><span>{filtered.length} options</span></div>
      <div id="consultation-options" role="listbox" aria-label="Consultations" className="service-options">
        {filtered.map((service,index) => <div key={service.id} id={`service-option-${service.id}`} role="option" aria-selected={value===service.id} data-service-index={index} className={`service-option ${value===service.id?'is-selected':''} ${active===index?'is-active':''}`} onPointerMove={()=>setActive(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(service.id)}>
          <span className="service-check">{value===service.id && <Check size={14}/>}</span><span className="service-option-copy"><strong>{service.name}</strong><span>{service.durationMin} minutes · Online</span></span><span className="service-option-fee">{service.formattedFee}</span>
        </div>)}
        {!filtered.length && <div className="service-empty">No matching consultations.<br/><span>Try a concern such as anxiety or relationships.</span></div>}
      </div><div className="service-menu-footer">All sessions are online with Dr. Niva Jacob</div>
    </div>}
  </div>;
}
