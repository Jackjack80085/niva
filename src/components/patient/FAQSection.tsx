import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { editorialEase, standardViewport } from '../../utils/motionVariants';
import { HandDrawnCurl } from '../common/OrganicMotifs';

const FAQS = [
  {
    q: 'What is the difference between a Consultation and Therapy?',
    a: 'A Consultation (20 minutes · ₹1,500) is a focused preliminary assessment to understand what you are experiencing, evaluate clinical symptoms, and determine the optimal care direction. Therapy sessions (50–75 minutes) provide ongoing, deep psychotherapeutic work for anxiety, attachment patterns, relational conflict, or psychosexual health.',
  },
  {
    q: 'How does an online sexology consultation work? Is there any physical examination?',
    a: 'There is zero physical examination involved. Psychosexual therapy is strictly conversational, confidential, and evidence-based. Dr. Niva provides a warm, shame-free space to explore vaginismus, intimacy anxiety, desire discrepancies, and relationship barriers through clinical psychology and medical sexology.',
  },
  {
    q: 'Will I be forced to take psychiatric medication?',
    a: 'No. Dr. Niva practices conservative, thoughtful medicine. Medication is never rushed. Many concerns respond beautifully to psychotherapy, nervous system down-regulation, and lifestyle modifications alone. When medication is clinically indicated, it is discussed transparently and chosen collaboratively.',
  },
  {
    q: 'How do returning patients book appointments?',
    a: 'Returning patients have an accelerated booking experience. Simply click "I\'m a returning patient" during booking to immediately view your previous session details and lock in the next available slot with zero repetitive form filling.',
  },
  {
    q: 'Are online telehealth consultations completely confidential?',
    a: 'Yes. All sessions take place via a secure, HIPAA-compliant HD video suite with end-to-end encryption. You receive your private session link prior to your appointment time without needing to install separate software.',
  },
  {
    q: 'What happens if my partner is hesitant about Couples Therapy?',
    a: 'You are welcome to begin with an individual consultation to untangle relational loops and attachment dynamics. Often, when one partner gains clarity and shifts their communication patterns, it creates the emotional safety necessary for the other partner to join.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="faq" className="py-24 md:py-36 border-t border-[#332B27]/10 bg-[#FAF7F0] texture-paper relative overflow-hidden">
      
      {/* Large Faded "Questions?" Background Typography */}
      <div 
        className="absolute top-12 sm:top-16 inset-x-0 flex items-center justify-center pointer-events-none select-none overflow-hidden -z-10"
        aria-hidden="true"
      >
        <span className="font-editorial italic font-light text-[18vw] text-[#332B27]/6 leading-none tracking-tight">
          Questions?
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <motion.div 
          className="text-center max-w-xl mx-auto mb-16 md:mb-20 space-y-3"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={standardViewport}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, ease: editorialEase }}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-[#B89552] font-sans-clean">
              FREQUENTLY ASKED
            </span>
            <HandDrawnCurl width={38} color="#B89552" />
          </div>

          <h2 className="font-editorial text-4xl sm:text-5xl text-[#332B27] font-normal tracking-tight">
            Important details before beginning.
          </h2>
          <p className="text-sm sm:text-base text-[#332B27]/70 font-sans-clean font-light">
            Clear, honest answers regarding psychotherapy, sexology, and practice policies.
          </p>
        </motion.div>

        {/* Extremely Clean Accordion (No cards, pure lines) */}
        <div className="divide-y divide-[#332B27]/15 border-y border-[#332B27]/15">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="py-6 sm:py-7 group"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left group gap-6 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className={`font-editorial text-xl sm:text-2xl font-medium transition-colors duration-200 ${
                    isOpen ? 'text-[#B89552]' : 'text-[#332B27] group-hover:text-[#B89552]'
                  }`}>
                    {faq.q}
                  </span>
                  
                  {/* + rotates into × smoothly with zero lag */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ease-out ${
                    isOpen ? 'rotate-45 text-[#B89552]' : 'text-[#332B27]/60 group-hover:text-[#332B27]'
                  }`}>
                    <Plus className="w-5 h-5" />
                  </div>
                </button>

                {/* Answer reveals with smooth zero-delay height + opacity transition */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div 
                      key={`faq-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ 
                        duration: shouldReduceMotion ? 0.01 : 0.25, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      className="overflow-hidden"
                    >
                      <p className="pt-4 text-sm sm:text-base text-[#332B27]/80 leading-relaxed font-sans-clean font-light pr-6 sm:pr-12">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
