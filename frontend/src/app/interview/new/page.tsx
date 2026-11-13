'use client';

// ============================================================================
// File: frontend/src/app/interview/new/page.tsx
// Description: Interview Practice Setup - creates a real practice session via
//              POST /api/v1/interviews/sessions, then routes to the live session.
// ============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import {
  Mic,
  Sparkles,
  ArrowRight,
  Target,
  Building2,
  ListOrdered,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { createInterviewSession } from '@/lib/api/interviews';

export default function InterviewSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [resumeText, setResumeText] = useState('');
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [jdText, setJdText] = useState('');
  const [showJdInput, setShowJdInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!role.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await createInterviewSession({
        target_role: role.trim(),
        company: company.trim() || undefined,
        interview_type: 'practice',
        question_count: questionCount,
        resume_text: resumeText.trim() || undefined,
        job_description: jdText.trim() || undefined,
      });
      router.push(`/interview/${session.session_id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start the session. Is the backend running?'
      );
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Interview Practice', href: '/interview' },
          { label: 'New Session' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] shadow-sm">
            <Mic className="w-3.5 h-3.5" />
            <span>MOCK INTERVIEW PRACTICE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight">
            Configure Your Mock Interview
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA]">
            Deterministic practice questions with transparent, heuristic answer feedback - no black-box scores.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-xl space-y-6">
          {/* Target Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1A1A1E] dark:text-white flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#6C5CE7]" />
              Target Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Engineer"
              className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold focus:outline-[#6C5CE7]"
            />
          </div>

          {/* Company (optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1A1A1E] dark:text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#6C5CE7]" />
              Company (optional)
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Stripe"
              className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold focus:outline-[#6C5CE7]"
            />
          </div>

          {/* Question count */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#1A1A1E] dark:text-white flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-[#6C5CE7]" />
                Questions
              </label>
              <span className="text-xs font-mono font-bold text-[#6C5CE7]">{questionCount}</span>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-[#6C5CE7]"
            />
          </div>

          {/* Optional resume text for deep-dive questions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowResumeInput((v) => !v)}
              className="text-xs font-semibold text-[#6C5CE7] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              {showResumeInput ? 'Hide resume input' : 'Paste resume text for resume-specific questions (optional)'}
            </button>
            {showResumeInput && (
              <textarea
                rows={5}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste plain-text resume content. Mentioned skills generate deep-dive questions."
                className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono leading-relaxed focus:outline-[#6C5CE7]"
              />
            )}
          </div>

          {/* Optional job description for JD-tailored questions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowJdInput((v) => !v)}
              className="text-xs font-semibold text-[#6C5CE7] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              {showJdInput ? 'Hide job description input' : 'Paste the job description for JD-tailored questions (optional)'}
            </button>
            {showJdInput && (
              <textarea
                rows={5}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job posting. Its requirements generate alignment questions, and requirements missing from your resume generate honest gap questions."
                className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono leading-relaxed focus:outline-[#6C5CE7]"
              />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#DC2626] dark:text-[#F87171] font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            icon={
              submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
            className="w-full"
            onClick={handleStart}
            disabled={!role.trim() || submitting}
          >
            {submitting ? 'Creating session...' : 'Start Practice Session'}
            {!submitting && <ArrowRight className="w-4 h-4 ml-1 inline" />}
          </Button>

          <p className="text-[10px] text-[#8A8A92] text-center leading-relaxed">
            Sessions are stored by the backend so you can resume or review them later from the Interview tab.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
