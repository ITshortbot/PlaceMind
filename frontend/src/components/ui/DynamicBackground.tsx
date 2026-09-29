'use client';

// ============================================================================
// File: frontend/src/components/ui/DynamicBackground.tsx
// Description: Ambient Dynamic Background matching the Placemind High-Contrast Theme
//              - Rich, vibrant moving organic gradient mesh (Pop-Yellow, Champagne, Dark Amber).
//              - Pronounced moving glow orbs visible on both crisp White and deep Black base.
//              - Modern geometric tech dot grid overlay.
// ============================================================================

import React from 'react';

export function DynamicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Dynamic Floating Gradient Orb 1 (Top Left Pop-Yellow Sunbeam) */}
      <div
        className="absolute -top-[12%] -left-[10%] w-[60vw] h-[60vw] rounded-full animate-mesh-1 blur-[90px] sm:blur-[120px] opacity-40 dark:opacity-30 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.65) 0%, rgba(234, 179, 8, 0.3) 45%, transparent 70%)',
        }}
      />

      {/* Dynamic Floating Gradient Orb 2 (Bottom Right Warm Amber Aurora) */}
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[65vw] h-[65vw] rounded-full animate-mesh-2 blur-[100px] sm:blur-[130px] opacity-35 dark:opacity-25 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.55) 0%, rgba(245, 158, 11, 0.25) 50%, transparent 75%)',
        }}
      />

      {/* Dynamic Floating Gradient Orb 3 (Center Dynamic Ambient Orb) */}
      <div
        className="absolute top-[30%] right-[30%] w-[50vw] h-[50vw] rounded-full animate-mesh-3 blur-[85px] sm:blur-[115px] opacity-30 dark:opacity-20 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(254, 240, 138, 0.7) 0%, rgba(250, 204, 21, 0.3) 40%, transparent 70%)',
        }}
      />

      {/* Geometric Tech Dot Matrix Pattern Overlay */}
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
