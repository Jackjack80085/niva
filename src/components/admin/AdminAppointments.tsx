import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  FileText, 
  Plus,
  RefreshCw
} from 'lucide-react';

export const AdminAppointments: React.FC = () => {
  const { 
    appointments, 
    openSideSheet, 
    openPatientModal, 
    openBooking
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      (a.sickness && a.sickness.toLowerCase().includes(search.toLowerCase())) ||
      (a.consultingFor && a.consultingFor.toLowerCase().includes(search.toLowerCase())) ||
      a.patientEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl font-sans-clean">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#332B27]/10">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#332B27]">
            Appointments
          </h2>
          <p className="text-xs text-[#332B27]/60 font-sans-clean mt-1 font-mono-tabular">
            {filtered.length} total appointments recorded
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={triggerRefresh}
            className="p-2 rounded-xl bg-white border border-[#332B27]/15 text-[#332B27]/60 hover:text-[#332B27] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-2xs"
            title="Refresh appointments list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => openBooking()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#332B27]/40 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient, diagnosis, or ref #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-white border border-[#332B27]/15 rounded-xl text-xs focus:outline-none focus:border-[#B89552] placeholder:text-[#332B27]/40 text-[#332B27] font-sans-clean shadow-2xs transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-[#F5EFEB] p-1 rounded-xl self-start sm:self-auto overflow-x-auto border border-[#332B27]/5">
          {['all', 'upcoming', 'confirmed', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-[#332B27] font-semibold shadow-xs border border-[#332B27]/10'
                  : 'text-[#332B27]/60 hover:text-[#332B27] hover:bg-white/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-[#332B27]/10 overflow-hidden shadow-xs">
        
        {/* Table Column Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#FAF7F0] border-b border-[#332B27]/10 text-[11px] font-semibold text-[#332B27]/60 uppercase tracking-wider font-sans-clean">
          <div className="col-span-3">Patient</div>
          <div className="col-span-2">Condition</div>
          <div className="col-span-3">Date & Time</div>
          <div className="col-span-4 text-right">Status & Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#332B27]/5">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#332B27]/40 text-xs font-sans-clean">
              No matching appointments found.
            </div>
          ) : (
            filtered.map((apt) => {
              const isCompleted = apt.status === 'completed';
              const isUpcoming = apt.status === 'upcoming';
              const isCancelled = apt.status === 'cancelled';

              return (
                <div
                  key={apt.id}
                  className="px-6 py-4 hover:bg-[#FAF7F0]/40 transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center group"
                >
                  {/* Column 1: Patient Name */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openPatientModal(apt)}
                        className="text-sm font-semibold text-[#332B27] group-hover:text-[#B89552] transition-colors truncate hover:underline text-left cursor-pointer"
                      >
                        {apt.patientName}
                      </button>
                      <span className="text-[11px] text-[#332B27]/40 font-mono-tabular shrink-0">
                        {apt.referenceNo}
                      </span>
                    </div>
                    <p className="text-xs text-[#332B27]/60 truncate mt-0.5">
                      {apt.patientEmail} · {apt.patientPhone}
                    </p>
                  </div>

                  {/* Column 2: Sickness / Condition */}
                  <div className="col-span-2 min-w-0">
                    <span className="text-xs font-medium text-[#332B27] truncate block">
                      {apt.sickness || apt.consultingFor || 'Consultation'}
                    </span>
                    {apt.reason && (
                      <p className="text-[11px] text-[#332B27]/50 truncate mt-0.5">
                        {apt.reason}
                      </p>
                    )}
                  </div>

                  {/* Column 3: Appointment Date & Time */}
                  <div className="col-span-3 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-[#332B27]">
                      <Calendar className="w-3.5 h-3.5 text-[#B89552] shrink-0" />
                      <span className="font-mono-tabular font-medium">{apt.date}</span>
                      <span className="text-[#332B27]/30">·</span>
                      <span className="font-mono-tabular font-semibold text-[#332B27]">{apt.time} IST</span>
                    </div>
                    <p className="text-[11px] text-[#332B27]/50 mt-0.5">
                      {apt.durationMin} mins · Video Consultation
                    </p>
                  </div>

                  {/* Column 4: Status & Actions */}
                  <div className="col-span-4 flex items-center justify-between md:justify-end gap-2.5 w-full">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 capitalize ${
                      isCompleted
                        ? 'text-[#2B3822] bg-[#AAB39A]/20 border border-[#AAB39A]/40'
                        : isUpcoming
                        ? 'text-[#54431B] bg-[#F1E3A6]/40 border border-[#B89552]/40'
                        : isCancelled
                        ? 'text-[#332B27]/40 bg-[#F5EFEB] border border-[#332B27]/10 line-through'
                        : 'text-[#2B3822] bg-[#AAB39A]/15 border border-[#AAB39A]/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                        isCompleted
                          ? 'bg-[#AAB39A]'
                          : isUpcoming
                          ? 'bg-[#B89552]'
                          : isCancelled
                          ? 'bg-[#332B27]/30'
                          : 'bg-[#AAB39A]'
                      }`} />
                      {apt.status}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openPatientModal(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#332B27]/15 hover:border-[#B89552] text-[#332B27] hover:bg-[#FAF7F0] text-xs font-medium shadow-2xs transition-all cursor-pointer group/chart"
                        title="View patient records & digital prescriptions"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#332B27]/50 group-hover/chart:text-[#B89552]" />
                        <span>Chart</span>
                      </button>

                      <button
                        onClick={() => openSideSheet(apt)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#332B27] hover:bg-[#27201D] text-[#FAF7F0] text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        title="Manage appointment and details"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#FAF7F0]/90" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
