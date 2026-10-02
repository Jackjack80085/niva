import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DOCTOR_INFO } from '../../data/initialData';
import { AdminOverview } from './AdminOverview';
import { AdminSchedule } from './AdminSchedule';
import { AdminAppointments } from './AdminAppointments';
import { AdminPatients } from './AdminPatients';
import { AdminAvailability } from './AdminAvailability';
import { AdminPracticeContentTabs } from './AdminPracticeContentTabs';
import { AppointmentSideSheet } from './AppointmentSideSheet';
import { PatientDetailModal } from './PatientDetailModal';
import { AdminTab } from '../../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Calendar, 
  Sliders, 
  ExternalLink, 
  Bell, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Stethoscope,
  Lock,
  X,
  FileText,
  Heart,
  Video,
  BookOpen,
  Sparkles,
  Globe,
  Settings as SettingsIcon
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { 
    adminTab, 
    setAdminTab, 
    setActiveView, 
    setIsCommandPaletteOpen,
    openBooking, 
    logoutAdmin,
    appointments 
  } = useApp();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [adminTab]);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const todayCount = appointments.filter(a => a.date === '2026-10-02').length;

  const renderNavButton = (tabKey: AdminTab, label: string, icon: React.ReactNode) => {
    const isActive = adminTab === tabKey;
    return (
      <button
        key={tabKey}
        onClick={() => setAdminTab(tabKey)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
          isActive
            ? 'bg-[#332B27] text-[#FAF7F0] shadow-xs'
            : 'text-[#332B27]/70 hover:text-[#332B27] hover:bg-[#FAF7F0]'
        }`}
        title={label}
      >
        <span className="shrink-0">{icon}</span>
        {!isSidebarCollapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#332B27] flex font-sans-clean selection:bg-[#F1E3A6]">
      
      {/* ================= COLLAPSIBLE SIDEBAR ================= */}
      <aside
        className={`bg-white border-r border-[#332B27]/10 hidden lg:flex flex-col justify-between transition-all duration-200 sticky top-0 h-screen z-20 shrink-0 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Practice Branding & Collapse Toggle */}
          <div className="px-5 h-16 border-b border-[#332B27]/10 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#F1E3A6] text-[#332B27] flex items-center justify-center shrink-0 font-editorial font-bold text-base">
                  NJ
                </div>
                <div className="truncate">
                  <p className="font-editorial text-base font-semibold text-[#332B27] tracking-wider uppercase truncate">
                    DR. NIVA
                  </p>
                  <p className="text-[10px] text-[#332B27]/50 uppercase tracking-widest font-sans-clean">
                    Clinical Portal
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#332B27]/40 hover:text-[#332B27] hover:bg-[#FAF7F0] transition-colors mx-auto cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Sections from Exact Prompt Specification */}
          <nav className="p-3 space-y-6">
            
            {/* 1. TODAY */}
            <div>
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-widest uppercase text-[#B89552] mb-1.5">
                  TODAY
                </p>
              )}
              <div className="space-y-0.5">
                {renderNavButton('overview', 'Overview', <LayoutDashboard className="w-4 h-4" />)}
                {renderNavButton('schedule', 'Schedule', <CalendarDays className="w-4 h-4" />)}
                {renderNavButton('appointments', 'Appointments', <Calendar className="w-4 h-4" />)}
                {renderNavButton('patients', 'Patients', <Users className="w-4 h-4" />)}
              </div>
            </div>

            {/* 2. PRACTICE */}
            <div>
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-widest uppercase text-[#B89552] mb-1.5">
                  PRACTICE
                </p>
              )}
              <div className="space-y-0.5">
                {renderNavButton('availability', 'Availability', <Sliders className="w-4 h-4" />)}
                {renderNavButton('consultations', 'Consultations', <FileText className="w-4 h-4" />)}
                {renderNavButton('therapy', 'Therapy', <Heart className="w-4 h-4" />)}
                {renderNavButton('locations', 'Locations', <Video className="w-4 h-4" />)}
              </div>
            </div>

            {/* 3. CONTENT */}
            <div>
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-widest uppercase text-[#B89552] mb-1.5">
                  CONTENT
                </p>
              )}
              <div className="space-y-0.5">
                {renderNavButton('resources', 'Resources', <BookOpen className="w-4 h-4" />)}
                {renderNavButton('the-curly-shrink', 'The Curly Shrink', <Sparkles className="w-4 h-4" />)}
                {renderNavButton('website', 'Website', <Globe className="w-4 h-4" />)}
              </div>
            </div>

            {/* 4. SYSTEM */}
            <div>
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-widest uppercase text-[#B89552] mb-1.5">
                  SYSTEM
                </p>
              )}
              <div className="space-y-0.5">
                {renderNavButton('notifications', 'Notifications', <Bell className="w-4 h-4" />)}
                {renderNavButton('settings', 'Settings', <SettingsIcon className="w-4 h-4" />)}
              </div>
            </div>

          </nav>
        </div>

        {/* Doctor profile card & Logout at bottom */}
        <div className="p-3 border-t border-[#332B27]/10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F0] border border-[#332B27]/5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={DOCTOR_INFO.portraitImage}
                alt={DOCTOR_INFO.name}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#332B27]/10"
              />
              {!isSidebarCollapsed && (
                <div className="truncate text-xs">
                  <p className="font-medium text-[#332B27] truncate">{DOCTOR_INFO.name}</p>
                  <p className="text-[10px] text-[#332B27]/50 truncate">MD Psychiatry</p>
                </div>
              )}
            </div>

            <button
              onClick={logoutAdmin}
              className="p-1.5 rounded-lg text-[#332B27]/40 hover:text-[#332B27] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              title="Lock Session"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER: DR. NIVA    ⌘ K     + Appointment */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[#332B27]/10 px-4 sm:px-6 lg:px-10 min-h-16 py-3 gap-3 flex flex-wrap items-center justify-between">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-4">
            <span className="font-editorial text-lg sm:text-2xl font-semibold tracking-wider text-[#332B27] uppercase">
              DR. NIVA
            </span>
            <span className="text-[#332B27]/20 hidden sm:inline">|</span>
            <span className="text-xs text-[#332B27]/50 font-sans-clean hidden sm:inline">
              Friday, October 2
            </span>
          </div>

          {/* Right Actions: ⌘ K search, notifications, + Appointment */}
          <div className="flex items-center gap-3">
            {/* Search (⌘K) */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              aria-label="Search workspace"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#332B27]/10 text-xs text-[#332B27]/60 hover:text-[#332B27] hover:border-[#332B27]/30 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#332B27]/40" />
              <span className="hidden md:inline">Quick search</span>
              <kbd className="hidden md:block px-1.5 py-0.5 rounded-md bg-white border border-[#332B27]/10 text-[10px] font-mono-tabular text-[#332B27]/70 font-semibold shadow-2xs">
                ⌘ K
              </kbd>
            </button>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-xl hover:bg-[#FAF7F0] text-[#332B27]/70 hover:text-[#332B27] transition-colors relative cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89552] absolute top-2 right-2" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-[#332B27]/10 p-4 z-50 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-3 border-b border-[#332B27]/10">
                    <p className="text-xs font-semibold text-[#332B27]">Clinical Notifications</p>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[#332B27]/40 hover:text-[#332B27] p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="py-2 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#332B27]/5">
                      <p className="font-medium text-[#332B27]">Today's Sessions</p>
                      <p className="text-[11px] text-[#332B27]/60 mt-0.5 font-mono-tabular">
                        {todayCount} appointments scheduled for Oct 2.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* + Appointment */}
            <button
              onClick={() => openBooking()}
              aria-label="New appointment"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Appointment</span>
            </button>

            {/* Patient Website preview */}
            <button
              onClick={() => setActiveView('patient-home')}
              className="p-2 rounded-xl text-[#332B27]/60 hover:text-[#332B27] hover:bg-[#FAF7F0] transition-colors cursor-pointer hidden sm:block"
              title="Switch to Patient View"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

        </header>

        {/* Tab View Body */}
        <div className="lg:hidden px-4 py-3 bg-white border-b border-[#332B27]/10 flex items-center gap-3">
          <label htmlFor="mobile-admin-section" className="text-xs font-semibold shrink-0">Workspace</label>
          <select id="mobile-admin-section" value={adminTab} onChange={(event) => setAdminTab(event.target.value as AdminTab)} className="min-w-0 flex-1 rounded-xl border border-[#332B27]/20 bg-[#FAF7F0] p-3">
            <optgroup label="Clinical">
              <option value="overview">Overview</option><option value="schedule">Schedule</option>
              <option value="appointments">Appointments</option><option value="patients">Patients</option>
            </optgroup>
            <optgroup label="Practice">
              <option value="availability">Availability</option><option value="consultations">Consultations</option>
              <option value="therapy">Therapy</option><option value="locations">Locations</option>
              <option value="resources">Resources</option><option value="the-curly-shrink">The Curly Shrink</option>
              <option value="website">Website</option><option value="notifications">Notifications</option><option value="settings">Settings</option>
            </optgroup>
          </select>
          <button onClick={logoutAdmin} aria-label="Log out" className="p-3 rounded-xl border border-[#332B27]/10"><Lock className="w-4 h-4" /></button>
        </div>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-x-auto">
          {adminTab === 'overview' && <AdminOverview />}
          {adminTab === 'schedule' && <AdminSchedule />}
          {adminTab === 'appointments' && <AdminAppointments />}
          {adminTab === 'patients' && <AdminPatients />}
          {adminTab === 'availability' && <AdminAvailability />}
          {(adminTab === 'consultations' || 
            adminTab === 'therapy' || 
            adminTab === 'locations' || 
            adminTab === 'resources' || 
            adminTab === 'the-curly-shrink' || 
            adminTab === 'website' || 
            adminTab === 'notifications' || 
            adminTab === 'settings') && (
            <AdminPracticeContentTabs tab={adminTab} />
          )}
        </main>

      </div>

      {/* Global Contextual Drawers & Modals */}
      <AppointmentSideSheet />
      <PatientDetailModal />

    </div>
  );
};
