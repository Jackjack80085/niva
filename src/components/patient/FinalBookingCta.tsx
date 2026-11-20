import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { OrganicShape } from '../common/OrganicMotifs';

export const FinalBookingCta: React.FC = () => {
  const { openBooking } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);

  // Organic background shape slowly expands as user approaches section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });
  const shapeScale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);

  // Subtle magnetic hover for primary CTA button on desktop
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldReduceMotion || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Maximum 5px magnetic attraction
    const x = Math.max(-5, Math.min(5, (e.clientX - centerX) * 0.15));
    const y = Math.max(-5, Math.min(5, (e.clientY - centerY) * 0.15));
    setBtnOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setBtnOffset({ x: 0, y: 0 });
  };

  return (
    <section 
      ref={containerRef}
      className="py-28 md:py-44 bg-[#FAF7F0] texture-paper relative overflow-hidden flex items-center justify-center border-t border-[#332B27]/10"
    >
      {/* Large Butter-Yellow Organic Shape entering from the right edge */}
      <motion.div
        style={{ scale: shouldReduceMotion ? 1 : shapeScale }}
        className="absolute -right-20 sm:-right-28 top-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] pointer-events-none select-none -z-10 origin-right"
        aria-hidden="true"
      >
        <OrganicShape variant="corner" opacity={0.88} className="w-full h-full text-[#F1E3A6]" />
      </motion.div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-10">
        
        {/* Emotional Finale Heading */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={standardViewport}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.85, ease: editorialEase }}
          className="space-y-4"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-[#B89552] font-sans-clean">
            BEGIN YOUR CONSULTATION
          </span>

          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl lg:text-[4.4rem] text-[#332B27] font-normal leading-[1.08] tracking-tight max-w-2xl mx-auto">
            You deserve a space<br />
            where you can speak openly.
          </h2>

          <p className="text-sm sm:text-base text-[#332B27]/70 font-sans-clean font-light max-w-md mx-auto pt-2">
            Unhurried appointments for individual psychiatry, psychotherapy, and certified psychosexual care.
          </p>
        </motion.div>

        {/* Magnetic CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={standardViewport}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, delay: 0.2, ease: editorialEase }}
          className="inline-flex justify-center"
        >
          <motion.button
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ x: btnOffset.x, y: btnOffset.y }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, mass: 0.1 }}
            onClick={() => openBooking()}
            className="btn-primary-editorial px-10 py-5 text-xs sm:text-sm font-semibold uppercase tracking-wider inline-flex items-center gap-3 shadow-md hover:shadow-xl cursor-pointer group"
          >
            <span>BOOK A CONSULTATION</span>
            <ArrowRight className="w-4 h-4 text-[#F1E3A6] transition-transform duration-200 group-hover:translate-x-1.5" />
          </motion.button>
        </motion.div>

        <p className="text-xs text-[#332B27]/50 font-sans-clean">
          100% confidential · Telehealth pan-India and worldwide
        </p>

      </div>
    </section>
  );
};
