'use client';

// ============================================================================
// File: frontend/src/components/landing/ProblemFraming.tsx
// Description: Problem framing section with user-friendly, high-vibe copy
//              and glassmorphic bento cards.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
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
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);
  const [stat3, setStat3] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 1200;
      const steps = 40;
      const interval = duration / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const ease = 1 - Math.pow(1 - progress, 3);

        setStat1(Math.round(75 * ease));
        setStat2(Math.round(6.4 * ease * 10) / 10);
        setStat3(Math.round(82 * ease));

        if (step >= steps) clearInterval(timer);
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isInView]);

  return (
    <section ref={ref} className="py-24 md:py-36 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-xl">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>THE MODERN HIRING CHALLENGE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
            <span className="font-light">Why great candidates get</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              overlooked
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-4 leading-relaxed">
            Automated screening systems discard hundreds of qualified applications simply due to formatting nuances and keyword gaps.
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
                  <AlertOctagon className="w-3.5 h-3.5" /> High Rejection Rate
                </span>
              </div>

              {/* Stat Display */}
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl font-black text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
                  {stat1}%<span className="text-[#6C5CE7]">+</span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
                  OF RESUMES NEVER REACH A HUMAN
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-4 tracking-tight">
                Filtered by Rigid Keyword Matchers
              </h3>

              <p className="text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-3 leading-[1.7]">
                If your experience describes your work with different terminology than the job post, automated scanners may reject your application before a recruiter ever reviews your portfolio.
              </p>

              {/* Comparison Graphic */}
              <div className="mt-6 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  <span className="w-2 h-2 rounded-full bg-[#F04438]" />
                  <span>Unoptimized Application: <strong className="text-[#B91C1C] dark:text-[#F04438]">Likely Filtered</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#1A1A1E] dark:text-[#F5F5F7] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <span>Placemind Tailored Resume: <strong className="text-[#16A34A] dark:text-[#22C55E]">95%+ Screening Pass</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs text-[#8A8A92] dark:text-[#6B6B76]">
              <span>Resolution: Contextual Skill Matching</span>
              <span className="text-[#6C5CE7] font-semibold">100% Parsable Formats &rarr;</span>
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
                  Recruiter Review Time
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
                  {stat2}s
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
                  AVERAGE INITIAL GLANCE
                </span>
              </div>

              <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-2">
                Unclear Impact Bullets Get Skipped
              </h4>

              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-2 leading-relaxed">
                Recruiters scan for immediate metrics. Bullet points without concrete numbers get overlooked in seconds.
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
                  Interview Anxiety
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
                  {stat3}%
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
                  OF CANDIDATES FEEL UNPREPARED
                </span>
              </div>

              <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-2">
                No Real-Time Practice Before the Call
              </h4>

              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-2 leading-relaxed">
                Most candidates read questions silently rather than speaking aloud under realistic pressure.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
