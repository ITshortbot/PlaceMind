'use client';

// ============================================================================
// File: frontend/src/app/dashboard/page.tsx
// Description: Tab 1 - Dashboard: Conversation-first AI Copilot hub plus the
//              user's REAL saved resumes (folding file history) and practice
//              sessions from the backend. Honest states only - no fake data.
// ============================================================================

import React, { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Wand2,
  Mic,
  Clock,
  ExternalLink,
  Sparkles,
  Send,
  Trash2,
  Copy,
  ArrowRight,
  Plus,
  Cpu,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
  Settings,
  HelpCircle,
} from 'lucide-react';
import {
  listResumes,
  getResume,
  createResume,
  deleteResume,
  ResumeSummary,
} from '@/lib/api/resumes';
import { listInterviewSessions, SessionSummary } from '@/lib/api/interviews';
import { sendChatMessage, ChatAction, ChatHistoryItem } from '@/lib/api/chat';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
  modelUsed?: string;
  isFallback?: boolean;
}

const STARTER_PROMPTS = [
  'Draft a tailored profile for a Frontend Engineer',
  'How do I format metrics using Google XYZ?',
  'Run an ATS scan on my target job description',
  'Start a behavioral mock interview',
];

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [busyResumeId, setBusyResumeId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Chat conversation state
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Welcome to PlaceMind. What would you like to work on? I can guide your resume drafting, run local ATS checks, or prep you for interview practice.',
      actions: [
        { id: 'act-resume', label: 'Create New Resume', kind: 'navigate', target: '/resume', payload: {} },
        { id: 'act-ats', label: 'Score with ATS Rules', kind: 'navigate', target: '/ats', payload: {} },
        { id: 'act-interview', label: 'Start Mock Interview', kind: 'navigate', target: '/interview', payload: {} },
        { id: 'act-upload', label: 'Upload Existing PDF', kind: 'navigate', target: '/resumes/upload', payload: {} },
      ],
      modelUsed: 'Workspace Copilot',
      isFallback: false,
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const refreshData = useCallback(async () => {
    listResumes().then(setResumes).catch(() => setResumes([]));
    listInterviewSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? chatInput).trim();
    if (!text || isSending) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, role: 'user', content: text },
    ];
    setMessages(newMessages);
    setChatInput('');
    setIsSending(true);

    try {
      // Build history for context
      const historyPayload: ChatHistoryItem[] = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage({
        message: text,
        page: { path: '/dashboard', label: 'Dashboard' },
        history: historyPayload,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          actions: res.actions,
          modelUsed: res.model_used,
          isFallback: res.is_fallback,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Could not connect to the assistant service. You can use the direct links below to navigate your workspace.',
          actions: [
            { id: 'fb-res', label: 'Open Resume Builder', kind: 'navigate', target: '/resume', payload: {} },
            { id: 'fb-ats', label: 'Open ATS Scanner', kind: 'navigate', target: '/ats', payload: {} },
          ],
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.kind === 'navigate' && action.target) {
      router.push(action.target);
    } else if (action.kind === 'prefill' && typeof action.payload?.text === 'string') {
      setChatInput(action.payload.text);
    }
  };

  const handleDeleteResume = async (id: string) => {
    setBusyResumeId(id);
    setActionError(null);
    try {
      await deleteResume(id);
      await refreshData();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyResumeId(null);
    }
  };

  const handleDuplicateResume = async (row: ResumeSummary) => {
    setBusyResumeId(row.id);
    setActionError(null);
    try {
      const full = await getResume(row.id);
      await createResume({
        file_name: `Copy of ${full.file_name}`,
        raw_text: full.raw_text,
        parsed_metadata: full.parsed_metadata,
      });
      await refreshData();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Duplicate failed.');
    } finally {
      setBusyResumeId(null);
    }
  };

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

      <main className="px-3 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full space-y-6">
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-xs text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FACC15] shadow-xs" />
              <span>
                Resumes saved: <strong>{resumes === null ? '...' : resumes.length}</strong>
              </span>
            </div>
            <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-xs text-xs font-bold flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>
                Practice sessions: <strong>{sessions === null ? '...' : sessions.length}</strong>
              </span>
            </div>
            {avgAts !== null && (
              <div className="px-3 py-1 rounded-2xl bg-white dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-xs text-xs font-bold flex items-center gap-2">
                <span>
                  Avg ATS: <strong>{avgAts}%</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 1. Conversational Copilot Hub (Conversation First) */}
        <section className="rounded-3xl bg-white/90 dark:bg-[#101015]/90 border border-black/[0.1] dark:border-white/[0.12] shadow-lg shadow-black/5 overflow-hidden flex flex-col backdrop-blur-xl">
          {/* Copilot Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#FACC15] text-[#0A0A0C] flex items-center justify-center font-black shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-[#0A0A0C] dark:text-white">
                  PlaceMind Assistant
                </h2>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                  Page-aware workspace copilot &bull; Zero data egress
                </p>
              </div>
            </div>
            <Badge variant="accent" size="sm" className="hidden sm:inline-flex">
              Connected
            </Badge>
          </div>

          {/* Conversation Stream */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[340px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[#FACC15] text-[#0A0A0C] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#0A0A0C] text-white dark:bg-[#FACC15] dark:text-[#0A0A0C] font-medium'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#1A1A1E] dark:text-[#F3F4F6] border border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-black/[0.08] dark:border-white/[0.08]">
                      {msg.actions.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => handleActionClick(act)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1C1C22] text-[#0A0A0C] dark:text-white border border-black/[0.12] dark:border-white/[0.16] hover:border-[#FACC15] hover:bg-[#FACC15]/10 font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3 text-[#EAB308]" />
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.modelUsed && (
                    <div className="text-[9px] text-[#9CA3AF] dark:text-[#6B7280] mt-1.5 flex items-center gap-1.5 font-mono">
                      <span>{msg.modelUsed}</span>
                      {msg.isFallback && <span>&bull; fallback mode</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex gap-2 items-center text-xs text-[#8A8A92] pl-9">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-ping" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Starter Chips */}
          <div className="px-4 sm:px-6 pb-2 pt-1 flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] hover:bg-[#FACC15]/15 hover:text-[#0A0A0C] dark:hover:text-[#FACC15] border border-black/[0.06] dark:border-white/[0.08] text-[10px] font-medium text-[#4A4A52] dark:text-[#9CA3AF] transition-colors truncate max-w-[280px]"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 border-t border-black/[0.08] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything or request a focused action..."
              disabled={isSending}
              className="flex-1 bg-white dark:bg-[#16161C] border border-black/[0.1] dark:border-white/[0.1] rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-[#0A0A0C] dark:text-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#FACC15]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSending}
              className={`p-2 rounded-2xl font-bold transition-all flex items-center justify-center flex-shrink-0 ${
                chatInput.trim() && !isSending
                  ? 'bg-[#FACC15] text-[#0A0A0C] shadow-sm hover:scale-105 active:scale-95'
                  : 'bg-black/[0.05] dark:bg-white/[0.05] text-[#9CA3AF] cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>

        {/* 2. 3-Card Quick-Action Row (Required for tests and focused workflows) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <Link
            href="/resume"
            className="md:col-span-4 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#101015]/90 border border-black/[0.1] dark:border-white/[0.12] hover:border-[#FACC15] shadow-xs hover:shadow-xl hover:shadow-[#FACC15]/10 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group cursor-pointer"
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
                  Paste a job description and generate an ATS-friendly draft from transparent rules - no black-box AI.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-black text-[#0A0A0C] dark:text-[#FACC15] pt-2 flex items-center gap-1">
              Start 1-Pass Auto-Gen &rarr;
            </span>
          </Link>

          <Link
            href="/interview"
            className="md:col-span-4 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#101015]/90 border border-black/[0.1] dark:border-white/[0.12] hover:border-[#FACC15] shadow-xs hover:shadow-xl hover:shadow-[#FACC15]/10 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group cursor-pointer"
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
                  Run technical and STAR behavioral practice sessions with transparent, heuristic answer feedback.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#854D0E] dark:text-[#FACC15] pt-2 flex items-center gap-1">
              Start Rehearsal &rarr;
            </span>
          </Link>
        </div>

        {/* 3. Section: Recent Resumes (Folded File History) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
                Recent Resumes
              </h2>
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                Manage saved documents, duplicates, and exports directly in your dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/resumes/upload">
                <Button variant="secondary" size="sm" icon={<UploadCloud className="w-3.5 h-3.5" />} className="h-7 text-[11px] px-2.5">
                  Upload PDF
                </Button>
              </Link>
              <Link href="/history" className="text-[11px] text-[#854D0E] dark:text-[#FACC15] hover:underline font-bold">
                View All &rarr;
              </Link>
            </div>
          </div>

          {actionError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              {actionError}
            </div>
          )}

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
            {(resumes ?? []).map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-12 rounded-lg border border-black/10 flex-shrink-0 bg-white shadow-2xs flex items-center justify-center">
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
                  <div className="flex items-center gap-1">
                    {res.latest_ats_score !== null && (
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]">
                        {res.latest_ats_score}% ATS
                      </span>
                    )}
                    <button
                      onClick={() => handleDuplicateResume(res)}
                      disabled={busyResumeId === res.id}
                      className="p-1 rounded-md text-[#8A8A92] hover:text-[#0A0A0C] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      title="Duplicate resume"
                      aria-label="Duplicate resume"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteResume(res.id)}
                      disabled={busyResumeId === res.id}
                      className="p-1 rounded-md text-[#8A8A92] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete resume"
                      aria-label="Delete resume"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

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

        {/* 4. Section: Recent Interview Sessions */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
              Recent Interview Sessions
            </h2>
            <Link href="/interview/new" className="text-[11px] text-[#854D0E] dark:text-[#FACC15] hover:underline font-bold">
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
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-xs flex items-center justify-between gap-3"
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
