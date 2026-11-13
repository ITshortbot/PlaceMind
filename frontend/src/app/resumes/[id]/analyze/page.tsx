'use client';

// ============================================================================
// File: frontend/src/app/resumes/[id]/analyze/page.tsx
// Description: ATS Gap Analysis against a pasted job description. Scores come
//              from the deterministic readiness engine on the backend and are
//              persisted; nothing on this page is a hardcoded demo number.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, CheckCircle2, XCircle, RefreshCw, FileText } from 'lucide-react';
import { analyzeResume, getResume, AtsAnalysisReport, ResumeDetail } from '@/lib/api/resumes';

const CATEGORY_LABELS: Record<string, string> = {
  structure: 'Structure & Sections',
  formatting: 'Formatting & Dates',
  keywords: 'JD Keyword Coverage',
  semantic: 'Semantic Alignment',
};

export default function ResumeAnalyzePage() {
  const params = useParams();
  const id = params.id as string;

  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [report, setReport] = useState<AtsAnalysisReport | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    getResume(id)
      .then(setResume)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Could not load this resume.'));
  }, [id]);

  const runAnalysis = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const result = await analyzeResume(id, { job_title: jobTitle || 'Untitled role', job_description: jobDescription });
      setReport(result);
      setResume((prev) => (prev ? { ...prev, latest_ats_score: result.overall } : prev));
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Analysis failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'History', href: '/history' },
          { label: 'ATS Gap Analysis' },
        ]}
        actionButton={
          <Link href={`/resumes/${id}/edit`}>
            <Button variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Open in Editor
            </Button>
          </Link>
        }
      />

      <main className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        {loadError && (
          <div className="p-4 rounded-2xl border border-[#EF4444]/40 text-sm text-[#EF4444]">{loadError}</div>
        )}

        {/* Two-Column Input & Context Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <span className="text-[10px] font-bold uppercase text-[#6C5CE7]">Active Resume</span>
              {resume && resume.latest_ats_score !== null && (
                <span className="text-[10px] font-mono text-[#16A34A] font-bold">
                  Last score: {resume.latest_ats_score}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#8A8A92]" />
              <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
                {resume ? resume.file_name : 'Loading...'}
              </h3>
            </div>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed line-clamp-4 whitespace-pre-line">
              {resume ? resume.raw_text.slice(0, 400) : ''}
            </p>
          </div>

          <div className="lg:col-span-7 p-5 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-[#6C5CE7]">Target Job Description</span>
              <button
                onClick={runAnalysis}
                disabled={running || jobDescription.trim().length < 20}
                className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${running ? 'animate-spin' : ''}`} />
                {running ? 'Analyzing...' : report ? 'Re-run Scan' : 'Run Scan'}
              </button>
            </div>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job title (e.g. Backend Engineer)"
              className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] text-xs"
            />
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the real job description here (at least 20 characters) to score this resume against it."
              className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] text-xs font-mono leading-relaxed"
            />
            {runError && <p className="text-[11px] text-[#EF4444]">{runError}</p>}
          </div>
        </div>

        {/* Score header: only after a real analysis ran */}
        {report === null ? (
          <div className="p-8 rounded-3xl border border-dashed border-black/[0.15] dark:border-white/[0.15] text-center space-y-2">
            <p className="text-sm font-semibold text-[#1A1A1E] dark:text-white">No analysis run yet</p>
            <p className="text-xs text-[#8A8A92]">
              Paste a job description above and run the scan. The score will come from the deterministic
              ATS readiness engine and will be saved to this resume.
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/90 dark:from-[#141417]/95 via-white/80 dark:via-[#141417]/90 to-[#6C5CE7]/10 border border-[#6C5CE7]/30 shadow-xl space-y-6">
              <div className="pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#6C5CE7]">
                  Overall Readiness
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-black text-[#1A1A1E] dark:text-white tracking-tight">
                    {report.overall}%
                  </span>
                </div>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">{report.limits_note}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(report.categories).map(([key, score]) => (
                  <div
                    key={key}
                    className="p-4 rounded-2xl bg-white/70 dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="truncate">{CATEGORY_LABELS[key] ?? key}</span>
                      <span className="text-[#6C5CE7]">{score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#38BDF8] rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deterministic rule findings */}
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
                  Rule Findings & Fixes
                </h3>
                <span className="text-xs text-[#8A8A92]">{report.items.length} deterministic checks</span>
              </div>

              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {report.items.map((item) => (
                  <div key={item.rule_id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {item.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                        )}
                        <span className="font-bold text-[#1A1A1E] dark:text-white">{item.rule_id}</span>
                        <Badge variant={item.passed ? 'success' : 'warning'} size="sm">
                          {item.passed ? 'Passed' : 'Needs work'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">{item.evidence}</p>
                      {!item.passed && (
                        <p className="text-[11px] text-[#854D0E] dark:text-[#FACC15]">Fix: {item.fix}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[#8A8A92] px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.04] flex-shrink-0 self-start sm:self-center">
                      {item.points}/100
                    </span>
                  </div>
                ))}
              </div>

              {report.top_fixes.length > 0 && (
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <h4 className="text-xs font-bold text-[#1A1A1E] dark:text-white mb-2">Top fixes by impact</h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                    {report.top_fixes.map((fix, i) => (
                      <li key={i}>{fix}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
