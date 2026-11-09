import { ArrowDown, ArrowRight, Video } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DOCTOR_INFO } from '../../data/initialData';
import drNivaPortrait from '../../assets/images/dr-niva-hero.webp';
import drNivaPortraitSmall from '../../assets/images/dr-niva-hero-small.webp';

export const HeroSection = () => {
  const { openBooking } = useApp();

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-[#FAF7F0] pt-27 pb-12 sm:pt-32 lg:pb-16"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 ambient-ivory-glow pointer-events-none" />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 sm:px-8 md:grid-cols-[1.13fr_1fr] md:gap-9 lg:gap-16">
        <div className="min-w-0">
          <div className="mb-5 sm:mb-6">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#705831]">
              <span aria-hidden="true" className="h-px w-6 bg-[#B89552]" />
              {DOCTOR_INFO.name}
            </p>
            <p className="mt-2 text-xs font-medium text-[#332B27]/70 sm:text-sm">
              Psychiatrist · Sexologist · Therapist
            </p>
          </div>

          <h1
            id="hero-heading"
            className="font-editorial max-w-[13ch] text-[clamp(2.65rem,10.8vw,4.4rem)] leading-[0.99] font-medium tracking-tight text-[#332B27] md:text-[clamp(3rem,5.55vw,5.1rem)]"
          >
            You don’t have to figure it all out{' '}
            <span className="relative isolate inline-block">
              alone.
              <span aria-hidden="true" className="absolute inset-x-0 bottom-[0.09em] -z-10 h-[0.28em] -rotate-2 rounded-sm bg-[#F1E3A6]" />
            </span>
          </h1>

          <p className="mt-5 max-w-[43ch] text-base leading-relaxed text-[#332B27]/80 sm:mt-6 sm:text-lg">
            A compassionate, evidence-based space for your mental health, relationships and sexual wellbeing.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 sm:mt-8">
            <button
              type="button"
              onClick={() => openBooking()}
              className="btn-primary-editorial group flex min-h-12 w-full items-center justify-center gap-3 px-6 py-3.5 text-sm font-semibold shadow-sm sm:w-auto"
            >
              Book a consultation
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </button>
            <a
              href="#consultations"
              className="group inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-[#332B27] underline decoration-[#B89552]/55 underline-offset-4 hover:decoration-[#332B27]"
            >
              Explore services
              <ArrowDown aria-hidden="true" className="size-3.5" />
            </a>
          </div>

          <p className="mt-5 border-t border-[#332B27]/12 pt-4 text-xs leading-relaxed text-[#332B27]/70 sm:mt-7 sm:text-sm">
            Mental health <span aria-hidden="true" className="mx-1 text-[#B89552]">·</span> Sexual health <span aria-hidden="true" className="mx-1 text-[#B89552]">·</span> Relationships
          </p>
        </div>

        <figure className="relative isolate mx-auto w-full max-w-[22rem] md:max-w-[26rem]">
          <div aria-hidden="true" className="absolute -inset-x-3 inset-y-3 -z-10 rotate-3 rounded-[30%_48%_34%_42%] bg-[#F1E3A6]/75 sm:-inset-x-4" />
          <div className="overflow-hidden rounded-[2rem_2rem_1.2rem_1.2rem] border-[3px] border-white bg-[#EAE3D2] shadow-[0_18px_50px_-24px_#332B2766]">
            <img
              src={drNivaPortrait}
              srcSet={`${drNivaPortraitSmall} 480w, ${drNivaPortrait} 960w`}
              sizes="(min-width: 1024px) 416px, (min-width: 768px) 44vw, (min-width: 400px) 352px, calc(100vw - 48px)"
              alt={`Portrait of ${DOCTOR_INFO.name}`}
              width={960}
              height={1440}
              fetchPriority="high"
              className="block aspect-[4/5] h-auto w-full object-cover object-[center_74%]"
            />
            <figcaption className="flex items-center gap-3 bg-[#FFFCF5] px-4 py-3.5 sm:px-5">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F2E8D1] text-[#705831]">
                <Video className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#332B27]">Online consultations</p>
                <p className="text-xs leading-relaxed text-[#332B27]/70">Available in India and internationally</p>
              </div>
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  );
};
