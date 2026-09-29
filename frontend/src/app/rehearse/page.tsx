'use client';

// ============================================================================
// File: frontend/src/app/rehearse/page.tsx
// Description: Live AI Mock Interview Rehearsal Room for Placemind
//              featuring dynamic audio visualizer waveforms, real-time speech probe,
//              voice toggle, and technical score critique cards.
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const MOCK_QUESTIONS = [
  {
    id: 1,
    question: 'How do you handle consumer group rebalancing spikes in high-throughput Kafka clusters?',
    probe: 'Looking for understanding of cooperative sticky assigners and static group membership.',
    score: '96% Answer Clarity',
  },
  {
    id: 2,
    question: 'Describe how you maintain 99.99% uptime when performing live database schema migrations.',
    probe: 'Looking for zero-downtime expand/contract patterns and shadow writes.',
    score: 'Pending Response',
  },
];

export default function RehearsePage() {
  const [isRecording, setIsRecording] = useState(true);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const currentQ = MOCK_QUESTIONS[activeQuestionIdx];

  return (
    <div className="min-h-screen bg-[#F4EFEA] dark:bg-[#09090C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Studio Workspace</span>
          </Link>
          <div className="h-4 w-px bg-black/[0.1] dark:bg-white/[0.1]" />
          <span className="font-bold text-sm">AI Technical Phone Screen Rehearsal</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse mr-1.5" />
            Live Session Active
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </header>

      {/* Main Interview Stage */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col justify-between gap-8">
        {/* Active AI Interviewer Stage */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#121217]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#6C5CE7] shadow-lg flex-shrink-0">
              <Image
                src="/assets/ai-interviewer.jpg"
                alt="AI Interviewer Aura"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-white dark:border-black" />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base font-bold text-[#1A1A1E] dark:text-white">Aura &bull; Principal Interviewer</h3>
                <span className="text-[10px] font-mono font-bold text-[#6C5CE7] bg-[#6C5CE7]/10 px-2 py-0.5 rounded">
                  Gemini 2.5 Voice Stream
                </span>
              </div>
              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                Simulating Staff Software Engineer interview for Stripe Core Infrastructure.
              </p>
            </div>
          </div>

          {/* Current Question Bubble */}
          <div className="p-5 rounded-2xl bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 space-y-2">
            <span className="text-[10px] font-bold uppercase text-[#6C5CE7]">Question 0{activeQuestionIdx + 1}:</span>
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1E] dark:text-white leading-snug">
              &quot;{currentQ.question}&quot;
            </h2>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] pt-1">
              ⚡ <strong>Target Signal:</strong> {currentQ.probe}
            </p>
          </div>

          {/* Dynamic Audio Waveform Visualizer */}
          <div className="p-6 rounded-2xl bg-black/[0.03] dark:bg-[#0A0A0E] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center gap-1.5 h-20">
            {[40, 65, 85, 30, 95, 70, 45, 90, 60, 80, 50, 100, 75, 40, 85, 60, 30, 90, 55, 70].map((h, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isRecording ? [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] : '20%',
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
                className="w-1.5 rounded-full bg-gradient-to-t from-[#6C5CE7] to-[#38BDF8]"
              />
            ))}
          </div>

          {/* Real-time Voice Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A] dark:text-[#22C55E]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
              <span>{isRecording ? 'Listening to speech...' : 'Microphone paused'}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  isRecording ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]' : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? 'Stop Answering' : 'Start Speaking'}</span>
              </button>

              <Button
                variant="primary"
                size="sm"
                icon={<ChevronRight className="w-4 h-4" />}
                onClick={() => setActiveQuestionIdx((prev) => (prev + 1) % MOCK_QUESTIONS.length)}
              >
                Next Question
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
