'use client';

// ============================================================================
// File: frontend/src/app/interview/new/page.tsx
// Description: Interview Practice Setup Wizard - Target role picker, resume selector,
//              detected weak areas chips, and Voice vs Text mode selection.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Mic,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
} from 'lucide-react';

const WEAK_AREAS = [
  { id: 'dist', label: 'Distributed Kafka Systems', tag: 'High Priority' },
  { id: 'sla', label: '99.99% High-Availability SLAs', tag: 'Medium Priority' },
  { id: 'lat', label: 'Cross-Region Latency Budgets (<5ms)', tag: 'Medium Priority' },
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState('Staff Distributed Systems Engineer · Stripe');
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [resumeId, setResumeId] = useState('stripe-staff');

  const handleStart = () => {
    const randomSessionId = `sess-${Math.floor(10000 + Math.random() * 90000)}`;
    router.push(`/interview/${randomSessionId}`);
  };

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Interview Practice', href: '/dashboard' },
          { label: 'Configure New Session' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] shadow-sm">
            <Mic className="w-3.5 h-3.5" />
            <span>AI PHONE SCREEN SIMULATOR</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight">
            Configure Your Mock Interview
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA]">
            Tailored technical probes synthesized from your resume and target job requirements.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-xl space-y-6">
          {/* Target Role Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1A1A1E] dark:text-white flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#6C5CE7]" />
              Target Role & Company
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold focus:outline-[#6C5CE7]"
            />
          </div>

          {/* Source Resume Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1A1A1E] dark:text-white">
              Source Resume Reference
            </label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold focus:outline-[#6C5CE7]"
            >
              <option value="stripe-staff">Rohan_Patel_Staff_Architect_2026.pdf (94.8% ATS Match)</option>
              <option value="ai-lead">Rohan_AI_Systems_Specialist.pdf (98.2% ATS Match)</option>
            </select>
          </div>

          {/* Detected Weak Areas (Pulled from Gap Analysis) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#1A1A1E] dark:text-white">
                Detected Focus Areas (from ATS Gap Scan)
              </span>
              <span className="text-[10px] text-[#6C5CE7] font-semibold">3 Probes Synthesized</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {WEAK_AREAS.map((wa) => (
                <span
                  key={wa.id}
                  className="px-3 py-1.5 rounded-xl bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-xs font-medium text-[#6C5CE7] dark:text-[#8F82FF] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{wa.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Mode Selection (Voice vs Text) */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-[#1A1A1E] dark:text-white">
              Interview Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('voice')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  mode === 'voice'
                    ? 'bg-[#6C5CE7]/15 border-[#6C5CE7] text-[#6C5CE7] shadow-sm'
                    : 'bg-black/[0.02] dark:bg-black/20 border-black/[0.06] dark:border-white/[0.06] text-[#5A5A63]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#6C5CE7] text-white flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A1A1E] dark:text-white">Voice Screen</div>
                  <div className="text-[10px] text-[#8A8A92]">Real-time speech simulation</div>
                </div>
              </button>

              <button
                onClick={() => setMode('text')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  mode === 'text'
                    ? 'bg-[#6C5CE7]/15 border-[#6C5CE7] text-[#6C5CE7] shadow-sm'
                    : 'bg-black/[0.02] dark:bg-black/20 border-black/[0.06] dark:border-white/[0.06] text-[#5A5A63]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-black/60 dark:bg-white/20 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A1A1E] dark:text-white">Text Chat</div>
                  <div className="text-[10px] text-[#8A8A92]">Typed response practice</div>
                </div>
              </button>
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full text-sm font-bold"
            >
              Start Live Interview Session
            </Button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
