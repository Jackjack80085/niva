import React from 'react';
import { PatientNav } from './PatientNav';
import { HeroSection } from './HeroSection';
import { IntroductionSection } from './IntroductionSection';
import { ExpertiseSection } from './ExpertiseSection';
import { ConsultationsSection } from './ConsultationsSection';
import { TheCurlyShrinkSection } from './TheCurlyShrinkSection';
import { CredibilityNumbersSection } from './CredibilityNumbersSection';
import { DoctorStory } from './DoctorStory'; // Professional Background
import { ResourcesSection } from './ResourcesSection';
import { FAQSection } from './FAQSection';
import { FinalBookingCta } from './FinalBookingCta';
import { PatientFooter } from './PatientFooter';
import { useApp } from '../../context/AppContext';
import { Calendar, ArrowRight } from 'lucide-react';

export const PatientHome: React.FC = () => {
  const { openBooking } = useApp();

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#332B27] flex flex-col selection:bg-[#F1E3A6] selection:text-[#332B27] texture-paper">
      
      {/* Dynamic Floating Navigation */}
      <PatientNav />

      {/* Main Editorial Publication Storytelling Flow */}
      <main className="flex-1 pb-20 md:pb-0">
        
        {/* 1. Hero: Cinematic restrained split-screen with line-by-line masked reveals & organic form */}
        <HeroSection />

        {/* 2. Introduction: Dr. Niva's clinical ethos, candid portrait & story */}
        <IntroductionSection />

        {/* 3. Areas I Help With: Interactive sticky index with smooth hover expansions */}
        <ExpertiseSection />

        {/* 4. Consultations: Dramatic Cocoa (#332B27) rhythm change with sophisticated expanding rows */}
        <ConsultationsSection />

        {/* 5. The Curly Shrink: Butter Yellow (#F1E3A6) horizontal social-content rail linked to scroll */}
        <TheCurlyShrinkSection />

        {/* 6. Numbers / Credibility: Split-screen slow non-casino count-up with warm cream background */}
        <CredibilityNumbersSection />

        {/* 7. Professional Background: Sophisticated editorial timeline with progressive draw */}
        <DoctorStory />

        {/* 8. Resources: Editorial publication library with asymmetric ratios */}
        <ResourcesSection />

        {/* 9. FAQ: Clean line-based accordion with subtle "Questions?" watermark */}
        <FAQSection />

        {/* 10. Final CTA: Emotional visual finale with expanding organic shape & magnetic hover */}
        <FinalBookingCta />

        {/* 11. Footer: Deep Cocoa with subtle signature curl */}
        <PatientFooter />

      </main>

      {/* Mobile Sticky Bottom "Book appointment" Action Bar (<=15% mobile viewport height cap) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#332B27]/12 shadow-lg">
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
