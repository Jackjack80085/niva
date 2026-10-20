import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PatientHome } from './components/patient/PatientHome';
import { BookingWorkspace } from './components/patient/BookingWorkspace';
import { PracticeWorkspace } from './components/admin/PracticeWorkspace';
import { AdminPortalPage } from './components/admin/AdminPortalPage';
import { CommandPalette } from './components/admin/CommandPalette';
import { ToastContainer } from './components/common/Toast';

const AppContent: React.FC = () => {
  const { activeView } = useApp();

  return (
    <>
      {/* Dynamic View Router */}
      {activeView === 'patient-home' && <PatientHome />}
      {activeView === 'patient-booking' && <BookingWorkspace />}
      {activeView === 'admin-login' && <AdminPortalPage />}
      {activeView === 'admin' && <PracticeWorkspace />}

      {/* Global Command Palette (⌘K) */}


      {/* Global Toast Notifications */}
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
