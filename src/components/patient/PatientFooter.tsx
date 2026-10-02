import React from 'react';
import { useApp } from '../../context/AppContext';
import { DOCTOR_INFO } from '../../data/initialData';
import { Lock, ArrowUpRight } from 'lucide-react';
import { HandDrawnCurl } from '../common/OrganicMotifs';

export const PatientFooter: React.FC = () => {
  const { setActiveView } = useApp();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#332B27] text-[#FAF7F0] texture-cocoa-grain py-20 sm:py-28 relative overflow-hidden border-t border-[#FAF7F0]/10 font-sans-clean">
      <div className="max-w-6xl mx-auto px-6 space-y-16 relative z-10">
        
        {/* Main Footer Header */}
        <div className="space-y-4">
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#FAF7F0]">
            DR. NIVA JACOB
          </h2>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#F1E3A6]">
            Psychiatrist • Sexologist • Therapist
          </p>

          {/* Subtle Curly-Line Signature Motif */}
          <div className="pt-2">
            <HandDrawnCurl width={68} strokeWidth={2} color="#F1E3A6" />
          </div>
        </div>

        {/* Understated Navigation & Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 pt-4 text-xs text-[#FAF7F0]/70">
          
          {/* Col 1: Practice Links */}
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-wider text-[#F1E3A6]">Practice</p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollToSection('about')} className="hover:text-[#FAF7F0] transition-colors">
                  About Dr. Niva
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('consultations')} className="hover:text-[#FAF7F0] transition-colors">
                  Consultations & Therapy
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('areas-i-help-with')} className="hover:text-[#FAF7F0] transition-colors">
                  Areas I Help With
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('the-curly-shrink')} className="hover:text-[#FAF7F0] transition-colors">
                  The Curly Shrink
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Content & Legal */}
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-wider text-[#F1E3A6]">Content & Policies</p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollToSection('resources')} className="hover:text-[#FAF7F0] transition-colors">
                  Resources Library
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')} className="hover:text-[#FAF7F0] transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <span className="cursor-default hover:text-[#FAF7F0]">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-default hover:text-[#FAF7F0]">Terms of Care</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Channels */}
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-wider text-[#F1E3A6]">Channels</p>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-[#FAF7F0] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-[#FAF7F0] inline-flex items-center gap-1 transition-colors"
                >
                  <span>YouTube</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="font-mono-tabular text-[#FAF7F0]/50">care@drnivajacob.com</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Credentials */}
          <div className="space-y-2 text-[11px] text-[#FAF7F0]/50 leading-relaxed font-light">
            <p className="font-medium text-[#FAF7F0]">{DOCTOR_INFO.name}</p>
            <p>{DOCTOR_INFO.qualifications}</p>
            <p className="font-mono-tabular">KMC Reg. {DOCTOR_INFO.registrationNo}</p>
            <p className="pt-2">Pan-India & International Telehealth</p>
          </div>

        </div>

        {/* Crisis Notice & Portal Lock */}
        <div className="pt-8 border-t border-[#FAF7F0]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF7F0]/40">
          <p>© {new Date().getFullYear()} Dr. Niva Jacob. All rights reserved.</p>

          <button
            onClick={() => setActiveView('admin-login')}
            className="inline-flex items-center gap-1.5 text-xs text-[#FAF7F0]/40 hover:text-[#FAF7F0] transition-colors py-1 px-2.5 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Doctor Portal</span>
          </button>
        </div>

      </div>
    </footer>
  );
};
