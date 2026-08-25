'use client';

// ============================================================================
// File: frontend/src/components/landing/SocialProof.tsx
// Description: Verified model foundations and credibility signals with dual Light/Dark styling
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';

export function SocialProof() {
  const models = [
    { name: 'Google Gemini 2.5', role: 'Cloud Synthesis' },
    { name: 'BAAI / bge-small', role: '384-d Vector Retrieval' },
    { name: 'PostgreSQL pgvector', role: 'HNSW Index Store' },
    { name: 'LM Studio / LLaMA 3.2', role: 'Offline Local Privacy' },
    { name: 'PyMuPDF Engine', role: 'In-Memory Extraction' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className="text-center mb-10"
        >
          <span className="text-xs uppercase font-mono tracking-wider text-[#5A5A63] dark:text-[#A1A1AA] font-semibold">
            BUILT ON VERIFIED OPEN-SOURCE & STATE-OF-THE-ART FOUNDATIONS
          </span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {models.map((m, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="p-5 rounded-2xl bg-white/60 dark:bg-[#141417]/60 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/40 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(108,92,231,0.12)] transition-all duration-200 text-center flex flex-col items-center justify-center backdrop-blur-xl group cursor-default"
            >
              <span className="text-sm font-bold text-[#1A1A1E] dark:text-[#F5F5F7] group-hover:text-[#6C5CE7] transition-colors">
                {m.name}
              </span>
              <span className="text-[11px] text-[#8A8A92] dark:text-[#6B6B76] mt-1 font-mono">
                {m.role}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
