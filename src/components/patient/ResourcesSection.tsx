import React, { useState } from 'react';
import { RESOURCE_ARTICLES } from '../../data/initialData';
import { ResourceArticle } from '../../types';
import { 
  ArrowRight, 
  X, 
  Clock, 
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { HandDrawnCurl } from '../common/OrganicMotifs';
import journalStillLifeImg from '../../assets/images/sanctuary_studio_1790926680361.jpg';

export const ResourcesSection: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<ResourceArticle | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const [filterCategory, setFilterCategory] = useState<'all' | 'mental-health' | 'relationships' | 'sexual-health'>('all');

  const filteredArticles = filterCategory === 'all' 
    ? RESOURCE_ARTICLES 
    : RESOURCE_ARTICLES.filter(a => a.category === filterCategory);

  const featuredArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  return (
    <section id="resources" className="py-24 md:py-36 bg-[#FAF7F0] texture-paper relative overflow-hidden border-t border-[#332B27]/10">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Editorial Publication Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-20">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest uppercase text-[#B89552] font-sans-clean">
                PUBLICATIONS & ESSAYS
              </span>
              <HandDrawnCurl width={40} color="#B89552" />
            </div>

            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[4rem] text-[#332B27] font-normal leading-[1.05] tracking-tight">
              Explore at your own pace.
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 font-sans-clean text-xs">
            {[
              { id: 'all', label: 'All Library' },
              { id: 'mental-health', label: 'Mental Health' },
              { id: 'relationships', label: 'Relationships' },
              { id: 'sexual-health', label: 'Sexual Health' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id as any)}
                className={`px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-[#332B27] text-white font-medium shadow-2xs'
                    : 'bg-white/80 border border-[#332B27]/10 text-[#332B27]/70 hover:border-[#332B27]/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= ASYMMETRIC EDITORIAL PUBLICATION GRID ================= */}
        <div className="space-y-10">
          
          {/* 1. Large Featured Lead Article */}
          {featuredArticle && (
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={standardViewport}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, ease: editorialEase }}
              onClick={() => setSelectedArticle(featuredArticle)}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center p-8 sm:p-12 rounded-[36px] bg-white border border-[#332B27]/12 shadow-xs hover:border-[#B89552]/60 transition-all duration-300 cursor-pointer group"
            >
              {/* Left text */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#B89552] group-hover:translate-x-1 transition-transform duration-300">
                    {featuredArticle.categoryLabel}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-xs text-[#332B27]/50 font-mono-tabular">
                    {featuredArticle.readTime}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F1E3A6]/60 text-[#332B27]">
                    Featured
                  </span>
                </div>

                <h3 className="font-editorial text-3xl sm:text-4xl lg:text-[2.6rem] text-[#332B27] font-medium leading-tight group-hover:text-[#B89552] transition-colors">
                  {featuredArticle.title}
                </h3>

                <p className="text-sm sm:text-base text-[#332B27]/70 font-sans-clean leading-relaxed font-light line-clamp-3">
                  {featuredArticle.excerpt}
                </p>

                <div className="pt-2">
                  <span className="editorial-link text-xs sm:text-sm font-semibold text-[#332B27] group-hover:text-[#B89552]">
                    <span>Read Full Essay</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-[#B89552]" />
                  </span>
                </div>
              </div>

              {/* Right imagery with zoom on hover (1 → 1.03) */}
              <div className="lg:col-span-5 overflow-hidden rounded-2xl bg-[#F5EFEB] aspect-[16/10] lg:aspect-[4/3] relative">
                <img
                  src={journalStillLifeImg}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover filter contrast-[1.02] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
            </motion.div>
          )}

          {/* 2. Smaller Asymmetric Resources Grid (Mixed Aspect Ratios) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {secondaryArticles.map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={standardViewport}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, delay: idx * 0.1, ease: editorialEase }}
                onClick={() => setSelectedArticle(article)}
                className="p-7 sm:p-8 rounded-3xl bg-white border border-[#332B27]/10 hover:border-[#B89552]/50 hover:shadow-xs transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#332B27]/50">
                    <span className="font-semibold uppercase tracking-wider text-[#B89552] group-hover:translate-x-1 transition-transform duration-300">
                      {article.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1 font-mono-tabular">
                      <Clock className="w-3 h-3 text-[#B89552]" />
                      {article.readTime}
                    </span>
                  </div>

                  <h4 className="font-editorial text-2xl text-[#332B27] font-medium leading-snug group-hover:text-[#B89552] transition-colors">
                    {article.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-[#332B27]/70 font-sans-clean leading-relaxed font-light line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-[#332B27]/10 mt-6 flex items-center justify-between text-xs font-semibold text-[#332B27]">
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#B89552]" />
                </div>
              </motion.div>
            ))}
          </div>

        </div>

      </div>

      {/* Slide-out Full Article Reading Drawer */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#FAF7F0] w-full max-w-2xl h-full shadow-2xl border-l border-[#332B27]/10 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#332B27]/10 flex items-center justify-between bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B89552]">
                  {selectedArticle.categoryLabel} · {selectedArticle.readTime}
                </span>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 rounded-full hover:bg-neutral-100 text-[#332B27] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-8 font-sans-clean">
                <div>
                  <h2 className="font-editorial text-3xl sm:text-4xl text-[#332B27] font-medium leading-tight">
                    {selectedArticle.title}
                  </h2>
                  <p className="text-base text-[#332B27]/70 italic font-editorial mt-2">
                    {selectedArticle.subtitle}
                  </p>
                </div>

                {/* Key Takeaways */}
                <div className="p-6 rounded-2xl bg-white border border-[#332B27]/10 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">
                    Key Takeaways:
                  </p>
                  <ul className="space-y-2 text-xs text-[#332B27]/80">
                    {selectedArticle.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#AAB39A] shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Main Content Paragraphs */}
                <div className="space-y-4 text-sm sm:text-base text-[#332B27]/80 font-light leading-relaxed">
                  {selectedArticle.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Clinical Tip from Dr. Niva */}
                <div className="p-6 rounded-2xl bg-[#F1E3A6]/60 border border-[#332B27]/10 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#332B27]">
                    Dr. Niva’s Clinical Tip:
                  </p>
                  <p className="text-xs sm:text-sm text-[#332B27] italic font-editorial leading-relaxed">
                    “{selectedArticle.clinicalTip}”
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};
