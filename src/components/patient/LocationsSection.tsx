import React from 'react';
import { useApp } from '../../context/AppContext';
import { Video, ShieldCheck, Globe, Clock, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, fadeInScale, staggerContainer, standardViewport } from '../../utils/motionVariants';

export const LocationsSection: React.FC = () => {
  const { openBooking } = useApp();

  return (
    <section id="online-therapy" className="py-20 md:py-28 max-w-6xl mx-auto px-6 relative overflow-hidden texture-grain">
      {/* Anchor for backwards compatibility */}
      <div id="locations" className="sr-only" />
      
      {/* Background tactile dots */}
      <div className="absolute inset-0 texture-dots pointer-events-none opacity-30 -z-10" />

      {/* Section Header with reveal */}
      <motion.div 
        className="max-w-2xl mb-16 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={standardViewport}
        variants={fadeInUp}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1E3A6] text-[#332B27] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#B89552]/30">
          <span className="w-2 h-2 rounded-full bg-[#B89552] animate-pulse" />
          <span>100% Online Therapy & Consultation</span>
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#332B27] font-normal tracking-tight">
          Private, confidential clinical care from anywhere.
        </h2>
        <p className="mt-4 text-base text-[#332B27]/70 font-sans-clean leading-relaxed">
          Exclusively dedicated to online psychotherapy and virtual clinical consultations. Experience deep psychological presence, zero commute delay, and absolute confidentiality from your private personal sanctuary.
        </p>
      </motion.div>

      {/* Featured Teletherapy Showcase Banner */}
      <motion.div 
        className="relative rounded-[28px] overflow-hidden mb-16 shadow-lg shadow-black/5 aspect-[21/9] bg-stone-900 group z-10"
        initial="hidden"
        whileInView="visible"
        viewport={standardViewport}
        variants={fadeInScale}
      >
        <img
          src="/src/assets/images/sanctuary_studio_1790926680361.jpg"
          alt="Peaceful online therapy environment"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-75 transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Video className="w-4 h-4 text-[#F1E3A6]" />
              <p className="text-xs font-medium tracking-wide uppercase text-white/80">Virtual Clinical Consulting Suite</p>
            </div>
            <p className="text-base sm:text-lg font-semibold">End-to-end encrypted HD video consultations, private intake & electronic prescriptions</p>
          </div>
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 whitespace-nowrap text-white">
            Available Pan-India & Global
          </span>
        </div>
      </motion.div>

      {/* Three Pillars of Online Practice */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={standardViewport}
        variants={staggerContainer}
      >
        <motion.div 
          className="bg-white p-8 rounded-[24px] border border-[#332B27]/10 shadow-xs flex flex-col justify-between"
          variants={fadeInUp}
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F1E3A6] text-[#332B27] flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-2xl text-[#332B27] font-medium mb-3">
              End-to-End Privacy
            </h3>
            <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed">
              Sessions take place on secure, HIPAA-compliant telehealth connections. No downloads or installations required—access your session with one click from your laptop or mobile.
            </p>
          </div>
          <div className="pt-6 mt-6 border-t border-[#332B27]/10 flex items-center gap-2 text-xs text-[#332B27]/60 font-mono-tabular">
            <CheckCircle2 className="w-4 h-4 text-[#B89552]" />
            <span>Browser-based encrypted link</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-8 rounded-[24px] border border-[#332B27]/10 shadow-xs flex flex-col justify-between"
          variants={fadeInUp}
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F1E3A6] text-[#332B27] flex items-center justify-center mb-5">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-2xl text-[#332B27] font-medium mb-3">
              Flexible Across Timezones
            </h3>
            <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed">
              Consulting clients across India, Singapore, the UAE, the UK, and North America. Evening and weekend slots carefully calibrated for your work schedule and timezone.
            </p>
          </div>
          <div className="pt-6 mt-6 border-t border-[#332B27]/10 flex items-center gap-2 text-xs text-[#332B27]/60 font-mono-tabular">
            <CheckCircle2 className="w-4 h-4 text-[#B89552]" />
            <span>IST, GMT, EST, PST compatible</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-8 rounded-[24px] border border-[#332B27]/10 shadow-xs flex flex-col justify-between"
          variants={fadeInUp}
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F1E3A6] text-[#332B27] flex items-center justify-center mb-5">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-2xl text-[#332B27] font-medium mb-3">
              Seamless Digital Care
            </h3>
            <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed">
              Every consultation includes stored clinical notes, downloadable digital prescriptions, and structured therapeutic homework directly in your secure electronic record.
            </p>
          </div>
          <div className="pt-6 mt-6 border-t border-[#332B27]/10 flex items-center gap-2 text-xs text-[#332B27]/60 font-mono-tabular">
            <CheckCircle2 className="w-4 h-4 text-[#B89552]" />
            <span>Digital Rx & Clinical notes</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Direct Booking CTA */}
      <motion.div 
        className="mt-12 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={standardViewport}
        variants={fadeInUp}
      >
        <button
          onClick={() => openBooking()}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#332B27] hover:bg-[#27201D] text-[#FAF7F0] text-sm font-semibold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>Book an Online Consultation</span>
          <ArrowRight className="w-4 h-4 text-[#F1E3A6]" />
        </button>
      </motion.div>
    </section>
  );
};
