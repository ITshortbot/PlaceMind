'use client';

// ============================================================================
// File: frontend/src/app/history/page.tsx
// Description: Tab 7 - History: real resume records from the backend.
//              Chronological cards with quick actions (Open in Editor,
//              Duplicate, Delete). ATS badges only appear when a real
//              analysis score exists for that resume.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Copy, Trash2, ExternalLink, Clock } from 'lucide-react';
import { createResume, deleteResume, getResume, listResumes, ResumeSummary } from '@/lib/api/resumes';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function HistoryPage() {
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setResumes(await listResumes());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load resumes.');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteResume(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  };

  const onDuplicate = async (row: ResumeSummary) => {
    setBusyId(row.id);
    try {
      const detail = await getResume(row.id);
      await createResume({
        file_name: detail.file_name.replace(/(\.[^.]+)?$/, ' (copy)$1'),
        raw_text: detail.raw_text,
        parsed_metadata: detail.parsed_metadata,
        sections: detail.sections.map((s) => ({
          section_type: s.section_type,
          content: s.content,
          meta_info: s.meta_info ?? {},
        })),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duplicate failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell showAiBar={false}>
      <TopBar
        title="File History"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'History' }]}
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your Resume Artifacts & Files
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
            Every entry below is a real saved record. Upload a resume to add one.
          </p>
        </div>

        {error && (
          <Card className="p-4 border-[#EF4444]/40 text-sm text-[#EF4444]">{error}</Card>
        )}

        {resumes === null && !error && (
          <p className="text-sm text-[#8A8A92]">Loading your saved resumes...</p>
        )}

        {resumes !== null && resumes.length === 0 && (
          <Card className="p-8 text-center space-y-3">
            <FileText className="w-8 h-8 mx-auto text-[#8A8A92]" />
            <p className="text-sm font-semibold">No resumes saved yet</p>
            <p className="text-xs text-[#8A8A92]">
              Upload a resume and it will appear here with its real analysis state.
            </p>
            <Link href="/resumes/upload">
              <Button variant="default" size="sm">Upload a resume</Button>
            </Link>
          </Card>
        )}

        <div className="space-y-4">
          {(resumes ?? []).map((row) => (
            <Card
              key={row.id}
              className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-xl border border-black/10 flex-shrink-0 bg-white shadow-xs flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#8A8A92]" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate">{row.file_name}</h3>
                    {row.latest_ats_score !== null && (
                      <Badge variant="success" size="sm" className="font-mono">
                        {row.latest_ats_score}% ATS
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                    {row.section_count} section{row.section_count === 1 ? '' : 's'} parsed
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#8A8A92] pt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Created: {formatDate(row.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link href={`/resumes/${row.id}/edit`}>
                  <Button variant="default" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Open in Editor
                  </Button>
                </Link>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Copy className="w-3.5 h-3.5" />}
                  disabled={busyId === row.id}
                  onClick={() => onDuplicate(row)}
                >
                  Duplicate
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#EF4444] hover:bg-[#EF4444]/10"
                  disabled={busyId === row.id}
                  onClick={() => onDelete(row.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
