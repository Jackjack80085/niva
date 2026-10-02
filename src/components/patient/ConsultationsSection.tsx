import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Video, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { ServiceType } from '../../types';

interface TherapyOffering {
  num: string;
  id: ServiceType;
  title: string;
  duration: string;
  fee: string;
  description: string;
}

const THERAPY_OFFERINGS: TherapyOffering[] = [
  {
    num: '01',
    id: 'anxiety',
    title: 'ANXIETY',
    duration: '50 minutes',
    fee: '₹3,000',
    description: 'Evidence-based cognitive restructuring, nervous system down-regulation, and somatic grounding to de-escalate chronic worry and panic.',
  },
  {
    num: '02',
    id: 'attachment-patterns',
    title: 'ATTACHMENT & EMOTIONAL PATTERNS',
    duration: '50 minutes',
    fee: '₹3,000',
    description: 'Unpack developmental bonding reflexes, untangle fears of abandonment or engulfment, and develop secure vulnerability.',
  },
  {
    num: '03',
    id: 'couple-therapy',
    title: 'COUPLE THERAPY',
    duration: '75 minutes',
    fee: '₹4,000',
    description: 'An emotionally focused relational space for partners to step out of painful conflict loops, heal trust, and renew intimacy.',
  },
  {
    num: '04',
    id: 'sexual-health',
    title: 'SEXUAL HEALTH & INTIMACY',
    duration: '50 minutes',
    fee: '₹3,000',
    description: 'A compassionate, non-judgmental space uniting sexology and psychology for vaginismus, desire discrepancies, and releasing shame.',
  },
  {
    num: '05',
    id: 'personality-patterns',
    title: 'PERSONALITY & EMOTIONAL PATTERNS',
    duration: '50 minutes',
    fee: '₹3,000',
    description: 'Deeply compassionate psychotherapy addressing identity instability, intense affective waves, chronic emptiness, and sensitivity.',
  },
  {
    num: '06',
    id: 'life-transitions',
    title: 'LIFE TRANSITIONS & OTHER CONCERNS',
    duration: '50 minutes',
    fee: '₹3,000',
    description: 'Grounding psychological navigation through career shifts, relationship endings, acute grief, late-discovered ADHD, and burnout.',
  },
];

export const ConsultationsSection: React.FC = () => {
  const { openBooking } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const [activeRow, setActiveRow] = useState<number | null>(null);

  return (
    <section 
      id="consultations" 
      className="bg-[#332B27] text-[#FAF7F0] texture-cocoa-grain relative overflow-hidden pt-28 pb-32 md:pt-36 md:pb-44"
    >
      {/* Visual Organic Overlap Transition from previous Ivory section */}
      <div 
        className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-[#FAF7F0] pointer-events-none -z-0"
        style={{
          clipPath: 'ellipse(65% 100% at 50% 0%)',
        }}
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16 md:mb-24"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={standardViewport}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, ease: editorialEase }}
        >
          <p className="text-xs font-bold tracking-widest uppercase text-[#F1E3A6] font-sans-clean mb-3">
            CONSULTATIONS & THERAPY
          </p>
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#FAF7F0] font-normal leading-[1.08] tracking-tight">
            Choose the kind of<br />
            support you need.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#FAF7F0]/70 font-sans-clean leading-relaxed font-light">
            Begin with a preliminary consultation to assess your needs, or reserve ongoing specialized psychotherapy.
          </p>
        </motion.div>

        {/* 1. LARGE CONSULTATION FEATURE FIRST */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={standardViewport}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.85, ease: editorialEase }}
          className="mb-20 sm:mb-24"
        >
          <div 
            onClick={() => openBooking({ serviceId: 'consultation' })}
            className="group cursor-pointer rounded-3xl bg-[#27201D] border border-[#FAF7F0]/15 shadow-xl hover:border-[#F1E3A6]/60 transition-all duration-300 p-8 sm:p-14 relative overflow-hidden"
          >
            {/* Top highlight bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-[#F1E3A6] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
              <div>
                <span className="font-sans-clean text-xs font-bold tracking-widest uppercase text-[#F1E3A6] block mb-1">
                  Primary Assessment
                </span>
                <h3 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FAF7F0] tracking-tight">
                  CONSULTATION
                </h3>
              </div>

              <div className="flex items-baseline gap-4 sm:text-right font-mono-tabular">
                <span className="text-xs sm:text-sm font-medium text-[#FAF7F0]/60 uppercase tracking-wider">
                  20 MINUTES
                </span>
                <span className="text-3xl sm:text-4xl font-semibold text-[#F1E3A6]">
                  ₹1,500
                </span>
              </div>
            </div>

            <p className="text-base sm:text-lg text-[#FAF7F0]/80 font-sans-clean leading-relaxed max-w-xl mb-8 font-light">
              A first step towards understanding what you're going through. Diagnostic evaluation, symptom triage, and care direction.
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-[#FAF7F0]/10 text-xs">
              <span className="text-[#FAF7F0]/60 font-sans-clean flex items-center gap-2">
                <Video className="w-4 h-4 text-[#F1E3A6]" />
                <span>100% Online HD Teletherapy Suite</span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openBooking({ serviceId: 'consultation' });
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F1E3A6] group-hover:text-white transition-colors cursor-pointer"
              >
                <span>Book Consultation</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>


        {/* 2. THERAPY OPTIONS UNDERNEATH AS SOPHISTICATED ROWS (NOT 6 BOXED CARDS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F0]/15">
            <h3 className="font-sans-clean text-xs font-bold tracking-widest uppercase text-[#F1E3A6]">
              THERAPY MODALITIES
            </h3>
            <span className="text-xs text-[#FAF7F0]/40 font-mono-tabular">
              Individual & Relational Care
            </span>
          </div>

          <div className="divide-y divide-[#FAF7F0]/15 border-b border-[#FAF7F0]/15">
            {THERAPY_OFFERINGS.map((item, idx) => {
              const isOpen = activeRow === idx;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveRow(isOpen ? null : idx)}
                  className="py-6 sm:py-7 group cursor-pointer transition-colors duration-200"
                >
                  {/* Row Header */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline gap-4 sm:gap-6 flex-1">
                      <span className="font-mono-tabular text-xs sm:text-sm font-semibold text-[#F1E3A6]/60">
                        {item.num}
                      </span>
                      <h4 className="font-editorial text-xl sm:text-2xl lg:text-3xl font-medium tracking-wide text-[#FAF7F0] group-hover:text-[#F1E3A6] transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 font-mono-tabular">
                      <span className="text-xs text-[#FAF7F0]/50 hidden sm:inline">
                        {item.duration}
                      </span>
                      <span className="text-xl sm:text-2xl font-semibold text-[#FAF7F0]">
                        {item.fee}
                      </span>
                      <div className={`w-8 h-8 rounded-full border border-[#FAF7F0]/20 flex items-center justify-center transition-all duration-300 ${
                        isOpen ? 'rotate-45 border-[#F1E3A6] text-[#F1E3A6]' : 'text-[#FAF7F0]/50'
                      }`}>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Smooth description expansion on hover/tap with zero delay */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        key={`therapy-row-${item.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ 
                          duration: shouldReduceMotion ? 0.01 : 0.24, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 pl-8 sm:pl-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <p className="text-xs sm:text-sm text-[#FAF7F0]/75 font-sans-clean leading-relaxed font-light max-w-xl">
                            {item.description}
                          </p>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBooking({ serviceId: item.id });
                            }}
                            className="btn-butter-editorial px-5 py-2.5 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
                          >
                            <span>Reserve Session</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
