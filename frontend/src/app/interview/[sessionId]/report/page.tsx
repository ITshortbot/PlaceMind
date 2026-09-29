'use client';

// ============================================================================
// File: frontend/src/app/interview/[sessionId]/report/page.tsx
// Description: Multi-Dimensional Interview Report with custom SVG radar chart,
//              per-question breakdown, STAR analysis, and actionable growth plan.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { RadarChart } from '@/components/app/RadarChart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Award,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Share2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const RADAR_DATA = [
  { axis: 'STAR Structure', value: 92 },
  { axis: 'Metric Precision', value: 88 },
  { axis: 'Relevance', value: 95 },
  { axis: 'Communication Clarity', value: 90 },
  { axis: 'Technical Depth', value: 86 },
];

const QUESTIONS_REPORT = [
  {
    id: 1,
    q: 'How do you manage consumer group rebalances during heavy traffic spikes without dropping event throughput?',
    ans: 'We implemented cooperative sticky assigners to prevent stop-the-world partition revocations across 120 broker nodes, combined with static group membership.',
    score: '96%',
    strengths: 'Clear STAR pattern; quantified broker cluster size and specific assigner algorithm.',
  },
  {
    id: 2,
    q: 'Describe a scenario where you performed live zero-downtime schema migrations on a PostgreSQL cluster handling 250M queries daily.',
    ans: 'Used shadow writes and expand-contract migrations with dual schema reads before cutting over replication slots.',
    score: '92%',
    strengths: 'Deep systems knowledge on replication lag and rollback safety.',
  },
];

export default function InterviewReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [expandedQ, setExpandedQ] = useState<number | null>(1);

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Interview History', href: '/history' },
          { label: 'Session Report' },
        ]}
        actionButton={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Share2 className="w-3.5 h-3.5" />}>
              Share Report
            </Button>
            <Link href="/interview/new">
              <Button variant="primary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>
                Practice Again
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Executive Score Summary Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/90 dark:from-[#141417]/95 via-white/80 dark:via-[#141417]/90 to-[#6C5CE7]/15 border border-[#6C5CE7]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E] text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Executive Grade Communication</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight">
              Overall Interview Score: <span className="text-[#6C5CE7]">88.5%</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] max-w-lg leading-relaxed">
              Staff Distributed Systems Engineer simulation completed &bull; 6 technical probes evaluated across STAR delivery, metric precision, and architectural depth.
            </p>
          </div>

          {/* Multi-Dimensional Radar Profile */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-black/40 border border-black/[0.06] dark:border-white/[0.06] shadow-sm flex-shrink-0">
            <RadarChart data={RADAR_DATA} size={220} />
          </div>
        </div>

        {/* AI Synthesis & Feedback Callout */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
            <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
              AI Evaluator Executive Summary
            </h3>
          </div>
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
            Rohan demonstrated mastery of distributed stream processing algorithms, specifically referencing cooperative sticky assigners and static group membership. To reach the top 1% bracket, emphasize rollback automation metrics during cross-region network partitions.
          </p>
        </div>

        {/* Per-Question Breakdown List */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-[#1A1A1E] dark:text-white">
            Per-Question Review & Feedback
          </h2>

          <div className="space-y-3">
            {QUESTIONS_REPORT.map((q) => {
              const isExpanded = expandedQ === q.id;
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3"
                >
                  <div
                    onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                    className="flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#6C5CE7]">Question 0{q.id}</span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1A1A1E] dark:text-white">
                        {q.q}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-[#16A34A] dark:text-[#22C55E]">
                        {q.score}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8A8A92]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A92]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#8A8A92] block">Transcribed Answer:</span>
                        <p className="text-[#5A5A63] dark:text-[#A1A1AA] italic mt-0.5">&quot;{q.ans}&quot;</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E] font-medium">
                        ✓ {q.strengths}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
