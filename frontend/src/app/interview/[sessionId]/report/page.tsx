'use client';

// ============================================================================
// File: frontend/src/app/interview/[sessionId]/report/page.tsx
// Description: Practice report for a completed session, fetched from the real
//              backend report endpoint. Scores are heuristic and labeled so.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';
import { getInterviewReport, type InterviewReport } from '@/lib/api/interviews';

const DIMENSION_LABELS: Record<string, string> = {
  structure: 'STAR Structure',
  quantification: 'Quantified Results',
  ownership: 'Action Ownership',
  delivery: 'Delivery (Filler-Free)',
};

export default function InterviewReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getInterviewReport(sessionId)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the report.');
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Interview Practice', href: '/interview' },
          { label: 'Session Report' },
        ]}
        actionButton={
          <Link href="/interview/new">
            <Button variant="primary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Practice Again
            </Button>
          </Link>
        }
      />

      <main className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#DC2626] dark:text-[#F87171] font-semibold">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {!report && !error && (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-[#8A8A92]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading report...
          </div>
        )}

        {report && (
          <>
            {report.overall_score === null ? (
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] text-center space-y-2">
                <p className="text-sm font-bold">No answers recorded yet</p>
                <p className="text-xs text-[#8A8A92]">{report.recommendations[0]}</p>
                <Link href={`/interview/${sessionId}`} className="text-xs font-semibold text-[#6C5CE7] hover:underline">
                  Return to the session
                </Link>
              </div>
            ) : (
              <>
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/90 dark:from-[#141417]/95 to-[#6C5CE7]/10 border border-[#6C5CE7]/30 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6C5CE7]">
                        Overall Practice Score
                      </span>
                      <div className="text-4xl sm:text-5xl font-black text-[#1A1A1E] dark:text-white tracking-tight mt-1">
                        {report.overall_score}
                        <span className="text-lg text-[#8A8A92]">/100</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 max-w-sm text-[10px] text-[#8A8A92] leading-relaxed">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#6C5CE7]" />
                      <span>{report.method_note}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(report.dimensions).map(([key, value]) => (
                      <div
                        key={key}
                        className="p-4 rounded-2xl bg-white/70 dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="truncate">{DIMENSION_LABELS[key] ?? key}</span>
                          <span className="text-[#6C5CE7]">{value}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#38BDF8] rounded-full"
                            style={{ width: `${Math.min(100, value)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-[#6C5CE7]" /> Recommendations
                  </h3>
                  <ul className="space-y-1.5">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-[#4A4A52] dark:text-[#A1A1AA] flex items-start gap-2">
                        <span className="text-[#6C5CE7] font-bold">{i + 1}.</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
                  <h3 className="text-sm font-bold">Per-Question Breakdown</h3>
                  <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                    {report.per_question.map((q) => (
                      <div key={q.order} className="py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedQ(expandedQ === q.order ? null : q.order)}
                          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-[#6C5CE7] flex-shrink-0">
                              Q{q.order}
                            </span>
                            <span className="text-xs font-semibold truncate">{q.prompt}</span>
                          </div>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-black">{q.score}</span>
                            {expandedQ === q.order ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#8A8A92]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#8A8A92]" />
                            )}
                          </span>
                        </button>
                        {expandedQ === q.order && (
                          <div className="mt-2 pl-6 space-y-1.5">
                            {q.strengths.map((s, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#16A34A] dark:text-[#22C55E]">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" /> <span>{s}</span>
                              </div>
                            ))}
                            {q.improvements.map((s, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#854D0E] dark:text-[#FACC15]">
                                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
