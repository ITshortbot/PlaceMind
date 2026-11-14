'use client';

// ============================================================================
// File: frontend/src/app/template/page.tsx
// Description: Prompt-to-Template Screen featuring:
//              - Interactive prompt input & example chips
//              - Local OSS backend generation (POST /api/v1/templates/generate)
//              - Fallback preset indicator badge
//              - Demo mode toggle (instant mock without backend)
//              - Real-time ColorPicker paired with print-ready ResumePreview
//              - LocalStorage persistence of the last 5 generated resumes
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, AI_PROMPT_HANDOFF_KEY } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { ColorPicker } from '@/components/color/ColorPicker';
import { ResumePreview } from '@/components/templates/ResumePreview';
import { AtsReadinessPanel, type ScoreDocResponse } from '@/components/ats/AtsReadinessPanel';
import { buildPalette, type Mood, type Palette } from '@/lib/color/engine';
import { TEMPLATE_FAMILIES } from '@/lib/templates/registry';
import { generateTemplate } from '@/lib/api/templates';
import {
  GenerateRequest,
  GenerateResponse,
  ResumeContent,
  StyleSpec,
} from '@/types/templates';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  History,
  Info,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

const STORAGE_KEY = 'placemind_template_history_v1';

const EXAMPLE_PROMPTS = [
  'clean dark-teal resume for a fresher data analyst, projects first',
  'modern executive tech lead resume with accent banner',
  'compact 1-page software engineer resume',
  'academic CV for research scientist with education first',
];

// High-quality sample presets for Demo Mode
const DEMO_PRESETS: Record<string, GenerateResponse> = {
  data_analyst: {
    style: {
      layout: 'single_column',
      font: 'Calibri',
      size_pt: 11.0,
      density: 'normal',
      header_style: 'left',
      section_order: ['summary', 'projects', 'skills', 'experience', 'education'],
      mood: 'tech',
      hue: 185,
    },
    content: {
      headline: 'Associate Data Analyst & Analytics Engineer',
      summary:
        'Detail-oriented data analyst skilled in SQL, Python, and dimensional data modeling. Experienced in converting complex datasets into actionable executive dashboards.',
      skills: ['SQL', 'Python', 'Pandas', 'Tableau', 'dbt', 'PowerBI', 'PostgreSQL', 'Git'],
      experience: [
        {
          role: 'Junior Data Analyst',
          company: '[Analytics Agency]',
          bullets: [
            'Built automated ETL pipeline reducing weekly reporting latency by [X] hours.',
            'Designed Tableau dashboards monitored by [X] department stakeholders.',
          ],
        },
      ],
      projects: [
        {
          name: 'Customer Churn Predictive Pipeline',
          description: 'End-to-end ML classification model built with Scikit-learn and FastAPI.',
          bullets: [
            'Trained logistic regression model achieving [X]% ROC-AUC score.',
            'Containerized API serving predictions in under [X]ms.',
          ],
          link: 'github.com/example/churn-ml',
        },
        {
          name: 'E-Commerce Revenue Data Warehouse',
          description: 'PostgreSQL warehouse using star schema dimensional modeling.',
          bullets: ['Modeled [X] fact and dimension tables processing [X]k daily transactions.'],
        },
      ],
      education: [
        {
          degree: 'B.S. in Data Science & Statistics',
          institution: '[State University]',
          year: '2023',
        },
      ],
    },
    warnings: [],
    latency_ms: 18.4,
    source: 'demo',
  },
  default_sample: {
    style: {
      layout: 'sidebar_header',
      font: 'Arial',
      size_pt: 11.0,
      density: 'normal',
      header_style: 'banner',
      section_order: ['summary', 'skills', 'experience', 'projects', 'education'],
      mood: 'tech',
      hue: 195,
    },
    content: {
      headline: 'Full-Stack Software Architect',
      summary:
        'Versatile engineer with 6+ years architecting scalable cloud services, real-time reactive frontends, and AI pipelines.',
      skills: ['TypeScript', 'Next.js', 'Python', 'FastAPI', 'Kubernetes', 'Docker', 'PostgreSQL', 'Redis'],
      experience: [
        {
          role: 'Senior Full-Stack Engineer',
          company: '[High-Growth Startup]',
          bullets: [
            'Engineered microservices handling [X]k concurrent user sessions with [X]% uptime.',
            'Optimized frontend Time-to-Interactive by [X]% using Next.js partial pre-rendering.',
          ],
        },
      ],
      projects: [
        {
          name: 'Distributed Vector Memory Engine',
          description: 'High-throughput RAG search engine with pgvector indexing.',
          bullets: ['Reduced similarity lookup latency from [X]ms to [X]ms.'],
          link: 'github.com/example/vector-mem',
        },
      ],
      education: [
        {
          degree: 'B.S. in Computer Science',
          institution: '[Top University]',
          year: '2020',
        },
      ],
    },
    warnings: [],
    latency_ms: 22.1,
    source: 'demo',
  },
};

export default function TemplatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    'clean dark-teal resume for a fresher data analyst, projects first'
  );
  const [jdText, setJdText] = useState('');
  const [showJdInput, setShowJdInput] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warningsDismissed, setWarningsDismissed] = useState(false);

  // Active generation output
  const [currentResponse, setCurrentResponse] = useState<GenerateResponse>(
    DEMO_PRESETS.default_sample
  );

  // Brand hex for custom color
  const [brandHex, setBrandHex] = useState('');

  // Active palette derived reactively from current style & brand hex
  const palette = useMemo(
    () =>
      buildPalette(
        currentResponse.style.mood,
        currentResponse.style.hue ?? undefined,
        brandHex || undefined
      ),
    [currentResponse.style.mood, currentResponse.style.hue, brandHex]
  );

  // Last 5 history items
  const [history, setHistory] = useState<
    Array<{ id: string; prompt: string; timestamp: number; response: GenerateResponse }>
  >([]);

  // ATS Readiness report state
  const [atsReport, setAtsReport] = useState<ScoreDocResponse | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 5));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const runAtsScore = async (targetResponse?: GenerateResponse) => {
    const activeData = targetResponse || currentResponse;
    setAtsLoading(true);
    setAtsError(null);

    // The readiness engine is deterministic (no LLM), so it runs against the
    // real backend even in demo mode. If it is unreachable, say so honestly.
    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(
        /\/$/,
        ''
      );
      const res = await fetch(`${backendUrl}/api/v1/ats/score-doc`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: activeData.content,
          style: activeData.style,
          jd_text: jdText.trim() ? jdText : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAtsReport(data);
      } else {
        throw new Error('ATS scoring failed');
      }
    } catch {
      setAtsReport(null);
      setAtsError(
        'ATS readiness service is unreachable. Start the backend and retry - no score was computed.'
      );
    } finally {
      setAtsLoading(false);
    }
  };

  const saveToHistory = (newResponse: GenerateResponse, userPrompt: string) => {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      prompt: userPrompt,
      timestamp: Date.now(),
      response: newResponse,
    };
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage quotas
      }
      return updated;
    });
  };

  const canApply = useMemo(() => {
    const c = currentResponse.content;
    if (!c) return false;
    const hasFacts = Boolean(
      (c.name && c.name.trim()) ||
      (c.contact && c.contact.trim()) ||
      (c.headline && c.headline.trim()) ||
      (c.summary && c.summary.trim()) ||
      (c.skills && c.skills.length > 0 && c.skills.some((s) => s.trim())) ||
      (c.experience && c.experience.length > 0) ||
      (c.projects && c.projects.length > 0) ||
      (c.education && c.education.length > 0)
    );
    // EMPTY generated content (facts_used false or all sections empty) must never be applied
    if (!hasFacts) return false;
    if (currentResponse.source === 'fallback' && !currentResponse.facts_used) return false;
    return true;
  }, [currentResponse]);

  const handleUseInBuilder = () => {
    if (!canApply) return;
    try {
      const hasUnsaved =
        window.localStorage.getItem('placemind.builderDirty') === 'true' ||
        window.localStorage.getItem('placemind.unsavedNotice') === 'true';
      if (hasUnsaved) {
        const confirmed = window.confirm(
          'You have unsaved changes in your resume builder draft. Replace them with this generated content?'
        );
        if (!confirmed) return;
      }
      window.localStorage.setItem('placemind.builderHandoff', JSON.stringify(currentResponse.content));
      router.push('/resume');
    } catch {
      router.push('/resume');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    // DEMO MODE (Local mock without backend network call)
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 600)); // Brief realistic delay
      const selectedDemo = prompt.toLowerCase().includes('data')
        ? DEMO_PRESETS.data_analyst
        : DEMO_PRESETS.default_sample;

      setCurrentResponse(selectedDemo);
      setBrandHex('');
      setWarningsDismissed(false);
      saveToHistory(selectedDemo, prompt);
      setLoading(false);
      runAtsScore(selectedDemo);
      return;
    }

    try {
      let activeResumeId: string | null = null;
      try {
        activeResumeId = window.localStorage.getItem('placemind.activeResumeId');
      } catch {}

      const reqPayload: GenerateRequest = {
        prompt: prompt.slice(0, 500),
        jd_text: jdText.trim() ? jdText.slice(0, 4000) : null,
        resume_id: activeResumeId || undefined,
      };

      const data = await generateTemplate(reqPayload);
      setCurrentResponse(data);
      setWarningsDismissed(false);
      saveToHistory(data, prompt);
      runAtsScore(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate template.';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        try {
          window.localStorage.removeItem('placemind.activeResumeId');
        } catch {}
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromHistory = (item: { response: GenerateResponse; prompt: string }) => {
    setCurrentResponse(item.response);
    setPrompt(item.prompt);
  };

  // Consume a prompt handed off from the global AI command bar (one real action).
  const handoffRan = React.useRef(false);
  useEffect(() => {
    if (handoffRan.current) return;
    handoffRan.current = true;
    try {
      const pending = window.localStorage.getItem(AI_PROMPT_HANDOFF_KEY);
      if (pending && pending.trim()) {
        window.localStorage.removeItem(AI_PROMPT_HANDOFF_KEY);
        setPrompt(pending);
        setTimeout(() => {
          const btn = document.getElementById('generate-template-btn') as HTMLButtonElement | null;
          btn?.click();
        }, 50);
      }
    } catch {
      // storage unavailable - nothing to consume
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell showAiBar={false}>
      <TopBar
        title="AI Template Studio"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Templates' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* ─── Top Header & Demo Mode Toggle ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight">
              Prompt-to-Template Generator
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
              Synthesize ATS-compliant single-column layouts, tailored resume content, and WCAG 4.5:1 color palettes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="demo-mode-toggle"
              className="flex items-center gap-2 cursor-pointer bg-slate-900/60 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md"
            >
              <span className="text-xs font-medium text-slate-300">Demo Mode</span>
              <input
                id="demo-mode-toggle"
                type="checkbox"
                checked={isDemoMode}
                onChange={(e) => setIsDemoMode(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
              />
            </label>
            {isDemoMode && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Offline Mode Active
              </span>
            )}
          </div>
        </div>

        {/* ─── Prompt Input Section ─── */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <label htmlFor="prompt-input" className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Describe Your Resume & Style</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {prompt.length} / 500 chars
              </span>
            </div>
            <textarea
              id="prompt-input"
              rows={3}
              maxLength={500}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. clean dark-teal resume for a fresher data analyst, projects first"
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
            />
          </div>

          {/* Example Prompt Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400">Quick Prompts:</span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/5 transition-all text-left"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Job Description Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowJdInput(!showJdInput)}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>{showJdInput ? '− Hide Job Description' : '+ Add Target Job Description (Optional)'}</span>
            </button>

            {showJdInput && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Paste target job requirements for role-tailored bullets:</span>
                  <span className="font-mono">{jdText.length} / 4000 chars</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={4000}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste Job Description here..."
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>
            )}
          </div>

          {/* Generate Button & Progress State */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing custom layout & accessible palette via local model...</span>
                </div>
              )}
            </div>

            <button
              type="button"
              id="generate-template-btn"
              disabled={loading || !prompt.trim()}
              onClick={handleGenerate}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                loading || !prompt.trim()
                  ? 'bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 active:scale-95'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Synthesizing...' : 'Generate Resume'}</span>
            </button>
          </div>
        </div>

        {/* ─── Error Alert Banner ─── */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-rose-800 dark:text-rose-200">Generation Notice</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-xs font-bold underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── Status & Fallback Indicator Badge ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {currentResponse.source === 'demo' ? (
              <span
                id="demo-badge"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30 font-semibold"
                title="Offline sample preset - no model was run for this result"
              >
                <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Sample preset (offline demo)</span>
              </span>
            ) : currentResponse.source === 'fallback' ? (
              <span
                id="fallback-badge"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold"
                title={
                  currentResponse.facts_used
                    ? 'Assembled from your saved facts, no AI wording'
                    : 'No live model is configured, so a keyword-matched preset layout was used - edit before use'
                }
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  {currentResponse.facts_used
                    ? 'assembled from your saved facts, no AI wording'
                    : 'Preset layout - sample content'}
                </span>
              </span>
            ) : (
              <span
                id="model-badge"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Generated by model</span>
              </span>
            )}

            {currentResponse.facts_used && (
              <span
                id="facts-used-badge"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-semibold"
                title="Candidate facts from your saved resume were used"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>based on your saved resume</span>
              </span>
            )}

            <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentResponse.latency_ms}ms
            </span>
          </div>

          {/* Last 5 History Selector */}
          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>Recent Generations:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {history.map((h, idx) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleRestoreFromHistory(h)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all truncate max-w-[120px]"
                    title={h.prompt}
                  >
                    #{idx + 1} {h.response.content.headline.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Dual Workspace: ColorPicker + Live ResumePreview ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive ColorPicker (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 no-print">
            <ColorPicker
              mood={currentResponse.style.mood}
              hue={currentResponse.style.hue ?? undefined}
              brandHex={brandHex}
              onMoodChange={(newMood: Mood) => {
                setCurrentResponse((prev) => ({
                  ...prev,
                  style: { ...prev.style, mood: newMood },
                }));
              }}
              onHueChange={(newHue: number) => {
                setCurrentResponse((prev) => ({
                  ...prev,
                  style: { ...prev.style, hue: newHue },
                }));
              }}
              onBrandHexChange={(newHex: string) => {
                setBrandHex(newHex);
              }}
            />

            {/* Template Specs Quick Overview */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 shadow-xl space-y-3 text-xs">
              <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[11px]">
                Active Architecture Spec
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-slate-800/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Layout</span>
                  <span className="font-semibold capitalize">
                    {currentResponse.style.layout.replace('_', ' ')}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Typography</span>
                  <span className="font-semibold">
                    {currentResponse.style.font} ({currentResponse.style.size_pt}pt)
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Density</span>
                  <span className="font-semibold capitalize">
                    {currentResponse.style.density}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Header Style</span>
                  <span className="font-semibold capitalize">
                    {currentResponse.style.header_style}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Printable ResumePreview + ATS Readiness Report (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center space-y-4">
            {/* ─── Dismissible Warnings Notice ─── */}
            {currentResponse.warnings && currentResponse.warnings.length > 0 && !warningsDismissed && (
              <div
                id="generation-warnings-notice"
                className="w-full max-w-[500px] p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start justify-between gap-3 shadow-sm no-print"
              >
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {currentResponse.warnings.map((w, idx) => (
                      <p key={idx} className="leading-relaxed font-medium">
                        {w}
                      </p>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWarningsDismissed(true)}
                  className="text-[11px] underline hover:opacity-80 shrink-0 ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ─── Header Action Row above Sheet ─── */}
            <div className="w-full max-w-[500px] flex items-center justify-between no-print px-1 py-1">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span>Layout Preview</span>
                {currentResponse.facts_used && (
                  <span className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/25 font-bold">
                    Grounded facts
                  </span>
                )}
              </div>

              <button
                type="button"
                id="use-in-builder-btn"
                disabled={!canApply}
                onClick={handleUseInBuilder}
                title={
                  !canApply
                    ? 'Apply disabled: generated content is empty or has no candidate facts'
                    : 'Transfer this generated layout and content to the Resume Builder'
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  canApply
                    ? 'bg-[#6C5CE7] hover:bg-[#5b4ec7] text-white shadow-md shadow-[#6C5CE7]/25 active:scale-95 cursor-pointer'
                    : 'bg-slate-700/50 text-slate-400 border border-white/5 cursor-not-allowed opacity-60'
                }`}
              >
                <span>Use in builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ResumePreview
              style={currentResponse.style}
              content={currentResponse.content}
              palette={palette}
              className="w-full"
            />

            <div className="w-full max-w-[210mm] no-print space-y-3">
              {atsError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{atsError}</span>
                </div>
              )}
              <AtsReadinessPanel
                report={atsReport}
                loading={atsLoading}
                onRefresh={() => runAtsScore()}
              />
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
