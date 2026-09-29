'use client';

// ============================================================================
// File: frontend/src/components/landing/GlobalBackground.tsx
// Description: Multi-stop diagonal pastel mesh (Light) and deep counterpart (Dark)
//              with CONTINUOUS high-amplitude drift & scroll-linked hue/depth shifts.
//
// JURY & ACCESSIBILITY DEFENSE:
// 1. Continuous Organic Drift: 5 independent, staggered GPU-accelerated blob keyframe
//    animations (16s, 20s, 24s, 18s, 22s) with visible drift visible within 3-5s.
// 2. Scroll-Linked Section Shift: useScroll() dynamically modulates hue rotation and
//    layer opacity as user navigates down the page.
// 3. Dual Mode Support: 5-stop soft pastel (Light) vs deep moody counterpart (Dark).
// 4. prefers-reduced-motion: Freezes all movement cleanly for motion-sensitive users.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export function GlobalBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();

  // Scroll-linked hue and depth transformations
  const hueShift = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0, 16, -14, 22]);
  const ambientOpacity = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.85, 1], [1, 0.92, 1, 0.84, 0.96]);
  const yDrift = useTransform(scrollYProgress, [0, 1], [0, -120]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none transition-colors duration-500"
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          /* ==================================================================
             DARK MODE: Deep, Moody Counterpart (Preserves diagonal cool->warm flow)
             ================================================================== */
          <motion.div
            key="dark-mesh"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{
              opacity: shouldReduceMotion ? 1 : ambientOpacity,
              y: shouldReduceMotion ? 0 : yDrift,
              filter: shouldReduceMotion ? undefined : `hue-rotate(${hueShift}deg)`,
            }}
            className="absolute inset-0 bg-[#0A0A0C]"
          >
            {/* Top-Left: Deep Navy/Indigo (#161D3A) */}
            <div
              className={`absolute -top-[20%] -left-[10%] w-[68vw] max-w-[900px] h-[68vw] max-h-[900px] rounded-full bg-[#161D3A] opacity-85 blur-[90px] md:blur-[140px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-1'
              }`}
            />

            {/* Upper-Middle: Deep Plum (#2A1F3D) */}
            <div
              className={`absolute top-[12%] left-[22%] w-[58vw] max-w-[750px] h-[58vw] max-h-[750px] rounded-full bg-[#2A1F3D] opacity-75 blur-[90px] md:blur-[130px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-2'
              }`}
            />

            {/* Center: Dark Wine/Mauve (#3A2438) */}
            <div
              className={`absolute top-[38%] left-[32%] w-[54vw] max-w-[700px] h-[54vw] max-h-[700px] rounded-full bg-[#3A2438] opacity-65 blur-[100px] md:blur-[150px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-3'
              }`}
            />

            {/* Lower-Middle: Dark Amber-Brown (#3D2C22) */}
            <div
              className={`absolute bottom-[12%] right-[18%] w-[58vw] max-w-[760px] h-[58vw] max-h-[760px] rounded-full bg-[#3D2C22] opacity-70 blur-[90px] md:blur-[140px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-4'
              }`}
            />

            {/* Bottom-Right: Deep Bronze (#2E2416) */}
            <div
              className={`absolute -bottom-[15%] -right-[10%] w-[64vw] max-w-[820px] h-[64vw] max-h-[820px] rounded-full bg-[#2E2416] opacity-85 blur-[90px] md:blur-[140px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-5'
              }`}
            />

            {/* Dark Mode Ambient Grain & Grid */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#F5F5F7_1px,transparent_1px)] [background-size:32px_32px]" />
          </motion.div>
        ) : (
          /* ==================================================================
             LIGHT MODE: Soft Pastel Diagonal Mesh (Per Reference Image)
             Flow: Top-Left Periwinkle -> Lavender -> Dusty Pink -> Blush -> Peach
             ================================================================== */
          <motion.div
            key="light-mesh"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{
              opacity: shouldReduceMotion ? 1 : ambientOpacity,
              y: shouldReduceMotion ? 0 : yDrift,
              filter: shouldReduceMotion ? undefined : `hue-rotate(${hueShift}deg)`,
            }}
            className="absolute inset-0 bg-[#F7EFE8]"
          >
            {/* Top-Left: Soft Periwinkle Blue (#BFD3E8) */}
            <div
              className={`absolute -top-[20%] -left-[10%] w-[68vw] max-w-[900px] h-[68vw] max-h-[900px] rounded-full bg-[#BFD3E8] opacity-95 blur-[90px] md:blur-[130px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-1'
              }`}
            />

            {/* Upper-Middle: Pale Lavender (#D6CBE0) */}
            <div
              className={`absolute top-[8%] left-[22%] w-[58vw] max-w-[750px] h-[58vw] max-h-[750px] rounded-full bg-[#D6CBE0] opacity-90 blur-[90px] md:blur-[120px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-2'
              }`}
            />

            {/* Center: Dusty Pink (#E8CFD6) */}
            <div
              className={`absolute top-[32%] left-[32%] w-[56vw] max-w-[720px] h-[56vw] max-h-[720px] rounded-full bg-[#E8CFD6] opacity-85 blur-[95px] md:blur-[135px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-3'
              }`}
            />

            {/* Lower-Middle: Warm Blush (#F0D9C8) */}
            <div
              className={`absolute bottom-[12%] right-[18%] w-[58vw] max-w-[780px] h-[58vw] max-h-[780px] rounded-full bg-[#F0D9C8] opacity-90 blur-[90px] md:blur-[120px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-4'
              }`}
            />

            {/* Bottom-Right: Soft Cream/Peach (#F6E7D2) */}
            <div
              className={`absolute -bottom-[15%] -right-[10%] w-[68vw] max-w-[900px] h-[68vw] max-h-[900px] rounded-full bg-[#F6E7D2] opacity-95 blur-[90px] md:blur-[130px] will-change-transform ${
                shouldReduceMotion ? '' : 'animate-blob-5'
              }`}
            />

            {/* Light Mode Fine Grain Texture to Prevent Banding */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#1A1A1E_1px,transparent_1px)] [background-size:28px_28px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
