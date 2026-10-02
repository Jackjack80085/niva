import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, DigitalPrescription } from '../../types';
import { DOCTOR_INFO } from '../../data/initialData';
import { 
  X, 
  FileText, 
  Pill, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  Plus, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PatientDetailModalContentProps {
  patient: Appointment;
  onClose: () => void;
}

const PatientDetailModalContent: React.FC<PatientDetailModalContentProps> = ({ patient, onClose }) => {
  const { 
    consultationNotes, 
    digitalPrescriptions, 
    addConsultationNote, 
    addDigitalPrescription, 
    addToast,
    appointments 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'notes' | 'prescriptions'>('notes');
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [showNewRxForm, setShowNewRxForm] = useState(false);
  const [printingRx, setPrintingRx] = useState<DigitalPrescription | null>(null);

  // Filter notes for this patient by email or name
  const patientNotes = consultationNotes.filter(
    (n) => n.patientEmail.toLowerCase() === patient.patientEmail.toLowerCase() ||
           n.patientName.toLowerCase() === patient.patientName.toLowerCase()
  );

  // Filter prescriptions for this patient
  const patientRxList = digitalPrescriptions.filter(
    (rx) => rx.patientEmail.toLowerCase() === patient.patientEmail.toLowerCase() ||
            rx.patientName.toLowerCase() === patient.patientName.toLowerCase()
  );

  // All consultations for this patient
  const patientAppointments = appointments.filter(
    (a) => a.patientEmail.toLowerCase() === patient.patientEmail.toLowerCase()
  );

  // New Note Form State
  const [noteSessionNum, setNoteSessionNum] = useState(patientNotes.length + 1);
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteSickness, setNoteSickness] = useState(patient.sickness || patient.consultingFor || patient.reason || 'General Clinical Consultation');
  const [noteMse, setNoteMse] = useState('Alert, oriented x 3, cooperative, coherent thought process, mild anxiety evident.');
  const [noteObservations, setNoteObservations] = useState('');
  const [noteInterventions, setNoteInterventions] = useState('Cognitive restructuring, Somatic grounding & Breath titration');
  const [noteProgress, setNoteProgress] = useState<'significant_improvement' | 'moderate_progress' | 'stable' | 'needs_adjustment'>('moderate_progress');
  const [notePlan, setNotePlan] = useState('Continue daily grounding exercises. Maintain thought log. Follow-up next week.');

  // New Prescription Form State
  const [rxDiagnosis, setRxDiagnosis] = useState(patient.sickness || patient.consultingFor || 'Anxiety & Stress-Related Disorder');
  const [rxDirectives, setRxDirectives] = useState('1. Practice 4-7-8 breathing twice daily (5 mins)\n2. Maintain daily thought-record log\n3. Engage in gentle somatic movement before sleep');
  const [rxSupplements, setRxSupplements] = useState('Magnesium Glycinate 250mg at bedtime\nChamomile / herbal calming tea evening');
  const [rxLifestyle, setRxLifestyle] = useState('No screen exposure 30 mins before sleep. Limit caffeine after 2:00 PM.');
  const [rxFollowUp, setRxFollowUp] = useState('In 7 days / Next scheduled online consultation');

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteObservations.trim()) {
      addToast({ title: 'Note Required', message: 'Please write in-session clinical observations.', type: 'alert' });
      return;
    }

    addConsultationNote({
      patientEmail: patient.patientEmail,
      patientName: patient.patientName,
      consultationDate: noteDate,
      sessionNumber: Number(noteSessionNum) || 1,
      sickness: noteSickness,
      mentalStatusExam: noteMse,
      clinicalObservations: noteObservations,
      interventionsUsed: noteInterventions,
      progressAssessment: noteProgress,
      planNextSteps: notePlan,
    });

    addToast({
      title: 'Consultation Note Saved',
      message: `Session #${noteSessionNum} notes recorded in ${patient.patientName}'s clinical chart.`,
      type: 'success',
    });

    setNoteObservations('');
    setShowNewNoteForm(false);
  };

  const handleSaveRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxDiagnosis.trim()) {
      addToast({ title: 'Diagnosis Required', message: 'Please provide a clinical diagnosis / impression.', type: 'alert' });
      return;
    }

    const directivesList = rxDirectives.split('\n').filter((line) => line.trim().length > 0);
    const supplementsList = rxSupplements.split('\n').filter((line) => line.trim().length > 0);

    const newRx = addDigitalPrescription({
      prescriptionNumber: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      patientEmail: patient.patientEmail,
      patientName: patient.patientName,
      patientAge: patient.patientAge,
      date: new Date().toISOString().split('T')[0],
      sicknessDiagnosis: rxDiagnosis,
      therapyDirectives: directivesList,
      recommendedSupplementsOrMedications: supplementsList,
      dietaryLifestyleRecommendations: rxLifestyle,
      followUpDate: rxFollowUp,
      doctorName: DOCTOR_INFO.name,
      doctorCredentials: DOCTOR_INFO.qualifications,
      registrationNumber: 'RCI Reg. No. A-48291',
    });

    addToast({
      title: 'Digital Prescription Issued',
      message: `Prescription #${newRx.prescriptionNumber} generated and signed.`,
      type: 'success',
    });

    setShowNewRxForm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-[#332B27]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 font-sans-clean"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF7F0] w-full max-w-4xl rounded-[28px] border border-[#332B27]/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header Card */}
        <div className="bg-white px-6 py-5 border-b border-[#332B27]/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#F1E3A6] text-[#332B27] flex items-center justify-center font-bold text-base font-sans-clean shrink-0 border border-[#B89552]/30 shadow-2xs">
              {patient.patientName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-editorial text-2xl font-medium text-[#332B27] truncate">
                  {patient.patientName}
                </h3>
                <span className="text-[11px] font-mono-tabular font-medium text-[#332B27]/60 bg-[#FAF7F0] px-2.5 py-0.5 rounded-full border border-[#332B27]/10">
                  {patient.referenceNo}
                </span>
              </div>
              <p className="text-xs text-[#332B27]/60 font-sans-clean mt-1 flex flex-wrap items-center gap-2">
                <span>{patient.patientEmail}</span>
                <span className="text-[#332B27]/30">·</span>
                <span className="font-mono-tabular">{patient.patientPhone}</span>
                {patient.patientAge && (
                  <>
                    <span className="text-[#332B27]/30">·</span>
                    <span>{patient.patientAge} years</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-[#FAF7F0] flex items-center justify-center text-[#332B27]/40 hover:text-[#332B27] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnosis Sub-Bar */}
        <div className="bg-[#FAF7F0] px-6 py-3 border-b border-[#332B27]/10 flex flex-wrap items-center justify-between gap-3 text-xs font-sans-clean">
          <div className="flex items-center gap-2">
            <span className="text-[#332B27]/50 text-[11px] font-semibold uppercase tracking-wider">Diagnosis:</span>
            <span className="font-medium text-[#332B27] bg-white px-3 py-1 rounded-full border border-[#332B27]/10 shadow-2xs text-xs">
              {patient.sickness || patient.consultingFor || 'Consultation Intake'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono-tabular">
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#332B27]/10 text-[#332B27]/70 shadow-2xs font-medium">
              {patientAppointments.length} {patientAppointments.length === 1 ? 'visit' : 'visits'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#332B27]/10 text-[#332B27]/70 shadow-2xs font-medium">
              {patientNotes.length} {patientNotes.length === 1 ? 'note' : 'notes'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#332B27]/10 text-[#332B27]/70 shadow-2xs font-medium">
              {patientRxList.length} {patientRxList.length === 1 ? 'prescription' : 'prescriptions'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white px-6 pt-3 border-b border-[#332B27]/10 flex items-center justify-between shrink-0">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 text-xs font-semibold tracking-wide flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'border-[#332B27] text-[#332B27]'
                  : 'border-transparent text-[#332B27]/50 hover:text-[#332B27]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Consultation Notes ({patientNotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`pb-3 text-xs font-semibold tracking-wide flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'prescriptions'
                  ? 'border-[#332B27] text-[#332B27]'
                  : 'border-transparent text-[#332B27]/50 hover:text-[#332B27]'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Digital Prescriptions ({patientRxList.length})</span>
            </button>
          </div>

          <div className="pb-2.5">
            {activeTab === 'notes' ? (
              <button
                onClick={() => setShowNewNoteForm(!showNewNoteForm)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showNewNoteForm ? 'Cancel Note' : 'Take Consultation Note'}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowNewRxForm(!showNewRxForm)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showNewRxForm ? 'Cancel Rx' : 'Issue Prescription'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ===================== TAB 1: CONSULTATION NOTES ===================== */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              
              {/* Form to Take New Note */}
              <AnimatePresence>
                {showNewNoteForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveNote}
                    className="p-6 bg-white rounded-3xl border border-[#332B27]/15 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#332B27]/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#B89552]" />
                        <h4 className="font-editorial text-xl font-medium text-[#332B27]">
                          Record New Consultation Note
                        </h4>
                      </div>
                      <span className="text-xs text-[#332B27]/50 font-mono-tabular">
                        Session #{noteSessionNum} · {noteDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans-clean">
                      <div>
                        <label className="block text-[#332B27] font-semibold mb-1">Session #</label>
                        <input
                          type="number"
                          value={noteSessionNum}
                          onChange={(e) => setNoteSessionNum(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl font-mono-tabular text-[#332B27]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#332B27] font-semibold mb-1">Date</label>
                        <input
                          type="date"
                          value={noteDate}
                          onChange={(e) => setNoteDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl font-mono-tabular text-[#332B27]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#332B27] font-semibold mb-1">Progress Assessment</label>
                        <select
                          value={noteProgress}
                          onChange={(e) => setNoteProgress(e.target.value as any)}
                          className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                        >
                          <option value="significant_improvement">Significant Improvement</option>
                          <option value="moderate_progress">Moderate Progress</option>
                          <option value="stable">Stable / Maintenance</option>
                          <option value="needs_adjustment">Needs Protocol Adjustment</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs font-sans-clean">
                      <label className="block text-[#332B27] font-semibold mb-1">Condition / Topic Addressed</label>
                      <input
                        type="text"
                        value={noteSickness}
                        onChange={(e) => setNoteSickness(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                      />
                    </div>

                    <div className="text-xs font-sans-clean">
                      <label className="block text-[#332B27] font-semibold mb-1">Mental Status Examination (MSE)</label>
                      <input
                        type="text"
                        value={noteMse}
                        onChange={(e) => setNoteMse(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                      />
                    </div>

                    <div className="text-xs font-sans-clean">
                      <label className="block text-[#332B27] font-semibold mb-1">Clinical Observations & In-Session Disclosures</label>
                      <textarea
                        rows={4}
                        value={noteObservations}
                        onChange={(e) => setNoteObservations(e.target.value)}
                        placeholder="Detail affective state, cognitive themes, somatic symptoms, therapeutic dialogue..."
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27] leading-relaxed resize-none focus:outline-none focus:border-[#B89552]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans-clean">
                      <div>
                        <label className="block text-[#332B27] font-semibold mb-1">Interventions Applied</label>
                        <input
                          type="text"
                          value={noteInterventions}
                          onChange={(e) => setNoteInterventions(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#332B27] font-semibold mb-1">Plan & Next Directives</label>
                        <input
                          type="text"
                          value={notePlan}
                          onChange={(e) => setNotePlan(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#332B27]/10">
                      <button
                        type="button"
                        onClick={() => setShowNewNoteForm(false)}
                        className="px-4 py-2 rounded-full bg-white border border-[#332B27]/15 text-[#332B27] text-xs font-medium hover:bg-[#FAF7F0] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] shadow-xs cursor-pointer"
                      >
                        Save Note to Chart
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Consultation Notes List */}
              {patientNotes.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#332B27]/10 shadow-2xs">
                  <FileText className="w-10 h-10 text-[#332B27]/30 mx-auto mb-3" />
                  <h4 className="font-editorial text-xl text-[#332B27]">No consultation notes recorded yet</h4>
                  <p className="text-xs text-[#332B27]/60 mt-1 max-w-sm mx-auto font-sans-clean">
                    Click "Take Consultation Note" above to write and permanently store clinical observations for this patient.
                  </p>
                </div>
              ) : (
                patientNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white rounded-3xl border border-[#332B27]/10 shadow-sm overflow-hidden transition-all hover:border-[#B89552]/40"
                  >
                    {/* Note Header Banner */}
                    <div className="bg-[#FAF7F0] px-6 py-3.5 border-b border-[#332B27]/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono-tabular font-bold text-xs bg-[#332B27] text-[#FAF7F0] px-2.5 py-0.5 rounded-md shadow-2xs">
                          Session #{note.sessionNumber}
                        </span>
                        <span className="font-mono-tabular text-xs text-[#332B27]/70 font-medium bg-white px-2.5 py-0.5 rounded-md border border-[#332B27]/10 shadow-2xs flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#B89552]" />
                          {note.consultationDate}
                        </span>
                        <span className="text-[#332B27]/30">·</span>
                        <span className="text-xs font-semibold text-[#B89552]">
                          {note.sickness}
                        </span>
                      </div>

                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        note.progressAssessment === 'significant_improvement'
                          ? 'bg-[#AAB39A]/20 text-[#2B3822] border border-[#AAB39A]/40'
                          : note.progressAssessment === 'moderate_progress'
                          ? 'bg-[#F1E3A6]/40 text-[#54431B] border border-[#B89552]/40'
                          : 'bg-[#FAF7F0] text-[#332B27] border border-[#332B27]/15'
                      }`}>
                        {note.progressAssessment.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Note Content */}
                    <div className="p-6 space-y-4 text-xs font-sans-clean">
                      <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10">
                        <span className="text-[11px] font-bold text-[#B89552] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#B89552]" />
                          Clinical Observations & Patient Disclosure
                        </span>
                        <p className="text-[#332B27] leading-relaxed bg-white p-3.5 rounded-xl border border-[#332B27]/10 shadow-2xs">
                          {note.clinicalObservations}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10">
                          <span className="text-[11px] font-bold text-[#332B27]/60 uppercase tracking-wider block mb-2">
                            Mental Status Examination (MSE)
                          </span>
                          <p className="text-[#332B27] leading-relaxed bg-white p-3.5 rounded-xl border border-[#332B27]/10 shadow-2xs text-[11px]">
                            {note.mentalStatusExam}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10">
                          <span className="text-[11px] font-bold text-[#332B27]/60 uppercase tracking-wider block mb-2">
                            Interventions Applied
                          </span>
                          <p className="text-[#332B27] leading-relaxed bg-white p-3.5 rounded-xl border border-[#332B27]/10 shadow-2xs text-[11px]">
                            {note.interventionsUsed}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#332B27]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="text-[#332B27] bg-[#FAF7F0] px-3.5 py-1.5 rounded-xl border border-[#332B27]/10 flex-1">
                          <strong className="text-[#332B27] font-semibold">Treatment Plan:</strong> {note.planNextSteps}
                        </div>
                        <span className="text-[#332B27]/60 font-medium shrink-0 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-[#B89552]" />
                          Dr. Niva Jacob, MD
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>
          )}

          {/* ===================== TAB 2: DIGITAL PRESCRIPTIONS ===================== */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              
              {/* Form to Issue New Prescription */}
              <AnimatePresence>
                {showNewRxForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveRx}
                    className="p-6 bg-white rounded-3xl border border-[#332B27]/15 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#332B27]/10">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-[#B89552]" />
                        <h4 className="font-editorial text-xl font-medium text-[#332B27]">
                          Issue Official Digital Prescription
                        </h4>
                      </div>
                      <span className="text-xs text-[#332B27]/50 font-mono-tabular">
                        Dr. Niva Jacob · {DOCTOR_INFO.registrationNo}
                      </span>
                    </div>

                    <div className="text-xs font-sans-clean">
                      <label className="block text-[#332B27] font-semibold mb-1">
                        Clinical Diagnosis / Primary Complaint
                      </label>
                      <input
                        type="text"
                        value={rxDiagnosis}
                        onChange={(e) => setRxDiagnosis(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                      />
                    </div>

                    <div className="text-xs font-sans-clean">
                      <label className="block text-[#332B27] font-semibold mb-1">
                        Therapy Protocol & Homework Directives (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={rxDirectives}
                        onChange={(e) => setRxDirectives(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27] leading-relaxed resize-none"
                      />
                    </div>

                    <div className="text-xs font-sans-clean">
                      <label className="block text-[#332B27] font-semibold mb-1">
                        Supportive Measures & Supplements (One per line)
                      </label>
                      <textarea
                        rows={2}
                        value={rxSupplements}
                        onChange={(e) => setRxSupplements(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27] leading-relaxed resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans-clean">
                      <div>
                        <label className="block text-[#332B27] font-semibold mb-1">Lifestyle & Sleep Directives</label>
                        <input
                          type="text"
                          value={rxLifestyle}
                          onChange={(e) => setRxLifestyle(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#332B27] font-semibold mb-1">Review Consultation Date</label>
                        <input
                          type="text"
                          value={rxFollowUp}
                          onChange={(e) => setRxFollowUp(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-[#332B27]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#332B27]/10">
                      <button
                        type="button"
                        onClick={() => setShowNewRxForm(false)}
                        className="px-4 py-2 rounded-full bg-white border border-[#332B27]/15 text-[#332B27] text-xs font-medium hover:bg-[#FAF7F0] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] shadow-xs cursor-pointer"
                      >
                        Authorize & Generate Rx
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Prescriptions List */}
              {patientRxList.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#332B27]/10 shadow-2xs">
                  <Pill className="w-10 h-10 text-[#332B27]/30 mx-auto mb-3" />
                  <h4 className="font-editorial text-xl text-[#332B27]">No prescriptions issued yet</h4>
                  <p className="text-xs text-[#332B27]/60 mt-1 max-w-sm mx-auto font-sans-clean">
                    Click "Issue Prescription" to write psychotherapy homework, supportive supplements, and lifestyle instructions.
                  </p>
                </div>
              ) : (
                patientRxList.map((rx) => (
                  <div
                    key={rx.id}
                    className="bg-white rounded-3xl border border-[#332B27]/10 shadow-sm overflow-hidden transition-all hover:border-[#B89552]/40"
                  >
                    {/* Prescription Top Banner */}
                    <div className="bg-[#FAF7F0] px-6 py-4 border-b border-[#332B27]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-[#F1E3A6] text-[#332B27] border border-[#B89552]/30 px-2.5 py-0.5 rounded-md">
                            {rx.prescriptionNumber}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#332B27]/70 font-mono-tabular bg-white px-2.5 py-0.5 rounded-md border border-[#332B27]/10 shadow-2xs">
                            <Calendar className="w-3.5 h-3.5 text-[#B89552]" />
                            Issued {rx.date}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2B3822] bg-[#AAB39A]/20 px-2.5 py-0.5 rounded-md border border-[#AAB39A]/40">
                            <CheckCircle2 className="w-3 h-3 text-[#AAB39A]" />
                            Official Teletherapy Rx
                          </span>
                        </div>
                        <h4 className="font-editorial text-xl font-medium text-[#332B27] mt-2">
                          {rx.sicknessDiagnosis}
                        </h4>
                      </div>

                      <button
                        onClick={() => setPrintingRx(rx)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#332B27]/15 hover:border-[#B89552] hover:bg-[#FAF7F0] text-[#332B27] text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto group/btn"
                      >
                        <Printer className="w-4 h-4 text-[#B89552]" />
                        <span>Print / View Official Rx</span>
                      </button>
                    </div>

                    {/* Prescription Content Sections */}
                    <div className="p-6 space-y-4 text-xs font-sans-clean">
                      
                      {/* Section 1: Therapy Protocol & Homework Directives */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-[#B89552] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#B89552]" />
                            Therapy Protocol & Homework Directives
                          </span>
                          <span className="text-[11px] text-[#332B27]/50 font-mono-tabular">
                            {rx.therapyDirectives.length} active directives
                          </span>
                        </div>
                        <div className="space-y-2">
                          {rx.therapyDirectives.map((d, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#332B27]/10 text-xs text-[#332B27] leading-relaxed shadow-2xs"
                            >
                              <span className="w-5 h-5 rounded-md bg-[#F1E3A6] text-[#332B27] font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="flex-1">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Supportive Care & Supplements */}
                      {rx.recommendedSupplementsOrMedications.length > 0 && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-[#332B27]/70 uppercase tracking-wider flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-[#B89552]" />
                              Supportive Care & Recommended Supplements
                            </span>
                            <span className="text-[11px] text-[#332B27]/50 font-mono-tabular">
                              {rx.recommendedSupplementsOrMedications.length} items
                            </span>
                          </div>
                          <div className="space-y-2">
                            {rx.recommendedSupplementsOrMedications.map((m, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#332B27]/10 text-xs text-[#332B27] leading-relaxed shadow-2xs"
                              >
                                <span className="w-5 h-5 rounded-md bg-[#F1E3A6] text-[#332B27] border border-[#B89552]/30 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  <Pill className="w-3 h-3 text-[#B89552]" />
                                </span>
                                <span className="flex-1 font-medium">{m}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Lifestyle Directives & Follow-Up Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10 flex flex-col justify-between">
                          <span className="text-[11px] font-bold text-[#332B27]/60 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Activity className="w-3.5 h-3.5 text-[#B89552]" />
                            Lifestyle & Sleep Directives
                          </span>
                          <p className="text-xs text-[#332B27] leading-relaxed bg-white p-3 rounded-xl border border-[#332B27]/10 shadow-2xs">
                            {rx.dietaryLifestyleRecommendations}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10 flex flex-col justify-between">
                          <span className="text-[11px] font-bold text-[#332B27]/60 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Calendar className="w-3.5 h-3.5 text-[#B89552]" />
                            Next Clinical Follow-Up
                          </span>
                          <div className="text-xs text-[#332B27] bg-white p-3 rounded-xl border border-[#332B27]/10 shadow-2xs flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-[#B89552] shrink-0" />
                            <span className="font-semibold text-[#332B27]">{rx.followUpDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Clinical Authorization Footer */}
                      <div className="pt-3 border-t border-[#332B27]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-[#332B27]/70">
                          <Stethoscope className="w-3.5 h-3.5 text-[#B89552] shrink-0" />
                          <span>
                            Authorized by <strong className="text-[#332B27] font-semibold">{rx.doctorName}</strong> ({rx.doctorCredentials})
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#332B27]/15 text-[#332B27] font-mono text-[11px] font-semibold self-start sm:self-auto shadow-2xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#B89552]" />
                          <span>{rx.registrationNumber}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}

            </div>
          )}

        </div>

      </div>

      {/* ===================== OFFICIAL DIGITAL PRESCRIPTION PRINT PREVIEW MODAL ===================== */}
      {printingRx && (
        <div className="fixed inset-0 z-60 bg-[#332B27]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden border border-[#332B27]/15 p-8 space-y-6">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#332B27]/10">
              <span className="text-xs font-semibold text-[#B89552] tracking-wider uppercase">
                Official Clinical Prescription Letterhead
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F1E3A6]" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintingRx(null)}
                  className="p-1.5 text-[#332B27]/40 hover:text-[#332B27] rounded-xl hover:bg-[#FAF7F0] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="flex items-start justify-between border-b-2 border-[#332B27] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[#332B27]">
                  {DOCTOR_INFO.name}
                </h2>
                <p className="text-xs font-medium text-[#332B27]/70 font-sans-clean">
                  {DOCTOR_INFO.title}
                </p>
                <p className="text-[11px] text-[#332B27]/50 font-mono-tabular">
                  {DOCTOR_INFO.qualifications} · {printingRx.registrationNumber}
                </p>
                <p className="text-[11px] text-[#332B27]/50">
                  Virtual Clinical Telehealth Suite · {DOCTOR_INFO.email}
                </p>
              </div>
              <div className="text-right text-xs font-mono-tabular text-[#332B27]/70">
                <p className="font-bold text-[#332B27] text-sm">{printingRx.prescriptionNumber}</p>
                <p>Date: {printingRx.date}</p>
                <p className="text-[11px] text-[#2B3822] font-semibold mt-1">Verified Teletherapy Rx</p>
              </div>
            </div>

            {/* Patient Header */}
            <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#332B27]/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans-clean">
              <div>
                <span className="text-[#332B27]/50 text-[10px] block uppercase">Patient Name</span>
                <span className="font-bold text-[#332B27]">{printingRx.patientName}</span>
              </div>
              <div>
                <span className="text-[#332B27]/50 text-[10px] block uppercase">Age / Gender</span>
                <span className="font-medium text-[#332B27]">{printingRx.patientAge || 'Adult'}</span>
              </div>
              <div>
                <span className="text-[#332B27]/50 text-[10px] block uppercase">Clinical Record Ref</span>
                <span className="font-medium text-[#332B27]">{patient.referenceNo}</span>
              </div>
              <div>
                <span className="text-[#332B27]/50 text-[10px] block uppercase">Delivery Mode</span>
                <span className="font-semibold text-[#B89552]">Encrypted Video Suite</span>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="text-xs font-sans-clean space-y-1">
              <span className="font-semibold text-[#332B27]/50 uppercase text-[11px]">Clinical Impression / Sickness:</span>
              <p className="font-medium text-sm text-[#332B27] border-l-2 border-[#B89552] pl-3 py-0.5">
                {printingRx.sicknessDiagnosis}
              </p>
            </div>

            {/* Rx Symbol & Therapy Directives */}
            <div className="space-y-4 text-xs font-sans-clean pt-2">
              <div className="flex items-center gap-2">
                <span className="font-serif italic font-bold text-2xl text-[#332B27]">Rx</span>
                <span className="text-xs font-semibold text-[#332B27]/70 uppercase tracking-wide">
                  Therapeutic Protocol & Interventions
                </span>
              </div>

              <div className="space-y-2 pl-4">
                <p className="font-semibold text-[#332B27] text-[11px] uppercase tracking-wider">
                  Psychotherapy Directives & Coping Regimen:
                </p>
                <ul className="list-decimal list-inside space-y-1.5 text-[#332B27] leading-relaxed">
                  {printingRx.therapyDirectives.map((directive, i) => (
                    <li key={i}>{directive}</li>
                  ))}
                </ul>
              </div>

              {printingRx.recommendedSupplementsOrMedications.length > 0 && (
                <div className="space-y-2 pl-4 pt-2">
                  <p className="font-semibold text-[#332B27] text-[11px] uppercase tracking-wider">
                    Supportive Calming Measures / Micronutrients:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[#332B27]">
                    {printingRx.recommendedSupplementsOrMedications.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 pt-2 border-t border-[#332B27]/10 text-xs">
                <div>
                  <p className="font-semibold text-[#332B27]">Lifestyle Advice:</p>
                  <p className="text-[#332B27]/70">{printingRx.dietaryLifestyleRecommendations}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#332B27]">Next Review Consultation:</p>
                  <p className="text-[#332B27]/70">{printingRx.followUpDate}</p>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-8 border-t border-[#332B27]/10 flex items-end justify-between">
              <div className="text-[11px] text-[#332B27]/50 font-sans-clean max-w-xs">
                Electronically generated and timestamped digital psychotherapy prescription. Valid across telehealth consultations.
              </div>
              <div className="text-right">
                <div className="font-editorial italic text-lg text-[#332B27]">
                  Dr. Niva Jacob, MD
                </div>
                <div className="border-t border-[#332B27]/20 pt-1 mt-1">
                  <p className="font-semibold text-xs text-[#332B27]">{DOCTOR_INFO.name}</p>
                  <p className="text-[10px] text-[#332B27]/50 font-mono-tabular">{printingRx.registrationNumber}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export const PatientDetailModal: React.FC = () => {
  const { selectedPatientForDetail, isPatientModalOpen, closePatientModal } = useApp();

  if (!isPatientModalOpen || !selectedPatientForDetail) {
    return null;
  }

  return (
    <PatientDetailModalContent
      patient={selectedPatientForDetail}
      onClose={closePatientModal}
    />
  );
};
