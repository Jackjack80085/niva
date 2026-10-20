import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appointment, BlockedSlot, DayAvailability, AppView, AdminTab, AppointmentStatus, ServiceType, ClinicalConsultationNote, DigitalPrescription, PatientType } from '../types';
import { 
  INITIAL_APPOINTMENTS, 
  INITIAL_BLOCKED_SLOTS, 
  INITIAL_WEEKLY_AVAILABILITY, 
  CURRENT_DATE_STRING,
  INITIAL_CONSULTATION_NOTES,
  INITIAL_DIGITAL_PRESCRIPTIONS
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'alert';
}

export type Permission = 'appointments' | 'availability' | 'records' | 'tasks';
export interface Associate { id: string; name: string; email: string; pin: string; enabled: boolean; permissions: Permission[] }
export interface PracticeTask { id: string; title: string; assigneeId: string; done: boolean }
function readSaved<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
interface AppContextType {
  staffId: string;
  associates: Associate[];
  saveAssociates: (items: Associate[]) => void;
  tasks: PracticeTask[];
  saveTasks: (items: PracticeTask[]) => void;
  can: (permission: Permission) => boolean;
  setMeetingUrl: (id: string, url: string) => void;
  timeOff: {id: string; start: string; end: string; reason: string}[];
  saveTimeOff: (items: {id: string; start: string; end: string; reason: string}[]) => void;

  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  weeklyAvailability: DayAvailability[];
  activeView: AppView;
  adminTab: AdminTab;
  currentDate: string;
  selectedAppointment: Appointment | null;
  isSideSheetOpen: boolean;
  isCommandPaletteOpen: boolean;
  toasts: ToastMessage[];
  bookingInitialPreselection?: {
    serviceId?: ServiceType;
    clinicId?: string;
    patientType?: PatientType;
  };
  
  // Authentication
  isAdminAuthenticated: boolean;
  adminPasscode: string;
  verifyAdminPasscode: (code: string) => boolean;
  logoutAdmin: () => void;

  // Clinical Notes & Prescriptions
  consultationNotes: ClinicalConsultationNote[];
  digitalPrescriptions: DigitalPrescription[];
  addConsultationNote: (note: Omit<ClinicalConsultationNote, 'id' | 'createdAt'>) => ClinicalConsultationNote;
  addDigitalPrescription: (rx: Omit<DigitalPrescription, 'id' | 'createdAt'>) => DigitalPrescription;
  
  // Patient Detail Modal
  selectedPatientForDetail: Appointment | null;
  isPatientModalOpen: boolean;
  openPatientModal: (patient: Appointment) => void;
  closePatientModal: () => void;

  // Actions
  setActiveView: (view: AppView) => void;
  setAdminTab: (tab: AdminTab) => void;
  setCurrentDate: (date: string) => void;
  openBooking: (preselect?: { serviceId?: ServiceType; clinicId?: string; patientType?: PatientType }) => void;
  openSideSheet: (appointment: Appointment) => void;
  closeSideSheet: () => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Core Domain Operations
  bookAppointment: (payload: Omit<Appointment, 'id' | 'referenceNo' | 'createdAt' | 'status'>) => Appointment;
  rescheduleAppointment: (appointmentId: string, newDate: string, newTime: string) => void;
  updateAppointmentStatus: (appointmentId: string, newStatus: AppointmentStatus) => void;
  blockSlot: (date: string, time: string, clinicId?: string, reason?: string) => void;
  unblockSlot: (date: string, time: string) => void;
  toggleBlockSlot: (date: string, time: string, clinicId?: string, reason?: string) => void;
  isSlotAvailable: (date: string, time: string, clinicId?: string, duration?: number, excludeId?: string) => boolean;
  updateDayAvailability: (day: string, updates: Partial<DayAvailability>) => void;
  duplicateScheduleToAllWeekdays: (sourceDay: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => readSaved('niva_appointments', INITIAL_APPOINTMENTS.map(a => ({...a, clinicId: 'online'}))));
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() => readSaved('niva_blocks', INITIAL_BLOCKED_SLOTS));
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>(() => readSaved('niva_hours', INITIAL_WEEKLY_AVAILABILITY));
  
  const [staffId, setStaffId] = useState(() => sessionStorage.getItem('niva_staff') || 'doctor');
  const [associates, saveAssociates] = useState<Associate[]>(() => readSaved('niva_associates', []));
  const [tasks, saveTasks] = useState<PracticeTask[]>(() => readSaved('niva_tasks', []));
  const [timeOff, saveTimeOff] = useState<{id: string; start: string; end: string; reason: string}[]>(() => readSaved('niva_leave', []));
  const can = (permission: Permission) => isAdminAuthenticated && (staffId === 'doctor' || associates.some(a => a.id === staffId && a.enabled && a.permissions.includes(permission)));
  useEffect(() => { for (const [key, value] of Object.entries({niva_appointments: appointments, niva_blocks: blockedSlots, niva_hours: weeklyAvailability, niva_associates: associates, niva_tasks: tasks, niva_leave: timeOff})) localStorage.setItem(key, JSON.stringify(value)); }, [appointments, blockedSlots, weeklyAvailability, associates, tasks, timeOff]);
  const setMeetingUrl = (id: string, url: string) => { if (!can('appointments')) return; setAppointments(prev => prev.map(a => a.id === id ? {...a, meetingUrl: url} : a)); };
  // Clinical Notes & Prescriptions State
  const [consultationNotes, setConsultationNotes] = useState<ClinicalConsultationNote[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dr_niva_consultation_notes');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_CONSULTATION_NOTES;
  });

  const [digitalPrescriptions, setDigitalPrescriptions] = useState<DigitalPrescription[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dr_niva_digital_prescriptions');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_DIGITAL_PRESCRIPTIONS;
  });

  // Save notes and prescriptions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dr_niva_consultation_notes', JSON.stringify(consultationNotes));
    }
  }, [consultationNotes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dr_niva_digital_prescriptions', JSON.stringify(digitalPrescriptions));
    }
  }, [digitalPrescriptions]);

  // Passcode verification state
  const adminPasscode = '2026';
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dr_niva_admin_auth') === 'true';
    }
    return false;
  });

  const verifyAdminPasscode = (code: string): boolean => {
    const associate = associates.find(a => a.enabled && a.pin === code.trim());
    if (code.trim() === adminPasscode || associate) {
      const id = code.trim() === adminPasscode ? 'doctor' : associate!.id;
      setStaffId(id); sessionStorage.setItem('niva_staff', id);
      setIsAdminAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dr_niva_admin_auth', 'true');
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dr_niva_admin_auth');
    }
    setActiveView('admin-login');
  };

  // Patient Detail Modal state
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Appointment | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);

  const openPatientModal = (patient: Appointment) => {
    if (!can('records')) return;
    setSelectedPatientForDetail(patient);
    setIsPatientModalOpen(true);
  };

  const closePatientModal = () => {
    setIsPatientModalOpen(false);
    setSelectedPatientForDetail(null);
  };

  const addConsultationNote = (noteData: Omit<ClinicalConsultationNote, 'id' | 'createdAt'>): ClinicalConsultationNote => {
    if (!can('records')) throw new Error('Clinical record access is restricted.');
    const newNote: ClinicalConsultationNote = {
      ...noteData,
      id: 'note-' + crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setConsultationNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const addDigitalPrescription = (rxData: Omit<DigitalPrescription, 'id' | 'createdAt'>): DigitalPrescription => {
    if (!can('records') || staffId !== 'doctor') throw new Error('Only the doctor can prescribe.');
    const newRx: DigitalPrescription = {
      ...rxData,
      id: 'rx-' + crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setDigitalPrescriptions((prev) => [newRx, ...prev]);
    return newRx;
  };

  const [activeView, setActiveViewState] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        // If not authenticated, open passcode screen
        const isAuth = sessionStorage.getItem('dr_niva_admin_auth') === 'true';
        return isAuth ? 'admin' : 'admin-login';
      }
      if (hash === '#admin-portal' || hash === '#portal' || hash === '#login') return 'admin-login';
      if (hash === '#booking' || hash === '#book') return 'patient-booking';
    }
    return 'patient-home';
  });

  const setActiveView = (view: AppView) => {
    // Enforce passcode verification before accessing admin
    if (view === 'admin' && !isAdminAuthenticated) {
      setActiveViewState('admin-login');
      if (typeof window !== 'undefined') {
        window.location.hash = 'admin-portal';
      }
      return;
    }

    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      if (view === 'admin') {
        window.location.hash = 'admin';
      } else if (view === 'admin-login') {
        window.location.hash = 'admin-portal';
      } else if (view === 'patient-booking') {
        window.location.hash = 'booking';
      } else if (view === 'patient-home') {
        if (['#admin', '#admin-portal', '#portal', '#booking', '#book'].includes(window.location.hash)) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  };

  // Sync hash changes from browser back/forward or manual hash entry
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        if (sessionStorage.getItem('dr_niva_admin_auth') === 'true') {
          setActiveViewState('admin');
        } else {
          setActiveViewState('admin-login');
        }
      } else if (hash === '#admin-portal' || hash === '#portal' || hash === '#login') {
        setActiveViewState('admin-login');
      } else if (hash === '#booking' || hash === '#book') {
        setActiveViewState('patient-booking');
      } else if (hash === '#home' || hash === '' || hash === '#') {
        setActiveViewState('patient-home');
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isAdminAuthenticated]);

  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [currentDate, setCurrentDate] = useState<string>(CURRENT_DATE_STRING);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [bookingInitialPreselection, setBookingInitialPreselection] = useState<{
    serviceId?: ServiceType;
    clinicId?: string;
    patientType?: PatientType;
  } | undefined>(undefined);

  // Keyboard shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        if (isSideSheetOpen) {
          setIsSideSheetOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSideSheetOpen]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openBooking = (preselect?: { serviceId?: ServiceType; clinicId?: string; patientType?: PatientType }) => {
    setBookingInitialPreselection(preselect);
    setActiveView('patient-booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSideSheet = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsSideSheetOpen(true);
  };

  const closeSideSheet = () => {
    setIsSideSheetOpen(false);
  };

  const minutes = (time: string) => Number(time.split(':')[0]) * 60 + Number(time.split(':')[1]);
  const isSlotAvailable = (date: string, time: string, clinicId?: string, duration = 20, excludeId?: string): boolean => {
    if (new Date(`${date}T${time}:00+05:30`).getTime() <= Date.now()) return false;
    const config = weeklyAvailability.find(d => d.day === new Date(date + 'T12:00:00').toLocaleDateString('en-US', {weekday: 'long'}));
    if (!config?.enabled || minutes(time) < minutes(config.startTime) || minutes(time) + duration > minutes(config.endTime)) return false;
    if (timeOff.some(t => date >= t.start && date <= t.end)) return false;
    if (blockedSlots.some(b => b.date === date && minutes(time) < minutes(b.time) + 30 && minutes(time) + duration > minutes(b.time))) return false;
    return !appointments.some(a => a.id !== excludeId && a.date === date && !['cancelled', 'rejected'].includes(a.status) && minutes(time) < minutes(a.time) + a.durationMin && minutes(time) + duration > minutes(a.time));
  };

  const bookAppointment = (payload: Omit<Appointment, 'id' | 'referenceNo' | 'createdAt' | 'status'>): Appointment => {
    if (!isSlotAvailable(payload.date, payload.time, 'online', payload.durationMin)) throw new Error('This time is no longer available. Choose another slot.');
    const nextRefNum = 1042 + appointments.length;
    const newAppointment: Appointment = {
      ...payload,
      id: 'apt-' + Math.random().toString(36).substring(2, 9),
      referenceNo: `APT-${nextRefNum}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      history: [
        {
          date: 'Today',
          type: 'Online Self-Booking',
          summary: `Booked ${payload.serviceId} consultation for ${payload.time}.`,
        },
      ],
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    addToast({
      title: 'Request received',
      message: `Pending approval for ${payload.patientName} at ${payload.time} on ${payload.date}.`,
      type: 'success',
    });

    return newAppointment;
  };

  const rescheduleAppointment = (appointmentId: string, newDate: string, newTime: string) => {
    if (!can('appointments')) return;
    const target = appointments.find(a => a.id === appointmentId);
    if (!target || !isSlotAvailable(newDate, newTime, 'online', target.durationMin, appointmentId)) { addToast({title: 'Unavailable time', message: 'Choose an available future slot.', type: 'alert'}); return; }
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === appointmentId) {
          const updated: Appointment = {
            ...apt,
            date: newDate,
            time: newTime,
            status: 'confirmed',
            history: [
              ...(apt.history || []),
              {
                date: 'Today',
                type: 'Rescheduled by Clinic',
                summary: `Moved from ${apt.date} ${apt.time} to ${newDate} ${newTime}.`,
              },
            ],
          };
          if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment(updated);
          }
          return updated;
        }
        return apt;
      })
    );

    addToast({
      title: 'Appointment Rescheduled',
      message: `Slot updated to ${newDate} at ${newTime}. Saved locally. Email delivery is not connected.`,
      type: 'info',
    });
  };

  const updateAppointmentStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    if (!can('appointments')) return;
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === appointmentId) {
          const updated: Appointment = {
            ...apt,
            status: newStatus,
            history: [...(apt.history || []), {date: new Date().toISOString(), type: `Status: ${newStatus}`, summary: `Updated by ${staffId === "doctor" ? "doctor" : "associate"}.`}],
          };
          if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment(updated);
          }
          return updated;
        }
        return apt;
      })
    );

    const labels: Record<AppointmentStatus, string> = {
      pending: 'Awaiting approval',
      rejected: 'Request declined',
      completed: 'Consultation marked as Completed',
      cancelled: 'Appointment Cancelled',
      confirmed: 'Appointment Confirmed',
      upcoming: 'Set to Upcoming',
      blocked: 'Slot Blocked',
    };

    addToast({
      title: 'Status Updated',
      message: labels[newStatus] || 'Updated appointment status.',
      type: 'info',
    });
  };

  const blockSlot = (date: string, time: string, clinicId: string = 'hsr', reason: string = 'Clinical consultation block') => {
    if (!can('availability')) return;
    const alreadyBlocked = blockedSlots.some((b) => b.date === date && b.time === time);
    if (!alreadyBlocked) {
      const newBlock: BlockedSlot = {
        id: 'blk-' + Math.random().toString(36).substring(2, 9),
        date,
        time,
        clinicId,
        reason,
      };
      setBlockedSlots((prev) => [...prev, newBlock]);
      addToast({
        title: 'Time Blocked',
        message: `${time} on ${date} is now unavailable for booking.`,
        type: 'alert',
      });
    }
  };

  const unblockSlot = (date: string, time: string) => {
    if (!can('availability')) return;
    setBlockedSlots((prev) => prev.filter((b) => !(b.date === date && b.time === time)));
    addToast({
      title: 'Slot Released',
      message: `${time} on ${date} is now open for bookings.`,
      type: 'success',
    });
  };

  const toggleBlockSlot = (date: string, time: string, clinicId: string = 'hsr', reason: string = 'Administrative block') => {
    const isBlocked = blockedSlots.some((b) => b.date === date && b.time === time);
    if (isBlocked) {
      unblockSlot(date, time);
    } else {
      blockSlot(date, time, clinicId, reason);
    }
  };

  const updateDayAvailability = (day: string, updates: Partial<DayAvailability>) => {
    if (!can('availability')) return;
    setWeeklyAvailability((prev) =>
      prev.map((item) => (item.day === day ? { ...item, ...updates } : item))
    );
    addToast({
      title: 'Availability Updated',
      message: `${day} schedule updated successfully.`,
      type: 'info',
    });
  };

  const duplicateScheduleToAllWeekdays = (sourceDay: string) => {
    const sourceConfig = weeklyAvailability.find((d) => d.day === sourceDay);
    if (!sourceConfig) return;

    setWeeklyAvailability((prev) =>
      prev.map((item) => {
        if (item.day !== 'Saturday' && item.day !== 'Sunday') {
          return {
            ...item,
            enabled: sourceConfig.enabled,
            clinicId: sourceConfig.clinicId,
            startTime: sourceConfig.startTime,
            endTime: sourceConfig.endTime,
            slotDurationMin: sourceConfig.slotDurationMin,
          };
        }
        return item;
      })
    );

    addToast({
      title: 'Schedule Duplicated',
      message: `Copied ${sourceDay}'s hours across all weekdays (Mon–Fri).`,
      type: 'success',
    });
  };

  return (
    <AppContext.Provider
      value={{
        staffId, associates, saveAssociates, tasks, saveTasks, can, setMeetingUrl, timeOff, saveTimeOff,
        appointments,
        blockedSlots,
        weeklyAvailability,
        activeView,
        adminTab,
        currentDate,
        selectedAppointment,
        isSideSheetOpen,
        isCommandPaletteOpen,
        toasts,
        bookingInitialPreselection,
        isAdminAuthenticated,
        adminPasscode,
        verifyAdminPasscode,
        logoutAdmin,
        consultationNotes,
        digitalPrescriptions,
        addConsultationNote,
        addDigitalPrescription,
        selectedPatientForDetail,
        isPatientModalOpen,
        openPatientModal,
        closePatientModal,
        setActiveView,
        setAdminTab,
        setCurrentDate,
        openBooking,
        openSideSheet,
        closeSideSheet,
        setIsCommandPaletteOpen,
        addToast,
        removeToast,
        bookAppointment,
        rescheduleAppointment,
        updateAppointmentStatus,
        blockSlot,
        unblockSlot,
        toggleBlockSlot,
        isSlotAvailable,
        updateDayAvailability,
        duplicateScheduleToAllWeekdays,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
