'use client';

// ============================================================================
// File: frontend/src/components/landing/HeroSection.tsx
// Description: Modern, high-vibe hero section with glassmorphism, animated CTAs,
//              and clean benefit-driven copy.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WaveTextReveal } from '@/components/ui/WaveTextReveal';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  Layers,
  ShieldCheck,
  TrendingUp,
  Zap,
  Lock,
  FileCheck,
  Award,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenDemo: () => void;
  onTryFree: () => void;
}

export function HeroSection({ onOpenDemo, onTryFree }: HeroSectionProps) {
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setCardTilt({
      rotateX: -Math.max(-10, Math.min(10, (y / (rect.height / 2)) * 10)),
      rotateY: Math.max(-10, Math.min(10, (x / (rect.width / 2)) * 10)),
    });
  };

  const handleMouseLeave = () => {
    setCardTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Core Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 text-center lg:text-left space-y-6"
          >
            {/* Live Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] shadow-sm backdrop-blur-xl">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C5CE7] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6C5CE7]"></span>
              </span>
              <span>Next-Gen Career Copilot &bull; 100% Private</span>
            </div>

            {/* Headline with Expressive Mixed-Weight */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[68px] tracking-tight leading-[1.08]">
                <span className="font-light text-[#1A1A1E] dark:text-[#F5F5F7]">Your resume,</span>{' '}
                <span className="font-black text-[#1A1A1E] dark:text-[#F5F5F7]">scored.</span>
                <br />
                <span className="font-light text-[#5A5A63] dark:text-[#A1A1AA]">Your interview,</span>{' '}
                <span className="font-black bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(108,92,231,0.35)]">
                  rehearsed.
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] max-w-2xl mx-auto lg:mx-0 font-normal leading-[1.7]">
              Instantly audit your resume against any job description, rewrite weak points into high-impact achievements, and practice realistic mock interviews before you apply.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={onTryFree}
                className="w-full sm:w-auto text-sm px-9 py-4 shadow-xl"
              >
                Try it Free
              </Button>

              <Button
                variant="secondary"
                size="lg"
                icon={<Play className="w-4 h-4 text-[#6C5CE7] fill-[#6C5CE7]" />}
                onClick={onOpenDemo}
                className="w-full sm:w-auto text-sm px-7 py-4"
              >
                Watch 60s Demo
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E]" />
                <span className="font-medium">100% Free to Start</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#6C5CE7] dark:text-[#7D6FF0]" />
                <span className="font-medium">Zero Data Selling</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                <span className="font-medium">ATS Parser Guaranteed</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Parallax Mock Card with Rich Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex justify-center lg:justify-end perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Ambient Radial Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[360px] h-[360px] bg-[#6C5CE7]/20 dark:bg-[#6C5CE7]/25 blur-[90px] rounded-full" />
            </div>

            {/* Floating Top Badge */}
            <div className="absolute -top-6 -left-6 z-20 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-[#1C1C21]/95 border border-white/80 dark:border-white/15 shadow-2xl backdrop-blur-2xl animate-float">
              <div className="w-8 h-8 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#16A34A] dark:text-[#22C55E]">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">Match Score: 92.4%</div>
                <div className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA]">High Interview Likelihood</div>
              </div>
            </div>

            {/* Floating Bottom Badge */}
            <div className="absolute -bottom-6 -right-4 z-20 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-[#1C1C21]/95 border border-white/80 dark:border-white/15 shadow-2xl backdrop-blur-2xl animate-float-reverse">
              <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] dark:text-[#7D6FF0]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">Top 5% Candidate</div>
                <div className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA]">Single-Column LaTeX Ready</div>
              </div>
            </div>

            {/* Main Interactive Parallax Mock Card */}
            <div
              style={{
                transform: `rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`,
                transition: 'transform 0.15s ease-out',
                transformStyle: 'preserve-3d',
              }}
              className="w-full max-w-md bg-white/85 dark:bg-[#16161D]/85 rounded-[30px] p-6 md:p-8 border border-white/80 dark:border-white/15 hover:border-[#6C5CE7]/60 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative z-10 group overflow-hidden transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-sm font-bold text-white shadow-md">
                    JD
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                      Senior Staff Engineer Audit
                    </h3>
                    <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                      Targeting Stripe &middot; Top Tier Compatibility
                    </p>
                  </div>
                </div>

                <Badge variant="accent" size="sm">
                  Active Match
                </Badge>
              </div>

              {/* Score Metric Ring */}
              <div className="my-5 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5A63] dark:text-[#A1A1AA] font-bold font-mono">
                    APPLICATION ALIGNMENT
                  </div>
                  <div className="text-3xl font-black text-[#1A1A1E] dark:text-[#F5F5F7] flex items-baseline gap-2 mt-0.5">
                    88.5%
                    <span className="text-xs font-bold text-[#16A34A] dark:text-[#22C55E] flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> High Match
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8A8A92] dark:text-[#6B6B76] mt-0.5">
                    94% Skills Matched &middot; 0 Formatting Errors
                  </div>
                </div>

                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke="currentColor"
                      strokeWidth="5"
                      className="text-black/[0.08] dark:text-[#2A2A30]"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke="#6C5CE7"
                      strokeWidth="5"
                      strokeDasharray="163.36"
                      initial={{ strokeDashoffset: 163.36 }}
                      animate={{ strokeDashoffset: 18.8 }}
                      transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <Sparkles className="w-5 h-5 text-[#6C5CE7] dark:text-[#7D6FF0] absolute" />
                </div>
              </div>

              {/* Requirement Match Breakdown */}
              <div className="space-y-2.5">
                <div className="text-[11px] uppercase tracking-wider text-[#5A5A63] dark:text-[#A1A1AA] font-bold flex items-center justify-between">
                  <span>Key Job Requirements</span>
                  <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-bold">Passed</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0E0E12] border border-black/[0.06] dark:border-white/[0.08] text-xs shadow-sm">
                  <span className="text-[#1A1A1E] dark:text-[#F5F5F7] font-medium">Distributed Architecture Experience</span>
                  <Badge variant="success" size="sm">
                    Well Covered
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0E0E12] border border-black/[0.06] dark:border-white/[0.08] text-xs shadow-sm">
                  <span className="text-[#1A1A1E] dark:text-[#F5F5F7] font-medium">High-Throughput Data Pipelines</span>
                  <Badge variant="success" size="sm">
                    Well Covered
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0E0E12] border border-black/[0.06] dark:border-white/[0.08] text-xs shadow-sm">
                  <span className="text-[#1A1A1E] dark:text-[#F5F5F7] font-medium">System Performance Tuning</span>
                  <Badge variant="warning" size="sm">
                    Can Enhance
                  </Badge>
                </div>
              </div>

              {/* AI Bullet Improvement */}
              <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-[#6C5CE7] flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#1A1A1E] dark:text-[#F5F5F7]">Recommended Rewrite:</strong> Added quantifiable latency reduction metrics to experience bullet (+7.8% score lift).
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
