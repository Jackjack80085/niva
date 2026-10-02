import React from 'react';
import { DOCTOR_INFO } from '../../data/initialData';
import { motion, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { HandDrawnCurl } from '../common/OrganicMotifs';

interface TimelineItem {
  degree: string;
  institution: string;
  focus: string;
}

const TIMELINE: TimelineItem[] = [
  {
    degree: 'MBBS',
    institution: 'Government Medical College, Kottayam',
    focus: 'Comprehensive general medicine, internal pathophysiology, and human neuroanatomy foundation.',
  },
  {
    degree: 'DNB Psychiatry',
    institution: 'Spandana Nursing Home & Research Centre, Bangalore',
    focus: 'Inpatient and outpatient medical psychiatry, psychopharmacology, clinical neuropsychiatry, and crisis intervention.',
  },
  {
    degree: 'Clinical Psychology & Psychotherapy Certification',
    institution: 'Medvarsity & International Psychosexual Institute',
    focus: 'Evidence-based cognitive restructuring, clinical sexology, attachment therapy, and somatic integration.',
  },
];

export const DoctorStory: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="about" className="py-24 md:py-36 border-t border-[#332B27]/10 bg-[#FAF7F0] texture-paper relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* ================= LEFT: SECTION TITLE & CREDENTIALS INTRO ================= */}
          <motion.div 
            className="lg:col-span-5 space-y-5"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={standardViewport}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, ease: editorialEase }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest uppercase text-[#B89552] font-sans-clean">
                CREDENTIALS
              </span>
              <HandDrawnCurl width={40} color="#B89552" />
            </div>

            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[3.5rem] text-[#332B27] font-normal leading-[1.08] tracking-tight">
              Professional Background
            </h2>

            <p className="text-base text-[#332B27]/75 font-sans-clean leading-relaxed font-light max-w-sm">
              Practicing at the intersection of medical psychiatry, clinical sexology, and relational psychotherapy.
            </p>

            <div className="pt-4 space-y-1 text-xs text-[#332B27]/60 font-mono-tabular">
              <p className="font-semibold text-[#332B27]">{DOCTOR_INFO.name}</p>
              <p>Karnataka Medical Council · Reg. {DOCTOR_INFO.registrationNo}</p>
              <p>12+ Years Clinical Practice · Bangalore & Virtual</p>
            </div>
          </motion.div>

          {/* ================= RIGHT: SOPHISTICATED EDITORIAL TIMELINE ================= */}
          <div className="lg:col-span-7 space-y-10">
            
            <div className="relative pl-6 sm:pl-8 border-l border-[#B89552]/40 space-y-10">
              
              {TIMELINE.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={standardViewport}
                  transition={{
                    duration: shouldReduceMotion ? 0.01 : 0.75,
                    delay: idx * 0.18,
                    ease: editorialEase,
                  }}
                  className="relative group"
                >
                  {/* Subtle Node Point on the vertical line */}
                  <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3 h-3 rounded-full bg-[#FAF7F0] border-2 border-[#B89552] group-hover:scale-125 transition-transform duration-300" />

                  <div className="space-y-1">
                    <h3 className="font-editorial text-2xl sm:text-3xl text-[#332B27] font-medium leading-snug">
                      {item.degree}
                    </h3>

                    <p className="text-sm sm:text-base font-sans-clean text-[#B89552] font-semibold">
                      {item.institution}
                    </p>

                    <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed font-light pt-1">
                      {item.focus}
                    </p>
                  </div>
                </motion.div>
              ))}

            </div>

            {/* LANGUAGES UNDERNEATH (Extremely Understated) */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={standardViewport}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, delay: 0.5, ease: editorialEase }}
              className="pt-6 border-t border-[#332B27]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans-clean"
            >
              <span className="font-bold tracking-wider uppercase text-[#B89552]">
                LANGUAGES SPOKEN
              </span>
              <span className="font-medium text-[#332B27] font-editorial text-lg tracking-wide">
                English • Malayalam • Kannada • Hindi
              </span>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
};
