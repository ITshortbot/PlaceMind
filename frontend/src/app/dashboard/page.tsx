'use client';

// ============================================================================
// File: frontend/src/app/dashboard/page.tsx
// Description: Tab 1 - Dashboard: Conversation-first AI Copilot hub.
//              Full-viewport chat layout — the conversation IS the page.
//              History (resumes & sessions) tucked into a collapsed disclosure.
//              Honest states only — no fake data.
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
  ChevronDown,
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
import { updateResume, extractResumeText, type ResumeSection } from '@/lib/api/resumes';
import { parseEdit, applyEdit } from '@/lib/chatEdit';
import { parseResumeText, toSections } from '@/lib/importResumeText';
import { ChatImportCard, type ImportState } from '@/components/app/ChatImportCard';

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
  importState?: ImportState;
}

const CHAT_STORE_KEY = 'placemind.chat.v1';

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
  const [historyOpen, setHistoryOpen] = useState(false);

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

  // Restore the conversation from this browser (history is kept locally).
  const restoredRef = useRef(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHAT_STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(saved) && saved.length > 0) {
          setMessages(
            saved.map((m) =>
              m.importState
                ? {
                    ...m,
                    importState: {
                      ...m.importState,
                      saving: false,
                      steps: m.importState.steps.map((st) =>
                        st.status === 'active' || st.status === 'pending' ? { ...st, status: 'error' as const } : st
                      ),
                      error: m.importState.parsed ? m.importState.error : m.importState.error || 'This was interrupted. Attach the file or paste the text again.',
                    },
                  }
                : m
            )
          );
        }
      }
    } catch {}
    restoredRef.current = true;
  }, []);

  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      window.localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(messages.slice(-60)));
    } catch {}
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80);
  }, [messages]);

  const clearConversation = () => {
    try {
      window.localStorage.removeItem(CHAT_STORE_KEY);
    } catch {}
    setMessages((prev) => prev.slice(0, 1));
  };

  const patchImport = (id: string, fn: (s: ImportState) => ImportState) =>
    setMessages((prev) => prev.map((m) => (m.id === id && m.importState ? { ...m, importState: fn(m.importState) } : m)));

  const setStep = (id: string, index: number, status: 'active' | 'done' | 'error') =>
    patchImport(id, (s) => ({ ...s, steps: s.steps.map((st, i) => (i === index ? { ...st, status } : st)) }));

  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const startImport = async (source: { file?: File; pastedText?: string }) => {
    const id = `imp-${Date.now()}`;
    const isFile = !!source.file;
    const label = source.file ? source.file.name : undefined;
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${id}`,
        role: 'user',
        content: source.file ? `Attached file: ${source.file.name}` : `Pasted resume text (${(source.pastedText || '').length} characters)`,
      },
      {
        id,
        role: 'assistant',
        content: 'I will read it and show what I find. I only use what is written in it. Anything I cannot find stays blank.',
        importState: {
          fileName: label,
          steps: [
            { label: isFile ? 'Reading the file' : 'Reading your text', status: 'active' },
            { label: 'Finding sections', status: 'pending' },
            { label: 'Preparing the review', status: 'pending' },
          ],
        },
      },
    ]);
    let text = source.pastedText || '';
    try {
      if (source.file) {
        const f = source.file;
        const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        const isText = f.type.startsWith('text/') || /\.(txt|md)$/i.test(f.name);
        if (isPdf) {
          text = (await extractResumeText(f)).text;
        } else if (isText) {
          text = await f.text();
        } else {
          throw new Error('This file type is not supported yet. Attach a PDF or a plain text file, or paste the text.');
        }
      }
      setStep(id, 0, 'done');
      setStep(id, 1, 'active');
      await pause(450);
      const parsed = parseResumeText(text);
      const found = parsed.summary || parsed.skills.length || parsed.experience.length || parsed.education.length || parsed.projects.length;
      if (!found) {
        setStep(id, 1, 'error');
        patchImport(id, (s) => ({
          ...s,
          error: 'I could not find resume sections in this text. Put headings such as Summary, Skills, Experience, Education or Projects on their own lines, or use the builder.',
        }));
        return;
      }
      setStep(id, 1, 'done');
      setStep(id, 2, 'active');
      await pause(350);
      setStep(id, 2, 'done');
      patchImport(id, (s) => ({ ...s, parsed }));
      importTextRef.current[id] = text;
    } catch (err) {
      setStep(id, 0, 'error');
      patchImport(id, (s) => ({ ...s, error: err instanceof Error ? err.message : 'Could not read that.' }));
    }
  };

  const importTextRef = useRef<Record<string, string>>({});

  const saveImport = async (id: string) => {
    const msg = messages.find((m) => m.id === id);
    const parsed = msg?.importState?.parsed;
    if (!msg || !parsed) return;
    patchImport(id, (s) => ({ ...s, saving: true, saveError: undefined }));
    try {
      const sections = toSections(parsed);
      if (!sections.length) throw new Error('Nothing to save yet.');
      const raw = importTextRef.current[id] || [parsed.name, parsed.email, parsed.phone, parsed.summary, parsed.skills.join(', ')].filter(Boolean).join('\n');
      const label = (parsed.name || 'imported').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const payload = {
        file_name: `${label}_chat_import.txt`,
        raw_text: raw || label,
        parsed_metadata: { builder: true, imported: 'chat', cleared_sections: [], contact: { email: parsed.email, phone: parsed.phone } },
        sections,
      };
      const existing = msg.importState?.savedId;
      const saved = existing ? await updateResume(existing, payload) : await createResume(payload);
      try {
        window.localStorage.setItem('placemind.activeResumeId', saved.id);
        window.localStorage.removeItem('placemind.unsavedNotice');
        window.localStorage.removeItem('placemind.builderDirty');
      } catch {}
      patchImport(id, (s) => ({ ...s, saving: false, savedId: saved.id }));
      refreshData();
    } catch (err) {
      patchImport(id, (s) => ({ ...s, saving: false, saveError: err instanceof Error ? err.message : 'Save failed.' }));
    }
  };

  const setImportField = (id: string, key: 'name' | 'email' | 'phone', value: string) =>
    patchImport(id, (s) => (s.parsed ? { ...s, parsed: { ...s.parsed, [key]: value } } : s));

  const UNDO_KEY = 'placemind.chat.undo.v1';

  const pushPair = (user: string, bot: string, actions?: ChatAction[]) =>
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: user },
      { id: `bot-${Date.now() + 1}`, role: 'assistant', content: bot, actions },
    ]);

  // Explicit, deterministic edits to the active resume. Returns true when the
  // message was handled here (including honest "cannot do that" replies).
  const tryChatEdit = async (text: string): Promise<boolean> => {
    const p = parseEdit(text);
    if (!p) return false;
    setChatInput('');
    if ('error' in p) { pushPair(text, p.error); return true; }
    const e = p.edit;
    const builderAction: ChatAction[] = [{ id: 'ed-b', label: 'Open in builder', kind: 'navigate', target: '/resume', payload: {} }];
    if (e.kind === 'refine') {
      pushPair(
        text,
        'Refine here means generating the template from your saved facts. It uses only what is in your active resume and adds nothing. To change a fact first, tell me the change, for example "add skill Python".',
        [{ id: 'ed-t', label: 'Open template generator', kind: 'navigate', target: '/template', payload: {} }],
      );
      return true;
    }
    let activeId: string | null = null;
    try { activeId = window.localStorage.getItem('placemind.activeResumeId'); } catch {}
    if (!activeId) {
      pushPair(text, 'There is no active resume yet. Attach or paste your resume here and save it first, then I can change it. Nothing was changed.');
      return true;
    }
    setIsSending(true);
    try {
      if (e.kind === 'undo') {
        let snap: { resumeId: string; sections: ResumeSection[]; raw_text: string; label: string } | null = null;
        try { snap = JSON.parse(window.localStorage.getItem(UNDO_KEY) || 'null'); } catch {}
        if (!snap || snap.resumeId !== activeId) { pushPair(text, 'There is no change to undo for your active resume.'); return true; }
        await updateResume(activeId, { sections: snap.sections, raw_text: snap.raw_text });
        try { window.localStorage.removeItem(UNDO_KEY); } catch {}
        refreshData();
        pushPair(text, `Undone. Reverted: ${snap.label}`, builderAction);
        return true;
      }
      const full = await getResume(activeId);
      const r = applyEdit(full.sections as ResumeSection[], e);
      if (!r.changed || !r.sections) { pushPair(text, r.message); return true; }
      let raw = full.raw_text || '';
      if (r.replace) raw = raw.split(r.replace.from).join(r.replace.to);
      const prevSections = (full.sections as ResumeSection[]).map((x) => ({ section_type: x.section_type, content: x.content, meta_info: x.meta_info }));
      await updateResume(activeId, { sections: r.sections, raw_text: raw });
      try { window.localStorage.setItem(UNDO_KEY, JSON.stringify({ resumeId: activeId, sections: prevSections, raw_text: full.raw_text || '', label: r.message })); } catch {}
      refreshData();
      pushPair(text, `${r.message} Saved to your active resume. Say "undo" to revert this change.`, builderAction);
    } catch (err) {
      pushPair(text, `I could not save that change, so nothing was changed. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setIsSending(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }), 100);
    }
    return true;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? chatInput).trim();
    if (!text || isSending) return;
    const pasted = parseResumeText(text);
    const sectionHits = [pasted.summary, pasted.skills.length, pasted.experience.length, pasted.education.length, pasted.projects.length].filter(Boolean).length;
    if (text.length >= 200 && sectionHits >= 2) {
      setChatInput('');
      startImport({ pastedText: text });
      return;
    }
    if (await tryChatEdit(text)) return;

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
      // Restore user text to composer on failure so draft is not lost
      setChatInput(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Could not connect to the assistant service. Your message has been preserved in the input bar so you can retry.',
          actions: [
            { id: 'fb-res', label: 'Open Resume Builder', kind: 'navigate', target: '/resume', payload: {} },
            { id: 'fb-ats', label: 'Open ATS Scanner', kind: 'navigate', target: '/ats', payload: {} },
            { id: 'fb-retry', label: 'Retry Message', kind: 'prefill', target: '/dashboard', payload: { text } },
          ],
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }), 100);
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

  const resumeCount = resumes === null ? '...' : resumes.length;
  const sessionCount = sessions === null ? '...' : sessions.length;

  return (
    <AppShell
      aiBarProps={{
        value: chatInput,
        onChange: setChatInput,
        onSubmit: handleSendMessage,
        isSending: isSending,
        placeholder: 'Ask anything or request a focused action...',
        hideFloatingResponse: true,
        onAttachFile: (f: File) => startImport({ file: f }),
        onPasteText: (t: string) => {
          const r = parseResumeText(t);
          const hits = [r.summary, r.skills.length, r.experience.length, r.education.length, r.projects.length].filter(Boolean).length;
          if (hits < 2 || isSending) return false;
          startImport({ pastedText: t.trim() });
          return true;
        },
      }}
    >
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

      {/*
        Full-viewport chat layout: height = 100dvh - TopBar (h-16).
        The document itself does not scroll on /dashboard — only the
        conversation stream scrolls internally.
      */}
      <div
        className="flex flex-col min-w-0"
        style={{
          height: 'calc(100dvh - 4rem)',
          /* Fallback for browsers without dvh */
          minHeight: 'calc(100svh - 4rem)',
        }}
      >
        {/* Compact greeting header + inline stat chips + history disclosure button */}
        <div className="px-3 sm:px-6 lg:px-8 pt-2.5 pb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 max-w-4xl mx-auto w-full flex-shrink-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-bold text-[#0A0A0C] dark:text-[#F8F9FA] tracking-tight">
              Welcome back
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#121217] border border-black/[0.08] dark:border-white/[0.1] text-[10px] font-bold text-[#4A4A52] dark:text-[#A1A1AA] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
                {resumeCount} resumes
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#121217] border border-black/[0.08] dark:border-white/[0.1] text-[10px] font-bold text-[#4A4A52] dark:text-[#A1A1AA] flex items-center gap-1">
                <Mic className="w-2.5 h-2.5 text-[#FACC15]" />
                {sessionCount} sessions
              </span>
              {avgAts !== null && (
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#121217] border border-black/[0.08] dark:border-white/[0.1] text-[10px] font-bold text-[#4A4A52] dark:text-[#A1A1AA]">
                  avg ATS {avgAts}%
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-[#16161C] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#FACC15] text-[#4A4A52] dark:text-[#A1A1AA] hover:text-[#0A0A0C] dark:hover:text-white transition-colors cursor-pointer"
            aria-expanded={historyOpen}
            aria-label="Toggle workspace history"
          >
            <span>Workspace Records</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                historyOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Collapsible Workspace History Drawer */}
        {historyOpen && (
          <div className="px-3 sm:px-6 lg:px-8 py-2 max-w-4xl mx-auto w-full flex-shrink-0 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#121217]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-lg space-y-4 max-h-[40vh] overflow-y-auto">
              {/* Recent Resumes */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
                    Recent Resumes
                  </h3>
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
                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#121217] border border-dashed border-black/[0.15] dark:border-white/[0.15] text-xs text-[#5A5A63] dark:text-[#A1A1AA] flex items-center justify-between gap-3">
                    <span>No resumes saved yet. Upload one to see it here.</span>
                    <Link href="/resumes/upload">
                      <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5">
                        Upload Resume
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(resumes ?? []).map((res) => (
                    <div
                      key={res.id}
                      className="p-3 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-xs flex items-center justify-between gap-3"
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

              {/* Recent Interview Sessions */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1E] dark:text-white">
                    Recent Interview Sessions
                  </h3>
                  <Link href="/interview/new" className="text-[11px] text-[#854D0E] dark:text-[#FACC15] hover:underline font-bold">
                    New Simulation &rarr;
                  </Link>
                </div>

                {sessions !== null && sessions.length === 0 && (
                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#121217] border border-dashed border-black/[0.15] dark:border-white/[0.15] text-xs text-[#5A5A63] dark:text-[#A1A1AA] flex items-center justify-between gap-3">
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
                      className="p-3 rounded-2xl bg-white/90 dark:bg-[#121217] border border-black/[0.1] dark:border-white/[0.12] shadow-xs flex items-center justify-between gap-3"
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
                          <Button variant="secondary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />} className="h-7 text-[11px] px-2.5">
                            View Report
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── Conversation Stream (scrollable, flex-1) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto w-full py-3 space-y-4">
            {messages.length > 1 && (
              <div className="flex justify-end">
                <button type="button" onClick={clearConversation} className="text-[11px] underline text-[#6B7280] dark:text-[#9CA3AF]">
                  Clear conversation
                </button>
              </div>
            )}
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

                  {msg.importState && (
                    <ChatImportCard
                      state={msg.importState}
                      onField={(k, v) => setImportField(msg.id, k, v)}
                      onSave={() => saveImport(msg.id)}
                    />
                  )}

                  {/* Action Buttons (these are the in-flow tools) */}
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

            {/* Starter Chips: shown when conversation is at the welcome message */}
            {messages.length === 1 && (
              <div className="pl-9 pt-1 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                  Starter prompts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isSending}
                      className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#16161C] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#FACC15] hover:bg-[#FACC15]/15 text-xs font-medium text-[#1A1A1E] dark:text-[#E4E4E7] transition-all cursor-pointer shadow-2xs text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSending && (
              <div className="flex gap-2 items-center text-xs text-[#8A8A92] pl-9">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-ping" />
                <span>Thinking...</span>
              </div>
            )}

            {/* Dock clearance spacer: ensures the conversation end is completely above the floating capsule */}
            <div className="dock-spacer" aria-hidden="true" />
            <div ref={chatBottomRef} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
