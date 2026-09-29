'use client';

// ============================================================================
// File: frontend/src/components/app/AiCommandBar.tsx
// Description: Master Floating AI Command Capsule (Black, White & Yellow High Contrast)
//              - Positioned comfortably lower (bottom-3 / bottom-4).
//              - Gentle, slow rotating yellow aura beam (soft intensity) that stays alive.
//              - Pill-shaped outer frosted capsule with deep floating drop shadow.
//              - Left quick actions: Star / Presets, Download / Archive, Attachment / Upload JD.
//              - Inset pill input field with independent outer & inner drop shadows.
//              - Right quick actions: Pencil direct rewrite & yellow send trigger.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Download,
  Paperclip,
  Mic,
  MicOff,
  Pencil,
  Send,
  Check,
} from 'lucide-react';

interface AiCommandBarProps {
  placeholder?: string;
  onExecute?: (command: string) => void;
}

export function AiCommandBar({
  placeholder = "Ask Placemind AI (e.g., 'Rewrite summary for Staff role', 'Add 3 distributed systems probes')...",
  onExecute,
}: AiCommandBarProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  // Respect OS accessibility preference — skip GPU-intensive aura animation
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastAction(input);

    if (onExecute) {
      onExecute(input);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setInput('');
      setTimeout(() => setLastAction(null), 3000);
    }, 1200);
  };

  const handleToolClick = (toolName: string, presetText: string) => {
    setActiveTool(toolName);
    setInput(presetText);
    setTimeout(() => setActiveTool(null), 1500);
  };

  return (
    <div className="sticky bottom-3 sm:bottom-4 inset-x-0 px-4 sm:px-8 z-30 pointer-events-none select-none">
      <div className="max-w-4xl mx-auto pointer-events-auto relative">
        {/* Rotating Yellow Aura Beam — unmounted in reduced-motion mode */}
        {!reducedMotion && (
          <div className="absolute -inset-0.5 rounded-full overflow-hidden pointer-events-none opacity-60 dark:opacity-75 blur-xs">
            <div
              className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 animate-aura-spin"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(250, 204, 21, 0.0) 120deg, rgba(250, 204, 21, 0.5) 200deg, rgba(250, 204, 21, 0.8) 240deg, transparent 300deg)',
              }}
            />
          </div>
        )}
        {/* Static ring fallback for reduced-motion / accessibility */}
        {reducedMotion && (
          <div className="absolute -inset-0.5 rounded-full border border-[#FACC15]/30 pointer-events-none" />
        )}

        {/* Outer Floating Frosted Pill Capsule */}
        <motion.form
          onSubmit={handleSubmit}
          animate={{
            scale: isFocused ? 1.01 : 1,
            boxShadow: isFocused
              ? '0 25px 50px -12px rgba(250, 204, 21, 0.35), 0 0 0 1.5px rgba(250, 204, 21, 0.5)'
              : '0 20px 45px -12px rgba(0, 0, 0, 0.45)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative h-13 sm:h-14 rounded-full glass-frosted-dark bg-[#0A0A0C]/90 dark:bg-[#0A0A0C]/95 border border-white/20 text-white p-1 sm:p-1.5 flex items-center justify-between gap-1 sm:gap-2 backdrop-blur-3xl"
        >
          {/* Left Action Buttons: Star (Presets), Archive/Download, Attachment */}
          <div className="flex items-center gap-0.5 sm:gap-1 pl-2 sm:pl-2.5 flex-shrink-0 text-white/70">
            {/* 1. Star (Presets) */}
            <button
              type="button"
              onClick={() => handleToolClick('star', 'Enhance metrics to top 5% Google XYZ format')}
              className={`p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer ${
                activeTool === 'star' ? 'text-[#FACC15] bg-white/10' : ''
              }`}
              title="Apply Star Candidate Metrics"
              aria-label="Star Presets"
            >
              <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTool === 'star' ? 'fill-current text-[#FACC15]' : ''}`} />
            </button>

            {/* 2. Download / Archive */}
            <button
              type="button"
              onClick={() => handleToolClick('download', 'Export latest tailored resume version as PDF')}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer"
              title="Quick Export & Download"
              aria-label="Export"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 3. Attachment / Upload JD */}
            <button
              type="button"
              onClick={() => handleToolClick('attach', 'Attach target Job Description for real-time ATS match')}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer"
              title="Attach Job Description or File"
              aria-label="Attach File"
            >
              <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Center Inset Pill Input Stage with Micro Drop Shadow */}
          <div className="flex-1 h-full rounded-full bg-white/10 dark:bg-white/5 border border-white/10 shadow-md px-3 sm:px-3.5 flex items-center gap-2 min-w-0">
            {/* Mic Dictation Trigger */}
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`p-1 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                isRecording
                  ? 'bg-[#EF4444] text-white animate-pulse'
                  : 'text-white/70 hover:text-[#FACC15] hover:bg-white/10'
              }`}
              title={isRecording ? 'Stop Recording' : 'Voice Dictation'}
              aria-label="Voice Input"
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? 'Listening to voice prompt...' : placeholder}
              className="flex-1 bg-transparent border-none text-xs sm:text-sm font-semibold text-white placeholder:text-white/40 focus:outline-none min-w-0"
            />

            {/* Quick Status Pill */}
            {lastAction && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black text-[#FACC15] px-2 py-0.5 rounded-full bg-[#FACC15]/20 animate-fade-in flex-shrink-0">
                <Check className="w-3 h-3" />
                <span>Applied!</span>
              </span>
            )}
          </div>

          {/* Right Action: Pencil / Direct Edit Tool & Yellow Submit */}
          <div className="flex items-center gap-1 sm:gap-1.5 pr-2 sm:pr-2.5 flex-shrink-0 text-white/70">
            {/* 1. Pencil Direct Rewrite Tool */}
            <button
              type="button"
              onClick={() => handleToolClick('pencil', 'Rewrite active bullet points for higher ATS punchiness')}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer"
              title="Direct Bullet Rewrite Tool"
              aria-label="Direct Rewrite"
            >
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 2. Execute / Send Trigger */}
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className={`p-1.5 sm:p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                input.trim()
                  ? 'bg-[#FACC15] text-[#0A0A0C] font-black shadow-md shadow-[#FACC15]/30 active:scale-95'
                  : 'text-white/30 cursor-not-allowed'
              }`}
              title="Run AI Command"
              aria-label="Run Prompt"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
