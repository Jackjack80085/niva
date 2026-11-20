import { DOCTOR_INFO } from '../../data/initialData';
import drNivaPortrait from '../../assets/images/dr-niva-hero.webp';
import drNivaPortraitSmall from '../../assets/images/dr-niva-hero-small.webp';

export const HeroSection = () => {
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
          <h1 id="hero-heading" className="portrait-hero-heading font-editorial font-normal">
            <span className="portrait-hero-lead">I don't just want to understand what you're going through.</span>{' '}
            <span className="portrait-hero-emphasis">I want to understand what brought you here.</span>
          </h1>
        </div>
      </div>
    </section>
  );
};
