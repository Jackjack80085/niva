import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Calendar, 
  Sliders, 
  X, 
  CalendarDays, 
  ShieldAlert,
  User
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    appointments,
    openSideSheet,
    setAdminTab,
    setActiveView,
    toggleBlockSlot
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Filter patients
  const filteredAppointments = appointments.filter((a) =>
    a.patientName.toLowerCase().includes(query.toLowerCase()) ||
    a.patientEmail.toLowerCase().includes(query.toLowerCase()) ||
    a.referenceNo.toLowerCase().includes(query.toLowerCase())
  );

  const handleAction = (action: () => void) => {
    action();
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-20 sm:pt-28 px-4 font-sans-clean">
      {/* Backdrop */}
      <div
        onClick={() => setIsCommandPaletteOpen(false)}
        className="fixed inset-0 bg-[#332B27]/40 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#332B27]/15 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-[#332B27]/10 gap-3">
          <Search className="w-4 h-4 text-[#332B27]/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search patients, actions, or jump to view... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none text-[#332B27] placeholder:text-[#332B27]/40 font-sans-clean"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1.5 text-[#332B27]/40 hover:text-[#332B27] hover:bg-[#FAF7F0] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Lists */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs font-sans-clean">
          
          {/* Quick Actions */}
          <div>
            <p className="px-3 py-1 text-[10px] font-bold tracking-wider text-[#B89552] uppercase">
              Quick Actions
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => handleAction(() => {
                  setActiveView('patient-booking');
                })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#332B27] hover:bg-[#FAF7F0] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#B89552]" />
                  <span className="font-medium">Create new appointment</span>
                </div>
                <span className="text-[10px] text-[#332B27]/60 font-mono-tabular px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#332B27]/10 font-semibold">N</span>
              </button>

              <button
                onClick={() => handleAction(() => {
                  toggleBlockSlot('2026-10-02', '11:00', 'hsr', 'Clinical case prep');
                })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#332B27] hover:bg-[#FAF7F0] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#B89552]" />
                  <span className="font-medium">Toggle block 11:00 AM slot</span>
                </div>
                <span className="text-[10px] text-[#332B27]/60 font-mono-tabular px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#332B27]/10 font-semibold">B</span>
              </button>

              <button
                onClick={() => handleAction(() => {
                  setActiveView('admin');
                  setAdminTab('schedule');
                })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#332B27] hover:bg-[#FAF7F0] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-[#332B27]/60" />
                  <span className="font-medium">Open today's schedule</span>
                </div>
                <span className="text-[10px] text-[#332B27]/60 font-mono-tabular px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#332B27]/10 font-semibold">S</span>
              </button>

              <button
                onClick={() => handleAction(() => {
                  setActiveView('admin');
                  setAdminTab('availability');
                })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#332B27] hover:bg-[#FAF7F0] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-[#332B27]/60" />
                  <span className="font-medium">Change clinical availability</span>
                </div>
                <span className="text-[10px] text-[#332B27]/60 font-mono-tabular px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#332B27]/10 font-semibold">A</span>
              </button>
            </div>
          </div>

          {/* Patients */}
          <div>
            <p className="px-3 py-1 text-[10px] font-bold tracking-wider text-[#B89552] uppercase">
              {query ? 'Matching Patients' : 'Recent Patients'}
            </p>
            <div className="space-y-0.5">
              {filteredAppointments.slice(0, 6).map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => handleAction(() => openSideSheet(apt))}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#332B27] hover:bg-[#FAF7F0] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#B89552]" />
                    <div>
                      <p className="font-semibold text-[#332B27]">{apt.patientName}</p>
                      <p className="text-[11px] text-[#332B27]/60 font-mono-tabular">{apt.time} · {apt.referenceNo}</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F1E3A6] text-[#332B27] capitalize font-medium">
                    {apt.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-3 bg-[#FAF7F0] border-t border-[#332B27]/10 flex items-center justify-between text-[11px] text-[#332B27]/50 font-sans-clean">
          <span>Navigate with arrows, press Enter to select</span>
          <span className="font-mono-tabular">ESC to exit</span>
        </div>

      </div>
    </div>
  );
};
