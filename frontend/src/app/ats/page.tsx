'use client';

// ============================================================================
// File: frontend/src/app/ats/page.tsx
// Description: ATS 1-Pass Analysis page — wired to the FastAPI backend.
//              Accepts a real PDF upload + job description text, calls
//              POST /api/v1/resume/score, and renders the live ATSGapReport.
// ============================================================================

import React, { useRef, useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useATSScoring, ScoringStatus } from '@/lib/hooks/useATSScoring';
import type { RequirementGapItem } from '@/types/ats';
import { AIServiceClient } from '@/lib/api/aiService';
import {
  Wand2,
  Sparkles,
  ShieldCheck,
  Loader2,
  Upload,
  FileCheck2,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Zap,
  RotateCcw,
  Server,
  Cloud,
} from 'lucide-react';

// ─── Pipeline Status Labels ──────────────────────────────────────────────────

const STATUS_LABELS: Record<ScoringStatus, string> = {
  idle: '',
  parsing: 'Extracting resume sections with PyMuPDF…',
  embedding: 'Computing 384-d BAAI/bge embeddings…',
  synthesizing: 'Synthesizing AI gap report with Gemini…',
  done: 'Analysis complete.',
  error: 'Pipeline error.',
};

// ─── Sub-component: Match Status Badge ───────────────────────────────────────

function MatchBadge({ status }: { status: RequirementGapItem['match_status'] }) {
  if (status === 'covered')
    return (
      <Badge variant="success" size="sm" className="flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Covered
      </Badge>
    );
  if (status === 'weak')
    return (
      <Badge variant="warning" size="sm" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" /> Weak
      </Badge>
    );
  return (
    <Badge variant="danger" size="sm" className="flex items-center gap-1">
      <XCircle className="w-3 h-3" /> Missing
    </Badge>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AtsAutoGeneratePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('Staff Software Engineer · Stripe Core Infrastructure');
  const [jdText, setJdText] = useState(
    `We are looking for a Staff Engineer to lead high-throughput event processing (Kafka), optimize PostgreSQL & vector search pipelines, and guarantee 99.99% multi-region uptime.`
  );
  const [aiMode, setAiMode] = useState<'cloud' | 'local'>(AIServiceClient.getPreferredAIMode());

  const { status, report, error, latencyMs, scoreResume, reset } = useATSScoring();

  const isRunning = status === 'parsing' || status === 'embedding' || status === 'synthesizing';
  const isDone = status === 'done';
  const isError = status === 'error';

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setSelectedFile(f);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await scoreResume({
      file: selectedFile,
      jobTitle,
      jobDescription: jdText,
      mode: aiMode,
    });
  };

  // ─── Result View ─────────────────────────────────────────────────────────
  if (isDone && report) {
    const scoreColor =
      report.overall_score >= 80
        ? 'text-[#16A34A] dark:text-[#22C55E]'
        : report.overall_score >= 60
        ? 'text-[#854D0E] dark:text-[#FACC15]'
        : 'text-[#DC2626] dark:text-[#F87171]';

    return (
      <AppShell>
        <TopBar
          title="ATS Gap Report"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'ATS 1-Pass', href: '/ats' },
            { label: 'Gap Report' },
          ]}
          actionButton={
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={reset}
            >
              New Analysis
            </Button>
          }
        />

        <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
          {/* ── Overall Score Hero ── */}
          <Card className="p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-black/[0.08] dark:border-white/[0.1] bg-white/90 dark:bg-[#121217]/90 backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A8A92]">
                  Overall ATS Alignment
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={`text-5xl font-black tracking-tight ${scoreColor}`}>
                    {report.overall_score.toFixed(1)}
                    <span className="text-2xl">%</span>
                  </span>
                  <Badge
                    variant={
                      report.status_summary === 'High Match'
                        ? 'success'
                        : report.status_summary === 'Moderate Match'
                        ? 'warning'
                        : 'danger'
                    }
                    size="md"
                  >
                    {report.status_summary}
                  </Badge>
                </div>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
                  {selectedFile?.name} · {latencyMs ? `${(latencyMs / 1000).toFixed(1)}s` : ''}
                  {report.processing_metadata.is_fallback && (
                    <span className="text-[#FACC15] font-bold ml-2">⚡ Fallback: Cloud</span>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-[#8A8A92]">
                <span className="font-mono">{report.processing_metadata.model_used}</span>
                <span>{report.processing_metadata.latency_ms.toFixed(0)}ms LLM latency</span>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Semantic Coverage (70%)</span>
                  <span className="text-[#FACC15]">{report.semantic_score.toFixed(1)}%</span>
                </div>
                <Progress value={report.semantic_score} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Keyword Density (30%)</span>
                  <span className="text-[#FACC15]">{report.keyword_score.toFixed(1)}%</span>
                </div>
                <Progress value={report.keyword_score} />
              </div>
            </div>
          </Card>

          {/* ── Gap Matrix ── */}
          <Card className="p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Requirements Gap Matrix</h2>
              <span className="text-xs text-[#8A8A92]">
                {report.gap_matrix.length} JD criteria evaluated
              </span>
            </div>

            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {report.gap_matrix.map((item, idx) => (
                <div key={idx} className="py-4 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchBadge status={item.match_status} />
                    <span className="font-bold text-[#1A1A1E] dark:text-white">
                      {item.requirement}
                    </span>
                    <span className="ml-auto font-mono text-[#8A8A92]">
                      {(item.similarity_score * 100).toFixed(1)}% sim
                    </span>
                  </div>
                  {item.matched_snippet && (
                    <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] italic pl-1 border-l-2 border-[#FACC15]/40">
                      {item.matched_snippet}
                    </p>
                  )}
                  {item.match_status !== 'covered' && (
                    <div className="p-2.5 rounded-xl bg-[#FACC15]/10 border border-[#FACC15]/30 text-[11px] text-[#0A0A0C] dark:text-white leading-relaxed">
                      <span className="font-bold text-[#854D0E] dark:text-[#FACC15]">💡 Fix: </span>
                      {item.improvement_suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* ── AI Bullet Rewrites ── */}
          {report.actionable_bullet_points.length > 0 && (
            <Card className="p-6 space-y-3 shadow-lg border-2 border-[#FACC15]/30">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="w-4 h-4 text-[#FACC15]" />
                AI-Generated Actionable Rewrites
              </div>
              <ul className="space-y-2">
                {report.actionable_bullet_points.map((bullet, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-[#1A1A1E] dark:text-white leading-relaxed"
                  >
                    <Zap className="w-3 h-3 text-[#FACC15] flex-shrink-0 mt-0.5" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ── Missing Keywords ── */}
          {report.missing_keywords.length > 0 && (
            <Card className="p-5 space-y-3 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A8A92]">
                Missing Keywords to Add
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.missing_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[11px] font-mono font-bold text-[#DC2626] dark:text-[#F87171]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </main>
      </AppShell>
    );
  }

  // ─── Upload / Input View ──────────────────────────────────────────────────
  return (
    <AppShell>
      <TopBar
        title="ATS Auto-Generate"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'ATS 1-Pass' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8 pb-24">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="accent" size="md" className="bg-[#FACC15] text-[#0A0A0C] border-none font-bold">
            <Wand2 className="w-3.5 h-3.5 mr-1" />
            1-PASS AI SCORING PIPELINE
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#0A0A0C] dark:text-[#F8F9FA]">
            Analyze Resume vs. Job Description
          </h1>
          <p className="text-xs sm:text-sm text-[#4A4A52] dark:text-[#A1A1AA]">
            Upload your PDF resume and paste a job description. Our backend computes bipartite
            cosine similarity and synthesizes an AI-powered gap report.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-black/[0.08] dark:border-white/[0.12] bg-white/90 dark:bg-[#121217]/90 backdrop-blur-2xl">
          {/* AI Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A1A1E] dark:text-white">AI Engine</span>
            <div className="flex items-center bg-black/10 dark:bg-white/10 p-1 rounded-xl border border-black/10 dark:border-white/15">
              <button
                onClick={() => setAiMode('cloud')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  aiMode === 'cloud'
                    ? 'bg-[#FACC15] text-[#0A0A0C] shadow-sm'
                    : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white'
                }`}
              >
                <Cloud className="w-3 h-3" /> Gemini Cloud
              </button>
              <button
                onClick={() => setAiMode('local')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  aiMode === 'local'
                    ? 'bg-[#FACC15] text-[#0A0A0C] shadow-sm'
                    : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white'
                }`}
              >
                <Cpu className="w-3 h-3" /> Local LM Studio
              </button>
            </div>
          </div>

          {/* PDF Upload Zone */}
          <div className="space-y-2">
            <Label>Resume PDF</Label>
            <label
              htmlFor="pdf-upload"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                selectedFile
                  ? 'border-[#FACC15] bg-[#FACC15]/5'
                  : 'border-black/20 dark:border-white/20 hover:border-[#FACC15] hover:bg-[#FACC15]/5'
              }`}
            >
              {selectedFile ? (
                <>
                  <FileCheck2 className="w-8 h-8 text-[#FACC15]" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#0A0A0C] dark:text-white">{selectedFile.name}</p>
                    <p className="text-xs text-[#8A8A92] mt-0.5">
                      {(selectedFile.size / 1024).toFixed(0)} KB · Click to replace
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#8A8A92]" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#1A1A1E] dark:text-white">
                      Drop your PDF here or click to browse
                    </p>
                    <p className="text-xs text-[#8A8A92] mt-0.5">Supports PDF only · Max 10MB</p>
                  </div>
                </>
              )}
              <input
                id="pdf-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label>Job Title</Label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white/60 dark:bg-black/30 text-sm text-[#1A1A1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50 transition-all"
              placeholder="e.g. Senior Frontend Engineer at Stripe"
            />
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="mb-0">Job Description</Label>
              <span className="text-[10px] text-[#854D0E] dark:text-[#FACC15] font-bold">
                Live Semantic Parser Ready
              </span>
            </div>
            <Textarea
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job posting text here..."
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Backend Health Indicator */}
          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#FACC15]" />
              <span>
                Backend:{' '}
                <strong>
                  {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}
                </strong>
              </span>
            </div>
            <span className="text-[#8A8A92] text-[10px]">POST /api/v1/resume/score</span>
          </div>

          {/* Error Message */}
          {isError && error && (
            <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#DC2626] dark:text-[#F87171] font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Pipeline Progress Indicator */}
          {isRunning && (
            <div className="p-4 rounded-2xl bg-[#FACC15]/10 border border-[#FACC15]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#854D0E] dark:text-[#FACC15]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pipeline Running…</span>
              </div>
              <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                {STATUS_LABELS[status]}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={handleSubmit}
              disabled={isRunning || !selectedFile}
              icon={
                isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0C]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#0A0A0C]" />
                )
              }
              className="w-full text-sm font-black shadow-xl shadow-[#FACC15]/25 text-[#0A0A0C]"
            >
              {isRunning ? STATUS_LABELS[status] : 'Run ATS Gap Analysis'}
            </Button>
            {!selectedFile && (
              <p className="text-center text-[11px] text-[#8A8A92] mt-2">
                Upload a PDF resume to enable analysis
              </p>
            )}
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
