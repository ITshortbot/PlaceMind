'use client';

// ============================================================================
// File: frontend/src/components/landing/FinalCTA.tsx
// Description: Full-width high-contrast final CTA band with dual Light/Dark styling
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { WaveTextReveal } from '@/components/ui/WaveTextReveal';

export function FinalCTA() {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[650px] h-[320px] bg-[#6C5CE7]/15 dark:bg-[#6C5CE7]/18 blur-[130px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-black/[0.08] dark:border-[#2A2A30] text-[11px] font-mono uppercase tracking-[0.2em] text-[#6C5CE7] dark:text-[#7D6FF0] backdrop-blur-md shadow-sm">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>INSTANT ATS DIAGNOSIS &bull; FREE FOREVER</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#1A1A1E] dark:text-[#F5F5F7] leading-tight">
            <span className="font-light">Ready to fix your resume and</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              nail the interview?
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] max-w-xl mx-auto leading-[1.7]">
            Audit your application against any job description in under 30 seconds. 100% free, no credit card required.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                const el = document.getElementById('demo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto text-sm px-8"
            >
              Get Started Free
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
