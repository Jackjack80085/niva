import React from 'react';
import { EventsCommunitySection } from './EventsCommunitySection';
import { PatientNav } from './PatientNav';
import { HeroSection } from './HeroSection';
import { IntroductionSection } from './IntroductionSection';
import { ExpertiseSection } from './ExpertiseSection';
import { ConsultationsSection } from './ConsultationsSection';
import { TheCurlyShrinkSection } from './TheCurlyShrinkSection';
import { CredibilityNumbersSection } from './CredibilityNumbersSection';
import { DoctorStory } from './DoctorStory'; // Professional Background
import { FAQSection } from './FAQSection';
import { FinalBookingCta } from './FinalBookingCta';
import { PatientFooter } from './PatientFooter';
import { useApp } from '../../context/AppContext';
import { Calendar, ArrowRight } from 'lucide-react';

export const PatientHome: React.FC = () => {
  const { openBooking } = useApp();

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#332B27] flex flex-col selection:bg-[#F1E3A6] selection:text-[#332B27] texture-paper">
      <PatientNav />

      <main className="flex-1 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
        <HeroSection />
        <IntroductionSection />
        <ExpertiseSection />
        <EventsCommunitySection />
        <ConsultationsSection />
        <TheCurlyShrinkSection />
        <CredibilityNumbersSection />
        <DoctorStory />

        <FAQSection />
        <FinalBookingCta />
        <PatientFooter />
      </main>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#332B27]/12 shadow-lg">
        <button
          onClick={() => openBooking()}
          className="w-full py-3.5 px-4 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] transition-transform"
        >
          <Calendar className="w-4 h-4 text-[#F1E3A6]" />
          <span>Book appointment with Dr. Niva</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#F1E3A6]" />
        </button>
      </div>
    </div>
  );
};
