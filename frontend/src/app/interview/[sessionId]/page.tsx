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

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#08080A] text-[#0A0A0C] dark:text-[#F8F9FA] flex flex-col font-sans transition-colors duration-300">
      {/* Session Header */}
      <header className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-2.5 text-xs min-w-0">
          <span className="font-extrabold truncate">{session.target_role}</span>
          {session.company && <span className="text-[#8A8A92] truncate hidden sm:inline">@ {session.company}</span>}
          <span className="px-2 py-0.5 rounded-full bg-[#FACC15]/20 text-[#854D0E] dark:text-[#FACC15] font-mono font-black text-[11px] flex-shrink-0">
            {progressLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Main Conversation Stream */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 max-w-3xl mx-auto w-full">
        {/* Collapsed Question Plan (Clearly separate from conversation stream) */}
        {session.turns.some((t) => t.answer_text === null) && (
          <details className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-xs group">
            <summary className="cursor-pointer font-bold text-[#8A8A92] hover:text-[#0A0A0C] dark:hover:text-white select-none list-none flex items-center justify-between">
              <span>Question plan ({session.question_count} planned topics)</span>
              <span className="text-[10px] text-[#8A8A92] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1.5 text-[11px]">
              {session.turns
                .filter((t) => t.category !== 'follow-up')
                .map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                    <span>Topic {i + 1}: {t.category.replace('_', ' ')}</span>
                    <span className="font-mono text-[10px]">
                      {t.answer_text !== null ? '✓ Answered' : (session.current_question?.order === t.order ? '● Current' : 'Planned')}
                    </span>
                  </div>
                ))}
            </div>
          </details>
        )}

        {transcript.map((item) => {
          if (item.sender === 'interviewer') {
            const isFollowUp = item.isFollowUp || item.category === 'follow-up';
            return (
              <div key={item.id} className="flex flex-col items-start space-y-1 max-w-[90%] sm:max-w-[85%]">
                <div
                  className={`p-4 rounded-3xl rounded-bl-xs text-xs sm:text-sm leading-relaxed border shadow-xs transition-all ${
                    isFollowUp
                      ? 'bg-[#FACC15]/10 dark:bg-[#FACC15]/15 border-[#FACC15]/40 text-[#1A1A1E] dark:text-[#F8F9FA]'
                      : item.isAcknowledgment
                      ? 'bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.06] text-[#4A4A52] dark:text-[#A1A1AA] italic'
                      : 'bg-white dark:bg-[#121217] border-black/[0.08] dark:border-white/[0.08] text-[#1A1A1E] dark:text-[#F8F9FA]'
                  }`}
                >
                  {/* Category / Follow-up header badge */}
                  {!item.isAcknowledgment && (
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-[#854D0E] dark:text-[#FACC15]">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      {isFollowUp ? (
                        <span>Follow-up Probe &bull; Same Question</span>
                      ) : (
                        <span>
                          Question {item.order ?? 1} &bull; {(item.category ?? 'practice').replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{item.text}</p>

                  {item.focus && !isFollowUp && (
                    <p className="mt-2 text-[10px] text-[#8A8A92] font-mono">Assesses: {item.focus}</p>
                  )}
                </div>
              </div>
            );
          }

          // Candidate answer bubble
          return (
            <div key={item.id} className="flex flex-col items-end">
              <div className="p-4 rounded-3xl rounded-br-xs max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed bg-[#0A0A0C] text-white dark:bg-[#FACC15] dark:text-[#0A0A0C] font-medium shadow-md">
                <p className="whitespace-pre-wrap">{item.text}</p>
              </div>
            </div>
          );
        })}

        {/* End-of-session comprehensive report card */}
        {completed && (
          <section className="mt-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121217] border-2 border-[#FACC15] shadow-xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#854D0E] dark:text-[#FACC15]">
                  Practice Session Completed
                </span>
                <h2 className="text-xl font-black text-[#0A0A0C] dark:text-white mt-0.5">
                  Interview Performance Summary
                </h2>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                  Practice feedback from transparent heuristics (STAR structure, concrete metrics, and action ownership).
                </p>
              </div>

              {report?.overall_score !== null && report?.overall_score !== undefined && (
                <div className="flex items-center gap-3 bg-[#FACC15]/15 border border-[#FACC15]/40 rounded-2xl p-3 flex-shrink-0">
                  <Award className="w-8 h-8 text-[#854D0E] dark:text-[#FACC15]" />
                  <div>
                    <div className="text-2xl font-black text-[#0A0A0C] dark:text-white">
                      {Math.round(report.overall_score)}/100
                    </div>
                    <div className="text-[10px] font-bold text-[#854D0E] dark:text-[#FACC15]">Overall Score</div>
                  </div>
                </div>
              )}
            </div>

            {loadingReport && (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#8A8A92]">
                <Loader2 className="w-4 h-4 animate-spin text-[#FACC15]" />
                <span>Aggregating heuristic feedback...</span>
              </div>
            )}

            {report && (
              <>
                {/* Dimensions Grid */}
                {report.dimensions && Object.keys(report.dimensions).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-[#4A4A52] dark:text-[#A1A1AA]">
                      Dimension Breakdown
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(report.dimensions).map(([dim, score]) => (
                        <div
                          key={dim}
                          className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between"
                        >
                          <span className="text-xs font-bold capitalize">
                            {dim.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono font-black text-[#854D0E] dark:text-[#FACC15]">
                            {Math.round(score)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-Question Feedback */}
                {report.per_question && report.per_question.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase text-[#4A4A52] dark:text-[#A1A1AA]">
                      Question Analysis
                    </h3>
                    {(() => {
                      let plannedCounter = 0;
                      return report.per_question.map((pq, idx) => {
                        const isFollowUp = pq.category === 'follow-up';
                        if (!isFollowUp) {
                          plannedCounter += 1;
                        }
                        const currentCounter = plannedCounter;

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border space-y-2 text-xs transition-all ${
                              isFollowUp
                                ? 'ml-4 sm:ml-6 bg-[#FACC15]/5 dark:bg-[#FACC15]/10 border-[#FACC15]/30'
                                : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-[#854D0E] dark:text-[#FACC15]">
                                {isFollowUp ? (
                                  <span>Follow-up to Question {currentCounter}</span>
                                ) : (
                                  <span>
                                    Question {currentCounter} &bull; {pq.category.replace('_', ' ')}
                                  </span>
                                )}
                              </span>
                              <span className="font-mono">{pq.score}/100</span>
                            </div>
                            <p className="text-[11px] text-[#4A4A52] dark:text-[#A1A1AA]">{pq.prompt}</p>

                            {pq.strengths && pq.strengths.length > 0 && (
                              <div className="space-y-1 pt-1">
                                {pq.strengths.map((s, sIdx) => (
                                  <div key={sIdx} className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {pq.improvements && pq.improvements.length > 0 && (
                              <div className="space-y-1">
                                {pq.improvements.map((imp, impIdx) => (
                                  <div key={impIdx} className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400 text-[11px]">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>{imp}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations && report.recommendations.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-black uppercase text-[#4A4A52] dark:text-[#A1A1AA]">
                      Practice Recommendations
                    </h3>
                    <ul className="space-y-1 text-xs text-[#4A4A52] dark:text-[#A1A1AA]">
                      {report.recommendations.map((rec, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] mt-1.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Method Note (Mandatory for honesty) */}
                <div className="p-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-[11px] text-[#6B7280] dark:text-[#9CA3AF] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#0A0A0C] dark:text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>Transparent Practice Methodology</span>
                  </div>
                  <p className="leading-relaxed">
                    {report.method_note ||
                      'Practice feedback from transparent heuristics: deterministic scoring based on STAR structure, metrics, action verbs, and filler frequency. Not a recruiter prediction or AI judgment.'}
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link href="/interview/new">
                <Button variant="default" size="default" icon={<RefreshCw className="w-4 h-4" />}>
                  Start Another Session
                </Button>
              </Link>
              <Link href="/interview">
                <Button variant="ghost" size="sm">
                  Back to Interview Hub
                </Button>
              </Link>
            </div>
          </section>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Answer Input Bar */}
      {!completed && (
        <div className="p-3 sm:p-5 border-t border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto space-y-2">
            {sendError && (
              <div className="flex items-center gap-2 text-xs text-[#DC2626] dark:text-[#F87171] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{sendError}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <textarea
                rows={2}
                placeholder="Type your answer (aim for 60-120 words with a concrete metric)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                className="flex-1 p-3 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#FACC15] resize-none"
              />
              <Button
                variant="default"
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
