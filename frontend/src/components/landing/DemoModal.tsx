'use client';

// ============================================================================
// File: frontend/src/components/landing/DemoModal.tsx
// Description: 60-second interactive video simulation modal with dual Light/Dark styling
// ============================================================================

import React, { useState } from 'react';
import { X, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white/95 dark:bg-[#141417]/95 border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-10 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/[0.08] dark:border-[#2A2A30]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                Placemind Architecture Walkthrough
              </h3>
              <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                PyMuPDF Parsing · 384-d Cosine Distance · LM Studio Zero-Egress
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-[#1C1C21] text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas Mock Screen */}
        <div className="relative aspect-video bg-[#0A0A0C] flex items-center justify-center overflow-hidden">
          {/* Animated Matrix Simulation */}
          <div className="p-8 text-center space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1C21] border border-[#2A2A30] text-xs text-[#7D6FF0]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
              <span>Streaming FastEmbed Inference</span>
            </div>

            <h4 className="text-xl font-bold text-white tracking-tight">
              Bipartite Vector Alignment Demo
            </h4>

            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Decomposing resume text into semantic chunks and comparing against job requirements using BGE-small dense embeddings.
            </p>

            <div className="flex justify-center pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              >
                {isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/[0.02] dark:bg-[#0A0A0C] border-t border-black/[0.08] dark:border-[#2A2A30] flex items-center justify-between text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
          <span>Full-Stack PBL Defense Build</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-black/[0.05] dark:bg-[#1C1C21] hover:text-[#1A1A1E] dark:hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
