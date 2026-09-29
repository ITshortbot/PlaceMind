'use client';

// ============================================================================
// File: frontend/src/components/landing/FAQ.tsx
// Description: FAQ accordion with dual Light/Dark styling
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { WaveTextReveal } from '@/components/ui/WaveTextReveal';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is my resume data kept private?',
      a: 'Yes. In Local Privacy Mode (via LM Studio), your resume PDF and parsed chunks are processed 100% on your local device. In Cloud Mode, your files are processed in-memory without persistent training retention.',
    },
    {
      q: 'Which AI models power Placemind?',
      a: 'We use BAAI/bge-small-en-v1.5 (via ONNX runtime) for 384-dimensional vector embeddings, Google Gemini 2.5 Flash for high-speed cloud gap synthesis, and quantized LLaMA 3.2 for offline local execution.',
    },
    {
      q: 'How does Local Privacy Mode work with LM Studio?',
      a: 'Start LM Studio on your machine, load any compatible GGUF model (e.g. LLaMA 3.2 or Mistral), and toggle the Local Server at http://localhost:1234. Placemind automatically detects the endpoint and routes all prompts locally.',
    },
    {
      q: 'How is vector cosine scoring superior to old-school keyword search?',
      a: 'Legacy ATS tools search for exact word matches (e.g. searching "Node.js" misses "Express server"). Placemind projects concepts into dense 384-dimensional mathematical space, identifying semantic equivalence even when wording differs.',
    },
    {
      q: 'What file formats are supported for upload?',
      a: 'We support standard PDF documents. PyMuPDF extracts raw text, font hierarchies, and contact anchors in-memory at sub-50ms speeds.',
    },
    {
      q: 'Is Placemind really free to start?',
      a: 'Yes, Placemind was developed as a Project-Based Learning (PBL) platform and offers unrestricted resume parsing, scoring, bullet rewriting, and mock interviews at zero cost.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section id="faq" className="py-28 md:py-40 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-black/[0.08] dark:border-[#2A2A30] text-[11px] font-mono uppercase tracking-[0.2em] text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-md">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>QUESTIONS & ANSWERS &bull; ARCHITECTURE FAQ</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
            <span className="font-light">Frequently</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              Asked Questions
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-4 leading-relaxed">
            Everything you need to know about Placemind&apos;s privacy, vector algorithms, and models.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="space-y-4"
        >
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`rounded-2xl border transition-all duration-200 backdrop-blur-xl overflow-hidden ${
                  isOpen
                    ? 'bg-white/85 dark:bg-[#141417]/85 border-[#6C5CE7]/50 shadow-[0_8px_30px_rgba(108,92,231,0.12)]'
                    : 'bg-white/55 dark:bg-[#141417]/60 border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/30'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <span className="text-base font-semibold text-[#1A1A1E] dark:text-[#F5F5F7]">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isOpen
                        ? 'bg-[#6C5CE7] text-white rotate-180 shadow-[0_0_10px_#6C5CE7]'
                        : 'bg-black/[0.04] dark:bg-[#1C1C21] text-[#5A5A63] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-6 text-sm text-[#5A5A63] dark:text-[#A1A1AA] leading-[1.7] border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
