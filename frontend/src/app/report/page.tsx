'use client';

// ============================================================================
// File: frontend/src/app/report/page.tsx
// Description: Tab 6 - Report: 2-Column Analytical Scoring Dashboard from Wireframe v1
//              Left Column: Resume & ATS Reports (Sub-scores, gap report)
//              Right Column: Interview Reports (Radar chart, STAR analysis)
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { RadarChart } from '@/components/app/RadarChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import {
  TrendingUp,
  FileCheck2,
  Mic,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const RADAR_DATA = [
  { axis: 'STAR Structure', value: 92 },
  { axis: 'Metric Precision', value: 88 },
  { axis: 'Relevance', value: 95 },
  { axis: 'Clarity', value: 90 },
  { axis: 'Tech Depth', value: 86 },
];

export default function ReportPage() {
  return (
    <AppShell showAiBar={false}>
      <TopBar
        title="Analytical Reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Performance & Score Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
            Evaluate your document alignment and verbal interview signals side-by-side.
          </p>
        </div>

        {/* 2-Column Scoring View from Wireframe v1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* =============================================================== */}
          {/* LEFT COLUMN: Resume & ATS Gap Reports                           */}
          {/* =============================================================== */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/12 text-[#6C5CE7] flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Resume & ATS Score Report</h3>
                    <p className="text-[11px] text-[#8A8A92]">Stripe · Staff Software Architect</p>
                  </div>
                </div>
                <Badge variant="success" size="sm" className="font-mono text-xs">
                  89.4% Match
                </Badge>
              </div>

              {/* Sub-Scores */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Semantic JD Coverage</span>
                    <span className="text-[#854D0E] dark:text-[#FACC15]">92%</span>
                  </div>
                  <Progress value={92} className="[&>div]:bg-[#FACC15]" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Keyword Density (Kafka, pgvector)</span>
                    <span className="text-[#854D0E] dark:text-[#FACC15]">86%</span>
                  </div>
                  <Progress value={86} className="[&>div]:bg-[#FACC15]" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Quantification (Google XYZ Metrics)</span>
                    <span className="text-[#854D0E] dark:text-[#FACC15]">94%</span>
                  </div>
                  <Progress value={94} className="[&>div]:bg-[#FACC15]" />
                </div>
              </div>

              <Separator />

              {/* Top Identified Gaps */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#8A8A92] uppercase text-[10px]">Identified Skill Status</span>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/25 flex items-center justify-between">
                    <span className="font-semibold text-[#16A34A]">✓ Kafka Streaming Pipelines</span>
                    <Badge variant="success" size="sm">Covered</Badge>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/25 flex items-center justify-between">
                    <span className="font-semibold text-[#B45309] dark:text-[#F5A623]">! 99.99% Multi-Region SLAs</span>
                    <Badge variant="warning" size="sm">Weak</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* =============================================================== */}
          {/* RIGHT COLUMN: Interview Simulation Reports                       */}
          {/* =============================================================== */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/12 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Interview Performance Report</h3>
                    <p className="text-[11px] text-[#8A8A92]">Staff Distributed Systems Rehearsal</p>
                  </div>
                </div>
                <Badge variant="success" size="sm" className="font-mono text-xs">
                  88.5% Score
                </Badge>
              </div>

              {/* SVG Radar Chart Display */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-black/40 flex items-center justify-center">
                <RadarChart data={RADAR_DATA} size={200} />
              </div>

              <Separator />

              {/* AI Communication Summary */}
              <div className="p-3.5 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#6C5CE7] dark:text-[#8F82FF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recruiter Synthesis</span>
                </div>
                <p className="text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed text-[11px]">
                  Exceptional clarity on cooperative sticky assigners and cluster sizing. For high-bar staff roles, elaborate more on failover latency budgets.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
