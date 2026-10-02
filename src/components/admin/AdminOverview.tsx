import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowRight, 
  Clock, 
  Video, 
  Calendar,
  FileText,
  Users,
  Activity,
  Plus,
  Ban,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Appointment } from '../../types';

export const AdminOverview: React.FC = () => {
  const { 
    appointments, 
    blockedSlots,
    openSideSheet, 
    openPatientModal,
    openBooking, 
    currentDate,
    setAdminTab,
    consultationNotes
  } = useApp();

  // Appointments for today (Friday, October 2, 2026)
  const todayAppointments = appointments.filter((a) => a.date === currentDate);
  const todayBlocked = blockedSlots.filter((b) => b.date === currentDate);

  // Combine appointments and blocked slots into a unified chronological timeline
  type TimelineItem = 
    | { type: 'appointment'; data: Appointment; time: string }
    | { type: 'blocked'; id: string; time: string; reason: string };

  const timelineItems: TimelineItem[] = [
    ...todayAppointments.map(a => ({ type: 'appointment' as const, data: a, time: a.time })),
    ...todayBlocked.map(b => ({ type: 'blocked' as const, id: b.id, time: b.time, reason: b.reason }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-10 max-w-4xl font-sans-clean">
      
      {/* Top Welcome Section from User Specification */}
      <div className="border-b border-[#332B27]/10 pb-6">
        <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#332B27] font-normal tracking-tight">
          Good morning, Dr. Niva.
        </h1>
        <p className="text-base text-[#332B27]/60 font-sans-clean mt-2 font-normal">
          Friday, October 2
        </p>
      </div>

      {/* TODAY Chronological Schedule from Exact User Architecture */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-widest uppercase text-[#332B27]/50 font-sans-clean">
            TODAY
          </h2>
          <span className="text-xs text-[#332B27]/60 font-mono-tabular">
            {todayAppointments.length} consultations scheduled
          </span>
        </div>

        {/* Chronological Timeline */}
        <div className="bg-white rounded-3xl border border-[#332B27]/10 p-4 sm:p-10 shadow-xs divide-y divide-[#332B27]/10">
          
          {timelineItems.length === 0 ? (
            <div className="py-12 text-center text-[#332B27]/50">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-[#332B27]/30" />
              <p className="text-sm">No appointments scheduled for today.</p>
            </div>
          ) : (
            timelineItems.map((item, index) => {
              if (item.type === 'blocked') {
                return (
                  <div 
                    key={`blocked-${item.id}-${index}`}
                    className="py-5 sm:py-6 first:pt-0 last:pb-0 flex items-start gap-3 sm:gap-6 group transition-colors"
                  >
                    {/* Time */}
                    <div className="w-12 sm:w-20 pt-1 shrink-0 font-mono-tabular font-medium text-sm text-[#332B27]/60">
                      {item.time}
                    </div>

                    {/* Divider line representation */}
                    <div className="text-[#332B27]/30 select-none pt-1 hidden sm:block">───</div>

                    {/* Blocked Badge & Info */}
                    <div className="flex-1 min-w-0 bg-[#F1E3A6]/25 border border-[#B89552]/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-[#F1E3A6] text-[#332B27] border border-[#B89552]/30 text-[11px] font-bold tracking-wider uppercase font-mono-tabular">
                          BLOCKED
                        </span>
                        <p className="text-xs text-[#332B27]/80 font-sans-clean">
                          {item.reason || 'Clinical Case Preparation & Administrative Buffer'}
                        </p>
                      </div>
                      <span className="text-[11px] text-[#B89552] font-mono-tabular">30 min buffer</span>
                    </div>
                  </div>
                );
              }

              const apt = item.data;
              const isReturning = apt.patientType === 'returning-patient' || (apt.history && apt.history.length > 0);

              return (
                <div 
                  key={apt.id}
                  onClick={() => openSideSheet(apt)}
                  className="py-6 first:pt-0 last:pb-0 flex items-start gap-3 sm:gap-6 group hover:bg-[#FAF7F0]/40 -mx-4 px-4 rounded-2xl transition-all cursor-pointer"
                >
                  {/* Time */}
                  <div className="w-12 sm:w-20 pt-1 shrink-0 font-mono-tabular font-semibold text-base text-[#332B27]">
                    {apt.time}
                  </div>

                  {/* Divider line representation */}
                  <div className="text-[#332B27]/30 select-none pt-1 hidden sm:block">───</div>

                  {/* Session Details */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      {/* Patient Name */}
                      <h3 className="font-editorial text-2xl text-[#332B27] font-medium group-hover:text-[#B89552] transition-colors">
                        {apt.patientName}
                      </h3>

                      {/* Service / Care Type */}
                      <p className="text-sm text-[#332B27]/80 font-sans-clean font-normal">
                        {apt.consultingFor || (apt.serviceId === 'consultation' ? 'Consultation' : `Therapy • ${apt.sickness || 'Psychotherapy'}`)}
                      </p>

                      {/* Duration & Fee */}
                      <p className="text-xs text-[#332B27]/50 font-mono-tabular">
                        {apt.durationMin} min · {apt.fee ? `₹${apt.fee.toLocaleString('en-IN')}` : '₹3,000'}
                      </p>
                    </div>

                    {/* Patient Status Pill (Returning vs New patient) */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium font-sans-clean ${
                        isReturning
                          ? 'bg-[#F1E3A6] text-[#332B27] border border-[#B89552]/30'
                          : 'bg-[#AAB39A]/20 text-[#2B3822] border border-[#AAB39A]/40'
                      }`}>
                        {isReturning ? 'Returning' : 'New patient'}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSideSheet(apt);
                        }}
                        className="p-2 rounded-xl text-[#332B27]/40 hover:text-[#332B27] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                        title="View clinical chart"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>

      {/* Quick Clinical Workspace Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div 
          onClick={() => setAdminTab('schedule')}
          className="p-5 rounded-2xl bg-white border border-[#332B27]/10 hover:border-[#B89552]/50 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#332B27]/50 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold font-sans-clean">Calendar View</span>
            <Calendar className="w-4 h-4 text-[#B89552]" />
          </div>
          <p className="font-editorial text-xl text-[#332B27] font-normal group-hover:text-[#B89552] transition-colors">
            Week Schedule
          </p>
          <p className="text-xs text-[#332B27]/60 mt-1">View room occupancy & clinical hours</p>
        </div>

        <div 
          onClick={() => setAdminTab('availability')}
          className="p-5 rounded-2xl bg-white border border-[#332B27]/10 hover:border-[#B89552]/50 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#332B27]/50 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold font-sans-clean">Availability</span>
            <Clock className="w-4 h-4 text-[#B89552]" />
          </div>
          <p className="font-editorial text-xl text-[#332B27] font-normal group-hover:text-[#B89552] transition-colors">
            Slot Rules
          </p>
          <p className="text-xs text-[#332B27]/60 mt-1">Manage intake slots & buffer windows</p>
        </div>

        <div 
          onClick={() => openBooking()}
          className="p-5 rounded-2xl bg-white border border-[#332B27]/10 hover:border-[#B89552]/50 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#332B27]/50 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold font-sans-clean">Booking Engine</span>
            <Plus className="w-4 h-4 text-[#B89552]" />
          </div>
          <p className="font-editorial text-xl text-[#332B27] font-normal group-hover:text-[#B89552] transition-colors">
            + Appointment
          </p>
          <p className="text-xs text-[#332B27]/60 mt-1">Manual intake for new or returning patients</p>
        </div>
      </div>

    </div>
  );
};
