import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Phone, Mail, FileText, ArrowRight, Pill } from 'lucide-react';

export const AdminPatients: React.FC = () => {
  const { appointments, openPatientModal, consultationNotes, digitalPrescriptions } = useApp();
  const [search, setSearch] = useState('');

  // Extract unique patients from appointments
  const uniquePatients = Array.from(
    new Map(appointments.map(a => [a.patientEmail, a])).values()
  ).filter(p => 
    p.patientName.toLowerCase().includes(search.toLowerCase()) ||
    p.patientEmail.toLowerCase().includes(search.toLowerCase()) ||
    (p.sickness && p.sickness.toLowerCase().includes(search.toLowerCase())) ||
    p.patientPhone.includes(search)
  );

  return (
    <div className="space-y-6 max-w-5xl font-sans-clean">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#332B27]/10">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#332B27]">
            Patients
          </h2>
          <p className="text-xs text-[#332B27]/60 font-sans-clean mt-1 font-mono-tabular">
            {uniquePatients.length} registered patient profiles
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#332B27]/40 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient, diagnosis, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-white border border-[#332B27]/15 rounded-xl text-xs focus:outline-none focus:border-[#B89552] font-sans-clean placeholder:text-[#332B27]/40 text-[#332B27] shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uniquePatients.map((patient) => {
          const patientVisits = appointments.filter(a => a.patientEmail === patient.patientEmail);
          const patientNotesCount = consultationNotes.filter(n => n.patientEmail.toLowerCase() === patient.patientEmail.toLowerCase()).length;
          const patientRxCount = digitalPrescriptions.filter(r => r.patientEmail.toLowerCase() === patient.patientEmail.toLowerCase()).length;

          return (
            <div
              key={patient.id}
              onClick={() => openPatientModal(patient)}
              className="p-5 bg-white rounded-2xl border border-[#332B27]/10 hover:border-[#B89552]/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[#332B27] group-hover:text-[#B89552] transition-colors truncate">
                        {patient.patientName}
                      </h3>
                      <span className="text-[11px] text-[#332B27]/40 font-mono-tabular shrink-0">
                        {patient.referenceNo}
                      </span>
                    </div>
                    <p className="text-xs text-[#332B27]/60 mt-0.5">
                      {patient.patientAge ? `${patient.patientAge}y · ` : ''}{patient.sickness || patient.consultingFor || 'Consultation'}
                    </p>
                  </div>

                  <span className="text-[11px] text-[#332B27]/70 font-mono-tabular bg-[#F5EFEB] px-2.5 py-0.5 rounded-full border border-[#332B27]/5 shrink-0">
                    {patientVisits.length} {patientVisits.length === 1 ? 'visit' : 'visits'}
                  </span>
                </div>

                {/* Contact info */}
                <div className="mt-3 text-xs text-[#332B27]/60 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#B89552]" />
                    <span>{patient.patientPhone}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-[#B89552]" />
                    <span className="truncate max-w-[180px]">{patient.patientEmail}</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#332B27]/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[11px] text-[#332B27]/60">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#332B27]/40" />
                    <span>{patientNotesCount} notes</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Pill className="w-3 h-3 text-[#332B27]/40" />
                    <span>{patientRxCount} Rx</span>
                  </span>
                </div>

                <button 
                  onClick={() => openPatientModal(patient)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#332B27]/15 hover:border-[#B89552] text-[#332B27] hover:bg-[#FAF7F0] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#B89552]" />
                  <span>View Chart</span>
                  <ArrowRight className="w-3 h-3 text-[#332B27]/40" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
