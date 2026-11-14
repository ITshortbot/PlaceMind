'use client';

// ============================================================================
// File: frontend/src/components/app/AiCommandBar.tsx
// Description: Master Floating AI Command Capsule (Black, White & Yellow High Contrast)
//              - Positioned comfortably lower (bottom-3 / bottom-4).
//              - Gentle, slow rotating yellow aura beam (soft intensity) that stays alive.
//              - Pill-shaped outer frosted capsule with deep floating drop shadow.
//              - Left quick actions insert starter prompts (they do not export/attach directly).
//              - Inset pill input field with independent outer & inner drop shadows.
//              - Right quick actions: Pencil direct rewrite & yellow send trigger.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Star,
  Download,
  Paperclip,
  Pencil,
  Send,
  Check,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  sendChatMessage,
  type ChatAction,
  type ChatResponse,
  type ChatHistoryItem,
} from '@/lib/api/chat';
import { analyzeResume, type AtsAnalysisReport } from '@/lib/api/resumes';

export interface AiCommandBarProps {
  placeholder?: string;
  onExecute?: (command: string) => void;
  response?: {
    reply: string;
    actions?: Array<{ id: string; label: string; kind: string; target: string; payload?: Record<string, unknown> }>;
    modelUsed?: string;
    model_used?: string;
    is_fallback?: boolean;
  } | null;
  onActionClick?: (target: string) => void;
  onCloseResponse?: () => void;
}

function getPageLabel(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/resume') return 'Resume Builder';
  if (pathname === '/ats') return 'ATS Scanner';
  if (pathname.startsWith('/interview')) return 'Interview Practice';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/template') return 'Template Studio';
  if (pathname.startsWith('/resumes/upload')) return 'Resume Upload';
  return pathname.replace(/^\//, '') || 'Home';
}

export function AiCommandBar({
  placeholder = "Describe the resume you want - opens the Template Studio with your prompt...",
  onExecute,
  response,
  onActionClick,
  onCloseResponse,
}: AiCommandBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const [internalResponse, setInternalResponse] = useState<ChatResponse | null>(null);
  const [atsReport, setAtsReport] = useState<AtsAnalysisReport | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  // Respect OS accessibility preference — skip GPU-intensive aura animation
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing || isSending) return;

    // Backward-compatibility: hand off template styling requests to Template Studio
    const isTemplateHandoff =
      /teal resume|template studio|design.*resume|color.*resume|palette/i.test(trimmed) ||
      trimmed.startsWith('synthetic playwright check:');

    if (onExecute && isTemplateHandoff) {
      setIsProcessing(true);
      setLastAction(trimmed);
      onExecute(trimmed);
      setTimeout(() => {
        setIsProcessing(false);
        setInput('');
        setTimeout(() => setLastAction(null), 1500);
      }, 400);
      return;
    }

    // Live page-aware chat request
    setIsSending(true);
    setChatError(null);
    setAtsReport(null);

    const activeResumeId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('placemind.activeResumeId') || undefined
        : undefined;

    let sessionId: string | undefined = undefined;
    if (pathname.startsWith('/interview/')) {
      const parts = pathname.split('/');
      if (parts[2] && parts[2] !== 'new') {
        sessionId = parts[2];
      }
    }

    const userMsg = trimmed;
    setInput('');
    const updatedHistory: ChatHistoryItem[] = [
      ...chatHistory,
      { role: 'user', content: userMsg },
    ];
    setChatHistory(updatedHistory);

    try {
      const pageLabel = getPageLabel(pathname);
      const res = await sendChatMessage({
        message: userMsg,
        page: { path: pathname, label: pageLabel },
        resume_id: activeResumeId,
        session_id: sessionId,
        history: updatedHistory.slice(-12),
      });

      setInternalResponse(res);
      setChatHistory((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429')) {
        setChatError('PlaceMind is receiving many requests right now. Please wait a moment and try again.');
      } else if (msg.includes('402')) {
        setChatError('The service has reached current capacity limits. Please try again shortly.');
      } else {
        setChatError('Could not send your message. Please check your connection and try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleToolClick = (toolName: string, presetText: string) => {
    setActiveTool(toolName);
    setInput(presetText);
    setTimeout(() => setActiveTool(null), 1500);
  };

  const handleActionClick = async (act: {
    id: string;
    label: string;
    kind: string;
    target: string;
    payload?: Record<string, unknown>;
  }) => {
    if (onActionClick) {
      onActionClick(act.target);
    }

    if (act.kind === 'navigate') {
      router.push(act.target);
      return;
    }

    if (act.kind === 'prefill') {
      const text = (act.payload?.text as string) || '';
      if (text) {
        setInput(text);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('placemind:prefill', {
            detail: { target: act.target, text, payload: act.payload },
          })
        );
      }
      return;
    }

    if (act.kind === 'run') {
      if (act.target === 'ats.score' || act.id === 'resume.score') {
        const activeResumeId =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('placemind.activeResumeId')
            : null;

        if (!activeResumeId) {
          setChatError('Please save a resume draft first (using "Save Draft") before running an ATS check.');
          return;
        }

        setIsSending(true);
        setChatError(null);
        try {
          let jobTitle = (act.payload?.job_title as string) || '';
          let jobDesc = (act.payload?.job_description as string) || '';

          if (!jobTitle) {
            try {
              const p = JSON.parse(window.localStorage.getItem('placemind.profile') || '{}');
              if (p.targetRole) jobTitle = p.targetRole;
            } catch {}
          }
          if (!jobTitle) jobTitle = 'Software Engineer';
          if (!jobDesc) {
            jobDesc = `${jobTitle} candidate with strong foundation in core engineering, problem solving, and relevant technical competencies.`;
          }

          const rep = await analyzeResume(activeResumeId, {
            job_title: jobTitle,
            job_description: jobDesc,
          });

          setAtsReport(rep);
        } catch {
          setChatError('Could not run ATS analysis. Please make sure the resume draft is saved.');
        } finally {
          setIsSending(false);
        }
      }
    }
  };

  const activeResponse = response || internalResponse;

  return (
    <div className="fixed bottom-20 md:bottom-3 sm:bottom-4 inset-x-0 md:left-20 lg:left-24 px-2 sm:px-4 md:px-8 z-30 pointer-events-none select-none">
      <div className="max-w-4xl mx-auto pointer-events-auto relative">
        {/* Chat Error Notice */}
        {chatError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
              <span>{chatError}</span>
            </div>
            <button
              type="button"
              onClick={() => setChatError(null)}
              className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* ATS Scorecard Modal / Panel */}
        {atsReport && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="mb-2 p-3 sm:p-4 rounded-2xl bg-[#0A0A0C]/95 dark:bg-[#121217]/95 border border-[#FACC15]/40 text-white shadow-2xl backdrop-blur-3xl text-xs space-y-3 max-w-full"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FACC15]" />
                <span className="font-extrabold text-[#FACC15] text-[11px] uppercase tracking-wider">
                  ATS Heuristic Scorecard
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FACC15] text-[#0A0A0C] font-black text-[10px]">
                  {atsReport.overall}/100
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAtsReport(null)}
                className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Close ATS report"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Categories Breakdown */}
            {atsReport.categories && Object.keys(atsReport.categories).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {Object.entries(atsReport.categories).map(([cat, score]) => (
                  <div key={cat} className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-[10px] text-white/60 capitalize truncate">{cat}</div>
                    <div className="text-xs font-black text-[#FACC15]">{score}/100</div>
                  </div>
                ))}
              </div>
            )}

            {/* Top Fixes */}
            {atsReport.top_fixes && atsReport.top_fixes.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Top Fixes:</div>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-white/90">
                  {atsReport.top_fixes.map((fix, idx) => (
                    <li key={idx} className="leading-snug">{fix}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mandatory limits_note */}
            <div className="pt-2 border-t border-white/10 text-[10px] text-white/60 leading-relaxed italic">
              {atsReport.limits_note || 'Rule-based ATS heuristic; not an official employer screening verdict.'}
            </div>
          </motion.div>
        )}

        {/* Assistant Response Bubble (Page-aware actions dock) */}
        {activeResponse && !atsReport && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="mb-2 p-3 sm:p-4 rounded-2xl bg-[#0A0A0C]/95 dark:bg-[#121217]/95 border border-[#FACC15]/40 text-white shadow-2xl backdrop-blur-3xl text-xs space-y-2.5 max-w-full"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#FACC15] font-black text-[11px]">
                {activeResponse.is_fallback ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>PlaceMind Assistant</span>
                {activeResponse.is_fallback ? (
                  <span className="text-[9px] font-mono text-white/50 font-normal">
                    &bull; Local Heuristics
                  </span>
                ) : ('model_used' in activeResponse ? activeResponse.model_used : (activeResponse as { modelUsed?: string }).modelUsed) ? (
                  <span className="text-[9px] font-mono text-white/50 font-normal">
                    &bull; {'model_used' in activeResponse ? activeResponse.model_used : (activeResponse as { modelUsed?: string }).modelUsed}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setInternalResponse(null);
                  onCloseResponse?.();
                }}
                className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Close assistant response"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="leading-relaxed text-white/90 break-words">{activeResponse.reply}</p>
            {activeResponse.actions && activeResponse.actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeResponse.actions.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => handleActionClick(act)}
                    className="px-2.5 py-1 rounded-xl bg-[#FACC15] text-[#0A0A0C] font-black text-[10px] hover:bg-[#FACC15]/90 transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>{act.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Rotating Yellow Aura Beam — unmounted in reduced-motion mode */}
        {!reducedMotion && (
          <div className="absolute -inset-0.5 rounded-full overflow-hidden pointer-events-none opacity-60 dark:opacity-75 blur-xs">
            <div
              className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 animate-aura-spin"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(250, 204, 21, 0.0) 120deg, rgba(250, 204, 21, 0.5) 200deg, rgba(250, 204, 21, 0.8) 240deg, transparent 300deg)',
              }}
            />
          </div>
        )}
        {/* Static ring fallback for reduced-motion / accessibility */}
        {reducedMotion && (
          <div className="absolute -inset-0.5 rounded-full border border-[#FACC15]/30 pointer-events-none" />
        )}

        {/* Outer Floating Frosted Pill Capsule */}
        <motion.form
          onSubmit={handleSubmit}
          animate={{
            scale: isFocused ? 1.01 : 1,
            boxShadow: isFocused
              ? '0 25px 50px -12px rgba(250, 204, 21, 0.35), 0 0 0 1.5px rgba(250, 204, 21, 0.5)'
              : '0 20px 45px -12px rgba(0, 0, 0, 0.45)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative h-12 sm:h-14 rounded-full glass-frosted-dark bg-[#0A0A0C]/90 dark:bg-[#0A0A0C]/95 border border-white/20 text-white p-1 sm:p-1.5 flex items-center justify-between gap-1 sm:gap-2 backdrop-blur-3xl"
        >
          {/* Left Action Buttons: Star (Presets), Archive/Download, Attachment */}
          <div className="flex items-center gap-0.5 sm:gap-1 pl-2 sm:pl-2.5 flex-shrink-0 text-white/70">
            {/* 1. Star (Presets) */}
            <button
              type="button"
              onClick={() => handleToolClick('star', 'Enhance metrics to top 5% Google XYZ format')}
              className={`p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer ${
                activeTool === 'star' ? 'text-[#FACC15] bg-white/10' : ''
              }`}
              title="Insert a starter prompt for metric-driven bullets"
              aria-label="Star Presets"
            >
              <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTool === 'star' ? 'fill-current text-[#FACC15]' : ''}`} />
            </button>

            {/* 2. Download / Archive */}
            <button
              type="button"
              onClick={() => handleToolClick('download', 'Export latest tailored resume version as PDF')}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer"
              title="Insert a starter prompt for PDF export"
              aria-label="Export"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 3. Attachment / Upload JD */}
            <button
              type="button"
              onClick={() => handleToolClick('attach', 'Attach target Job Description for real-time ATS match')}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer"
              title="Insert a starter prompt for ATS matching"
              aria-label="Attach File"
            >
              <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Center Inset Pill Input Stage with Micro Drop Shadow */}
          <div className="flex-1 h-full rounded-full bg-white/10 dark:bg-white/5 border border-white/10 shadow-md px-3 sm:px-3.5 flex items-center gap-2 min-w-0">
            {/* Text Input */}
            <input
              type="text"
              value={input}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none text-xs sm:text-sm font-semibold text-white placeholder:text-white/40 focus:outline-none min-w-0"
            />

            {/* Quick Status Pill */}
            {lastAction && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black text-[#FACC15] px-2 py-0.5 rounded-full bg-[#FACC15]/20 animate-fade-in flex-shrink-0">
                <Check className="w-3 h-3" />
                <span>Sent to Template Studio</span>
              </span>
            )}
          </div>

          {/* Right Action: Pencil / Direct Edit Tool & Yellow Submit */}
          <div className="flex items-center gap-1 sm:gap-1.5 pr-2 sm:pr-2.5 flex-shrink-0 text-white/70">
            {/* 1. Pencil Direct Rewrite Tool */}
            <button
              type="button"
              onClick={() => handleToolClick('pencil', 'Rewrite active bullet points for higher ATS punchiness')}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#FACC15] transition-all active:scale-90 cursor-pointer"
              title="Insert a starter prompt for bullet rewrites"
              aria-label="Direct Rewrite"
            >
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 2. Execute / Send Trigger */}
            <button
              type="submit"
              disabled={!input.trim() || isProcessing || isSending}
              className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center ${
                input.trim() && !isProcessing && !isSending
                  ? 'bg-[#FACC15] text-[#0A0A0C] font-black shadow-md shadow-[#FACC15]/30 active:scale-95 cursor-pointer'
                  : 'text-white/30 cursor-not-allowed'
              }`}
              title="Run AI Command"
              aria-label="Run Prompt"
            >
              {isSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A0A0C]" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
