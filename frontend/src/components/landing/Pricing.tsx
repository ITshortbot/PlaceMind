'use client';

// ============================================================================
// File: frontend/src/components/landing/Pricing.tsx
// Description: Transparent pricing section with dual Light/Dark styling
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { WaveTextReveal } from '@/components/ui/WaveTextReveal';

export function Pricing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section id="pricing" className="py-28 md:py-40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-black/[0.08] dark:border-[#2A2A30] text-[11px] font-mono uppercase tracking-[0.2em] text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-md">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>TRANSPARENT PRICING &bull; STUDENT & CAMPUS TIERS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
            <span className="font-light">Free to start.</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              No credit card
            </span>{' '}
            <span className="font-medium">traps.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-4 leading-relaxed">
            Get your resume audited, gap-analyzed, and practiced without paying $30/month subscriptions.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch"
        >
          {/* Free Tier Card (Primary Active) */}
          <motion.div
            variants={itemVariants}
            className="p-8 md:p-10 rounded-2xl bg-white/85 dark:bg-[#141417]/85 border border-[#6C5CE7]/60 shadow-[0_8px_35px_rgba(108,92,231,0.22)] backdrop-blur-xl flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-200"
          >
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-[#6C5CE7] text-white text-[11px] font-bold tracking-tight uppercase shadow-md">
              Current Open Tier
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#7D6FF0]">
                Student & Job Seeker Plan
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-extrabold text-[#1A1A1E] dark:text-[#F5F5F7]">$0</span>
                <span className="text-sm text-[#5A5A63] dark:text-[#A1A1AA]">/ forever free</span>
              </div>
              <p className="text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-3 leading-[1.7]">
                Full access to our vector scoring algorithms, unlimited local privacy mode audits, and mock interview questions.
              </p>

              <div className="my-8 border-t border-black/[0.08] dark:border-[#2A2A30]" />

              <ul className="space-y-3.5 text-xs text-[#1A1A1E] dark:text-[#F5F5F7] font-medium">
                {[
                  'Unlimited PDF Ingestion & In-Memory Parsing',
                  'Dense 384-d Vector Gap Analysis Matrix',
                  'Google XYZ Formula Resume Bullet Rewrites',
                  '100% Private Offline Mode (LM Studio)',
                  'Adaptive Technical & Behavioral Mock Interviews',
                  'ATS-Optimized PDF Export',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  const el = document.getElementById('demo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Start Free Audit
              </Button>
            </div>
          </motion.div>

          {/* Pro / Campus License (Coming Soon / Grayed Out) */}
          <motion.div
            variants={itemVariants}
            className="p-8 md:p-10 rounded-2xl bg-white/50 dark:bg-[#141417]/50 border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-xl opacity-65 flex flex-col justify-between relative select-none"
          >
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-[#8A8A92] dark:text-[#A1A1AA]">
                University & Enterprise
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-extrabold text-[#1A1A1E] dark:text-[#F5F5F7]">Custom</span>
                <span className="text-sm text-[#5A5A63] dark:text-[#A1A1AA]">/ cohort placement</span>
              </div>
              <p className="text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-3 leading-[1.7]">
                Bulk analytics for university placement cells and automated cohort hiring pipelines.
              </p>

              <div className="my-8 border-t border-black/[0.08] dark:border-[#2A2A30]" />

              <ul className="space-y-3.5 text-xs text-[#8A8A92] dark:text-[#A1A1AA]">
                {[
                  'University Placement Cell Dashboard',
                  'Bulk Candidate Vector Matching & Cohort Ranking',
                  'Live Video Multi-Turn Technical Proctoring',
                  'Custom Fine-Tuned Domain Evaluators',
                  'Dedicated API Endpoint SLA',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8A8A92] dark:text-[#6B6B76] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <Button variant="secondary" size="md" disabled className="w-full">
                Coming Soon (PBL Phase 2)
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
