import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, X, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { editorialEase } from '../../utils/motionVariants';

export const PatientNav: React.FC = () => {
  const { openBooking, setActiveView } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setActiveView('patient-home');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 flex justify-center pointer-events-none transition-all duration-400">
      <div
        className={`w-full transition-all duration-400 ease-out pointer-events-auto ${
          scrolled
            ? 'max-w-5xl mt-3 mx-4 sm:mx-6 px-6 py-3 rounded-full bg-[#FAF7F0]/92 backdrop-blur-md border border-[#332B27]/12 shadow-sm'
            : 'max-w-6xl mx-auto px-6 py-6 bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between">
          
          {/* Brand: Dr. NIVA JACOB / Psychiatrist • Sexologist • Therapist */}
          <button
            onClick={() => {
              setActiveView('patient-home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left group cursor-pointer"
          >
            <span className={`font-editorial font-medium tracking-tight text-[#332B27] group-hover:text-[#B89552] transition-all duration-300 block ${
              scrolled ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
            }`}>
              Dr. NIVA JACOB
            </span>
            {!scrolled && (
              <span className="block text-[11px] sm:text-xs font-sans-clean font-medium text-[#332B27]/60 tracking-wide mt-0.5">
                Psychiatrist • Sexologist • Therapist
              </span>
            )}
          </button>

          {/* Desktop Navigation Links - Extremely Minimal */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-sans-clean font-medium text-[#332B27]/80">
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-[#332B27] transition-colors cursor-pointer py-1"
            >
              About
            </button>

            <button
              onClick={() => scrollToSection('consultations')}
              className="hover:text-[#332B27] transition-colors cursor-pointer py-1"
            >
              Consultations
            </button>

            <button
              onClick={() => scrollToSection('areas-i-help-with')}
              className="hover:text-[#332B27] transition-colors cursor-pointer py-1"
            >
              Areas I Help With
            </button>

            <button
              onClick={() => scrollToSection('the-curly-shrink')}
              className="hover:text-[#332B27] transition-colors cursor-pointer py-1"
            >
              The Curly Shrink
            </button>

            <button
              onClick={() => scrollToSection('resources')}
              className="hover:text-[#332B27] transition-colors cursor-pointer py-1"
            >
              Resources
            </button>

            {/* Primary CTA button */}
            <button
              onClick={() => openBooking()}
              className="ml-2 px-5 py-2.5 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold uppercase tracking-wider hover:bg-[#27201D] hover:translate-y-[-1px] transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              BOOK A CONSULTATION
            </button>

            {/* Discreet Portal Key */}
            <button
              onClick={() => setActiveView('admin-login')}
              className="text-[#332B27]/30 hover:text-[#332B27] transition-colors p-1"
              title="Dr. Niva Portal Access"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2.5">
            <button
              onClick={() => openBooking()}
              className="px-3.5 py-1.5 rounded-full bg-[#332B27] text-white text-[11px] font-semibold uppercase tracking-wider"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#332B27] rounded-lg hover:bg-neutral-100/60 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden mt-4 pt-4 border-t border-[#332B27]/10 space-y-3 bg-[#FAF7F0] rounded-2xl p-4 shadow-lg overflow-hidden pointer-events-auto"
            >
              <button
                onClick={() => scrollToSection('about')}
                className="block w-full text-left py-2 text-base font-editorial text-[#332B27]"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('consultations')}
                className="block w-full text-left py-2 text-base font-editorial text-[#332B27]"
              >
                Consultations
              </button>
              <button
                onClick={() => scrollToSection('areas-i-help-with')}
                className="block w-full text-left py-2 text-base font-editorial text-[#332B27]"
              >
                Areas I Help With
              </button>
              <button
                onClick={() => scrollToSection('the-curly-shrink')}
                className="block w-full text-left py-2 text-base font-editorial text-[#332B27]"
              >
                The Curly Shrink
              </button>
              <button
                onClick={() => scrollToSection('resources')}
                className="block w-full text-left py-2 text-base font-editorial text-[#332B27]"
              >
                Resources
              </button>

              <div className="pt-3 border-t border-[#332B27]/10 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openBooking();
                  }}
                  className="w-full py-3 rounded-full bg-[#332B27] text-white text-xs font-semibold uppercase tracking-wider text-center block shadow-xs"
                >
                  BOOK A CONSULTATION
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveView('admin-login');
                  }}
                  className="w-full py-2 text-center text-xs text-[#332B27]/50 hover:text-[#332B27] flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3 h-3" />
                  <span>Dr. Niva Portal Login</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
