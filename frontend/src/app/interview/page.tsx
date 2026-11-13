'use client';

// ============================================================================
// File: frontend/src/app/interview/page.tsx
// Description: Interview Practice tab - real session list from the backend
//              plus entry point to configure a new practice session.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Mic,
  Plus,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { listInterviewSessions, type SessionSummary } from '@/lib/api/interviews';

export default function InterviewTab() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listInterviewSessions()
      .then((s) => {
        if (!cancelled) setSessions(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load sessions.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <TopBar
        title="Interview Practice"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Interview Practice' },
        ]}
        actionButton={
          <Link href="/interview/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              New Session
            </Button>
          </Link>
        }
      />

      <main className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#6C5CE7]" /> Mock Interview Practice
          </h1>
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
            Deterministic question plans with transparent, heuristic answer feedback - every score shows its working.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#DC2626] dark:text-[#F87171] font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>{error} Start the backend to load your sessions.</span>
          </div>
        )}

        {!sessions && !error && (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-[#8A8A92]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions...
          </div>
        )}

        {sessions && sessions.length === 0 && (
          <div className="p-10 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] text-center space-y-3">
            <Mic className="w-8 h-8 text-[#6C5CE7] mx-auto" />
            <p className="text-sm font-bold">No practice sessions yet</p>
            <p className="text-xs text-[#8A8A92] max-w-sm mx-auto">
              Configure your first mock interview - pick a target role, paste your resume for deep-dive
              questions, and answer turn by turn.
            </p>
            <Link href="/interview/new">
              <Button variant="primary" size="default" icon={<Plus className="w-4 h-4" />}>
                Start your first session
              </Button>
            </Link>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Link
                key={s.session_id}
                href={s.status === 'completed' ? `/interview/${s.session_id}/report` : `/interview/${s.session_id}`}
                className="block p-4 rounded-2xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/50 transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate">{s.target_role}</span>
                      {s.company && <span className="text-xs text-[#8A8A92] truncate">@ {s.company}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#8A8A92]">
                      <span className="flex items-center gap-1">
                        {s.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                        ) : (
                          <Clock className="w-3 h-3 text-[#FACC15]" />
                        )}
                        {s.status === 'completed' ? 'Completed' : 'In progress'}
                      </span>
                      <span>{s.answered}/{s.question_count} answered</span>
                      {s.average_score !== null && (
                        <span className="font-bold text-[#6C5CE7]">avg {s.average_score}/100</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8A8A92] group-hover:text-[#6C5CE7] flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
