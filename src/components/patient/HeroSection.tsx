import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DOCTOR_INFO } from '../../data/initialData';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useMotionValue, 
  useSpring, 
  useReducedMotion 
} from 'framer-motion';
import { editorialEase } from '../../utils/motionVariants';
import drNivaPortrait from '../../assets/images/hero_dr_niva_1790926646890.jpg';

export const HeroSection: React.FC = () => {
  const { openBooking } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);

  // High-performance hardware-accelerated mouse parallax using Framer Motion values
  // (Zero React re-renders, 60fps/120fps butter-smooth tracking)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Soft spring physics for dignified, calm optical depth
  const springConfig = { stiffness: 60, damping: 25, mass: 0.1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Background butter-yellow organic shape: 6–8px movement
  const shapeX = useTransform(smoothMouseX, [-1, 1], [-8, 8]);
  const shapeY = useTransform(smoothMouseY, [-1, 1], [-8, 8]);

  // Foreground portrait: 3–4px movement
  const portraitX = useTransform(smoothMouseX, [-1, 1], [-3.5, 3.5]);
  const portraitY = useTransform(smoothMouseY, [-1, 1], [-3.5, 3.5]);

  // Subtle scroll parallax
  const { scrollY } = useScroll();
  const scrollParallaxY = useTransform(scrollY, [0, 500], [0, 36]);
  
  // Combine mouse Y and scroll Y for portrait
  const combinedPortraitY = useTransform(
    [portraitY, scrollParallaxY],
    ([mY, sY]) => (mY as number) + (sY as number)
  );

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalized between -1 and 1
      const normX = (e.clientX / innerWidth - 0.5) * 2;
      const normY = (e.clientY / innerHeight - 0.5) * 2;
      mouseX.set(normX);
      mouseY.set(normY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, shouldReduceMotion]);

  const scrollToConsultations = () => {
    const el = document.getElementById('consultations') || document.getElementById('areas-i-help-with');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToIntroduction = () => {
    const el = document.getElementById('introduction');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 bg-[#FAF7F0] texture-paper min-h-[92vh] flex flex-col justify-between"
    >
      {/* Soft ambient lighting glow */}
      <div className="absolute inset-0 ambient-ivory-glow pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-6 relative z-10 w-full flex-1 flex flex-col justify-center">
        
        {/* Editorial Split-Screen Grid:
            Mobile: Photo first (order-1), Text follows (order-2)
            Desktop: Text left (lg:order-1), Photo right (lg:order-2)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ================= LEFT: EDITORIAL NARRATIVE ================= */}
          <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-center">
            
            {/* Headline: Framer Motion Line-by-Line Masked Text Reveal */}
            <h1 className="font-editorial text-5xl sm:text-6xl lg:text-[4.4rem] leading-[1.05] text-[#332B27] font-medium tracking-tight mb-8">
              
              {/* Line 1 */}
              <span className="block overflow-hidden py-0.5 sm:py-1">
                <motion.span
                  className="block"
                  initial={{ y: shouldReduceMotion ? 0 : '108%', opacity: shouldReduceMotion ? 1 : 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, delay: 0.06, ease: editorialEase }}
                >
                  You don’t have to
                </motion.span>
              </span>

              {/* Line 2 */}
              <span className="block overflow-hidden py-0.5 sm:py-1">
                <motion.span
                  className="block"
                  initial={{ y: shouldReduceMotion ? 0 : '108%', opacity: shouldReduceMotion ? 1 : 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, delay: 0.18, ease: editorialEase }}
                >
                  figure it all out
                </motion.span>
              </span>

              {/* Line 3 with Butter-Yellow Brush Highlight Animation */}
              <span className="block overflow-hidden py-0.5 sm:py-1">
                <motion.span
                  className="inline-block relative"
                  initial={{ y: shouldReduceMotion ? 0 : '108%', opacity: shouldReduceMotion ? 1 : 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, delay: 0.3, ease: editorialEase }}
                >
                  <span>alone.</span>

                  {/* Horizontal Butter-Yellow Brush Highlight Reveal */}
                  <motion.span
                    className="absolute inset-x-0 bottom-1 sm:bottom-2 h-[38%] bg-[#F1E3A6] -z-10 rounded-xs -rotate-0.5 pointer-events-none origin-left"
                    initial={{ scaleX: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
                    animate={{ scaleX: 1, opacity: 0.95 }}
                    transition={{
                      duration: shouldReduceMotion ? 0.01 : 0.65,
                      delay: shouldReduceMotion ? 0 : 0.55, // smoothly sweeps right as text locks into place
                      ease: editorialEase,
                    }}
                    aria-hidden="true"
                  />
                </motion.span>
              </span>

            </h1>

            {/* Doctor Name & Subtitle - Smooth dignified entrance */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, delay: 0.42, ease: editorialEase }}
              className="mb-4"
            >
              <p className="font-editorial text-2xl sm:text-3xl text-[#332B27] font-semibold tracking-wide">
                Dr. Niva Jacob
              </p>
              <p className="text-xs sm:text-sm font-sans-clean font-medium text-[#B89552] tracking-wider uppercase mt-1">
                Psychiatrist • Sexologist • Therapist
              </p>
            </motion.div>

            {/* Supporting Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, delay: 0.52, ease: editorialEase }}
              className="text-base sm:text-lg text-[#332B27]/80 font-sans-clean leading-relaxed max-w-xl mb-9 font-light"
            >
              A compassionate, evidence-based space for your mental health, relationships and sexual wellbeing.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, delay: 0.62, ease: editorialEase }}
              className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7 mb-10"
            >
              <button
                onClick={() => openBooking()}
                className="btn-primary-editorial px-8 py-4 text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto group"
              >
                <span>BOOK A CONSULTATION</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={scrollToConsultations}
                className="editorial-link text-sm font-medium text-[#332B27] hover:text-[#B89552] py-2 cursor-pointer self-start sm:self-auto group"
              >
                <span>Explore how I can help</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </motion.div>

            {/* Triad Anchors */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, delay: 0.75 }}
              className="pt-6 border-t border-[#332B27]/10 flex flex-wrap items-center gap-5 text-xs font-sans-clean text-[#332B27]/60"
            >
              <span className="font-medium text-[#332B27]">Mental Health</span>
              <span className="text-[#B89552]">•</span>
              <span className="font-medium text-[#332B27]">Sexual Health</span>
              <span className="text-[#B89552]">•</span>
              <span className="font-medium text-[#332B27]">Relationships</span>
            </motion.div>

          </div>

          {/* ================= RIGHT: LARGE PORTRAIT WITH ORGANIC PAINTED FORM & MOUSE PARALLAX ================= */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center items-center relative">
            
            {/* Irregular Butter-Yellow Organic Shape: Expands on load + smooth GPU mouse parallax depth (6–8px) */}
            <motion.div
              initial={{ scale: shouldReduceMotion ? 1 : 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.95 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 1.0, delay: 0.1, ease: editorialEase }}
              style={{
                x: shouldReduceMotion ? 0 : shapeX,
                y: shouldReduceMotion ? 0 : shapeY,
              }}
              className="absolute -inset-8 sm:-inset-12 flex items-center justify-center pointer-events-none -z-10"
            >
              <svg 
                viewBox="0 0 500 560" 
                className="w-[128%] h-[128%] max-w-none text-[#F1E3A6] fill-current select-none drop-shadow-xs"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Irregular hand-painted gouache / organic silhouette contour */}
                <path 
                  d="M 190,20 
                     C 300,10 405,45 450,115 
                     C 495,185 490,270 475,355 
                     C 460,440 410,510 330,540 
                     C 250,570 150,545 90,490 
                     C 30,435 15,350 20,265 
                     C 25,180 50,110 100,55 
                     C 130,22 155,23 190,20 Z" 
                />
              </svg>
            </motion.div>

            {/* Editorial Portrait Container: Fades upward on load + mouse depth (3–4px) + scroll parallax */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.85, delay: 0.15, ease: editorialEase }}
              style={{
                x: shouldReduceMotion ? 0 : portraitX,
                y: shouldReduceMotion ? 0 : combinedPortraitY,
              }}
              className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md"
            >
              <div 
                className="overflow-hidden bg-[#EAE3D2] shadow-xl border-4 border-white transition-all duration-500"
                style={{
                  borderRadius: '38px 22px 44px 26px',
                }}
              >
                <img
                  src={drNivaPortrait}
                  alt={`Portrait of ${DOCTOR_INFO.name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto aspect-[3/4] object-cover object-top filter contrast-[1.02] brightness-[1.01]"
                />
              </div>

              {/* Verified Clinical Indicator */}
              <div className="absolute -bottom-3 -left-3 sm:-left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#332B27]/10 shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[11px] font-sans-clean font-medium text-[#332B27]">
                  Consulting Online · Pan-India
                </span>
              </div>
            </motion.div>

          </div>

        </div>
      </div>

      {/* Floating line: "Scroll to explore ↓" at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="max-w-6xl mx-auto px-6 pt-10 text-center select-none"
      >
        <button
          onClick={scrollToIntroduction}
          className="inline-flex items-center gap-1.5 text-xs text-[#332B27]/40 hover:text-[#332B27] transition-colors cursor-pointer group"
        >
          <span>Scroll to explore</span>
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
        </button>
      </motion.div>

    </section>
  );
};
