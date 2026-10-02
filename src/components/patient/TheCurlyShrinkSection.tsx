import React, { useState, useRef } from 'react';
import { Play, Instagram, Youtube, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { HandDrawnCurl } from '../common/OrganicMotifs';

interface SocialThumbnail {
  id: string;
  type: 'VIDEO' | 'REEL' | 'BREAKDOWN';
  title: string;
  topic: string;
  duration: string;
  views: string;
  aspect: string;
  caption: string;
  takeaways: string[];
  gradientBg: string;
}

const SOCIAL_ITEMS: SocialThumbnail[] = [
  {
    id: 'anxiety-breakdown',
    type: 'VIDEO',
    title: 'Anxiety explained without the clinical jargon',
    topic: 'Mental Health & Nervous System',
    duration: '3:45',
    views: '124K views',
    aspect: 'aspect-[9/16] max-h-[460px]',
    caption: 'Why your body enters fight-or-flight before your brain even knows why—and the physiological sigh that resets your vagus nerve in 20 seconds.',
    takeaways: [
      'Panic is a protective survival reflex firing at maximum volume.',
      'Somatic cues like heart palpitations are carbon-dioxide sensitivity, not a cardiac event.',
      'Two quick nasal inhales + long mouth exhale stimulates the parasympathetic brake.'
    ],
    gradientBg: 'from-[#FAF7F0] via-[#FAF3D8] to-[#EBDCA0]',
  },
  {
    id: 'dating-patterns',
    type: 'REEL',
    title: 'The anxious-avoidant trap in modern dating',
    topic: 'Attachment & Relationships',
    duration: '1:30',
    views: '98K views',
    aspect: 'aspect-[4/5] max-h-[420px]',
    caption: 'The anxious-avoidant loop: why the more one partner pursues, the faster the other withdraws into silence—and how to break the cycle.',
    takeaways: [
      'Pursuit and withdrawal are two expressions of the exact same attachment fear.',
      'Name the cycle as the third entity in the room rather than attacking your partner.',
      'Taking a regulated 20-minute break with a promised return time prevents flooded fights.'
    ],
    gradientBg: 'from-[#F5EBD4] via-[#F1E3A6] to-[#DFC885]',
  },
  {
    id: 'sexual-wellbeing',
    type: 'VIDEO',
    title: 'De-mystifying vaginismus & intimacy guilt',
    topic: 'Sexology & Intimacy',
    duration: '5:08',
    views: '186K views',
    aspect: 'aspect-[9/16] max-h-[460px]',
    caption: 'De-mystifying vaginismus, performance anxiety, and mismatched libido without clinical shame, embarrassment, or awkwardness.',
    takeaways: [
      'Pelvic floor guarding is involuntary—your body is trying to protect you.',
      'Spontaneous desire vs. responsive desire: why not being in the mood immediately is completely normal.',
      'Intimacy flourishes when performance benchmarks and fear of failure are taken off the table.'
    ],
    gradientBg: 'from-[#FAF7F0] via-[#F4E6B4] to-[#E2CC77]',
  },
  {
    id: 'boundary-phrases',
    type: 'REEL',
    title: 'Phrases to speak unspoken boundaries',
    topic: 'Relational Safety',
    duration: '0:58',
    views: '210K views',
    aspect: 'aspect-[1/1] max-h-[400px]',
    caption: 'How to communicate a boundary without over-explaining, apologizing, or triggering defensive hostility.',
    takeaways: [
      'A boundary is about what YOU will do, not controlling the other person.',
      'Clear is kind; over-justification invites debate.',
      'Regulate your nervous system before responding to conflict.'
    ],
    gradientBg: 'from-[#FAF7F0] via-[#EFE0AA] to-[#DBC270]',
  },
];

export const TheCurlyShrinkSection: React.FC = () => {
  const [activeItem, setActiveItem] = useState<SocialThumbnail | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Subtle horizontal scroll linked to vertical page scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const railX = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section 
      ref={sectionRef}
      id="the-curly-shrink" 
      className="py-28 md:py-40 bg-[#F1E3A6] text-[#332B27] relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header: Distinct expressive composition */}
        <div className="max-w-3xl mb-12 sm:mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={standardViewport}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.75, ease: editorialEase }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-bold tracking-widest uppercase text-[#332B27]/70 font-sans-clean">
              THE OTHER SIDE OF MY WORK
            </span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={standardViewport}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.85, delay: 0.1, ease: editorialEase }}
            className="font-editorial text-5xl sm:text-6xl lg:text-[4.5rem] text-[#332B27] font-normal leading-[1.05] tracking-tight"
          >
            Meet The{' '}
            <span className="italic font-light text-[1.12em] font-editorial text-[#27201D]">
              Curly
            </span>{' '}
            Shrink.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={standardViewport}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, delay: 0.2, ease: editorialEase }}
            className="text-base sm:text-lg text-[#332B27]/80 font-sans-clean leading-relaxed font-light max-w-xl"
          >
            Mental health, sexual health and relationship conversations — made simpler, more relatable and easier to talk about.
          </motion.p>

          {/* Hand-drawn curly-line animation connecting heading to content */}
          <div className="pt-2">
            <HandDrawnCurl width={90} strokeWidth={2.4} color="#332B27" delay={0.4} />
          </div>
        </div>

      </div>

      {/* Horizontally Arranged Real Social-Content Rail (Responsive to Vertical Scroll) */}
      <div className="w-full overflow-x-auto pb-8 pt-2 scrollbar-none px-6 sm:px-12">
        <motion.div 
          style={{ x: shouldReduceMotion ? 0 : railX }}
          className="flex items-end gap-6 sm:gap-8 min-w-max"
        >
          {SOCIAL_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => setActiveItem(item)}
              whileHover={{ scale: shouldReduceMotion ? 1 : 1.025 }}
              transition={{ duration: 0.35, ease: editorialEase }}
              className={`w-72 sm:w-80 ${item.aspect} rounded-3xl bg-gradient-to-tr ${item.gradientBg} border-2 border-white/70 shadow-md hover:shadow-xl p-6 flex flex-col justify-between cursor-pointer relative overflow-hidden group select-none`}
            >
              {/* Top Tag & Badge */}
              <div className="flex items-center justify-between z-10">
                <span className="px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-wider text-[#332B27] font-sans-clean">
                  {item.type}
                </span>
                <span className="text-[11px] font-semibold text-[#332B27]/70 font-mono-tabular">
                  {item.duration}
                </span>
              </div>

              {/* Play Button Indicator */}
              <div className="my-auto mx-auto w-12 h-12 rounded-full bg-white/90 text-[#332B27] flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                <Play className="w-5 h-5 fill-[#332B27] ml-0.5" />
              </div>

              {/* Bottom Metadata: Fades upward on hover */}
              <div className="z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white/80 space-y-1 shadow-xs transition-transform duration-300 group-hover:-translate-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B89552] block">
                  {item.topic}
                </span>
                <p className="font-editorial text-lg font-medium text-[#332B27] leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-[#332B27]/60 font-mono-tabular pt-1">
                  {item.views} · Watch breakdown →
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Social Channels Footer */}
      <div className="max-w-6xl mx-auto px-6 pt-10 border-t border-[#332B27]/15 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="font-editorial italic text-2xl text-[#332B27] font-normal">
            @thecurlyshrink
          </span>
          <p className="text-xs text-[#332B27]/70 font-sans-clean mt-0.5">
            Psychiatry & sexology education for over 250,000+ humans worldwide.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#332B27] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#27201D] hover:-translate-y-0.5 transition-all shadow-xs"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram ↗</span>
          </a>

          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#332B27] text-xs font-semibold uppercase tracking-wider hover:bg-[#FAF7F0] hover:-translate-y-0.5 transition-all shadow-xs border border-[#332B27]/10"
          >
            <Youtube className="w-4 h-4 text-red-600" />
            <span>YouTube ↗</span>
          </a>
        </div>
      </div>

      {/* Video Modal Player */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200"
            >
              <div className="p-6 bg-[#F1E3A6] text-[#332B27] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#332B27]/70 block font-sans-clean">
                    {activeItem.topic}
                  </span>
                  <h3 className="font-editorial text-2xl font-bold text-[#332B27]">
                    {activeItem.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveItem(null)}
                  className="p-2 rounded-full hover:bg-black/10 text-[#332B27] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 font-sans-clean text-xs sm:text-sm">
                <p className="text-[#332B27]/80 leading-relaxed font-light">
                  {activeItem.caption}
                </p>

                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">
                    Core Clinical Takeaways:
                  </p>
                  <ul className="space-y-2 text-xs text-neutral-600">
                    {activeItem.takeaways.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B89552] mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-neutral-100 text-xs">
                  <span className="text-neutral-400 font-mono-tabular">
                    {activeItem.views} · High engagement
                  </span>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#332B27] hover:underline flex items-center gap-1"
                  >
                    <span>View on Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};
