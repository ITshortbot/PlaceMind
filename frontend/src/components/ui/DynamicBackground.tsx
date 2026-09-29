'use client';

// ============================================================================
// File: frontend/src/components/ui/DynamicBackground.tsx
// Description: Ambient Dynamic Background matching the Placemind High-Contrast Theme
//
// PERFORMANCE DECISIONS:
// 1. `will-change: transform` is declared in globals.css on all animated orbs,
//    promoting them to independent GPU compositor layers.
// 2. `contain: layout style paint` prevents animated orb repaints from
//    cascading into surrounding content.
// 3. The hook respects `prefers-reduced-motion` — if the OS accessibility
//    setting is enabled, the entire animation layer is unmounted rather than
//    just paused, fully eliminating GPU overhead.
// 4. Blur radii are intentionally capped at 120px (sm: breakpoint). Higher
//    blur values scale quadratically in GPU cost without visible quality gain.
// ============================================================================

import React, { useEffect, useState } from 'react';

/** Checks OS/browser `prefers-reduced-motion` setting once on mount */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function DynamicBackground() {
  const reduced = usePrefersReducedMotion();

  // When reduced-motion is requested, render a completely static gradient
  // background instead — no animation layers, zero GPU overhead.
  if (reduced) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 select-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(250,204,21,0.12) 0%, transparent 60%), ' +
            'radial-gradient(ellipse at 80% 80%, rgba(250,204,21,0.08) 0%, transparent 55%)',
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Orb 1: Top-left pop-yellow sunbeam
          GPU: compositor layer via will-change:transform (set in globals.css) */}
      <div
        className="absolute -top-[12%] -left-[10%] w-[60vw] h-[60vw] rounded-full animate-mesh-1 blur-[90px] sm:blur-[120px] opacity-40 dark:opacity-30 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle, rgba(250, 204, 21, 0.65) 0%, rgba(234, 179, 8, 0.3) 45%, transparent 70%)',
        }}
      />

      {/* Orb 2: Bottom-right warm amber aurora */}
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[65vw] h-[65vw] rounded-full animate-mesh-2 blur-[100px] sm:blur-[120px] opacity-35 dark:opacity-25 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle, rgba(250, 204, 21, 0.55) 0%, rgba(245, 158, 11, 0.25) 50%, transparent 75%)',
        }}
      />

      {/* Orb 3: Center ambient accent
          Capped at sm:blur-[115px] to avoid GPU overdraw on 1x DPR screens */}
      <div
        className="absolute top-[30%] right-[30%] w-[50vw] h-[50vw] rounded-full animate-mesh-3 blur-[85px] sm:blur-[110px] opacity-30 dark:opacity-20 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle, rgba(254, 240, 138, 0.7) 0%, rgba(250, 204, 21, 0.3) 40%, transparent 70%)',
        }}
      />

      {/* Geometric tech dot matrix overlay — static, no animation cost */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] transition-opacity duration-700"
        style={{
          backgroundImage: `radial-gradient(currentColor 1.2px, transparent 1.2px)`,
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
}
