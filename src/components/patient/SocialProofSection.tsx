import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, standardViewport } from '../../utils/motionVariants';

export const SocialProofSection: React.FC = () => {
  return (
    <section className="py-24 md:py-36 bg-[#FAF7F0] relative overflow-hidden border-t border-[#332B27]/10 texture-paper">
      
      {/* Background subtle radial warm aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-[#F1E3A6]/20 via-[#B89552]/10 to-[#F1E3A6]/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Oversized Typography Social Proof (No SaaS KPI cards) */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-20 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
          variants={fadeInUp}
        >
          {/* Metric 1 */}
          <div className="flex flex-col items-center">
            <span className="font-editorial text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-light tracking-tight text-[#332B27] leading-none">
              6,300+
            </span>
            <span className="font-editorial italic text-2xl sm:text-3xl text-[#332B27]/70 mt-2 sm:mt-4 tracking-normal">
              clients
            </span>
          </div>

          {/* Metric 2 */}
          <div className="flex flex-col items-center">
            <span className="font-editorial text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-light tracking-tight text-[#332B27] leading-none">
              1,500+
            </span>
            <span className="font-editorial italic text-2xl sm:text-3xl text-[#332B27]/70 mt-2 sm:mt-4 tracking-normal">
              hours
            </span>
          </div>
        </motion.div>

        {/* Centered Poetic Anchor from User Specification */}
        <motion.div 
          className="mt-16 sm:mt-24 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
          variants={fadeInUp}
        >
          <div className="w-16 h-px bg-[#332B27]/20 mx-auto mb-8" />
          <p className="font-editorial text-2xl sm:text-3xl md:text-4xl text-[#332B27] font-normal tracking-wide">
            Compassion. Care. Healing.
          </p>
          <p className="text-xs sm:text-sm text-[#332B27]/60 font-sans-clean mt-3 max-w-md mx-auto leading-relaxed">
            Evidence-based psychiatric medicine and psychosexual therapy rooted in deep human dignity.
          </p>
        </motion.div>

      </div>
    </section>
  );
};
