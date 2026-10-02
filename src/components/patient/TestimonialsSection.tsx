import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { fadeInUp, fadeInScale, staggerContainer, standardViewport } from '../../utils/motionVariants';
import { 
  Quote, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Sparkles, 
  Clock
} from 'lucide-react';

interface Testimonial {
  id: string;
  category: 'all' | 'anxiety' | 'relationships' | 'trauma';
  categoryLabel: string;
  quote: string;
  author: string;
  initials: string;
  context: string;
  duration: string;
  outcome: string;
  modality: string;
  location: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    category: 'anxiety',
    categoryLabel: 'Anxiety & Panic',
    quote: "I spent years feeling overwhelmed by constant catastrophic worry and nocturnal panic. Dr. Jacob's approach was unlike anything I had experienced—she helped me understand my nervous system's fight-or-flight triggers rather than treating me as broken. I feel genuinely grounded again.",
    author: "Priya Rao",
    initials: "PR",
    context: "Tech Lead, 32",
    duration: "8 Months of Care",
    outcome: "Overcame nocturnal panic cycles; rebuilt autonomic nervous system regulation",
    modality: "CBT & Somatic Grounding",
    location: "HSR Therapy Suite"
  },
  {
    id: 't-2',
    category: 'relationships',
    categoryLabel: 'Couples & Relationships',
    quote: "My partner and I were stuck in a paralyzing pursue-withdraw deadlock for over three years. Dr. Jacob guided us into understanding our underlying attachment styles and fears of abandonment without choosing sides. Our communication is compassionate and honest today.",
    author: "Arjun & Maya Nair",
    initials: "AM",
    context: "Product Designers, 36",
    duration: "14 Months of Care",
    outcome: "Transformed conflict loops and restored secure emotional intimacy",
    modality: "Emotionally Focused Therapy (EFT)",
    location: "Indiranagar Practice"
  },
  {
    id: 't-3',
    category: 'trauma',
    categoryLabel: 'Trauma & Attachment',
    quote: "Processing childhood trauma always felt terrifying until I worked with Dr. Jacob. Her pacing is exceptionally respectful—she never forced me into overwhelming disclosures, teaching me grounding skills first. Her clinical steadiness made healing feel possible.",
    author: "Rahul Mehta",
    initials: "RM",
    context: "Director of Operations, 41",
    duration: "11 Months of Care",
    outcome: "Processed deep traumatic triggers; dissolved chronic somatic shame",
    modality: "EMDR Protocol & Compassion Work",
    location: "Virtual Clinical Suite"
  },
  {
    id: 't-4',
    category: 'anxiety',
    categoryLabel: 'Anxiety & Panic',
    quote: "As a senior leader, I hid my debilitating social anxiety and imposter syndrome behind chronic exhaustion. Dr. Jacob provided a sanctuary where I didn't need to perform or rationalize. She helped me decouple my self-worth from unrelenting productivity.",
    author: "Ananya Deshmukh",
    initials: "AD",
    context: "Strategy Consultant, 30",
    duration: "6 Months of Care",
    outcome: "Reclaimed healthy boundary clarity; resolved severe performance anxiety",
    modality: "Acceptance & Commitment Therapy (ACT)",
    location: "Indiranagar Practice"
  },
  {
    id: 't-5',
    category: 'relationships',
    categoryLabel: 'Couples & Relationships',
    quote: "Parenting pressures and career stress had completely eroded our emotional connection. Dr. Jacob helped us recognize that our conflicts were never about household logistics, but unvoiced loneliness and exhaustion. We now have a compassionate framework to repair quickly.",
    author: "Karthik & Sneha Iyer",
    initials: "KS",
    context: "Architects & Parents, 38",
    duration: "10 Months of Care",
    outcome: "Restored mutual empathy and structured collaborative parenting partnership",
    modality: "Systemic Relational Therapy",
    location: "HSR Therapy Suite"
  },
  {
    id: 't-6',
    category: 'trauma',
    categoryLabel: 'Trauma & Attachment',
    quote: "Navigating emotional intimacy and avoidant tendencies was always my persistent blind spot. Dr. Jacob helped me demystify avoidant defense mechanisms with zero judgment. The quiet, deeply thoughtful space she creates has been life-changing.",
    author: "Vikramaditya S.",
    initials: "VS",
    context: "Research Scientist, 35",
    duration: "12 Months of Care",
    outcome: "Cultivated emotional openness and resilient self-compassion",
    modality: "Psychodynamic & Schema Psychotherapy",
    location: "Virtual Clinical Suite"
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Reflections' },
  { id: 'anxiety', label: 'Anxiety & Panic' },
  { id: 'relationships', label: 'Couples & Relationships' },
  { id: 'trauma', label: 'Trauma & Attachment' },
] as const;

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 280, damping: 30 },
      opacity: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      scale: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: 'spring', stiffness: 280, damping: 30 },
      opacity: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
      scale: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
    },
  }),
};

export const TestimonialsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered dataset
  const filteredList = TESTIMONIALS.filter(t => 
    selectedCategory === 'all' ? true : t.category === selectedCategory
  );

  const activeTestimonial = filteredList[currentIndex] || filteredList[0];

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const nextIndex = prev + newDirection;
      if (nextIndex < 0) return filteredList.length - 1;
      if (nextIndex >= filteredList.length) return 0;
      return nextIndex;
    });
  };

  const jumpToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Autoplay handler with pause on hover
  useEffect(() => {
    if (isPlaying) {
      autoPlayRef.current = setInterval(() => {
        paginate(1);
      }, 7000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, currentIndex, filteredList.length]);

  // Reset index when category changes
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentIndex(0);
    setDirection(0);
  };

  return (
    <section 
      id="testimonials"
      className="py-20 md:py-32 max-w-6xl mx-auto px-6 relative overflow-hidden texture-grain"
    >
      
      {/* Background stippled dot texture */}
      <div className="absolute inset-0 texture-dots pointer-events-none opacity-25 -z-10" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-[#1B4D3E]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header with Scroll Reveal Animation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
        <motion.div 
          className="max-w-xl"
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
          variants={fadeInUp}
        >
          <p className="text-xs font-semibold tracking-wider uppercase text-[#1B4D3E] font-sans-clean mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clinical Feedback & Patient Reflections</span>
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#111827] font-normal tracking-tight">
            Restoring clarity, safety, and emotional calm.
          </h2>
          <p className="mt-4 text-base text-neutral-600 font-sans-clean leading-relaxed">
            Attributable reflections from individuals and couples under long-term psychological care.
          </p>
        </motion.div>

        {/* Category Filter Pills */}
        <motion.div 
          className="flex flex-wrap items-center gap-2"
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
          variants={fadeInUp}
        >
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1B4D3E] text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/80 hover:border-neutral-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Main Interactive Testimonial Slider Stage */}
      <motion.div 
        className="relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={standardViewport}
        variants={fadeInScale}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        <div className="relative bg-white/90 backdrop-blur-md rounded-[32px] border border-neutral-200/90 shadow-xl shadow-stone-900/5 p-8 sm:p-12 lg:p-14 overflow-hidden">
          
          {/* Subtle Corner Ambient Aura */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#1B4D3E]/10 via-[#1B4D3E]/2 to-transparent rounded-bl-full pointer-events-none" />
          
          {/* Decorative quote mark */}
          <div className="absolute top-6 right-8 text-neutral-100 pointer-events-none select-none">
            <Quote className="w-24 h-24 stroke-[1] text-[#1B4D3E]/10" />
          </div>

          {/* AnimatePresence Slider Content */}
          <div className="relative min-h-[320px] sm:min-h-[280px] flex flex-col justify-between">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeTestimonial.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;
                  if (swipe < -50 || velocity.x < -400) {
                    paginate(1);
                  } else if (swipe > 50 || velocity.x > 400) {
                    paginate(-1);
                  }
                }}
                className="space-y-8 cursor-grab active:cursor-grabbing"
              >
                {/* Category Badge & Duration */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-[#1B4D3E]/10 text-xs font-semibold text-[#1B4D3E]">
                    {activeTestimonial.categoryLabel}
                  </span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs font-medium text-neutral-500 font-sans-clean flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{activeTestimonial.duration}</span>
                  </span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs font-medium text-neutral-500 font-sans-clean">
                    {activeTestimonial.location}
                  </span>
                </div>

                {/* Primary Reflection Quote */}
                <blockquote className="font-editorial text-xl sm:text-2xl lg:text-3xl text-neutral-900 leading-relaxed italic font-normal tracking-tight max-w-4xl">
                  "{activeTestimonial.quote}"
                </blockquote>

                {/* Patient Signature & Clinical Treatment Outcome Card */}
                {/* Patient Signature & Attributable Context */}
                <div className="pt-8 border-t border-neutral-100 flex items-center justify-between">
                  
                  {/* Author Identity */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#1B4D3E]/10 text-[#1B4D3E] font-semibold text-sm flex items-center justify-center border border-[#1B4D3E]/15 shrink-0 shadow-2xs font-mono-tabular">
                      {activeTestimonial.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-base text-neutral-900 font-sans-clean">
                        {activeTestimonial.author}
                      </p>
                      <p className="text-xs text-neutral-500 font-sans-clean mt-0.5">
                        {activeTestimonial.context}
                      </p>
                    </div>
                  </div>

                </div>

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slider Navigation Bar */}
          <div className="mt-10 pt-6 border-t border-neutral-100 flex items-center justify-between">
            
            {/* Slide Index Counter */}
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-sm font-semibold text-neutral-900">
                0{currentIndex + 1}
              </span>
              <span className="text-neutral-300">/</span>
              <span className="font-mono-tabular text-xs text-neutral-400">
                0{filteredList.length}
              </span>

              {/* Autoplay Play/Pause Toggle */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="ml-3 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {filteredList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx 
                      ? 'w-7 bg-[#1B4D3E]' 
                      : 'w-2 bg-neutral-200 hover:bg-neutral-300'
                  }`}
                  aria-label={`Jump to reflection ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrow Controls */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => paginate(-1)}
                className="w-10 h-10 rounded-full border border-neutral-200 bg-white hover:border-[#1B4D3E]/40 hover:bg-[#1B4D3E]/5 flex items-center justify-center text-neutral-700 hover:text-[#1B4D3E] transition-all shadow-2xs"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => paginate(1)}
                className="w-10 h-10 rounded-full border border-neutral-200 bg-white hover:border-[#1B4D3E]/40 hover:bg-[#1B4D3E]/5 flex items-center justify-center text-neutral-700 hover:text-[#1B4D3E] transition-all shadow-2xs"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

          </div>

        </div>

        {/* Thumbnail Quick Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {filteredList.slice(0, 3).map((item, idx) => {
            const isActive = currentIndex === idx;
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                onClick={() => jumpToSlide(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white border-[#1B4D3E] ring-1 ring-[#1B4D3E] shadow-sm'
                    : 'bg-white/60 hover:bg-white border-neutral-200/80 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-neutral-900 font-sans-clean">
                    {item.author}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-neutral-400">
                    0{idx + 1}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 font-sans-clean line-clamp-2 leading-relaxed">
                  "{item.quote}"
                </p>
              </motion.div>
            );
          })}
        </div>

      </motion.div>

    </section>
  );
};
