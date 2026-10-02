import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SERVICES, DOCTOR_INFO } from '../../data/initialData';
import { Service, Appointment, PatientType } from '../../types';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Video, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  User, 
  UserCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import drNivaPortrait from '../../assets/images/hero_dr_niva_1790926646890.jpg';

type CareCategory = 'consultation' | 'therapy' | 'couples-therapy';

interface ReturningPatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  previousSessionTitle: string;
  previousSessionModality: string;
  clinician: string;
  nextSuggestedDateStr: string;
  nextSuggestedLabel: string;
  nextSuggestedTime: string;
}

const SAMPLE_RETURNING_PATIENTS: ReturningPatientProfile[] = [
  {
    id: 'p-1',
    name: 'Rahul',
    email: 'rahul.mehta@enterprise.com',
    phone: '+91 98860 31256',
    previousSessionTitle: 'Therapy • Anxiety',
    previousSessionModality: '50 min • Somatic & Cognitive Grounding',
    clinician: 'Dr. Niva Jacob',
    nextSuggestedDateStr: '2026-10-13',
    nextSuggestedLabel: 'Tue, 13 Oct',
    nextSuggestedTime: '10:30 AM',
  },
  {
    id: 'p-2',
    name: 'Priya',
    email: 'priya.rao@gmail.com',
    phone: '+91 98820 44123',
    previousSessionTitle: 'Therapy • Attachment & Emotional Patterns',
    previousSessionModality: '50 min • Relational Psychotherapy',
    clinician: 'Dr. Niva Jacob',
    nextSuggestedDateStr: '2026-10-14',
    nextSuggestedLabel: 'Wed, 14 Oct',
    nextSuggestedTime: '09:30 AM',
  },
  {
    id: 'p-3',
    name: 'Arjun & Maya',
    email: 'arjun.nair@techflow.io',
    phone: '+91 99120 55182',
    previousSessionTitle: 'Couple Therapy',
    previousSessionModality: '75 min • Emotionally Focused Therapy (EFT)',
    clinician: 'Dr. Niva Jacob',
    nextSuggestedDateStr: '2026-10-15',
    nextSuggestedLabel: 'Thu, 15 Oct',
    nextSuggestedTime: '12:00 PM',
  },
];

export const BookingWorkspace: React.FC = () => {
  const { 
    setActiveView, 
    bookAppointment, 
    bookingInitialPreselection,
    addToast
  } = useApp();

  // Intake Gate: "Have we met before?"
  const [patientMode, setPatientMode] = useState<'prompt' | 'new' | 'returning'>(() => {
    if (bookingInitialPreselection?.patientType === 'returning-patient') return 'returning';
    if (bookingInitialPreselection?.patientType === 'new-patient') return 'new';
    return 'prompt';
  });

  // Returning patient active profile
  const [activeReturningProfile, setActiveReturningProfile] = useState<ReturningPatientProfile>(
    SAMPLE_RETURNING_PATIENTS[0]
  );
  const [returningCustomTimeOpen, setReturningCustomTimeOpen] = useState(false);

  // New Patient Flow Step: 1 (Choose care), 2 (Choose date), 3 (Your details), 4 (Confirmed)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Care category for new patient flow
  const [careCategory, setCareCategory] = useState<CareCategory>(() => {
    const pre = bookingInitialPreselection?.serviceId;
    if (pre === 'consultation') return 'consultation';
    if (pre === 'couple-therapy' || pre === 'couples-therapy') return 'couples-therapy';
    if (pre) return 'therapy';
    return 'consultation';
  });

  // Service Selection
  const [selectedService, setSelectedService] = useState<Service>(() => {
    if (bookingInitialPreselection?.serviceId) {
      const match = SERVICES.find(s => s.id === bookingInitialPreselection.serviceId);
      if (match) return match;
    }
    return SERVICES.find(s => s.id === 'consultation') || SERVICES[0];
  });

  // Exact Days from User Specification: MON 12, TUE 13, WED 14, THU 15, FRI 16
  const dateOptions = [
    { dateStr: '2026-10-12', dayName: 'MON', dayNum: '12', label: 'Mon, 12 Oct', fullDate: 'Monday, 12 October 2026' },
    { dateStr: '2026-10-13', dayName: 'TUE', dayNum: '13', label: 'Tue, 13 Oct', fullDate: 'Tuesday, 13 October 2026' },
    { dateStr: '2026-10-14', dayName: 'WED', dayNum: '14', label: 'Wed, 14 Oct', fullDate: 'Wednesday, 14 October 2026' },
    { dateStr: '2026-10-15', dayName: 'THU', dayNum: '15', label: 'Thu, 15 Oct', fullDate: 'Thursday, 15 October 2026' },
    { dateStr: '2026-10-16', dayName: 'FRI', dayNum: '16', label: 'Fri, 16 Oct', fullDate: 'Friday, 16 October 2026' },
  ];

  const [selectedDate, setSelectedDate] = useState(dateOptions[1].dateStr); // Tue 13 Oct
  const [selectedTime, setSelectedTime] = useState<string>('10:30');

  // Exact Time Slots from User Specification
  const morningSlots = ['09:00', '09:30', '10:00', '10:30'];
  const afternoonSlots = ['12:00', '12:30', '01:00', '01:30'];

  // Form Fields
  const [consultingFor, setConsultingFor] = useState<string>(selectedService.name);
  const [sickness, setSickness] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Resulting confirmation
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  useEffect(() => {
    if (bookingInitialPreselection?.patientType) {
      if (bookingInitialPreselection.patientType === 'returning-patient') setPatientMode('returning');
      else if (bookingInitialPreselection.patientType === 'new-patient') setPatientMode('new');
    }
    if (bookingInitialPreselection?.serviceId) {
      const match = SERVICES.find(s => s.id === bookingInitialPreselection.serviceId);
      if (match) {
        setSelectedService(match);
        setConsultingFor(match.name);
        if (match.id === 'consultation') setCareCategory('consultation');
        else if (match.id === 'couple-therapy') setCareCategory('couples-therapy');
        else setCareCategory('therapy');
      }
    }
  }, [bookingInitialPreselection]);

  // Fast Rebook handler for returning patient
  const handleFastRebook = (customDate?: string, customTime?: string) => {
    const finalDate = customDate || activeReturningProfile.nextSuggestedDateStr;
    const rawTime = customTime || activeReturningProfile.nextSuggestedTime.replace(' AM', '').replace(' PM', '');

    const matchedService = SERVICES.find(s => 
      activeReturningProfile.previousSessionTitle.toLowerCase().includes(s.name.toLowerCase())
    ) || SERVICES.find(s => s.id === 'anxiety') || SERVICES[1];

    const newApt = bookAppointment({
      patientName: activeReturningProfile.name,
      patientPhone: activeReturningProfile.phone,
      patientEmail: activeReturningProfile.email,
      sickness: activeReturningProfile.previousSessionTitle,
      reason: `Returning patient session: ${activeReturningProfile.previousSessionTitle}`,
      consultingFor: activeReturningProfile.previousSessionTitle,
      serviceId: matchedService.id,
      clinicId: 'online',
      date: finalDate,
      time: rawTime,
      durationMin: matchedService.durationMin,
      fee: matchedService.fee,
      patientType: 'returning-patient',
    });

    setConfirmedBooking(newApt);
    setPatientMode('new');
    setCurrentStep(4);
  };

  const handleValidateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Please provide your full legal name';
    if (!phone.trim()) errors.phone = 'Please provide your contact phone number';
    if (!email.trim() || !email.includes('@')) errors.email = 'Valid email is required for encrypted room link';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const clinicalSickness = sickness.trim() || consultingFor;

    // Submit booking
    const newApt = bookAppointment({
      patientName: name.trim(),
      patientPhone: phone.trim(),
      patientEmail: email.trim(),
      patientAge: age ? parseInt(age, 10) : undefined,
      sickness: clinicalSickness,
      reason: sickness.trim() || undefined,
      consultingFor: consultingFor,
      serviceId: selectedService.id,
      clinicId: 'online',
      date: selectedDate,
      time: selectedTime,
      durationMin: selectedService.durationMin,
      fee: selectedService.fee,
      patientType: 'new-patient',
    });

    setConfirmedBooking(newApt);
    setCurrentStep(4);
  };

  const selectedDateObj = dateOptions.find(d => d.dateStr === selectedDate) || dateOptions[1];

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://telehealth.drnivajacob.com/room/${confirmedBooking?.referenceNo || 'secure-session'}`);
      addToast({
        title: 'Meeting Link Copied',
        message: 'The encrypted HD video link has been copied to your clipboard.',
        type: 'success',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#332B27] flex flex-col font-sans-clean selection:bg-[#F1E3A6]">
      
      {/* Top Header Bar */}
      <header className="border-b border-[#332B27]/10 bg-[#FAF7F0]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (patientMode === 'returning') {
                  setPatientMode('prompt');
                } else if (currentStep > 1 && currentStep < 4) {
                  setCurrentStep(currentStep - 1);
                } else {
                  setActiveView('patient-home');
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#332B27]/70 hover:text-[#332B27] transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{patientMode === 'prompt' || currentStep === 1 ? 'Back to Practice' : 'Previous Step'}</span>
            </button>

            <span className="text-neutral-300">/</span>

            <span className="font-editorial text-sm font-semibold tracking-wider text-[#332B27] uppercase">
              Dr. Niva Jacob Practice
            </span>
          </div>

          {/* Mode Switcher pill */}
          {patientMode !== 'prompt' && currentStep < 4 && (
            <button
              onClick={() => setPatientMode('prompt')}
              className="text-xs text-[#332B27]/60 hover:text-[#332B27] font-sans-clean flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change patient status</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 md:py-16">
        
        {/* ================= STAGE 0: "Have we met before?" GATEWAY ================= */}
        {patientMode === 'prompt' && (
          <div className="max-w-2xl mx-auto text-center py-6 sm:py-12 animate-in fade-in">
            
            <p className="font-editorial italic text-2xl sm:text-3xl text-[#332B27]/60 font-light mb-2">
              Welcome.
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#332B27] font-normal tracking-tight mb-12">
              Have we met before?
            </h1>

            {/* 2 Big Choice Cards from User Specification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              
              {/* Option 1: I'm a new patient */}
              <div 
                onClick={() => {
                  setPatientMode('new');
                  setCurrentStep(1);
                }}
                className="p-8 sm:p-10 rounded-3xl bg-white border border-[#332B27]/15 shadow-xs hover:shadow-md hover:border-[#B89552]/60 transition-all duration-300 cursor-pointer flex flex-col justify-between group min-h-[220px]"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F1E3A6] text-[#332B27] flex items-center justify-center mb-6">
                    <User className="w-6 h-6" />
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#332B27] group-hover:text-[#B89552] transition-colors">
                    I'm a new patient
                  </h2>
                  <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean mt-2 leading-relaxed">
                    First-time intake, preliminary evaluation, or beginning ongoing psychotherapy.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#332B27]/10 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-[#332B27] group-hover:text-[#B89552] group-hover:underline">
                    Start a consultation →
                  </span>
                </div>
              </div>

              {/* Option 2: I'm a returning patient */}
              <div 
                onClick={() => {
                  setPatientMode('returning');
                  setReturningCustomTimeOpen(false);
                }}
                className="p-8 sm:p-10 rounded-3xl bg-white border border-[#332B27]/15 shadow-xs hover:shadow-md hover:border-[#B89552]/60 transition-all duration-300 cursor-pointer flex flex-col justify-between group min-h-[220px]"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#332B27] text-white flex items-center justify-center mb-6">
                    <UserCheck className="w-6 h-6 text-[#F1E3A6]" />
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#332B27] group-hover:text-[#B89552] transition-colors">
                    I'm a returning patient
                  </h2>
                  <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean mt-2 leading-relaxed">
                    Fast rebooking for ongoing psychotherapy, couple review, or follow-up consultations.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#332B27]/10 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-[#332B27] group-hover:text-[#B89552] group-hover:underline">
                    Rebook a session →
                  </span>
                </div>
              </div>

            </div>

            <p className="text-xs text-[#332B27]/50 font-sans-clean mt-12">
              All appointments occur via private end-to-end encrypted HD video rooms.
            </p>
          </div>
        )}


        {/* ================= RETURNING PATIENT FASTER FLOW ================= */}
        {patientMode === 'returning' && (
          <div className="max-w-xl mx-auto py-6 animate-in fade-in">
            
            {/* Quick Profile Switcher for existing client demo */}
            <div className="mb-6 flex items-center justify-between p-2 rounded-2xl bg-white border border-[#332B27]/10 text-xs font-sans-clean shadow-2xs">
              <span className="text-[#332B27]/60 pl-2">Select returning client demo:</span>
              <div className="flex items-center gap-1">
                {SAMPLE_RETURNING_PATIENTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveReturningProfile(p);
                      setReturningCustomTimeOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      activeReturningProfile.id === p.id
                        ? 'bg-[#332B27] text-white font-semibold'
                        : 'text-[#332B27]/70 hover:text-[#332B27]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Faster Flow Card from Exact User Specification */}
            <div className="p-8 sm:p-12 rounded-[36px] bg-white border border-[#332B27]/15 shadow-sm space-y-8">
              
              <div>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#332B27] font-normal">
                  Welcome back, {activeReturningProfile.name}.
                </h2>
                <p className="text-xs text-[#332B27]/60 font-sans-clean mt-1">
                  We're glad to continue your healing journey together.
                </p>
              </div>

              {/* Your previous session */}
              <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89552] font-sans-clean block">
                  Your previous session
                </span>
                <p className="font-editorial text-2xl text-[#332B27] font-medium">
                  {activeReturningProfile.previousSessionTitle}
                </p>
                <p className="text-xs text-[#332B27]/70 font-sans-clean">
                  {activeReturningProfile.clinician} • {activeReturningProfile.previousSessionModality}
                </p>
              </div>

              {/* Book another session */}
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#B89552] font-sans-clean block">
                  Book another session
                </span>

                {/* Primary Fast Button: [ Next available ] */}
                <button
                  onClick={() => handleFastRebook()}
                  className="w-full p-5 sm:p-6 rounded-2xl bg-[#332B27] text-white hover:bg-[#4a3f3a] transition-all shadow-md hover:shadow-lg flex items-center justify-between group cursor-pointer"
                >
                  <div className="text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#F1E3A6] block font-sans-clean">
                      [ Next available ]
                    </span>
                    <span className="font-editorial text-2xl sm:text-3xl font-normal text-white mt-1 block">
                      {activeReturningProfile.nextSuggestedLabel} • {activeReturningProfile.nextSuggestedTime}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-5 h-5 text-[#F1E3A6]" />
                  </div>
                </button>

                {/* Secondary Button: [ SELECT ANOTHER TIME ] */}
                <button
                  onClick={() => setReturningCustomTimeOpen(!returningCustomTimeOpen)}
                  className="w-full py-4 rounded-2xl bg-white border border-[#332B27]/20 hover:border-[#332B27] text-[#332B27] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  {returningCustomTimeOpen ? 'Hide time picker' : '[ SELECT ANOTHER TIME ]'}
                </button>
              </div>

              {/* Optional Slot Picker for returning client */}
              <AnimatePresence>
                {returningCustomTimeOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 border-t border-[#332B27]/10 space-y-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#B89552] font-sans-clean mb-3">
                          Choose Alternative Date
                        </p>
                        <div className="grid grid-cols-5 gap-2 font-sans-clean text-center">
                          {dateOptions.map((d) => (
                            <button
                              key={d.dateStr}
                              onClick={() => setSelectedDate(d.dateStr)}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                selectedDate === d.dateStr
                                  ? 'bg-[#332B27] text-white border-[#332B27] shadow-xs'
                                  : 'bg-[#FAF7F0] border-[#332B27]/10 hover:border-[#332B27]/30 text-[#332B27]'
                              }`}
                            >
                              <span className="text-[10px] font-bold block uppercase">{d.dayName}</span>
                              <span className="text-lg font-mono-tabular font-bold block">{d.dayNum}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Morning Slots */}
                      <div>
                        <p className="text-xs font-semibold text-[#332B27]/50 uppercase tracking-wider font-sans-clean mb-2.5">
                          Morning
                        </p>
                        <div className="grid grid-cols-4 gap-2 font-mono-tabular">
                          {morningSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => handleFastRebook(selectedDate, time)}
                              className="py-2.5 rounded-xl border border-[#332B27]/10 bg-[#FAF7F0] hover:bg-[#332B27] hover:text-white transition-all text-xs font-semibold cursor-pointer"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Afternoon Slots */}
                      <div>
                        <p className="text-xs font-semibold text-[#332B27]/50 uppercase tracking-wider font-sans-clean mb-2.5">
                          Afternoon
                        </p>
                        <div className="grid grid-cols-4 gap-2 font-mono-tabular">
                          {afternoonSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => handleFastRebook(selectedDate, time)}
                              className="py-2.5 rounded-xl border border-[#332B27]/10 bg-[#FAF7F0] hover:bg-[#332B27] hover:text-white transition-all text-xs font-semibold cursor-pointer"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        )}


        {/* ================= NEW PATIENT FLOW (3-STEP) ================= */}
        {patientMode === 'new' && (
          <div>
            {/* Header & 3-Step Navigation */}
            <div className="text-center mb-10 md:mb-14">
              <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#332B27] font-normal uppercase tracking-tight mb-6">
                BOOK A CONSULTATION
              </h1>

              {/* 01 Choose care  →  02 Choose date  →  03 Your details */}
              <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-xl mx-auto text-xs sm:text-sm font-sans-clean">
                <button
                  onClick={() => currentStep > 1 && currentStep < 4 && setCurrentStep(1)}
                  className={`flex items-center gap-2 transition-colors ${
                    currentStep === 1 
                      ? 'font-bold text-[#332B27]' 
                      : currentStep > 1 
                      ? 'text-[#332B27]/70 hover:text-[#332B27] cursor-pointer' 
                      : 'text-neutral-400'
                  }`}
                >
                  <span className="font-mono-tabular font-semibold">01</span>
                  <span>Choose care</span>
                </button>

                <span className="text-neutral-300 text-base">→</span>

                <button
                  onClick={() => currentStep > 2 && currentStep < 4 && setCurrentStep(2)}
                  className={`flex items-center gap-2 transition-colors ${
                    currentStep === 2 
                      ? 'font-bold text-[#332B27]' 
                      : currentStep > 2 
                      ? 'text-[#332B27]/70 hover:text-[#332B27] cursor-pointer' 
                      : 'text-neutral-400'
                  }`}
                >
                  <span className="font-mono-tabular font-semibold">02</span>
                  <span>Choose date</span>
                </button>

                <span className="text-neutral-300 text-base">→</span>

                <div
                  className={`flex items-center gap-2 ${
                    currentStep === 3 
                      ? 'font-bold text-[#332B27]' 
                      : 'text-neutral-400'
                  }`}
                >
                  <span className="font-mono-tabular font-semibold">03</span>
                  <span>Your details</span>
                </div>
              </div>
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              
              {/* Contextual Live Summary Card */}
              <aside className="lg:col-span-4 flex flex-col space-y-6">
                <div className="p-6 rounded-3xl bg-white border border-[#332B27]/10 shadow-xs space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#B89552] font-sans-clean">
                    Session Summary
                  </p>

                  <div className="flex items-center gap-3">
                    <img
                      src={drNivaPortrait}
                      alt={DOCTOR_INFO.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-neutral-200"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#332B27]">{DOCTOR_INFO.name}</p>
                      <p className="text-[11px] text-[#332B27]/60 font-sans-clean">{DOCTOR_INFO.title}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#332B27]/10 text-xs font-sans-clean">
                    <div>
                      <p className="text-[#332B27]/50 text-[10px] uppercase font-semibold">Care Selection</p>
                      <p className="font-medium text-[#332B27] text-sm mt-0.5">{selectedService.name}</p>
                      <p className="text-[11px] text-[#332B27]/60 font-mono-tabular mt-0.5">
                        {selectedService.durationMin} mins · {selectedService.formattedFee}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#332B27]/50 text-[10px] uppercase font-semibold">Format</p>
                      <p className="font-medium text-[#332B27] mt-0.5 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#B89552]" />
                        <span>100% Online HD Teletherapy</span>
                      </p>
                    </div>

                    {selectedTime && (
                      <div>
                        <p className="text-[#332B27]/50 text-[10px] uppercase font-semibold">Scheduled Window</p>
                        <p className="font-medium text-[#332B27] font-mono-tabular mt-0.5">
                          {selectedDateObj.label} at {selectedTime} IST
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-3 border-t border-[#332B27]/10">
                      <span className="text-[#332B27]/70 font-medium">Session Fee:</span>
                      <span className="font-semibold text-[#332B27] font-mono-tabular text-base">
                        {selectedService.formattedFee}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#332B27]/10">
                    <p className="text-[11px] text-[#332B27]/60 leading-snug flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#B89552] shrink-0" />
                      <span>Confidential, HIPAA-compliant online teletherapy.</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F1E3A6]/40 border border-[#332B27]/10 text-xs text-[#332B27] font-sans-clean space-y-1">
                  <p className="font-semibold">Unhurried Presence</p>
                  <p className="text-[#332B27]/70 leading-relaxed font-light">
                    Zero waiting rooms. You meet with Dr. Niva directly for the full scheduled duration.
                  </p>
                </div>
              </aside>


              {/* 3-Step Container */}
              <section className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-[36px] border border-[#332B27]/15 shadow-sm min-h-[520px] flex flex-col justify-between">
                
                {/* STEP 01: Choose care */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold tracking-wider uppercase text-[#B89552] font-sans-clean mb-1">
                        Step 01
                      </p>
                      <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[#332B27]">
                        Choose care
                      </h3>
                      <p className="text-xs sm:text-sm text-[#332B27]/60 font-sans-clean mt-1">
                        Select between an initial consultation, specialized individual therapy, or couple relational therapy.
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      
                      {/* 1. Consultation */}
                      <div
                        onClick={() => {
                          setCareCategory('consultation');
                          const srv = SERVICES.find(s => s.id === 'consultation') || SERVICES[0];
                          setSelectedService(srv);
                          setConsultingFor(srv.name);
                        }}
                        className={`p-6 sm:p-7 rounded-2xl border transition-all cursor-pointer ${
                          careCategory === 'consultation'
                            ? 'border-[#332B27] bg-[#FAF7F0] ring-1 ring-[#332B27]'
                            : 'border-[#332B27]/15 bg-white hover:border-[#332B27]/40 hover:bg-[#FAF7F0]/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                          <h4 className="font-editorial text-2xl font-medium text-[#332B27]">
                            Consultation
                          </h4>
                          <span className="font-mono-tabular text-sm font-semibold text-[#332B27]">
                            20 min • ₹1,500
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed">
                          A first step towards understanding what you're going through.
                        </p>
                      </div>

                      {/* 2. Therapy */}
                      <div
                        onClick={() => {
                          setCareCategory('therapy');
                          if (selectedService.id === 'consultation' || selectedService.id === 'couple-therapy') {
                            const srv = SERVICES.find(s => s.id === 'anxiety') || SERVICES[1];
                            setSelectedService(srv);
                            setConsultingFor(srv.name);
                          }
                        }}
                        className={`p-6 sm:p-7 rounded-2xl border transition-all cursor-pointer ${
                          careCategory === 'therapy'
                            ? 'border-[#332B27] bg-[#FAF7F0] ring-1 ring-[#332B27]'
                            : 'border-[#332B27]/15 bg-white hover:border-[#332B27]/40 hover:bg-[#FAF7F0]/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                          <h4 className="font-editorial text-2xl font-medium text-[#332B27]">
                            Therapy
                          </h4>
                          <span className="font-mono-tabular text-sm font-semibold text-[#332B27]">
                            50 min • from ₹3,000
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed mb-4">
                          Comprehensive individual psychotherapy for anxiety, attachment patterns, intimacy, or emotional regulation.
                        </p>

                        {/* Modality options */}
                        {careCategory === 'therapy' && (
                          <div className="pt-4 border-t border-[#332B27]/10 mt-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#B89552] font-sans-clean">
                              Choose Therapy Focus:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { id: 'anxiety', label: 'Anxiety', fee: '₹3,000' },
                                { id: 'attachment-patterns', label: 'Attachment & Emotional Patterns', fee: '₹3,000' },
                                { id: 'sexual-health', label: 'Sexual Health & Intimacy', fee: '₹3,000' },
                                { id: 'personality-patterns', label: 'Personality & Emotional Patterns', fee: '₹3,000' },
                                { id: 'life-transitions', label: 'Life Transitions & Other Concerns', fee: '₹3,000' },
                              ].map((th) => {
                                const isFocus = selectedService.id === th.id;
                                return (
                                  <button
                                    key={th.id}
                                    type="button"
                                    onClick={() => {
                                      const srv = SERVICES.find(s => s.id === th.id);
                                      if (srv) {
                                        setSelectedService(srv);
                                        setConsultingFor(srv.name);
                                      }
                                    }}
                                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                                      isFocus
                                        ? 'bg-white border-[#332B27] text-[#332B27] font-semibold shadow-xs ring-1 ring-[#332B27]'
                                        : 'bg-white/90 border-[#332B27]/15 text-[#332B27]/80 hover:border-[#332B27]/40'
                                    }`}
                                  >
                                    <span>{th.label}</span>
                                    <span className="font-mono-tabular text-[11px] text-[#332B27]/50 shrink-0 ml-2">{th.fee}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Couples Therapy */}
                      <div
                        onClick={() => {
                          setCareCategory('couples-therapy');
                          const srv = SERVICES.find(s => s.id === 'couple-therapy') || SERVICES[3];
                          setSelectedService(srv);
                          setConsultingFor(srv.name);
                        }}
                        className={`p-6 sm:p-7 rounded-2xl border transition-all cursor-pointer ${
                          careCategory === 'couples-therapy'
                            ? 'border-[#332B27] bg-[#FAF7F0] ring-1 ring-[#332B27]'
                            : 'border-[#332B27]/15 bg-white hover:border-[#332B27]/40 hover:bg-[#FAF7F0]/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                          <h4 className="font-editorial text-2xl font-medium text-[#332B27]">
                            Couples Therapy
                          </h4>
                          <span className="font-mono-tabular text-sm font-semibold text-[#332B27]">
                            75 min • ₹4,000
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed">
                          An emotionally focused relational space for partners to de-escalate cycles, restore trust & renew intimacy.
                        </p>
                      </div>

                    </div>

                    <div className="pt-6 flex justify-end items-center border-t border-[#332B27]/10">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#332B27] text-white text-xs font-semibold tracking-wide hover:bg-[#4a3f3a] transition-colors shadow-xs cursor-pointer"
                      >
                        <span>Choose date & time</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}


                {/* STEP 02: Choose date (EXACT SPECIFICATION: "When would you like to come in?") */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold tracking-wider uppercase text-[#B89552] font-sans-clean mb-1">
                        Step 02
                      </p>
                      <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[#332B27]">
                        When would you like to come in?
                      </h3>
                      <p className="text-xs sm:text-sm text-[#332B27]/60 font-sans-clean mt-1">
                        Select an available consultation day and preferred time slot.
                      </p>
                    </div>

                    {/* Clean Calendar Row: MON 12, TUE 13, WED 14, THU 15, FRI 16 */}
                    <div className="pt-2">
                      <div className="grid grid-cols-5 gap-2 sm:gap-3">
                        {dateOptions.map((d) => {
                          const isSelected = selectedDate === d.dateStr;
                          return (
                            <div
                              key={d.dateStr}
                              onClick={() => setSelectedDate(d.dateStr)}
                              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#332B27] bg-[#332B27] text-white shadow-xs'
                                  : 'border-[#332B27]/15 bg-[#FAF7F0] hover:bg-neutral-100 hover:border-[#332B27]/30 text-[#332B27]'
                              }`}
                            >
                              <span className={`text-[11px] font-bold tracking-wider block uppercase ${isSelected ? 'text-[#F1E3A6]' : 'text-[#332B27]/50'}`}>
                                {d.dayName}
                              </span>
                              <span className="text-xl sm:text-2xl font-mono-tabular font-bold block mt-1">
                                {d.dayNum}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Exact Morning & Afternoon Slots from User Specification */}
                    <div className="space-y-6 pt-2">
                      {/* Morning */}
                      <div>
                        <p className="text-xs font-semibold text-[#332B27]/50 uppercase tracking-wider font-sans-clean mb-3">
                          Morning
                        </p>
                        <div className="grid grid-cols-4 gap-2.5 font-mono-tabular">
                          {morningSlots.map((time) => {
                            const isSelected = selectedTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={`py-3 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#332B27] text-white shadow-xs scale-[1.02]'
                                    : 'bg-[#FAF7F0] text-[#332B27] hover:bg-neutral-100 border border-[#332B27]/15'
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Afternoon */}
                      <div>
                        <p className="text-xs font-semibold text-[#332B27]/50 uppercase tracking-wider font-sans-clean mb-3">
                          Afternoon
                        </p>
                        <div className="grid grid-cols-4 gap-2.5 font-mono-tabular">
                          {afternoonSlots.map((time) => {
                            const isSelected = selectedTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={`py-3 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#332B27] text-white shadow-xs scale-[1.02]'
                                    : 'bg-[#FAF7F0] text-[#332B27] hover:bg-neutral-100 border border-[#332B27]/15'
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-6 flex justify-between items-center border-t border-[#332B27]/10">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#332B27]/70 hover:text-[#332B27] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <div className="flex items-center gap-4">
                        <span className="hidden sm:inline text-xs text-[#332B27]/60 font-mono-tabular">
                          {selectedDateObj.label} @ {selectedTime} IST
                        </span>
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#332B27] text-white text-xs font-semibold tracking-wide hover:bg-[#4a3f3a] transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Proceed to your details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}


                {/* STEP 03: Your details */}
                {currentStep === 3 && (
                  <form onSubmit={handleValidateAndSubmit} className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold tracking-wider uppercase text-[#B89552] font-sans-clean mb-1">
                        Step 03
                      </p>
                      <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[#332B27]">
                        Your details
                      </h3>
                      <p className="text-xs sm:text-sm text-[#332B27]/60 font-sans-clean mt-1">
                        We send your private teletherapy video room link to this email and phone.
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#332B27]/80 mb-1.5 font-sans-clean">
                            Full Legal Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Rahul Mehta"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                              formErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-[#332B27]/20 focus:border-[#332B27]'
                            }`}
                          />
                          {formErrors.name && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#332B27]/80 mb-1.5 font-sans-clean">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            placeholder="+91 98860 31256"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                              formErrors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-[#332B27]/20 focus:border-[#332B27]'
                            }`}
                          />
                          {formErrors.phone && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-[#332B27]/80 mb-1.5 font-sans-clean">
                            Email Address (for confidential link) *
                          </label>
                          <input
                            type="email"
                            placeholder="rahul.mehta@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                              formErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-[#332B27]/20 focus:border-[#332B27]'
                            }`}
                          />
                          {formErrors.email && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#332B27]/80 mb-1.5 font-sans-clean">
                            Age (Optional)
                          </label>
                          <input
                            type="number"
                            placeholder="32"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-xl border border-[#332B27]/20 bg-white focus:outline-none focus:border-[#332B27] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10">
                        <label className="block text-xs font-semibold text-[#B89552] uppercase tracking-wider mb-1.5 font-sans-clean">
                          What brings you in? (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Panic attacks, boundary conflicts, or psychosexual concerns"
                          value={sickness}
                          onChange={(e) => setSickness(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border border-[#332B27]/15 bg-white focus:outline-none focus:border-[#332B27] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center border-t border-[#332B27]/10">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#332B27]/70 hover:text-[#332B27] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#332B27] text-white text-xs font-semibold tracking-wide hover:bg-[#4a3f3a] transition-colors shadow-md cursor-pointer"
                      >
                        <span>Reserve & Confirm • {selectedService.formattedFee}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}


                {/* STEP 04: Confirmed Screen */}
                {currentStep === 4 && confirmedBooking && (
                  <div className="space-y-6 text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-[#F1E3A6] text-[#332B27] flex items-center justify-center mx-auto shadow-xs">
                      <Check className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#B89552] font-sans-clean">
                        Session Reserved
                      </span>
                      <h3 className="font-editorial text-3xl sm:text-4xl font-normal text-[#332B27] mt-1">
                        We look forward to meeting you.
                      </h3>
                      <p className="text-sm text-[#332B27]/70 font-sans-clean mt-2 max-w-md mx-auto">
                        Your private teletherapy link has been sent to <strong>{confirmedBooking.patientEmail}</strong>.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/15 text-left max-w-md mx-auto space-y-3 font-sans-clean text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-[#332B27]/10">
                        <span className="text-[#332B27]/50 font-semibold uppercase text-[10px]">Reference</span>
                        <span className="font-mono-tabular font-bold text-[#332B27]">{confirmedBooking.referenceNo}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#332B27]/60">Care Offering:</span>
                        <span className="font-semibold text-[#332B27]">{confirmedBooking.consultingFor}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#332B27]/60">Date & Time:</span>
                        <span className="font-semibold text-[#332B27] font-mono-tabular">
                          {confirmedBooking.date} at {confirmedBooking.time} IST
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#332B27]/60">Duration:</span>
                        <span className="font-mono-tabular text-[#332B27] font-medium">{confirmedBooking.durationMin} minutes</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleCopyLink}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-[#332B27]/20 text-[#332B27] text-xs font-semibold hover:border-[#332B27] transition-colors shadow-2xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#332B27]/60" />
                        <span>Copy Video Room Link</span>
                      </button>

                      <button
                        onClick={() => setActiveView('patient-home')}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#332B27] text-white text-xs font-semibold hover:bg-[#4a3f3a] transition-colors shadow-xs cursor-pointer"
                      >
                        <span>Return to Homepage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </section>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
