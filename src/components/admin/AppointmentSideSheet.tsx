import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SERVICES } from '../../data/initialData';
import { 
  X, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle, 
  CalendarClock, 
  Ban, 
  FileText,
  User
} from 'lucide-react';

export const AppointmentSideSheet: React.FC = () => {
  const { 
    selectedAppointment, 
    isSideSheetOpen, 
    closeSideSheet, 
    rescheduleAppointment, 
    updateAppointmentStatus,
    openPatientModal
  } = useApp();

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('2026-10-03');
  const [newTime, setNewTime] = useState('11:30');

  if (!isSideSheetOpen || !selectedAppointment) return null;

  const service = SERVICES.find(s => s.id === selectedAppointment.serviceId) || SERVICES[0];

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rescheduleAppointment(selectedAppointment.id, newDate, newTime);
    setIsRescheduling(false);
  };

  const isCompleted = selectedAppointment.status === 'completed';
  const isCancelled = selectedAppointment.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans-clean">
      {/* Backdrop */}
      <div 
        onClick={closeSideSheet}
        className="absolute inset-0 bg-[#332B27]/40 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#332B27]/10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-[#332B27]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#332B27]/50">
                <span>{selectedAppointment.referenceNo}</span>
                <span>·</span>
                <span className={`capitalize font-semibold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase ${
                  isCompleted 
                    ? 'bg-[#AAB39A]/20 text-[#2B3822] border border-[#AAB39A]/40' 
                    : isCancelled 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-[#F1E3A6] text-[#332B27] border border-[#B89552]/30'
                }`}>
                  {selectedAppointment.status}
                </span>
              </div>
              <button
                onClick={closeSideSheet}
                className="p-1.5 text-[#332B27]/40 hover:text-[#332B27] rounded-xl hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="font-editorial text-2xl font-medium text-[#332B27]">
                {selectedAppointment.patientName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-[#332B27]/60 font-sans-clean">
                  {service.name} · {selectedAppointment.durationMin} mins
                </p>
                {selectedAppointment.consultingFor && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F1E3A6] text-[#332B27] border border-[#B89552]/30 font-medium">
                    {selectedAppointment.consultingFor}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans-clean">
            
            {/* Reschedule View or Normal View */}
            {isRescheduling ? (
              <form onSubmit={handleRescheduleSubmit} className="p-4 rounded-2xl bg-[#F1E3A6]/20 border border-[#B89552]/30 space-y-4">
                <div>
                  <p className="font-semibold text-[#332B27]">Reschedule Consultation</p>
                  <p className="text-[11px] text-[#332B27]/70 mt-0.5">
                    Select new date and clinical time slot for {selectedAppointment.patientName}.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#332B27]/80 mb-1">New Date</label>
                  <select
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#332B27]/15 rounded-xl font-mono-tabular text-[#332B27]"
                  >
                    <option value="2026-10-02">Friday, 02 Oct 2026 (Today)</option>
                    <option value="2026-10-03">Saturday, 03 Oct 2026</option>
                    <option value="2026-10-05">Monday, 05 Oct 2026</option>
                    <option value="2026-10-06">Tuesday, 06 Oct 2026</option>
                    <option value="2026-10-07">Wednesday, 07 Oct 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#332B27]/80 mb-1">New Time Slot</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#332B27]/15 rounded-xl font-mono-tabular text-[#332B27]"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] cursor-pointer"
                  >
                    Save & Notify Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    className="px-3 py-2 rounded-xl bg-white border border-[#332B27]/15 text-[#332B27] hover:bg-[#FAF7F0] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* Slot details */
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10 space-y-2.5">
                <div className="flex items-center gap-2.5 text-[#332B27]">
                  <Clock className="w-4 h-4 text-[#B89552] shrink-0" />
                  <span className="font-mono-tabular font-medium text-[#332B27]">
                    {selectedAppointment.time} – {selectedAppointment.durationMin === 45 ? '11:15' : '11:00'} ({selectedAppointment.durationMin} mins)
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[#332B27]">
                  <Calendar className="w-4 h-4 text-[#B89552] shrink-0" />
                  <span className="font-mono-tabular">{selectedAppointment.date}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#332B27]">
                  <Video className="w-4 h-4 text-[#B89552] shrink-0" />
                  <span className="font-medium">Online Video Consultation</span>
                </div>
              </div>
            )}

            {/* Patient Contact */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-[#332B27]/50 uppercase tracking-wider">
                Contact
              </p>
              <div className="space-y-2 bg-[#FAF7F0] border border-[#332B27]/10 rounded-2xl p-3.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#B89552]" />
                  <a href={`tel:${selectedAppointment.patientPhone}`} className="text-[#332B27] hover:underline font-mono-tabular">
                    {selectedAppointment.patientPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#B89552]" />
                  <a href={`mailto:${selectedAppointment.patientEmail}`} className="text-[#332B27] hover:underline truncate">
                    {selectedAppointment.patientEmail}
                  </a>
                </div>
                {selectedAppointment.patientAge && (
                  <div className="flex items-center gap-2 text-[#332B27]/70">
                    <User className="w-3.5 h-3.5 text-[#B89552]" />
                    <span>{selectedAppointment.patientAge} years old</span>
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Intake Note / Reason */}
            {selectedAppointment.reason && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[#332B27]/50 uppercase tracking-wider">
                  Patient Intake Note
                </p>
                <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#332B27]/10 text-[#332B27] leading-relaxed">
                  {selectedAppointment.reason}
                </div>
              </div>
            )}

            {/* Clinical Physician Notes */}
            {selectedAppointment.notes && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[#332B27]/50 uppercase tracking-wider">
                  Physician Case Notes
                </p>
                <div className="p-3.5 bg-[#F5EFEB] rounded-2xl border border-[#332B27]/10 text-[#332B27] leading-relaxed font-mono-tabular">
                  {selectedAppointment.notes}
                </div>
              </div>
            )}

            {/* Appointment History */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[#332B27]/50 uppercase tracking-wider">
                History
              </p>
              {selectedAppointment.history && selectedAppointment.history.length > 0 ? (
                <div className="divide-y divide-[#332B27]/10 border border-[#332B27]/10 rounded-2xl overflow-hidden bg-white">
                  {selectedAppointment.history.map((hist, idx) => (
                    <div key={idx} className="p-3.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#332B27]">
                        <span className="font-semibold">{hist.type}</span>
                        <span className="font-mono-tabular text-[#332B27]/50">{hist.date}</span>
                      </div>
                      <p className="text-[11px] text-[#332B27]/70 mt-1 leading-snug">
                        {hist.summary}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#332B27]/40 text-xs italic">First consultation recorded.</p>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-[#332B27]/10 bg-[#FAF7F0]/80 space-y-2.5">
            <button
              onClick={() => {
                closeSideSheet();
                openPatientModal(selectedAppointment);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#332B27]/15 hover:border-[#B89552] text-[#332B27] text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#B89552]" />
              <span>Open Patient Medical Chart</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  updateAppointmentStatus(selectedAppointment.id, 'completed');
                  closeSideSheet();
                }}
                className="py-2.5 px-3 rounded-xl bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-[#FAF7F0]" />
                <span>Mark Complete</span>
              </button>

              <button
                onClick={() => setIsRescheduling(!isRescheduling)}
                className="py-2.5 px-3 rounded-xl bg-white border border-[#332B27]/15 text-[#332B27] text-xs font-semibold hover:bg-[#FAF7F0] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <CalendarClock className="w-4 h-4 text-[#332B27]/70" />
                <span>Reschedule</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm(`Cancel appointment for ${selectedAppointment.patientName}?`)) {
                  updateAppointmentStatus(selectedAppointment.id, 'cancelled');
                  closeSideSheet();
                }
              }}
              className="w-full py-2 text-[#332B27]/60 hover:text-red-700 hover:bg-red-50/60 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Appointment</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
