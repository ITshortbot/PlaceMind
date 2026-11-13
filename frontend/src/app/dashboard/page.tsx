'use client';

// ============================================================================
// File: frontend/src/app/dashboard/page.tsx
// Description: Tab 1 - Dashboard: quick actions plus the user's REAL saved
//              resumes and interview sessions from the backend. No demo
//              metrics: counts, scores and dates below are live records,
//              and sections say so when empty.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, Wand2, Mic, Clock, ExternalLink } from 'lucide-react';
import { listResumes, ResumeSummary } from '@/lib/api/resumes';
import { listInterviewSessions, SessionSummary } from '@/lib/api/interviews';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    listResumes().then(setResumes).catch(() => setResumes([]));
    listInterviewSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const scored = (resumes ?? []).filter((r) => r.latest_ats_score !== null);
  const avgAts =
    scored.length > 0
      ? Math.round((scored.reduce((sum, r) => sum + (r.latest_ats_score ?? 0), 0) / scored.length) * 10) / 10
      : null;

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
        {/* Welcome Header - real workspace state only */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-[#0A0A0C] dark:text-[#F8F9FA] tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-[#4A4A52] dark:text-[#A1A1AA]">
              Your saved resumes and practice sessions, loaded from your workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FACC15] shadow-xs" />
              <span>
                Resumes saved: <strong>{resumes === null ? '...' : resumes.length}</strong>
              </span>
            </div>
            <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm text-xs font-bold flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>
                Practice sessions: <strong>{sessions === null ? '...' : sessions.length}</strong>
              </span>
            </div>
            {avgAts !== null && (
              <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm text-xs font-bold flex items-center gap-2">
                <span>
                  Avg ATS: <strong>{avgAts}%</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3-Card Quick-Action Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
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

        {/* Section: Recent Resumes - real records */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
              Recent Resumes
            </h2>
            <Link href="/history" className="text-[11px] text-[#FACC15] dark:text-[#FACC15] hover:underline font-bold">
              View All &rarr;
            </Link>
          </div>

          {resumes !== null && resumes.length === 0 && (
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#121217] border border-dashed border-black/[0.15] dark:border-white/[0.15] text-xs text-[#5A5A63] dark:text-[#A1A1AA] flex items-center justify-between gap-3">
              <span>No resumes saved yet. Upload one to see it here.</span>
              <Link href="/resumes/upload">
                <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5">
                  Upload Resume
                </Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(resumes ?? []).slice(0, 2).map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-12 rounded-lg border border-black/10 flex-shrink-0 bg-white shadow-xs flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#8A8A92]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-[#1A1A1E] dark:text-white truncate">
                      {res.file_name}
                    </h3>
                    <p className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] truncate mt-0.5">
                      {res.section_count} section{res.section_count === 1 ? '' : 's'} parsed
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[#8A8A92]">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatDate(res.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {res.latest_ats_score !== null && (
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]">
                      {res.latest_ats_score}% ATS
                    </span>
                  )}
                  <Link href={`/resumes/${res.id}/edit`}>
                    <Button variant="default" size="sm" className="h-7 text-[11px] px-2.5">
                      Open in Editor
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Recent Interview Sessions - real records */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
              Recent Interview Sessions
            </h2>
            <Link href="/interview/new" className="text-[11px] text-[#FACC15] dark:text-[#FACC15] hover:underline font-bold">
              New Simulation &rarr;
            </Link>
          </div>

          {sessions !== null && sessions.length === 0 && (
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#121217] border border-dashed border-black/[0.15] dark:border-white/[0.15] text-xs text-[#5A5A63] dark:text-[#A1A1AA] flex items-center justify-between gap-3">
              <span>No practice sessions yet. Start a simulation to see it here.</span>
              <Link href="/interview/new">
                <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5">
                  Start Practicing
                </Button>
              </Link>
            </div>
          )}

          <div className="space-y-2">
            {(sessions ?? []).slice(0, 3).map((interview) => (
              <div
                key={interview.session_id}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FACC15]/20 text-[#0A0A0C] dark:text-[#FACC15] flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[#1A1A1E] dark:text-white">
                        {interview.target_role}
                      </h3>
                      <Badge variant="accent" size="sm">
                        {interview.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5">
                      {interview.company ? `${interview.company} \u2022 ` : ''}
                      {interview.answered}/{interview.question_count} Questions Answered
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {interview.average_score !== null && (
                      <div className="text-xs font-black text-[#16A34A] dark:text-[#22C55E]">
                        {Math.round(interview.average_score * 10) / 10}/100
                      </div>
                    )}
                    <div className="text-[9px] text-[#8A8A92]">{formatDate(interview.created_at)}</div>
                  </div>

                  <Link href={`/interview/${interview.session_id}/report`}>
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
