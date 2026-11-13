'use client';

// ============================================================================
// File: frontend/src/app/interview/[sessionId]/page.tsx
// Description: Live interview session wired to the real backend:
//              GET session state, POST answers, heuristic per-answer feedback,
//              completion routes to the real report.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Send,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  answerInterviewQuestion,
  getInterviewSession,
  type InterviewSessionState,
  type InterviewTurn,
} from '@/lib/api/interviews';

export default function LiveInterviewSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<InterviewSessionState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getInterviewSession(sessionId)
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Could not load this session.');
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.turns, sending]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !session || session.status === 'completed') return;
    setSending(true);
    setSendError(null);
    try {
      const res = await answerInterviewQuestion(sessionId, inputText.trim());
      setInputText('');
      // Refresh authoritative state from the backend
      const fresh = await getInterviewSession(sessionId);
      setSession(fresh);
      if (res.completed) {
        // session.status flips to completed via the refresh above
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not submit the answer.');
    } finally {
      setSending(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
        <p className="text-sm font-semibold">{loadError}</p>
        <Link href="/interview/new" className="text-xs text-[#6C5CE7] hover:underline font-semibold">
          Start a new practice session
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#6C5CE7]" />
        <span className="text-xs text-[#8A8A92]">Loading session...</span>
      </div>
    );
  }

  const answeredTurns = session.turns.filter((t) => t.answer_text !== null);
  const currentTurn: InterviewTurn | undefined = session.turns.find((t) => t.answer_text === null);
  const completed = session.status === 'completed';

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-300">
      <header className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold">{session.target_role}</span>
          {session.company && <span className="text-[#8A8A92]">@ {session.company}</span>}
          <span className="px-2 py-0.5 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] font-mono font-bold">
            {session.answered}/{session.question_count}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {completed && (
            <Link href={`/interview/${sessionId}/report`}>
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Report
              </Button>
            </Link>
          )}
          <Link href="/interview">
            <Button variant="ghost" size="sm" icon={<LogOut className="w-3.5 h-3.5" />}>
              Leave
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 max-w-3xl mx-auto w-full">
        {answeredTurns.map((t) => (
          <div key={t.order} className="space-y-3">
            <div className="flex flex-col items-start">
              <div className="p-4 rounded-2xl rounded-bl-none max-w-[85%] text-xs leading-relaxed bg-white dark:bg-[#141417] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
                <div className="text-[10px] font-bold uppercase text-[#6C5CE7] dark:text-[#8F82FF] mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Question {t.order} &bull; {t.category.replace('_', ' ')}
                </div>
                <p>{t.question_text}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="p-4 rounded-2xl rounded-br-none max-w-[85%] text-xs leading-relaxed bg-[#6C5CE7] text-white shadow-md">
                <p>{t.answer_text}</p>
              </div>
              {t.feedback && (
                <div className="mt-1.5 max-w-[85%] p-3 rounded-xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.06] dark:border-white/[0.08] text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#6C5CE7]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Practice score: {t.score}/100
                  </div>
                  {t.feedback.strengths.map((str, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[#16A34A] dark:text-[#22C55E]">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{str}</span>
                    </div>
                  ))}
                  {t.feedback.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[#854D0E] dark:text-[#FACC15]">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {!completed && currentTurn && (
          <div className="flex flex-col items-start">
            <div className="p-4 rounded-2xl rounded-bl-none max-w-[85%] text-xs leading-relaxed bg-white dark:bg-[#141417] border-2 border-[#6C5CE7]/40 shadow-md">
              <div className="text-[10px] font-bold uppercase text-[#6C5CE7] dark:text-[#8F82FF] mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Question {currentTurn.order} &bull; {currentTurn.category.replace('_', ' ')}
              </div>
              <p>{currentTurn.question_text}</p>
              {currentTurn.focus && (
                <p className="mt-2 text-[10px] text-[#8A8A92]">Assesses: {currentTurn.focus}</p>
              )}
            </div>
          </div>
        )}

        {completed && (
          <div className="text-center p-6 rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/30 space-y-2">
            <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto" />
            <p className="text-sm font-bold">Session complete</p>
            <Link
              href={`/interview/${sessionId}/report`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6C5CE7] hover:underline"
            >
              Open your practice report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {!completed && (
        <div className="p-4 sm:p-6 border-t border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto space-y-2">
            {sendError && (
              <div className="flex items-center gap-2 text-xs text-[#DC2626] dark:text-[#F87171] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> {sendError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <textarea
                rows={2}
                placeholder="Type your answer (aim for 60-120 words with a concrete metric)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 p-3 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs leading-relaxed focus:outline-[#6C5CE7] resize-none"
              />
              <Button
                variant="primary"
                size="default"
                icon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
              >
                {sending ? 'Scoring' : 'Answer'}
              </Button>
            </div>
            <p className="text-[10px] text-[#8A8A92]">
              Feedback is heuristic (STAR structure, metrics, action verbs) - practice guidance, not a recruiter verdict.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
