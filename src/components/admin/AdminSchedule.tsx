import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SERVICES } from '../../data/initialData';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Lock, 
  Calendar as CalendarIcon
} from 'lucide-react';

export const AdminSchedule: React.FC = () => {
  const { 
    appointments, 
    blockedSlots, 
    openSideSheet, 
    openBooking, 
    toggleBlockSlot, 
    currentDate 
  } = useApp();

  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>('2026-10-02');

  // Days in week: Sep 28 - Oct 4, 2026 (matching Oct 2 today)
  const weekDays = [
    { name: 'Mon', num: '28', dateStr: '2026-09-28' },
    { name: 'Tue', num: '29', dateStr: '2026-09-29' },
    { name: 'Wed', num: '30', dateStr: '2026-09-30' },
    { name: 'Thu', num: '01', dateStr: '2026-10-01' },
    { name: 'Fri (Today)', num: '02', dateStr: '2026-10-02', isToday: true },
    { name: 'Sat', num: '03', dateStr: '2026-10-04' },
    { name: 'Sun', num: '04', dateStr: '2026-10-05' },
  ];

  const timeRows = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  return (
    <div className="space-y-6 max-w-6xl font-sans-clean">
      
      {/* Calendar Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#332B27]/10">
        
        {/* Left: Month & Date Navigation */}
        <div className="flex items-center gap-3">
          <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#332B27]">
            October 2026
          </h2>

          <div className="flex items-center gap-0.5 bg-white border border-[#332B27]/15 rounded-xl p-0.5 text-xs font-medium text-[#332B27]/70 shadow-2xs">
            <button className="p-1 hover:bg-[#FAF7F0] rounded-lg text-[#332B27]/50 hover:text-[#332B27] cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setSelectedWeekDay('2026-10-02')}
              className="px-2.5 py-0.5 hover:bg-[#FAF7F0] rounded-lg text-[#332B27] font-semibold cursor-pointer"
            >
              Today
            </button>
            <button className="p-1 hover:bg-[#FAF7F0] rounded-lg text-[#332B27]/50 hover:text-[#332B27] cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: View Toggle + Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Day / Week / Month Segmented Control */}
          <div className="flex items-center bg-[#F5EFEB] p-1 rounded-xl text-xs font-medium text-[#332B27]/70 border border-[#332B27]/5">
            <button
              onClick={() => setCalendarView('day')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                calendarView === 'day' ? 'bg-white text-[#332B27] shadow-xs font-semibold' : 'hover:text-[#332B27]'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                calendarView === 'week' ? 'bg-white text-[#332B27] shadow-xs font-semibold' : 'hover:text-[#332B27]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                calendarView === 'month' ? 'bg-white text-[#332B27] shadow-xs font-semibold' : 'hover:text-[#332B27]'
              }`}
            >
              Month
            </button>
          </div>

          {/* Block Time Action */}
          <button
            onClick={() => {
              toggleBlockSlot(currentDate, '11:00', 'hsr', 'Administrative block');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#332B27]/15 text-xs font-medium text-[#332B27] hover:bg-[#FAF7F0] transition-colors shadow-2xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#B89552]" />
            <span>Block Time</span>
          </button>

          {/* + Appointment */}
          <button
            onClick={() => openBooking()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Appointment</span>
          </button>
        </div>

      </div>

      {/* Week Calendar Grid View */}
      {calendarView === 'week' && (
        <div className="bg-white rounded-2xl border border-[#332B27]/10 overflow-x-auto shadow-xs" role="region" aria-label="Weekly schedule; scroll horizontally to see all days" tabIndex={0}>
          <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-[#332B27]/10 bg-[#FAF7F0] text-xs font-sans-clean">
            <div className="p-3 border-r border-[#332B27]/10 text-[#332B27]/50 font-mono-tabular text-center">
              Time
            </div>
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                className={`p-2.5 text-center border-r border-[#332B27]/10 last:border-r-0 ${
                  d.isToday ? 'bg-[#F1E3A6]/30' : ''
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                  d.isToday ? 'text-[#332B27]' : 'text-[#332B27]/60'
                }`}>
                  {d.name}
                </p>
                <p className={`font-mono-tabular text-sm font-bold mt-0.5 ${
                  d.isToday ? 'text-[#B89552]' : 'text-[#332B27]'
                }`}>
                  {d.num}
                </p>
              </div>
            ))}
          </div>

          {/* Calendar Slots Grid */}
          <div className="divide-y divide-[#332B27]/5 max-h-[600px] overflow-y-auto">
            {timeRows.map((time) => (
              <div key={time} className="grid grid-cols-8 min-h-[52px]">
                
                {/* Time Gutter */}
                <div className="p-2 border-r border-[#332B27]/10 text-[11px] font-mono-tabular text-[#332B27]/50 flex items-start justify-center">
                  {time}
                </div>

                {/* Day Columns */}
                {weekDays.map((d) => {
                  const apt = appointments.find(a => a.date === d.dateStr && a.time === time);
                  const isBlocked = blockedSlots.some(b => b.date === d.dateStr && b.time === time);

                  return (
                    <div
                      key={d.dateStr}
                      className={`p-1 border-r border-[#332B27]/5 last:border-r-0 relative transition-colors ${
                        d.isToday ? 'bg-[#FAF7F0]/40' : ''
                      }`}
                    >
                      {apt && (
                        <div
                          onClick={() => openSideSheet(apt)}
                          className={`h-full w-full p-2 rounded-xl border text-[11px] font-sans-clean cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between ${
                            apt.status === 'completed'
                              ? 'bg-[#AAB39A]/15 border-[#AAB39A]/30 text-[#2B3822]'
                              : apt.status === 'cancelled'
                              ? 'bg-[#F5EFEB] border-[#332B27]/10 text-[#332B27]/40 line-through'
                              : 'bg-white border-[#332B27]/15 text-[#332B27] hover:border-[#B89552] shadow-2xs'
                          }`}
                        >
                          <div>
                            <p className="font-semibold truncate">{apt.patientName}</p>
                            <p className="text-[10px] text-[#332B27]/60 truncate">
                              {SERVICES.find(s => s.id === apt.serviceId)?.name || 'Consultation'}
                            </p>
                          </div>
                          <span className="text-[9px] font-mono-tabular uppercase tracking-wider text-[#B89552] font-semibold">
                            {apt.sickness || 'Video'}
                          </span>
                        </div>
                      )}

                      {isBlocked && (
                        <div
                          onClick={() => toggleBlockSlot(d.dateStr, time)}
                          title="Click to unblock slot"
                          className="h-full w-full p-1.5 rounded-xl bg-[#F1E3A6]/25 border border-[#B89552]/30 text-[10px] text-[#332B27]/80 cursor-pointer flex items-center justify-center gap-1 hover:bg-[#F1E3A6]/40 transition-colors"
                        >
                          <Lock className="w-3 h-3 text-[#B89552]" />
                          <span className="font-medium">Blocked</span>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Day or Month fallback */}
      {calendarView !== 'week' && (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#332B27]/10 text-[#332B27]/60 text-xs font-sans-clean space-y-3">
          <CalendarIcon className="w-6 h-6 text-[#B89552] mx-auto" />
          <p>Calendar view filtered. Toggle to "Week" for the full multi-column schedule.</p>
          <button
            onClick={() => setCalendarView('week')}
            className="px-4 py-2 bg-[#332B27] text-[#FAF7F0] hover:bg-[#27201D] rounded-full text-xs font-semibold cursor-pointer"
          >
            Switch to Week
          </button>
        </div>
      )}

    </div>
  );
};
