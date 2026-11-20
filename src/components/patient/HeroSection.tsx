import { DOCTOR_INFO } from '../../data/initialData';
import { motion, useReducedMotion } from 'framer-motion';
import { editorialEase } from '../../utils/motionVariants';
import drNivaPortrait from '../../assets/images/dr-niva-hero.webp';
import drNivaPortraitSmall from '../../assets/images/dr-niva-hero-small.webp';

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <section aria-labelledby="hero-heading" className="portrait-hero">
      <div className="portrait-hero-image">
        <img
          src={drNivaPortrait}
          srcSet={`${drNivaPortraitSmall} 480w, ${drNivaPortrait} 960w`}
          sizes="(min-width: 1280px) 832px, (min-width: 768px) 65vw, 100vw"
          alt={`Portrait of ${DOCTOR_INFO.name}`}
          width={960}
          height={1440}
          fetchPriority="high"
        />
      </div>
      <div className="portrait-hero-shade" aria-hidden="true" />

      <div className="portrait-hero-inner mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.div
          className="portrait-hero-content"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .65, ease: editorialEase }}
        >
          <div className="portrait-hero-copy">
            <h1 id="hero-heading" className="portrait-hero-heading font-editorial font-normal">
              <span className="portrait-hero-lead">I don't just want to understand what you're going through.</span>{' '}
              <span className="portrait-hero-emphasis">I want to understand what brought you here.</span>
            </h1>
          </div>
          <aside className="portrait-hero-note" aria-label="A space for you">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#F1E3A6]">A space for you</p>
            <p className="mt-4 font-editorial text-3xl leading-[1.15] text-[#FAF7F0]">You can begin exactly where you are.</p>
            <p className="mt-3 text-sm leading-relaxed text-[#FAF7F0]/75">Bring your questions, your uncertainty, and your story.</p>
          </aside>
        </motion.div>
      </div>
    </section>
  );
};
