'use client';

// ============================================================================
// File: frontend/src/app/interview/[sessionId]/page.tsx
// Description: Conversational mock interview practice room:
//              - Natural turn-by-turn dialogue with transparent heuristic practice feedback.
//              - Follow-up probes stay grouped with their parent question.
//              - No per-answer scorecard during the session.
//              - End-of-session report displayed upon completion with method note.
//              - Reload hydration preserves typed input and avoids fabricated replies.
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
  HelpCircle,
  TrendingUp,
  Award,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  answerInterviewQuestion,
  getInterviewSession,
  getInterviewReport,
  type InterviewSessionState,
  type PlannedQuestion,
  type InterviewReport,
  type AnswerResponse,
} from '@/lib/api/interviews';

interface TranscriptItem {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  category?: string;
  order?: number;
  focus?: string | null;
  isFollowUp?: boolean;
  isAcknowledgment?: boolean;
}

function buildTranscriptFromSession(s: InterviewSessionState): TranscriptItem[] {
  const items: TranscriptItem[] = [];
  // Include question and answer bubbles only for turns that were actually asked & answered
  s.turns.forEach((t) => {
    if (t.answer_text !== null) {
      const isFollowUp = t.category === 'follow-up';
      items.push({
        id: `turn-q-${t.order}-${t.category}`,
        sender: 'interviewer',
        text: t.question_text,
        category: t.category,
        order: t.order,
        focus: t.focus,
        isFollowUp,
      });
      items.push({
        id: `turn-a-${t.order}-${t.category}`,
        sender: 'candidate',
        text: t.answer_text,
      });
    }
  });

  // Append the current unanswered question exactly once if the session is not completed
  if (s.status !== 'completed' && s.current_question) {
    const cq = s.current_question;
    const isFollowUp = cq.category === 'follow-up';
    const last = items[items.length - 1];
    if (!last || last.text !== cq.prompt) {
      items.push({
        id: `current-q-${cq.order}-${cq.category}`,
        sender: 'interviewer',
        text: cq.prompt,
        category: cq.category,
        order: cq.order,
        focus: cq.focus,
        isFollowUp,
      });
    }
  }

  return items;
}

// Quick, transparent read of the draft answer. Computed in the browser from the
// typed text only. It is guidance while typing, not the score.
function liveRead(text: string) {
  const t = text.toLowerCase();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    words,
    situation: /\b(when|while|during|at my|in my|our|we had|the team|project|internship|college|class|fest|hackathon)\b/.test(t),
    action: /\b(i (built|led|wrote|designed|made|created|developed|implemented|managed|organi[sz]ed|fixed|helped|coordinated|tested|deployed)|my part|i was responsible)\b/.test(t),
    result: /\b(result|resulted|led to|so that|outcome|improved|reduced|increased|saved|launched|used by|shipped|delivered)\b/.test(t),
    number: /\d/.test(text),
  };
}

const mmss = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
export default function LiveInterviewSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<InterviewSessionState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [completed, setCompleted] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string>('0/0');
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Initial load / reload hydration
  useEffect(() => {
    let cancelled = false;
    getInterviewSession(sessionId)
      .then(async (s) => {
        if (cancelled) return;
        setSession(s);
        if (s.status === 'completed') {
          setProgressLabel(`${s.question_count}/${s.question_count}`);
        } else {
          setProgressLabel(`${s.answered}/${s.question_count}`);
        }

        // Build transcript from stored turns (only answered turns + current unanswered question)
        const items = buildTranscriptFromSession(s);
        setTranscript(items);

        if (s.status === 'completed') {
          setCompleted(true);
          try {
            setLoadingReport(true);
            const r = await getInterviewReport(sessionId);
            if (!cancelled) setReport(r);
          } catch {
            // ignore report error on initial hydration
          } finally {
            if (!cancelled) setLoadingReport(false);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not load this session.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length, sending, completed]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !session || completed) return;

    setSending(true);
    setSendError(null);

    const originalCurrentQuestion = session.current_question;
    const expectedTurn = originalCurrentQuestion
      ? { order: originalCurrentQuestion.order, category: originalCurrentQuestion.category }
      : undefined;

    // 1. Immediately append user's answer to transcript optimistically
    const userItemId = `ans-${Date.now()}`;
    const userItem: TranscriptItem = {
      id: userItemId,
      sender: 'candidate',
      text,
    };
    setTranscript((prev) => [...prev, userItem]);
    setInputText('');

    try {
      const res: AnswerResponse = await answerInterviewQuestion(sessionId, text, expectedTurn);

      const incoming: TranscriptItem[] = [];

      // 2. Render interviewer acknowledgment bubble
      if (res.acknowledgment) {
        incoming.push({
          id: `ack-${Date.now()}`,
          sender: 'interviewer',
          text: res.acknowledgment,
          isAcknowledgment: true,
        });
      }

      // 3. Render next question (planned or follow-up probe)
      if (res.next_question) {
        setSession((prev) => (prev ? { ...prev, current_question: res.next_question } : null));
        const isFollowUp = res.next_question.category === 'follow-up';
        incoming.push({
          id: `next-${Date.now()}`,
          sender: 'interviewer',
          text: res.next_question.prompt,
          category: res.next_question.category,
          order: res.next_question.order,
          focus: res.next_question.focus,
          isFollowUp,
        });

        // Only update progress when not a follow-up probe
        if (res.progress) {
          setProgressLabel(res.progress);
        }
      }

      setTranscript((prev) => [...prev, ...incoming]);

      // 4. Handle completion
      if (res.completed) {
        setCompleted(true);
        if (res.progress) {
          setProgressLabel(res.progress);
        } else if (session) {
          setProgressLabel(`${session.question_count}/${session.question_count}`);
        }
        setLoadingReport(true);
        try {
          const r = await getInterviewReport(sessionId);
          setReport(r);
        } catch {
          setSendError('Session completed, but could not load the final report.');
        } finally {
          setLoadingReport(false);
        }
      }
    } catch (err) {
      // 4a. Ambiguous failure reconciliation: check if the answer was actually recorded
      try {
        const latestSession = await getInterviewSession(sessionId);
        setSession(latestSession);

        const wasRecorded =
          latestSession.status === 'completed' ||
          latestSession.turns.some((t) => t.answer_text === text) ||
          (originalCurrentQuestion &&
            (!latestSession.current_question ||
              latestSession.current_question.order !== originalCurrentQuestion.order ||
              latestSession.current_question.category !== originalCurrentQuestion.category));

        if (wasRecorded) {
          // Re-hydrate transcript from the actual server session state
          const items = buildTranscriptFromSession(latestSession);
          setTranscript(items);
          setSendError(null);

          if (latestSession.status === 'completed') {
            setCompleted(true);
            setProgressLabel(`${latestSession.question_count}/${latestSession.question_count}`);
            setLoadingReport(true);
            try {
              const r = await getInterviewReport(sessionId);
              setReport(r);
            } catch {
              setSendError('Session completed, but could not load the final report.');
            } finally {
              setLoadingReport(false);
            }
          } else {
            setProgressLabel(`${latestSession.answered}/${latestSession.question_count}`);
          }
        } else {
          // Not recorded: remove optimistic bubble and restore typed text to input for retry
          setTranscript((prev) => prev.filter((item) => item.id !== userItemId));
          setInputText(text);
          const userFriendlyError =
            err instanceof Error && err.message && !err.message.toLowerCase().includes('fetch')
              ? err.message
              : 'Could not submit your answer. You can retry sending.';
          setSendError(userFriendlyError);
        }
      } catch {
        // Re-fetch failed (offline network): restore typed text and remove optimistic bubble
        setTranscript((prev) => prev.filter((item) => item.id !== userItemId));
        setInputText(text);
        const userFriendlyError =
          err instanceof Error && err.message && !err.message.toLowerCase().includes('fetch')
            ? err.message
            : 'Could not submit your answer. You can retry sending.';
        setSendError(userFriendlyError);
      }
    } finally {
      setSending(false);
    }
  };

  // Per-question timer: resets whenever the current question changes. Display only.
  const qKey = session?.current_question ? `${session.current_question.order}-${session.current_question.category}` : '';
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    if (completed || !qKey) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [qKey, completed]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col items-center justify-center gap-4 p-8 text-center">
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
        <span className="text-xs text-[#8A8A92]">Loading practice session...</span>
      </div>
    );
  }


  const answeredCount = parseInt(progressLabel.split('/')[0], 10) || 0;
  const total = session.question_count;
  const interviewerQs = transcript.filter((i) => i.sender === 'interviewer' && !i.isAcknowledgment);
  const stageItem = !completed ? interviewerQs[interviewerQs.length - 1] : undefined;
  const stageIdx = stageItem ? transcript.indexOf(stageItem) : -1;
  const ackItem = stageIdx > 0 && transcript[stageIdx - 1].isAcknowledgment ? transcript[stageIdx - 1] : undefined;
  const parentItem = stageItem?.isFollowUp
    ? [...transcript.slice(0, stageIdx)].reverse().find((i) => i.sender === 'interviewer' && !i.isAcknowledgment && !i.isFollowUp)
    : undefined;
  const history = transcript.filter((i) => i !== stageItem && i !== ackItem);
  const lr = liveRead(inputText);
  const chip = (label: string, on: boolean) => (
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all duration-300 ${
        on
          ? 'bg-[#FACC15] border-[#B8960A] text-[#0A0A0C] scale-100'
          : 'bg-transparent border-dashed border-black/25 dark:border-white/25 text-[#8A8A92] scale-95'
      }`}
    >
      {label}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#08080A] text-[#0A0A0C] dark:text-[#F8F9FA] flex flex-col font-sans transition-colors duration-300">
      <style>{`
@keyframes pmStageIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pmAckIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.pm-stage-in { animation: pmStageIn .45s cubic-bezier(.2,.8,.2,1) both; }
.pm-ack-in { animation: pmAckIn .35s ease-out both; }
@media (prefers-reduced-motion: reduce) { .pm-stage-in, .pm-ack-in { animation: none; } }
`}</style>

      {/* Header: role, step path, timer */}
      <header className="border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between gap-3 z-20 sticky top-0">
        <div className="flex items-center gap-2.5 text-xs min-w-0">
          <span className="font-extrabold truncate">{session.target_role}</span>
          {session.company && <span className="text-[#8A8A92] truncate hidden sm:inline">@ {session.company}</span>}
        </div>

        <div className="flex items-center gap-1.5" aria-label={`Progress ${answeredCount} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => {
            const done = i < answeredCount || completed;
            const current = !completed && i === answeredCount;
            return (
              <React.Fragment key={i}>
                {i > 0 && <span className={`w-4 sm:w-8 h-0.5 rounded-full transition-colors duration-500 ${done ? 'bg-[#FACC15]' : 'bg-black/15 dark:bg-white/15'}`} />}
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all duration-500 ${
                    done
                      ? 'bg-[#FACC15] border-[#B8960A] text-[#0A0A0C]'
                      : current
                      ? 'bg-white dark:bg-[#121217] border-[#FACC15] text-[#0A0A0C] dark:text-white shadow-[0_0_0_4px_rgba(250,204,21,0.25)]'
                      : 'border-dashed border-black/25 dark:border-white/25 text-[#8A8A92]'
                  }`}
                >
                  {i + 1}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!completed && (
            <span className="px-3 py-1.5 rounded-full bg-[#0A0A0C] text-white dark:bg-white dark:text-[#0A0A0C] font-mono font-black text-[11px]" title="Time on this question. For practice only.">
              {mmss(elapsed)}
            </span>
          )}
          {completed && (
            <Link href={`/interview/${sessionId}/report`}>
              <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Full Report
              </Button>
            </Link>
          )}
          <Link href="/interview">
            <Button variant="ghost" size="sm" icon={<LogOut className="w-3.5 h-3.5" />}>
              Exit
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Stage: one question at a time */}
        {!completed && stageItem && (
          <section key={stageItem.id} className="pm-stage-in space-y-4">
            {ackItem && (
              <p key={ackItem.id} className="pm-ack-in text-xs sm:text-sm italic text-[#5A5A63] dark:text-[#A1A1AA] pl-1">
                {ackItem.text}
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#854D0E] dark:text-[#FACC15] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {stageItem.isFollowUp
                    ? 'Follow-up on the same question'
                    : `Question ${Math.min(answeredCount + 1, total)} of ${total}  .  ${(stageItem.category ?? 'practice').replace('_', ' ')}`}
                </div>

                {parentItem && (
                  <p className="text-xs text-[#8A8A92] border-l-2 border-black/15 dark:border-white/15 pl-3">{parentItem.text}</p>
                )}

                <h1 className={`font-extrabold tracking-tight leading-snug whitespace-pre-wrap ${stageItem.isFollowUp ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
                  {stageItem.text}
                </h1>
                {stageItem.focus && !stageItem.isFollowUp && (
                  <p className="text-[11px] text-[#8A8A92] font-mono">Assesses: {stageItem.focus}</p>
                )}
              </div>

              {/* Live read of the draft answer */}
              <aside className="lg:col-span-4 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] space-y-3 self-start">
                <div className="text-xs font-bold">Live read of your answer</div>
                <div className="flex flex-wrap gap-2">
                  {chip('Situation', lr.situation)}
                  {chip('Action', lr.action)}
                  {chip('Result', lr.result)}
                  {chip('Number', lr.number)}
                </div>
                <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#FACC15] transition-all duration-300" style={{ width: `${Math.min(100, (lr.words / 90) * 100)}%` }} />
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                  {lr.words} words. Aim for 60 to 120. Chips are matched from your own text as you type. A quick read, not the score.
                </p>
              </aside>
            </div>

            {/* Answer box */}
            <div className="space-y-2">
              {sendError && (
                <div className="flex items-center gap-2 text-xs text-[#DC2626] dark:text-[#F87171] font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}
              <textarea
                rows={6}
                placeholder="Type your answer. Say what happened, what you did yourself, and one real outcome."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                className="w-full p-4 rounded-2xl bg-white dark:bg-black/30 border-2 border-black/[0.12] dark:border-white/[0.12] text-sm leading-relaxed focus:outline-none focus:border-[#FACC15] resize-none shadow-xs"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] text-[#8A8A92]">Practice feedback is heuristic (STAR structure, metrics, action verbs). It is not a recruiter verdict.</p>
                <Button
                  variant="default"
                  size="lg"
                  icon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                >
                  {sending ? 'Sending' : 'Answer'}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Earlier in this interview */}
        {history.length > 0 && (
          <details className="group rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
            <summary className="cursor-pointer select-none list-none px-4 py-3 text-xs font-bold text-[#6B7280] dark:text-[#9CA3AF] flex items-center justify-between">
              <span>Earlier in this interview ({history.filter((h) => h.sender === 'candidate').length} answers)</span>
              <span className="text-[10px] group-open:rotate-180 transition-transform">v</span>
            </summary>
            <div className="px-4 pb-4 space-y-2">
              {history.map((item) =>
                item.sender === 'interviewer' ? (
                  <p
                    key={item.id}
                    className={`text-xs leading-relaxed ${item.isAcknowledgment ? 'italic text-[#8A8A92]' : 'font-semibold text-[#1A1A1E] dark:text-[#F8F9FA]'}`}
                  >
                    {item.isFollowUp ? 'Follow-up: ' : ''}
                    {item.text}
                  </p>
                ) : (
                  <p key={item.id} className="text-xs leading-relaxed text-[#4A4A52] dark:text-[#A1A1AA] pl-3 border-l-2 border-[#FACC15] whitespace-pre-wrap">
                    {item.text}
                  </p>
                )
              )}
            </div>
          </details>
        )}

        {/* Debrief */}
        {completed && (
          <section className="pm-stage-in space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#854D0E] dark:text-[#FACC15]">Practice session completed</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Debrief</h2>
            </div>

            {loadingReport && (
              <div className="flex items-center gap-2 py-8 text-xs text-[#8A8A92]">
                <Loader2 className="w-4 h-4 animate-spin text-[#FACC15]" />
                <span>Putting your debrief together...</span>
              </div>
            )}
            {sendError && <p className="text-xs text-[#DC2626] font-semibold">{sendError}</p>}

            {report && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {report.overall_score !== null && report.overall_score !== undefined && (
                    <div className="md:col-span-3 p-5 rounded-2xl bg-[#FACC15] border-2 border-[#B8960A] text-[#0A0A0C]">
                      <div className="text-4xl font-black leading-none">{Math.round(report.overall_score)}<span className="text-lg">/100</span></div>
                      <div className="text-[11px] font-bold mt-2">Overall practice score</div>
                      <div className="text-[10px] mt-1 opacity-80">Heuristic, not a recruiter verdict.</div>
                    </div>
                  )}
                  {report.dimensions && Object.keys(report.dimensions).length > 0 && (
                    <div className="md:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.08] dark:border-white/[0.08] space-y-3">
                      <div className="text-xs font-black uppercase text-[#4A4A52] dark:text-[#A1A1AA]">Dimensions</div>
                      {Object.entries(report.dimensions).map(([dim, score]) => (
                        <div key={dim} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold capitalize">
                            <span>{dim.replace('_', ' ')}</span>
                            <span className="font-mono">{Math.round(score)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                            <div className="h-full bg-[#FACC15] transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {report.recommendations && report.recommendations.length > 0 && (
                    <div className="md:col-span-4 p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] space-y-2">
                      <div className="text-xs font-black uppercase text-[#4A4A52] dark:text-[#A1A1AA]">Practice next</div>
                      <ul className="space-y-1.5 text-xs text-[#4A4A52] dark:text-[#A1A1AA]">
                        {report.recommendations.filter((rec) => !/^re-record/i.test(rec)).map((rec, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] mt-1.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {report.per_question && report.per_question.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-black uppercase text-[#4A4A52] dark:text-[#A1A1AA]">Answer by answer (tap to expand)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                      {report.per_question.map((pq, idx) => {
                        const isFollowUp = pq.category === 'follow-up';
                        return (
                          <details key={idx} className={`group rounded-2xl border ${isFollowUp ? 'bg-[#FACC15]/5 border-[#FACC15]/40' : 'bg-white dark:bg-[#121217] border-black/[0.08] dark:border-white/[0.08]'}`}>
                            <summary className="cursor-pointer select-none list-none p-4 flex items-center justify-between gap-3">
                              <span className="text-xs font-bold text-[#854D0E] dark:text-[#FACC15]">
                                {isFollowUp ? 'Follow-up answer' : `Question  .  ${pq.category.replace('_', ' ')}`}
                              </span>
                              <span className="font-mono text-sm font-black">{pq.score}</span>
                            </summary>
                            <div className="px-4 pb-4 space-y-2 text-xs">
                              <p className="text-[#4A4A52] dark:text-[#A1A1AA]">{pq.prompt}</p>
                              {pq.strengths?.map((st, k) => (
                                <div key={`s${k}`} className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                  <span>{st}</span>
                                </div>
                              ))}
                              {pq.improvements?.map((im, k) => (
                                <div key={`i${k}`} className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400 text-[11px]">
                                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                  <span>{im}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-[11px] text-[#6B7280] dark:text-[#9CA3AF] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#0A0A0C] dark:text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>How this was scored</span>
                  </div>
                  <p className="leading-relaxed">
                    {report.method_note ||
                      'Practice feedback from transparent heuristics: deterministic scoring based on STAR structure, metrics, action verbs, and filler frequency. Not a recruiter prediction or AI judgment.'}
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Link href="/interview/new">
                <Button variant="default" size="default" icon={<RefreshCw className="w-4 h-4" />}>
                  Practice again
                </Button>
              </Link>
              <Link href="/interview">
                <Button variant="ghost" size="sm">Back to Interview Hub</Button>
              </Link>
            </div>
          </section>
        )}

        <div ref={bottomRef} />
      </main>
    </div>
  );
}
