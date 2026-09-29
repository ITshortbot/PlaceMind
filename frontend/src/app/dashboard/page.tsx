'use client';

// ============================================================================
// File: frontend/src/app/dashboard/page.tsx
// Description: Tab 1 - Dashboard: Optimized Single-Screen Layout (No scrolling required).
//              Features personalized greeting, 3 quick action cards, compact recent resumes,
//              and interview activity, perfectly framing the bottom floating AI command capsule.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Wand2,
  Mic,
  Clock,
  Sparkles,
  ExternalLink,
  Zap,
} from 'lucide-react';

const RECENT_RESUMES = [
  {
    id: 'stripe-staff',
    name: 'Rohan_Patel_Staff_Architect_2026.pdf',
    date: 'Aug 26, 2026',
    atsScore: 94.8,
    targetRole: 'Staff Software Architect · Stripe',
    file: '/assets/Resume/rem1.webp',
  },
  {
    id: 'ai-lead',
    name: 'Rohan_AI_Systems_Specialist.pdf',
    date: 'Aug 24, 2026',
    atsScore: 98.2,
    targetRole: 'Senior AI Engineer · OpenAI',
    file: '/assets/Resume/rem3.webp',
  },
];

const RECENT_INTERVIEWS = [
  {
    sessionId: 'sess-84920',
    role: 'Staff Distributed Systems Engineer',
    company: 'Stripe Core Infrastructure',
    date: 'Aug 26, 2026',
    score: '88.5%',
    status: 'Completed',
    questionsCount: 6,
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <TopBar
        title="Dashboard"
        actionButton={
          <Link href="/resume">
            <Button variant="default" size="sm" icon={<FileText className="w-3.5 h-3.5" />}>
              Build Resume
            </Button>
          </Link>
        }
      />

      <main className="px-4 sm:px-8 py-3 max-w-7xl mx-auto w-full flex flex-col justify-between space-y-4">
        {/* Personalized Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FACC15]/15 text-[#854D0E] dark:text-[#FACC15] text-[11px] font-black mb-1 border border-[#FACC15]/30">
              <Sparkles className="w-3 h-3" />
              <span>Targeting: Stripe &bull; Staff Software Architect Track</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-[#0A0A0C] dark:text-[#F8F9FA] tracking-tight">
              Welcome back, Rohan
            </h1>
            <p className="text-xs text-[#4A4A52] dark:text-[#A1A1AA]">
              Here is your active placement intelligence profile based on your target role.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FACC15] shadow-xs" />
              <span>Avg ATS: <strong>96.5%</strong></span>
            </div>
            <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm text-xs font-bold flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
              <span>Streak: <strong>4 Days</strong></span>
            </div>
          </div>
        </div>

        {/* 3-Card Quick-Action Row (High-Contrast Glassmorphic Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Action 1: Build a Resume */}
          <Link
            href="/resume"
            className="md:col-span-4 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#101015]/90 border border-black/[0.1] dark:border-white/[0.12] hover:border-[#FACC15] shadow-sm hover:shadow-xl hover:shadow-[#FACC15]/10 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0A0A0C] text-[#FACC15] dark:bg-white/[0.08] flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-[#FACC15] group-hover:text-[#0A0A0C] transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0A0A0C] dark:text-white group-hover:text-[#FACC15] transition-colors">
                  Build a Resume
                </h3>
                <p className="text-[11px] text-[#4A4A52] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                  Craft and edit your single-column ATS resume with certificates and real-time live preview.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#854D0E] dark:text-[#FACC15] pt-2 flex items-center gap-1">
              Open 3-Panel Editor &rarr;
            </span>
          </Link>

          {/* Action 2: Auto-Generate for a Job */}
          <Link
            href="/ats"
            className="md:col-span-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#FACC15]/20 via-white dark:via-[#14141A] to-white dark:to-[#101015] border-2 border-[#FACC15] shadow-lg shadow-[#FACC15]/15 hover:shadow-2xl hover:shadow-[#FACC15]/25 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FACC15] text-[#0A0A0C] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0A0A0C] dark:text-white transition-colors">
                  Auto-Generate for a Job
                </h3>
                <p className="text-[11px] text-[#4A4A52] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                  Paste any job description and let AI synthesize an ATS-tailored draft in one pass.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-black text-[#0A0A0C] dark:text-[#FACC15] pt-2 flex items-center gap-1">
              Start 1-Pass Auto-Gen &rarr;
            </span>
          </Link>

          {/* Action 3: Practice an Interview */}
          <Link
            href="/interview"
            className="md:col-span-4 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#101015]/90 border border-black/[0.1] dark:border-white/[0.12] hover:border-[#FACC15] shadow-sm hover:shadow-xl hover:shadow-[#FACC15]/10 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0A0A0C] text-[#FACC15] dark:bg-white/[0.08] flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-[#FACC15] group-hover:text-[#0A0A0C] transition-all">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0A0A0C] dark:text-white group-hover:text-[#FACC15] transition-colors">
                  Practice Interview
                </h3>
                <p className="text-[11px] text-[#4A4A52] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                  Run realistic technical and STAR behavioral simulations with live speech feedback.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#854D0E] dark:text-[#FACC15] pt-2 flex items-center gap-1">
              Start Rehearsal &rarr;
            </span>
          </Link>
        </div>

        {/* Section: Recent Resumes (Compact Row) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
              Recent Resumes
            </h2>
            <Link href="/template" className="text-[11px] text-[#FACC15] dark:text-[#FACC15] hover:underline font-bold">
              Browse All Templates (10) &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RECENT_RESUMES.map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-9 h-12 rounded-lg overflow-hidden border border-black/10 flex-shrink-0 bg-white shadow-xs">
                    <Image src={res.file} alt={res.name} fill className="object-cover object-top" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-[#1A1A1E] dark:text-white truncate">
                      {res.name}
                    </h3>
                    <p className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] truncate mt-0.5">
                      {res.targetRole}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[#8A8A92]">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{res.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]">
                    {res.atsScore}% ATS
                  </span>
                  <Link href="/resume">
                    <Button variant="default" size="sm" className="h-7 text-[11px] px-2.5">
                      Open in Editor
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Recent Interview Sessions (Compact Row) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
              Recent Interview Sessions
            </h2>
            <Link href="/interview" className="text-[11px] text-[#FACC15] dark:text-[#FACC15] hover:underline font-bold">
              New Simulation &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {RECENT_INTERVIEWS.map((interview) => (
              <div
                key={interview.sessionId}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FACC15]/20 text-[#0A0A0C] dark:text-[#FACC15] flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[#1A1A1E] dark:text-white">
                        {interview.role}
                      </h3>
                      <Badge variant="accent" size="sm">
                        {interview.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5">
                      {interview.company} &bull; {interview.questionsCount} Questions Answered
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-black text-[#16A34A] dark:text-[#22C55E]">
                      {interview.score}
                    </div>
                    <div className="text-[9px] text-[#8A8A92]">{interview.date}</div>
                  </div>

                  <Link href="/report">
                    <Button variant="secondary" size="sm" icon={<ExternalLink className="w-3 h-3" />} className="h-7 text-[11px] px-2.5">
                      View Report
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
