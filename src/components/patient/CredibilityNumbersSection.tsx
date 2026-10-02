import React, { useEffect, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { editorialEase, standardViewport } from '../../utils/motionVariants';

// Slow gentle count-up hook (1.2–1.5s, non-jittery)
const useSlowCountUp = (target: number, durationMs: number = 1400, trigger: boolean) => {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!trigger) return;
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [trigger, target, durationMs, shouldReduceMotion]);

  return count;
};

export const CredibilityNumbersSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();

  const clientsCount = useSlowCountUp(6300, 1400, isInView);
  const hoursCount = useSlowCountUp(1500, 1400, isInView);

  return (
    <section 
      ref={ref}
      className="py-28 md:py-40 bg-[#F5EFEB] texture-paper border-t border-[#332B27]/10 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Large Split-Screen Typography Composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          
          {/* Metric 1: 6,300+ clients */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={standardViewport}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.85, ease: editorialEase }}
            className="flex flex-col items-center md:items-start text-center md:text-left"
          >
            <div className="font-editorial text-7xl sm:text-8xl lg:text-[7.5rem] font-light tracking-tight text-[#332B27] leading-none">
              {clientsCount.toLocaleString('en-IN')}+
            </div>
            
            <div className="w-20 h-px bg-[#B89552]/40 my-4" />

            <div className="font-editorial italic text-2xl sm:text-3xl text-[#332B27]/70 font-normal">
              clients supported
            </div>
            <p className="text-xs sm:text-sm text-[#332B27]/60 font-sans-clean mt-2 max-w-xs font-light">
              Across clinical psychiatry, psychosexual therapy, and couple communication.
            </p>
          </motion.div>

          {/* Metric 2: 1,500+ hours */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={standardViewport}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.85, delay: 0.2, ease: editorialEase }}
            className="flex flex-col items-center md:items-start text-center md:text-left pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-[#B89552]/30 md:pl-16 lg:pl-20"
          >
            <div className="font-editorial text-7xl sm:text-8xl lg:text-[7.5rem] font-light tracking-tight text-[#332B27] leading-none">
              {hoursCount.toLocaleString('en-IN')}+
            </div>

            <div className="w-20 h-px bg-[#B89552]/40 my-4" />

            <div className="font-editorial italic text-2xl sm:text-3xl text-[#332B27]/70 font-normal">
              clinical consultation hours
            </div>
            <p className="text-xs sm:text-sm text-[#332B27]/60 font-sans-clean mt-2 max-w-xs font-light">
              Unhurried, dedicated one-on-one presence without false divides or rushed prescriptions.
            </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
