'use client';

// ============================================================================
// File: frontend/src/app/dashboard/page.tsx
// Description: Internal SaaS Dashboard - Quick actions, recent resumes,
//              interview sessions, and at-a-glance stats strip.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  UploadCloud,
  Mic,
  TrendingUp,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Award,
  Zap,
} from 'lucide-react';

const RECENT_RESUMES = [
  {
    id: 'stripe-staff',
    name: 'Rohan_Patel_Staff_Architect_2026.pdf',
    date: 'Aug 24, 2026',
    atsScore: 94.8,
    targetRole: 'Staff Software Architect · Stripe',
    file: '/assets/Resume/rem1.webp',
  },
  {
    id: 'ai-lead',
    name: 'Rohan_AI_Systems_Specialist.pdf',
    date: 'Aug 21, 2026',
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
    date: 'Aug 25, 2026',
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
          <Link href="/resumes/upload">
            <Button variant="primary" size="sm" icon={<UploadCloud className="w-3.5 h-3.5" />}>
              Upload Resume
            </Button>
          </Link>
        }
      />

      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Header & Summary Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight">
              Welcome back, Rohan
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
              You have 2 analyzed resumes and 1 completed technical phone screen session.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-[#141417]/80 border border-black/[0.08] dark:border-white/[0.08] shadow-xs text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>Avg ATS Score: <strong>96.5%</strong></span>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-[#141417]/80 border border-black/[0.08] dark:border-white/[0.08] shadow-xs text-xs font-semibold flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span>Streak: <strong>4 Days</strong></span>
            </div>
          </div>
        </div>

        {/* 3-Card Quick-Action Row (Uneven Sizing per Design Spec) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Upload a Resume (Primary, Larger Card - 6 cols) */}
          <Link
            href="/resumes/upload"
            className="md:col-span-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#6C5CE7]/15 via-white/80 dark:via-[#141417]/90 to-white/90 dark:to-[#141417] border border-[#6C5CE7]/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1E] dark:text-white group-hover:text-[#6C5CE7] dark:group-hover:text-[#8F82FF] transition-colors">
                  Upload & Parse Resume
                </h3>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  Extract structured JSON sections with zero disk egress and audit formatting against Workday parsers.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-[#6C5CE7] dark:text-[#8F82FF]">
              <span>Start Upload Wizard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Practice Interview (Secondary Card - 3 cols) */}
          <Link
            href="/interview/new"
            className="md:col-span-3 p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/12 text-[#16A34A] dark:text-[#22C55E] flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
                AI Mock Interview
              </h3>
              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
                Practice realistic phone screens and system design probes with live speech feedback.
              </p>
            </div>
            <span className="text-xs font-bold text-[#16A34A] dark:text-[#22C55E] pt-4 flex items-center gap-1">
              New Session &rarr;
            </span>
          </Link>

          {/* Card 3: ATS Score History (Compact Card - 3 cols) */}
          <Link
            href="/history"
            className="md:col-span-3 p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0284C7]/12 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
                ATS Score History
              </h3>
              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
                Review past gap reports, skill match breakdowns, and downloaded PDF drafts.
              </p>
            </div>
            <span className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] pt-4 flex items-center gap-1">
              View Archive &rarr;
            </span>
          </Link>
        </div>

        {/* Section: Recent Resumes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1A1A1E] dark:text-white">
              Recent Resumes
            </h2>
            <Link href="/resumes/upload" className="text-xs text-[#6C5CE7] hover:underline font-semibold">
              + Upload New
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RECENT_RESUMES.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden border border-black/10 flex-shrink-0 bg-white shadow-xs">
                    <Image src={res.file} alt={res.name} fill className="object-cover object-top" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-[#1A1A1E] dark:text-white truncate">
                      {res.name}
                    </h3>
                    <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] truncate mt-0.5">
                      {res.targetRole}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#8A8A92]">
                      <Clock className="w-3 h-3" />
                      <span>{res.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]">
                    {res.atsScore}% ATS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/resumes/${res.id}/analyze`}
                      className="px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#6C5CE7]/15 text-[11px] font-semibold text-[#6C5CE7] transition-colors"
                    >
                      Analyze
                    </Link>
                    <Link
                      href={`/resumes/${res.id}/edit`}
                      className="px-2.5 py-1 rounded-lg bg-[#6C5CE7] hover:bg-[#7D6FF0] text-[11px] font-bold text-white transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Recent Interview Sessions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1A1A1E] dark:text-white">
              Recent Interview Sessions
            </h2>
            <Link href="/interview/new" className="text-xs text-[#6C5CE7] hover:underline font-semibold">
              + Practice Role
            </Link>
          </div>

          <div className="space-y-3">
            {RECENT_INTERVIEWS.map((interview) => (
              <div
                key={interview.sessionId}
                className="p-5 rounded-2xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7]/12 text-[#6C5CE7] flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
                        {interview.role}
                      </h3>
                      <Badge variant="accent" size="sm">
                        {interview.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5">
                      {interview.company} &bull; {interview.questionsCount} Questions Answered
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-[#16A34A] dark:text-[#22C55E]">
                      {interview.score}
                    </div>
                    <div className="text-[10px] text-[#8A8A92]">{interview.date}</div>
                  </div>

                  <Link href={`/interview/${interview.sessionId}/report`}>
                    <Button variant="secondary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
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
