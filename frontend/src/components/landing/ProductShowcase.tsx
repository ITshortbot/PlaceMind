'use client';

// ============================================================================
// File: frontend/src/components/landing/ProductShowcase.tsx
// Description: Edge-to-Edge (100vw Full Bleed) MacBook Showcase with user's
//              exact pill-tile cards (headline + purple divider + subtext).
// ============================================================================

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  FileCheck,
  Sparkles,
  Zap,
  Download,
} from 'lucide-react';

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll-linked smooth parallax motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const mockupScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.98, 1.02, 0.99]);
  const mockupY = useTransform(scrollYProgress, [0, 0.5, 1], [20, 0, -20]);

  // Floating corner card animation variants
  const calloutVariants = {
    hiddenTopLeft: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : -30,
      y: shouldReduceMotion ? 0 : -20,
    },
    hiddenTopRight: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : 30,
      y: shouldReduceMotion ? 0 : -20,
    },
    hiddenBottomLeft: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : -30,
      y: shouldReduceMotion ? 0 : 20,
    },
    hiddenBottomRight: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : 30,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <section ref={containerRef} className="py-20 md:py-32 relative overflow-hidden w-full">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-xl">
          <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
          <span>STUDIO CANVAS &bull; LIVE EDITOR</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
          <span className="font-light">Every tool you need in</span>{' '}
          <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
            one workspace
          </span>
        </h2>

        <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-3 max-w-2xl mx-auto leading-relaxed">
          Real-time ATS parsing, metric-driven bullet point enhancements, and instant match scoring.
        </p>
      </div>

      {/* FULL-BLEED 100VW CONTAINER TOUCHING BOTH SIDES */}
      <div className="w-full relative px-0">
        {/* Floating Callout 1: Top-Left (Exact Pill Tile Format) */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenTopLeft"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.35 }}
          className="hidden xl:block absolute top-8 left-8 2xl:left-16 z-30 max-w-xs px-6 py-4 rounded-[32px] pill-tile hover:scale-105 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
              ATS-Safe Format !!
            </h4>
            <span className="text-[10px] font-bold text-[#16A34A] dark:text-[#22C55E]">
              ✓ 0 Errors
            </span>
          </div>
          <div className="pill-divider my-2" />
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
            Passes Workday & Greenhouse parsers
          </p>
        </motion.div>

        {/* Floating Callout 2: Top-Right (Exact Pill Tile Format) */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenTopRight"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.4 }}
          className="hidden xl:block absolute top-8 right-8 2xl:right-16 z-30 max-w-[280px] px-6 py-4 rounded-[32px] pill-tile hover:scale-105 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
              Match Score !!
            </h4>
            <span className="text-sm font-black text-[#6C5CE7]">
              94.8%
            </span>
          </div>
          <div className="pill-divider my-2" />
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
            Instant check against job criteria
          </p>
        </motion.div>

        {/* Real Edge-to-Edge Stretched Mockup Asset */}
        <motion.div
          style={{
            scale: shouldReduceMotion ? 1 : mockupScale,
            y: shouldReduceMotion ? 0 : mockupY,
          }}
          className="relative w-full overflow-hidden shadow-[0_30px_100px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_120px_-10px_rgba(0,0,0,0.9)] border-y border-white/60 dark:border-white/10"
        >
          <div className="relative w-full aspect-[16/9] min-h-[480px] sm:min-h-[600px] lg:min-h-[720px]">
            <Image
              src="/assets/mockups/macbook-final.png"
              alt="Placemind MacBook Studio Showcase"
              fill
              priority
              className="object-cover object-center"
            />
          </div>
        </motion.div>

        {/* Floating Callout 3: Bottom-Left (Exact Pill Tile Format) */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenBottomLeft"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.45 }}
          className="hidden xl:block absolute bottom-8 left-8 2xl:left-16 z-30 max-w-xs px-6 py-4 rounded-[32px] pill-tile hover:scale-105 transition-all duration-300 group cursor-pointer"
        >
          <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
            Impact Bullets !!
          </h4>
          <div className="pill-divider my-2" />
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
            Quantifiable metric rewrites
          </p>
        </motion.div>

        {/* Floating Callout 4: Bottom-Right (Exact Pill Tile Format) */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenBottomRight"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.5 }}
          className="hidden xl:block absolute bottom-8 right-8 2xl:right-16 z-30 max-w-[260px] px-6 py-4 rounded-[32px] pill-tile hover:scale-105 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
              Export PDF !!
            </h4>
            <span className="text-[10px] font-mono text-[#6C5CE7] font-semibold">
              LaTeX Ready
            </span>
          </div>
          <div className="pill-divider my-2" />
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
            Download verified resume anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
