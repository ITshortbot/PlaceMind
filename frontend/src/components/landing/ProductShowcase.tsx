'use client';

// ============================================================================
// File: frontend/src/components/landing/ProductShowcase.tsx
// Description: Full-Bleed MacBook Showcase with Scroll-to-Expose Opening Animation
//              (smooth 3D screen tilt and vertical mask expansion as user scrolls into view).
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

  // Scroll-linked smooth expose and tilt transitions
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Scroll-to-Expose transformations
  const exposeScale = useTransform(scrollYProgress, [0, 0.45, 0.8], [0.92, 1.02, 0.98]);
  const exposeRotateX = useTransform(scrollYProgress, [0, 0.45, 0.8], [12, 0, -6]);
  const exposeY = useTransform(scrollYProgress, [0, 0.45, 0.8], [60, 0, -30]);
  const exposeOpacity = useTransform(scrollYProgress, [0, 0.25, 0.8], [0.6, 1, 0.9]);

  // Floating corner card animation variants
  const calloutVariants = {
    hiddenTopLeft: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : -25,
      y: shouldReduceMotion ? 0 : -15,
    },
    hiddenTopRight: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : 25,
      y: shouldReduceMotion ? 0 : -15,
    },
    hiddenBottomLeft: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : -25,
      y: shouldReduceMotion ? 0 : 15,
    },
    hiddenBottomRight: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : 25,
      y: shouldReduceMotion ? 0 : 15,
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
    <section ref={containerRef} className="py-20 md:py-32 relative overflow-hidden w-full perspective-1000">
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

      {/* FULL-BLEED CONTAINER WITH SCROLL-TO-EXPOSE PERSPECTIVE MOTION */}
      <div className="w-full relative px-0">
        {/* Floating Callout 1: Top-Left */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenTopLeft"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.35 }}
          className="hidden lg:block absolute top-10 left-8 xl:left-14 z-30 max-w-xs p-4 rounded-2xl bg-white/90 dark:bg-[#141417]/90 border border-white/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl hover:border-[#6C5CE7]/60 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/12 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] dark:text-[#7D6FF0] flex-shrink-0 shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                  ATS-Safe Formatting
                </h4>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]">
                  0 Errors
                </span>
              </div>
              <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                Structured to pass single-column Workday & Greenhouse parsers.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Floating Callout 2: Top-Right */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenTopRight"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.4 }}
          className="hidden lg:block absolute top-10 right-8 xl:right-14 z-30 max-w-[270px] p-4 rounded-2xl bg-white/90 dark:bg-[#141417]/90 border border-white/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl hover:border-[#38BDF8]/60 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                  Real-Time Score
                </h4>
                <span className="text-xs font-bold text-[#6C5CE7]">
                  94.8%
                </span>
              </div>
              <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                Instant alignment check against target job requirements.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Real Edge-to-Edge Stretched Mockup Asset with Scroll-to-Expose Tilt */}
        <motion.div
          style={{
            scale: shouldReduceMotion ? 1 : exposeScale,
            rotateX: shouldReduceMotion ? 0 : exposeRotateX,
            y: shouldReduceMotion ? 0 : exposeY,
            opacity: shouldReduceMotion ? 1 : exposeOpacity,
            transformPerspective: 1200,
          }}
          className="relative w-full overflow-hidden shadow-[0_30px_100px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_120px_-10px_rgba(0,0,0,0.9)] border-y border-white/60 dark:border-white/10 transition-transform duration-100 ease-out"
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

        {/* Floating Callout 3: Bottom-Left */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenBottomLeft"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.45 }}
          className="hidden lg:block absolute bottom-10 left-8 xl:left-14 z-30 max-w-xs p-4 rounded-2xl bg-white/90 dark:bg-[#141417]/90 border border-white/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl hover:border-[#6C5CE7]/60 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/12 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] dark:text-[#7D6FF0] flex-shrink-0 shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                Impact Bullet Rewrites
              </h4>
              <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                Action-oriented bullet points formatted with quantifiable metrics.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Floating Callout 4: Bottom-Right */}
        <motion.div
          variants={calloutVariants}
          initial="hiddenBottomRight"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.5 }}
          className="hidden lg:block absolute bottom-10 right-8 xl:right-14 z-30 max-w-[250px] p-4 rounded-2xl bg-white/90 dark:bg-[#141417]/90 border border-white/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl hover:border-[#22C55E]/60 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/12 border border-[#22C55E]/30 flex items-center justify-center text-[#16A34A] dark:text-[#22C55E] flex-shrink-0 shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                Instant Export
              </h4>
              <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                Export to clean ATS-ready PDF or LaTeX anytime.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
