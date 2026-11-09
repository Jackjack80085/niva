import { ArrowDown, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DOCTOR_INFO } from '../../data/initialData';
import drNivaPortrait from '../../assets/images/dr-niva-hero.webp';
import drNivaPortraitSmall from '../../assets/images/dr-niva-hero-small.webp';

export const HeroSection = () => {
  const { openBooking } = useApp();

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
        <div className="portrait-hero-copy">
          <div>
            <p className="mb-4 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.17em] text-[#F1E3A6] sm:mb-5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {DOCTOR_INFO.name}
            </p>
            <h1 id="hero-heading" className="portrait-hero-heading font-editorial font-medium tracking-tight">
              <span className="block">You don’t have to</span>
              <span className="block">figure it all out</span>
              <span className="block text-[#F1E3A6]">alone.</span>
            </h1>
          </div>

          <div className="portrait-hero-actions">
            <p className="mb-2 text-xs font-semibold tracking-wide text-[#F1E3A6]">
              Psychiatrist · Sexologist · Therapist
            </p>
            <p className="text-sm leading-relaxed text-[#FAF7F0]/90 sm:text-base">
              A compassionate, evidence-based space for your mental health, relationships and sexual wellbeing.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => openBooking()}
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#F1E3A6] px-5 py-3 text-sm font-bold text-[#332B27] transition-colors hover:bg-[#FAF7F0]"
              >
                Book a consultation
                <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
              </button>
              <a
                href="#consultations"
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold underline decoration-[#F1E3A6]/60 underline-offset-4 hover:text-[#F1E3A6]"
              >
                Explore services
                <ArrowDown aria-hidden="true" className="size-3" />
              </a>
            </div>
          </div>
        </div>

        <ul className="portrait-hero-topics font-editorial" aria-label="Areas of care">
          {['Mental health', 'Sexual health', 'Relationships'].map((topic) => (
            <li key={topic} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#F1E3A6]" />
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
