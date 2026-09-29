'use client';

// ============================================================================
// File: frontend/src/components/landing/MobileShowcase.tsx
// Description: Clean, High-DPI Mobile Rehearsal Showcase with 3D Depth Card Carousel
//              (smooth perspective rotation and switchable mobile mockup cards).
// ============================================================================

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  Smartphone,
  Mic,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MOBILE_CAROUSEL_ITEMS = [
  {
    id: 1,
    title: 'Live Phone Screen Rehearsal',
    sub: 'Voice-based real-time interview simulator',
    img: '/assets/mockups/iphone-final.jpg',
    tag: 'Active Simulation',
  },
  {
    id: 2,
    title: 'On-the-Fly ATS Audit',
    sub: 'Instant resume check before hiring manager calls',
    img: '/assets/mockups/iphone-showcase.png',
    tag: 'Quick Audit',
  },
];

export function MobileShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  // Scroll-linked smooth parallax motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const phoneScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1.02, 0.98]);
  const phoneY = useTransform(scrollYProgress, [0, 0.5, 1], [20, 0, -20]);

  const currentItem = MOBILE_CAROUSEL_ITEMS[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % MOBILE_CAROUSEL_ITEMS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : MOBILE_CAROUSEL_ITEMS.length - 1));
  };

  return (
    <section ref={containerRef} className="py-20 md:py-32 relative overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Clean Benefit Highlights */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] shadow-sm backdrop-blur-xl">
              <Smartphone className="w-3.5 h-3.5" />
              <span>ON-THE-GO REHEARSAL &bull; MOBILE & DESKTOP</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
              <span className="font-light">Practice your interview</span>{' '}
              <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
                anytime, anywhere
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
              Step into interviews with confidence. Practice technical questions, get instant feedback, and check scores on your phone.
            </p>

            {/* Feature Cards */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/80 dark:bg-[#141417]/85 border border-white/80 dark:border-white/10 shadow-sm backdrop-blur-xl hover:border-[#6C5CE7]/50 hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#7D6FF0] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                    Voice Mock Rehearsal
                  </h4>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                    Practice out loud with real-time speech response.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/80 dark:bg-[#141417]/85 border border-white/80 dark:border-white/10 shadow-sm backdrop-blur-xl hover:border-[#22C55E]/50 hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/12 text-[#16A34A] dark:text-[#22C55E] flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                    Instant Match Score
                  </h4>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                    Quick resume audit against any target job posting.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <Button
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  const el = document.getElementById('demo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Try Mobile Demo
              </Button>

              {/* 3D Carousel Navigation Pill */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/70 dark:bg-[#141417]/75 border border-white/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
                <button
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#1A1A1E] dark:text-white"
                  aria-label="Previous view"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono font-bold px-2 text-[#6C5CE7]">
                  {`0${activeIndex + 1} / 0${MOBILE_CAROUSEL_ITEMS.length}`}
                </span>
                <button
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#1A1A1E] dark:text-white"
                  aria-label="Next view"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 3D Depth Card Carousel with Perspective Tilt */}
          <motion.div
            style={{
              scale: shouldReduceMotion ? 1 : phoneScale,
              y: shouldReduceMotion ? 0 : phoneY,
            }}
            className="lg:col-span-6 relative flex justify-center items-center perspective-1000"
          >
            {/* Ambient Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[360px] h-[360px] bg-[#6C5CE7]/18 dark:bg-[#6C5CE7]/25 blur-[90px] rounded-full" />
            </div>

            {/* 3D Stacked Carousel Cards */}
            <div className="relative w-full max-w-[540px] aspect-[4/3] sm:aspect-[1.25/1]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, rotateY: 18, scale: 0.92, x: 30 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1, x: 0 }}
                  exit={{ opacity: 0, rotateY: -18, scale: 0.92, x: -30 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-[0_25px_80px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_90px_-10px_rgba(0,0,0,0.85)] border border-white/80 dark:border-white/10 group bg-black/5 dark:bg-white/5"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <Image
                    src={currentItem.img}
                    alt={currentItem.title}
                    fill
                    priority
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                  />

                  {/* Top Floating Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 dark:bg-white/80 text-white dark:text-black text-[10px] font-bold backdrop-blur-md shadow-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    {currentItem.tag}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
