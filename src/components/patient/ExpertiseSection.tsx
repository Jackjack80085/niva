import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, ArrowRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { ServiceType } from '../../types';
import { HandDrawnCurl } from '../common/OrganicMotifs';

interface FocusArea {
  index: string;
  title: string;
  summary: string;
  details: string;
  clinicalTakeaway: string;
  associatedServiceId: ServiceType;
}

const EDITORIAL_AREAS: FocusArea[] = [
  {
    index: '01',
    title: 'Mental Health',
    summary: 'Anxiety, mood concerns, emotional wellbeing...',
    details: 'Evidence-based psychiatric assessment, cognitive restructuring, panic de-escalation, and nervous system down-regulation for sustained calm.',
    clinicalTakeaway: 'Addressing hyperarousal and panic at both neurochemical and emotional levels.',
    associatedServiceId: 'anxiety',
  },
  {
    index: '02',
    title: 'Trauma',
    summary: 'Understanding difficult experiences...',
    details: 'Trauma-informed somatic processing, developmental stabilization, safe container grounding, and paced emotional titration.',
    clinicalTakeaway: 'Expanding your window of tolerance without retraumatization.',
    associatedServiceId: 'anxiety',
  },
  {
    index: '03',
    title: 'Relationships',
    summary: 'Attachment, communication...',
    details: 'De-escalating pursue-withdraw loops, speaking unspoken emotional truths, healing attachment ruptures, and cultivating secure intimacy.',
    clinicalTakeaway: 'Reframing relational anger as an unexpressed plea for connection.',
    associatedServiceId: 'couple-therapy',
  },
  {
    index: '04',
    title: 'Sexual Health',
    summary: 'Intimacy, sexual concerns...',
    details: 'Affirming psychosexual care for vaginismus, erectile anxiety, desire discrepancies, and releasing internalized sexual shame without physical exams.',
    clinicalTakeaway: '100% verbal, stigma-free clinical sexology uniting body and mind.',
    associatedServiceId: 'sexual-health',
  },
  {
    index: '05',
    title: 'Therapy',
    summary: 'Exploring emotions...',
    details: 'Deep self-understanding, affective regulation, boundary navigation, working through grief, and adapting to major life transitions.',
    clinicalTakeaway: 'Building the emotional musculature to carry complex human feelings.',
    associatedServiceId: 'personality-patterns',
  },
  {
    index: '06',
    title: 'LGBTQ+ Affirmative Care',
    summary: 'Respectful, non-judgmental...',
    details: 'Shame-free, identity-affirming therapeutic space honoring diverse sexual orientations, gender identities, relationship configurations, and chosen families.',
    clinicalTakeaway: 'Affirming, trauma-informed care that validates your lived truth.',
    associatedServiceId: 'life-transitions',
  },
];

export const ExpertiseSection: React.FC = () => {
  const { openBooking } = useApp();
  const shouldReduceMotion = useReducedMotion();

  // Desktop active hover item, Mobile accordion active index
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(0);
  const [expandedMobileIdx, setExpandedMobileIdx] = useState<number | null>(0);

  const handleSelectArea = (serviceId: ServiceType) => {
    const consultationsEl = document.getElementById('consultations');
    if (consultationsEl) {
      consultationsEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      openBooking({ serviceId });
    }
  };

  return (
    <section id="areas-i-help-with" className="py-24 md:py-36 bg-[#FAF7F0] texture-paper relative overflow-hidden border-t border-[#332B27]/10">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Editorial Split: Left Sticky Heading vs Right Interactive Index */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* ================= LEFT: STICKY HEADING ================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest uppercase text-[#B89552] font-sans-clean">
                AREAS I HELP WITH
              </span>
              <HandDrawnCurl width={40} color="#B89552" />
            </div>

            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[3.8rem] text-[#332B27] font-normal leading-[1.08] tracking-tight">
              What can we work<br />
              on together?
            </h2>

            <p className="text-base text-[#332B27]/70 font-sans-clean leading-relaxed font-light max-w-sm pt-2">
              A collaborative, trauma-informed clinical space uniting psychiatry, psychosexual therapy, and depth emotional healing.
            </p>

            <div className="pt-4 hidden lg:block">
              <button
                onClick={() => handleSelectArea('consultation')}
                className="btn-primary-editorial px-6 py-3 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Explore Consultations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ================= RIGHT: INTERACTIVE EDITORIAL INDEX ================= */}
          <div className="lg:col-span-7 divide-y divide-[#332B27]/15 border-t border-b border-[#332B27]/15">
            {EDITORIAL_AREAS.map((area, idx) => {
              const isHovered = hoveredIdx === idx;
              const isMobileOpen = expandedMobileIdx === idx;

              return (
                <motion.div
                  key={area.index}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={standardViewport}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, delay: idx * 0.08, ease: editorialEase }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  className="py-6 sm:py-7 group cursor-pointer transition-colors duration-300"
                  onClick={() => {
                    // Toggle for mobile accordion, or click on desktop
                    setExpandedMobileIdx(isMobileOpen ? null : idx);
                  }}
                >
                  {/* Row Header */}
                  <div className="flex items-baseline justify-between gap-4">
                    
                    <div className="flex items-baseline gap-4 sm:gap-6 flex-1">
                      {/* 01 Number */}
                      <span className={`font-mono-tabular text-sm sm:text-base font-semibold transition-colors duration-300 shrink-0 ${
                        isHovered ? 'text-[#B89552]' : 'text-[#332B27]/40'
                      }`}>
                        {area.index}
                      </span>

                      {/* Title: moves right 8px on hover */}
                      <div className="flex-1">
                        <h3 className={`font-editorial text-2xl sm:text-3xl md:text-[2.2rem] font-medium leading-snug transition-transform duration-300 ${
                          isHovered && !shouldReduceMotion ? 'translate-x-2 text-[#332B27]' : 'text-[#332B27]'
                        }`}>
                          {area.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#332B27]/60 font-sans-clean mt-1 font-normal">
                          {area.summary}
                        </p>
                      </div>
                    </div>

                    {/* Arrow / Chevron */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-xs font-semibold text-[#B89552] font-sans-clean transition-opacity duration-300 hidden sm:inline ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                      }`}>
                        Consult
                      </span>
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                        isHovered 
                          ? 'border-[#B89552] bg-[#FAF7F0] text-[#B89552] rotate-45' 
                          : 'border-transparent text-[#332B27]/40'
                      }`}>
                        <ArrowUpRight className="w-4 h-4 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Contextual description: expands smoothly on hover (desktop) or tap (mobile) */}
                  <AnimatePresence>
                    {(isHovered || isMobileOpen) && (
                      <motion.div
                        key={`area-desc-${area.index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ 
                          duration: shouldReduceMotion ? 0.01 : 0.24, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 pl-8 sm:pl-12 pr-4 space-y-3">
                          <p className="text-xs sm:text-sm text-[#332B27]/80 font-sans-clean leading-relaxed font-light">
                            {area.details}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <span className="text-[11px] text-[#B89552] font-medium font-sans-clean italic">
                              ✦ {area.clinicalTakeaway}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectArea(area.associatedServiceId);
                              }}
                              className="text-xs font-semibold text-[#332B27] underline hover:text-[#B89552] cursor-pointer"
                            >
                              Book session for {area.title} →
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
