import React from 'react';
import { useApp } from '../../context/AppContext';
import { Stethoscope, User, Command } from 'lucide-react';

export const AppSwitcher: React.FC = () => {
  const { activeView, setActiveView, setIsCommandPaletteOpen } = useApp();

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-full border border-[#332B27]/15 shadow-sm shadow-[#332B27]/5 text-xs font-sans-clean font-medium">
      <button
        onClick={() => setActiveView('patient-home')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer ${
          activeView !== 'admin'
            ? 'bg-[#332B27] text-[#FAF7F0] shadow-xs'
            : 'text-[#332B27]/70 hover:text-[#332B27] hover:bg-[#FAF7F0]'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        <span>Patient View</span>
      </button>

      <button
        onClick={() => setActiveView('admin')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer ${
          activeView === 'admin'
            ? 'bg-[#332B27] text-[#FAF7F0] shadow-xs'
            : 'text-[#332B27]/70 hover:text-[#332B27] hover:bg-[#FAF7F0]'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#F1E3A6] animate-pulse" />
        <Stethoscope className="w-3.5 h-3.5 text-[#F1E3A6]" />
        <span>Clinical Admin</span>
      </button>

      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        title="Open Command Palette (⌘K)"
        className="hidden md:flex items-center gap-1 px-2 py-1.5 text-[#332B27]/50 hover:text-[#332B27] hover:bg-[#FAF7F0] rounded-full transition-colors ml-0.5 cursor-pointer"
      >
        <Command className="w-3 h-3" />
        <span className="text-[10px] font-mono-tabular">K</span>
      </button>
    </div>
  );
};
