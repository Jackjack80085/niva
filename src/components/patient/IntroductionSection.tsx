import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { HandDrawnCurl, OrganicShape } from '../common/OrganicMotifs';
import doctorCandidImg from '../../assets/images/candid_dr_niva_1790926664270.jpg';

export const IntroductionSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const scrollToAbout = () => {
    const el = document.getElementById('about');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="introduction" className="py-24 md:py-36 bg-[#FAF7F0] texture-paper relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Asymmetric Editorial Composition (45% Photo Left, 55% Content Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ================= LEFT: LARGE CANDID PHOTOGRAPH WITH UNUSUAL EDITORIAL CROP ================= */}
          <div className="lg:col-span-5 relative flex justify-center">
            
            {/* Soft Sage / Yellow Organic Shape behind one edge */}
            <div className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 w-48 h-48 sm:w-64 sm:h-64 pointer-events-none -z-10">
              <OrganicShape variant="sage" opacity={0.7} className="w-full h-full" />
            </div>

            <div className="absolute -bottom-6 -right-6 w-40 h-40 pointer-events-none -z-10">
              <OrganicShape variant="candid" opacity={0.4} className="w-full h-full" />
            </div>

            {/* Image Container with vertical clip-path reveal & subtle internal scale */}
            <motion.div
              className="relative w-full max-w-md overflow-hidden shadow-lg border border-[#332B27]/10"
              style={{
                borderRadius: '2px 42px 2px 32px',
              }}
              initial={{ clipPath: shouldReduceMotion ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }}
              whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
              viewport={standardViewport}
              transition={{ duration: shouldReduceMotion ? 0.01 : 1.1, ease: editorialEase }}
            >
              <motion.img
                src={doctorCandidImg}
                alt="Dr. Niva Jacob in clinical consultation studio"
                className="w-full h-auto aspect-[4/5] object-cover object-center filter contrast-[1.02]"
                initial={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                whileInView={{ scale: 1 }}
                viewport={standardViewport}
                transition={{ duration: shouldReduceMotion ? 0.01 : 1.3, ease: editorialEase }}
              />

              {/* Discreet editorial attribution caption */}
              <div className="absolute bottom-3 left-4 text-[10px] uppercase font-mono-tabular tracking-widest text-[#FAF7F0]/90 bg-[#332B27]/40 backdrop-blur-xs px-2.5 py-1 rounded-sm">
                Studio Intake · Bangalore
              </div>
            </motion.div>

          </div>

          {/* ================= RIGHT: EDITORIAL HEADLINE & STORY ================= */}
          <motion.div
            className="lg:col-span-7 flex flex-col justify-center space-y-6"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={standardViewport}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.85, delay: 0.25, ease: editorialEase }}
          >
            {/* Small Eyebrow: ABOUT DR. NIVA + Handwritten Curl Motif */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold tracking-widest uppercase text-[#B89552] font-sans-clean">
                ABOUT DR. NIVA
              </span>
              <HandDrawnCurl width={46} color="#B89552" delay={0.4} />
              <span className="text-[11px] font-sans-clean font-medium tracking-wider text-[#332B27]/50 uppercase">
                Compassion • Care • Healing
              </span>
            </div>

            {/* Large Cormorant Heading */}
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[3.8rem] text-[#332B27] font-normal leading-[1.08] tracking-tight">
              A space where you can be heard without judgment.
            </h2>

            {/* Body Copy */}
            <div className="space-y-4 text-[#332B27]/80 font-sans-clean leading-relaxed font-light text-base sm:text-lg">
              <p>
                Too often, mental healthcare forces a rigid divide: you either receive a ten-minute psychiatric prescription, or therapy that completely ignores the neurobiological and somatic reality of your body.
              </p>
              <p>
                I built this practice so that your nervous system, your intimate relationships, and your mental health are finally addressed together. Whether navigating complex panic, lifelong attachment patterns, or private psychosexual concerns, sessions are unhurried, evidence-based, and rooted in unconditional human dignity.
              </p>
            </div>

            {/* Text link: About Dr. Niva → */}
            <div className="pt-4">
              <button
                onClick={scrollToAbout}
                className="editorial-link text-sm sm:text-base font-semibold text-[#332B27] hover:text-[#B89552] cursor-pointer group"
              >
                <span>About Dr. Niva</span>
                <span className="transition-transform group-hover:translate-x-1.5">→</span>
              </button>
            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
};
