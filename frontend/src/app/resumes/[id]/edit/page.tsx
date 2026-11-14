'use client';

// ============================================================================
// File: frontend/src/app/resumes/[id]/edit/page.tsx
// Description: Real resume editor: loads the stored record, edits file name,
//              raw text and sections, saves through the backend API. The ATS
//              chip only shows the last persisted analysis score.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Check, FileText, Plus, Save, Trash2 } from 'lucide-react';
import { getResume, updateResume, ResumeDetail, ResumeSection } from '@/lib/api/resumes';

export default function ResumeEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getResume(id)
      .then((detail) => {
        setResume(detail);
        setFileName(detail.file_name);
        setRawText(detail.raw_text);
        setSections(detail.sections.map((s) => ({ ...s })));
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Could not load this resume.'));
  }, [id]);

  const setSection = (idx: number, patch: Partial<ResumeSection>) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const onSave = async () => {
    setSaveState('saving');
    setSaveError(null);
    try {
      const saved = await updateResume(id, {
        file_name: fileName,
        raw_text: rawText,
        sections: sections.map((s) => ({
          section_type: s.section_type,
          content: s.content,
          meta_info: s.meta_info ?? {},
        })),
      });
      setResume(saved);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed.');
      setSaveState('error');
    }
  };

  return (
    <AppShell>
      <div className="h-[100dvh] flex flex-col overflow-hidden">
        <TopBar
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'History', href: '/history' },
            { label: 'Resume Editor' },
          ]}
          actionButton={
            <div className="flex items-center gap-2">
              {resume && resume.latest_ats_score !== null && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#16A34A]/15 text-[#16A34A] dark:text-[#22C55E]">
                  Last analysis: {resume.latest_ats_score}%
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={saveState === 'saved' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                onClick={onSave}
                disabled={saveState === 'saving' || !resume}
              >
                {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save Changes'}
              </Button>
            </div>
          }
        />

        <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {loadError && (
            <div className="p-6 text-sm text-[#EF4444]">{loadError}</div>
          )}

          {!resume && !loadError && (
            <div className="p-6 text-sm text-[#8A8A92]">Loading resume...</div>
          )}

          {resume && (
            <>
              {/* Left Pane: rendered preview of the actual stored content (A4 Format) */}
              <div className="flex-1 p-4 lg:p-6 bg-black/[0.03] dark:bg-black/40 border-b lg:border-b-0 lg:border-r border-black/[0.08] dark:border-white/[0.08] overflow-y-auto flex flex-col items-center justify-start pb-28">
                <div className="w-full max-w-[500px] rounded-2xl shadow-2xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#181820] p-6 sm:p-8 space-y-4 aspect-[210/297] min-h-[707px]">
                  <div className="flex items-center gap-2 pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                    <FileText className="w-4 h-4 text-[#8A8A92]" />
                    <span className="text-xs font-bold text-[#1A1A1E] dark:text-white">{fileName}</span>
                  </div>
                  <p className="text-xs whitespace-pre-line text-[#1A1A1E] dark:text-[#E4E4E7] leading-relaxed">
                    {rawText}
                  </p>
                  {sections.map((s, i) => (
                    <div key={i}>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6C5CE7]">
                        {s.section_type}
                      </h4>
                      <p className="text-xs whitespace-pre-line text-[#4A4A52] dark:text-[#A1A1AA] mt-1">
                        {s.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Pane: real editing controls bound to the stored record */}
              <div className="w-full lg:w-[480px] p-5 sm:p-6 space-y-5 overflow-y-auto bg-white/70 dark:bg-[#121217]/90 backdrop-blur-xl pb-28">
              <div>
                <h2 className="text-base font-bold text-[#1A1A1E] dark:text-white">Edit Resume</h2>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5">
                  Changes save to your workspace. Run an analysis afterwards to refresh the score.
                </p>
              </div>

              {saveError && <p className="text-[11px] text-[#EF4444]">{saveError}</p>}

              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#8A8A92]">File name</span>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] text-xs"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#8A8A92]">Raw text</span>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] text-xs font-mono leading-relaxed"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#8A8A92]">Sections</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-3 h-3" />}
                    onClick={() => setSections((prev) => [...prev, { section_type: 'summary', content: '' }])}
                  >
                    Add
                  </Button>
                </div>
                {sections.map((s, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.section_type}
                        onChange={(e) => setSection(i, { section_type: e.target.value })}
                        className="flex-1 p-2 rounded-lg bg-black/[0.02] dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-bold"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#EF4444] hover:bg-[#EF4444]/10"
                        onClick={() => setSections((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <textarea
                      rows={3}
                      value={s.content}
                      onChange={(e) => setSection(i, { content: e.target.value })}
                      className="w-full p-2 rounded-lg bg-black/[0.02] dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.06] text-xs"
                    />
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-[#8A8A92]">
                Want a fresh score?{' '}
                <Link href={`/resumes/${id}/analyze`} className="text-[#6C5CE7] hover:underline font-semibold">
                  Run an ATS analysis
                </Link>{' '}
                against a real job description.
              </p>
            </div>
          </>
        )}
      </main>
      </div>
    </AppShell>
  );
}
