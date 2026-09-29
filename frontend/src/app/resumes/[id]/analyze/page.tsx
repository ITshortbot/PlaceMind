'use client';

// ============================================================================
// File: frontend/src/app/resumes/[id]/analyze/page.tsx
// Description: ATS Gap Analysis Page with prominent score header, sub-scores,
//              interactive requirements coverage table, and 1-click optimization trigger.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Sliders,
  Layers,
  Zap,
} from 'lucide-react';

const SUB_SCORES = [
  { name: 'Semantic Coverage', score: 92, weight: '50% Weight' },
  { name: 'Keyword Density', score: 86, weight: '30% Weight' },
  { name: 'Quantification (Google XYZ)', score: 94, weight: '10% Weight' },
  { name: 'Single-Column ATS Format', score: 100, weight: '10% Weight' },
];

const GAP_REQUIREMENTS = [
  {
    id: 1,
    skill: 'Apache Kafka Stream Processing',
    status: 'Covered',
    context: 'Scaled distributed Kafka streaming pipelines to 4.5M events/sec.',
    importance: 'High',
  },
  {
    id: 2,
    skill: 'PostgreSQL & pgvector RAG Search',
    status: 'Covered',
    context: 'Engineered cloud database index handling 250M queries daily.',
    importance: 'High',
  },
  {
    id: 3,
    skill: '99.99% High-Availability SLAs',
    status: 'Weak',
    context: 'Mentioned 99.99% uptime, but lacking disaster recovery drill details.',
    importance: 'Medium',
  },
  {
    id: 4,
    skill: 'Cross-Region Latency Budgets (<5ms)',
    status: 'Missing',
    context: 'No quantifiable latency ceiling specified for multi-region endpoints.',
    importance: 'Medium',
  },
];

export default function ResumeAnalyzePage() {
  const params = useParams();
  const id = params.id as string;
  const [jobDescription, setJobDescription] = useState(
    `Staff Software Engineer · Stripe Core Infrastructure
We are looking for an experienced distributed systems engineer to lead high-throughput event processing pipelines, optimize PostgreSQL databases, and guarantee 99.99% multi-region uptime.`
  );

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Resumes', href: '/dashboard' },
          { label: 'ATS Gap Analysis' },
        ]}
        actionButton={
          <Link href={`/resumes/${id}/edit`}>
            <Button variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Generate Optimized Resume
            </Button>
          </Link>
        }
      />

      <main className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Two-Column Input & Context Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Resume Snapshot (Read-only reference) */}
          <div className="lg:col-span-5 p-5 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <span className="text-[10px] font-bold uppercase text-[#6C5CE7]">Active Resume</span>
              <span className="text-[10px] font-mono text-[#16A34A] font-bold">100% Parsable</span>
            </div>
            <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
              Rohan K. Patel &bull; Staff Software Architect
            </h3>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
              Targeting high-throughput distributed systems roles across Stripe, OpenAI, and Vercel.
            </p>
          </div>

          {/* Right: Job Description Input & Re-Analyze */}
          <div className="lg:col-span-7 p-5 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-[#6C5CE7]">Target Job Description</span>
              <button className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                <RefreshCw className="w-3 h-3" /> Re-run Scan
              </button>
            </div>
            <textarea
              rows={2}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] text-xs font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Prominent Score Header & 4 Sub-Score Gauges */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/90 dark:from-[#141417]/95 via-white/80 dark:via-[#141417]/90 to-[#6C5CE7]/10 border border-[#6C5CE7]/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#6C5CE7]">Overall Alignment</span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-[#1A1A1E] dark:text-white tracking-tight">
                  89.4%
                </span>
                <span className="text-sm font-bold text-[#16A34A] dark:text-[#22C55E] flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Top Tier Match
                </span>
              </div>
              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
                High interview likelihood for Stripe Core Infrastructure Staff Engineer role.
              </p>
            </div>

            <Link href={`/resumes/${id}/edit`}>
              <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                Apply AI Fixes &rarr; 97.2% Target
              </Button>
            </Link>
          </div>

          {/* 4 Sub-Score Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUB_SCORES.map((sub) => (
              <div
                key={sub.name}
                className="p-4 rounded-2xl bg-white/70 dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] space-y-2"
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="truncate">{sub.name}</span>
                  <span className="text-[#6C5CE7]">{sub.score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#38BDF8] rounded-full"
                    style={{ width: `${sub.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#8A8A92] block">{sub.weight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements Coverage Gap Report Table */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
              Requirements Breakdown & Missing Skills
            </h3>
            <span className="text-xs text-[#8A8A92]">4 Core JD Criteria Evaluated</span>
          </div>

          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {GAP_REQUIREMENTS.map((req) => (
              <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1E] dark:text-white">{req.skill}</span>
                    <Badge
                      variant={
                        req.status === 'Covered'
                          ? 'success'
                          : req.status === 'Weak'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">{req.context}</p>
                </div>

                <span className="text-[10px] font-mono text-[#8A8A92] px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.04] flex-shrink-0 self-start sm:self-center">
                  {req.importance} Priority
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
