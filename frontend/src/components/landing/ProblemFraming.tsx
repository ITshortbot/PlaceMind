'use client';

// ============================================================================
// File: frontend/src/components/landing/ProblemFraming.tsx
// Description: Problem framing section with user-friendly, high-vibe copy
//              and glassmorphic bento cards.
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertOctagon,
  Search,
  MessageSquareWarning,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Zap,
  Filter,
  FileX,
  Clock,
} from 'lucide-react';

export function ProblemFraming() {
  return (
    <section className="py-24 md:py-36 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-xl">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>THE MODERN HIRING CHALLENGE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
            <span className="font-light">Why strong experience gets</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              overlooked
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-4 leading-relaxed">
            Make your experience easier to read, compare with a job description, and discuss in an interview.
          </p>
        </div>

        {/* UNEVEN BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Bento Card 1: Dominant Hero Card (Spans 7 Columns) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 p-8 md:p-12 rounded-[32px] bg-white/80 dark:bg-[#141417]/85 border border-white/80 dark:border-white/10 hover:border-[#6C5CE7]/50 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(108,92,231,0.15)] backdrop-blur-2xl flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/12 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] dark:text-[#7D6FF0] shadow-sm">
                    <Filter className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#8A8A92] dark:text-[#6B6B76]">
                      THE SCREENING BOTTLENECK
                    </div>
                    <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                      Automated Filters
                    </div>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F04438]/10 text-[#B91C1C] dark:text-[#F04438] border border-[#F04438]/30 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" /> Formatting &amp; Keywords
                </span>
              </div>

              {/* Stat Display */}
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl font-black text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
                  Clarity
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
                  FOR PEOPLE AND PARSERS
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-4 tracking-tight">
                Make Relevant Experience Easier to Find
              </h3>

              <p className="text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-3 leading-[1.7]">
                Review formatting and job-post terminology, then decide which changes accurately describe your work.
              </p>

              {/* Comparison Graphic */}
              <div className="mt-6 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  <span className="w-2 h-2 rounded-full bg-[#F04438]" />
                  <span>
                    Before Review:{" "}
                    <strong className="inline md:block text-[#B91C1C] dark:text-[#F04438]">
                      Gaps to Check
                    </strong>
                  </span>


                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#1A1A1E] dark:text-[#F5F5F7] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <span>
                    After Your Review:{" "}
                    <strong className="inline md:block text-[#16A34A] dark:text-[#22C55E]">
                      Clearer Alignment
                    </strong>
                  </span>

                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs text-[#8A8A92] dark:text-[#6B6B76]">
              <span>Check: Relevant Skills and Clear Structure</span>
              <span className="text-[#6C5CE7] font-semibold">Parse-Friendly Single-Column Formats &rarr;</span>
            </div>
          </motion.div>

          {/* Right Stack: 2 Asymmetric Bento Cards (Spans 5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8 justify-between">
            {/* Bento Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="p-7 md:p-8 rounded-[28px] bg-white/80 dark:bg-[#141417]/85 border border-white/80 dark:border-white/10 hover:border-[#6C5CE7]/50 transition-all duration-300 hover:shadow-xl backdrop-blur-2xl flex-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#0284C7]/12 border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8]">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F04438]/10 text-[#B91C1C] dark:text-[#F04438]">
                  Show Your Contribution
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
                  Impact
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
                  EXPLAIN YOUR CONTRIBUTION
                </span>
              </div>

              <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-2">
                Explain What Changed Because of Your Work
              </h4>

              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-2 leading-relaxed">
                Use specific outcomes where you can support them. Do not add numbers you cannot verify.
              </p>
            </motion.div>

            {/* Bento Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-7 md:p-8 rounded-[28px] bg-white/80 dark:bg-[#141417]/85 border border-white/80 dark:border-white/10 hover:border-[#6C5CE7]/50 transition-all duration-300 hover:shadow-xl backdrop-blur-2xl flex-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7]/12 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] dark:text-[#7D6FF0]">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F04438]/10 text-[#B91C1C] dark:text-[#F04438]">
                  Interview Preparation
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
                  Practice
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
                  BEFORE THE INTERVIEW
                </span>
              </div>

              <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-2">
                Rehearse Answers Out Loud
              </h4>

              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-2 leading-relaxed">
                Practice explaining your decisions and trade-offs, then review where your answer could be clearer.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
