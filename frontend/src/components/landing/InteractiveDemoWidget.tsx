'use client';

// ============================================================================
// File: frontend/src/components/landing/InteractiveDemoWidget.tsx
// Description: Live Interactive Differentiator Widget with dual Light/Dark styling
// ============================================================================

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WaveTextReveal } from '@/components/ui/WaveTextReveal';
import {
  Sparkles,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Volume2,
  FileCode,
  ArrowRight,
  Loader2,
  Zap,
  Mic,
} from 'lucide-react';
import { AIMode, ATSGapReport } from '@/types/ats';

const SAMPLE_ROLES = {
  ai_engineer: {
    title: 'Staff AI Systems Architect @ Stripe',
    jd: `Staff AI Systems Architect
We are seeking an engineer to build low-latency RAG architectures, FastAPI microservices, and modern Next.js 15 interfaces.
Requirements:
1. 4+ years with TypeScript, React/Next.js App Router, and Tailwind CSS.
2. Experience architecting vector search pipelines using PostgreSQL (pgvector) and HNSW indexing.
3. Proficiency in Python (FastAPI, PyMuPDF, LiteLLM) and async concurrency.
4. Deep understanding of distributed caching with Redis and zero-egress S3/Cloudflare R2 storage.
5. Experience with local LLM quantization and offline model serving (Ollama, LM Studio).`,
    resume: `Alex Morgan - Full-Stack AI Developer
- Built full-stack web applications in Next.js, React, and TypeScript with dark mode support.
- Developed backend API routes in Python FastAPI with async endpoint handling.
- Implemented basic vector database queries using Pinecone and OpenAI embeddings.
- Experience setting up Docker containers and deploying web applications to Vercel and AWS.`
  },
  frontend_lead: {
    title: 'Lead Frontend Engineer @ Vercel',
    jd: `Lead Frontend Engineer
Looking for an exceptional UI engineer specializing in Next.js 15, WebGL/Three.js shaders, and high-performance Tailwind systems.
Requirements:
1. Deep mastery of React Server Components, Streaming SSR, and Next.js 15.
2. Experience crafting interactive 3D WebGL / Canvas animations with Three.js.
3. Advanced design system architecture, Tailwind CSS, and WCAG AA accessibility.
4. Performance optimization: Sub-50ms INP, zero LCP layout shifts, bundle tree-shaking.`,
    resume: `Taylor Reed - Senior Frontend Developer
- Developed React and Next.js web applications with responsive Tailwind CSS.
- Integrated REST and GraphQL APIs into client dashboards.
- Built interactive charts and basic canvas visualizers.
- Optimized Lighthouse scores and improved page load speeds.`
  }
};

export function InteractiveDemoWidget() {
  const [activeTab, setActiveTab] = useState<'scorer' | 'interview'>('scorer');
  const [selectedRoleKey, setSelectedRoleKey] = useState<'ai_engineer' | 'frontend_lead'>('ai_engineer');
  const [aiMode, setAiMode] = useState<AIMode>('cloud');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ATSGapReport | null>(null);

  // Typewriter effect state for bullet rewrites
  const [typedText, setTypedText] = useState('');
  const fullRewriteText = 'Rewrote Bullet (Google XYZ): "Architected low-latency RAG search engine with PostgreSQL pgvector (HNSW cosine index), reducing vector query latency by 64% at 4,500 req/sec."';

  // Mock Interview Audio State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewQuestionIndex, setInterviewQuestionIndex] = useState(0);

  const interviewQuestions = [
    {
      q: 'You mentioned using PostgreSQL pgvector for your RAG engine. Can you explain the trade-offs between IVFFlat and HNSW indexing when dataset cardinality scales to 10M rows?',
      tag: 'Vector DB Architecture',
    },
    {
      q: 'How did you prevent vector dilution when chunking multi-page PDF resumes into semantic section embeddings?',
      tag: 'PyMuPDF Chunking Heuristics',
    },
    {
      q: 'Walk me through how your HybridLLMRouter handles transport timeouts when failing over from local LM Studio to Cloud Gemini.',
      tag: 'Fault Tolerance & Resilience',
    },
  ];

  const activeRole = SAMPLE_ROLES[selectedRoleKey];

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setReport(null);
    setTypedText('');

    setTimeout(() => {
      const generatedReport: ATSGapReport = {
        overall_score: selectedRoleKey === 'ai_engineer' ? 84.5 : 88.0,
        semantic_score: selectedRoleKey === 'ai_engineer' ? 87.0 : 91.0,
        keyword_score: selectedRoleKey === 'ai_engineer' ? 78.5 : 81.0,
        status_summary: 'High Match',
        gap_matrix: [
          {
            requirement: selectedRoleKey === 'ai_engineer' 
              ? 'Next.js 15 App Router & Tailwind CSS UI architecture'
              : 'React Server Components & Next.js 15 Streaming SSR',
            match_status: 'covered',
            similarity_score: 0.91,
            matched_resume_section: 'work_experience',
            matched_snippet: 'Built full-stack web applications in Next.js and TypeScript...',
            improvement_suggestion: 'Strong alignment. Consider adding bundle-size reduction metrics.',
          },
          {
            requirement: selectedRoleKey === 'ai_engineer'
              ? 'PostgreSQL (pgvector) & HNSW Indexing for RAG Search'
              : 'Interactive 3D WebGL / Canvas Animations (Three.js)',
            match_status: 'weak',
            similarity_score: 0.64,
            matched_resume_section: 'projects',
            matched_snippet: 'Implemented basic vector database queries...',
            improvement_suggestion: 'Explicitly mention PostgreSQL pgvector, HNSW graph parameters, and cosine distance queries.',
          },
          {
            requirement: selectedRoleKey === 'ai_engineer'
              ? 'Python FastAPI & Asynchronous Concurrency'
              : 'Design System Architecture & WCAG AA Accessibility',
            match_status: 'covered',
            similarity_score: 0.89,
            matched_resume_section: 'work_experience',
            matched_snippet: 'Developed backend API routes in Python FastAPI...',
            improvement_suggestion: 'Add throughput numbers (e.g. 5,000 req/sec at sub-20ms p99 latency).',
          },
          {
            requirement: selectedRoleKey === 'ai_engineer'
              ? 'Cloudflare R2 Object Storage & Zero Egress'
              : 'Performance Optimization: Sub-50ms INP & zero LCP shifts',
            match_status: 'missing',
            similarity_score: 0.36,
            matched_resume_section: null,
            matched_snippet: null,
            improvement_suggestion: 'Missing explicit cloud object storage experience. Add S3/R2 upload project highlights.',
          },
        ],
        missing_keywords: ['pgvector', 'HNSW', 'Cloudflare R2', 'LM Studio', 'Zero-Egress'],
        detected_strengths: ['Next.js 15', 'FastAPI', 'TypeScript', 'Vector Retrieval'],
        actionable_bullet_points: [
          'Rewrote Project Bullet: "Architected low-latency RAG system with PostgreSQL pgvector (HNSW cosine index), reducing vector search latency by 64%."',
          'Added Cloud Storage: "Implemented encrypted document ingestion pipeline to Cloudflare R2 with zero egress overhead."',
        ],
        parsed_sections: [
          { section_type: 'skills', content: 'TypeScript, Python, FastAPI, Next.js, React' },
          { section_type: 'work_experience', content: 'Full-Stack AI Developer at Apex...' },
        ],
        pdf_r2_url: null,
        processing_metadata: {
          model_used: aiMode === 'cloud' ? 'gemini/gemini-2.5-flash' : 'lm-studio:llama3.2',
          routing_mode: aiMode,
          latency_ms: aiMode === 'cloud' ? 385.4 : 790.1,
          is_fallback: false,
          embedding_dimension: 384,
        },
      };

      setReport(generatedReport);
      setIsAnalyzing(false);

      // Start typewriter effect
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < fullRewriteText.length) {
          setTypedText(fullRewriteText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 15);
    }, 1300);
  };

  return (
    <section id="demo" className="py-28 md:py-40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-black/[0.08] dark:border-[#2A2A30] text-[11px] font-mono uppercase tracking-[0.2em] text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-md">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>TEST THE ENGINE LIVE &bull; REAL-TIME WORKSPACE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
            <span className="font-light">Interactive Placemind</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              Copilot
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-4 leading-relaxed">
            Simulate a real ATS vector audit or test an adaptive mock interview question.
          </p>
        </div>

        {/* Tab Toggle Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <button
            onClick={() => setActiveTab('scorer')}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'scorer'
                ? 'bg-white/85 dark:bg-[#1C1C21]/90 text-[#1A1A1E] dark:text-[#F5F5F7] border border-[#6C5CE7] shadow-[0_0_25px_-5px_rgba(108,92,231,0.4)] backdrop-blur-xl'
                : 'bg-white/50 dark:bg-[#141417]/60 text-[#5A5A63] dark:text-[#A1A1AA] border border-black/[0.08] dark:border-white/[0.08] hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] backdrop-blur-md'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
            <span>ATS Vector Gap Scorer</span>
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'interview'
                ? 'bg-white/85 dark:bg-[#1C1C21]/90 text-[#1A1A1E] dark:text-[#F5F5F7] border border-[#6C5CE7] shadow-[0_0_25px_-5px_rgba(108,92,231,0.4)] backdrop-blur-xl'
                : 'bg-white/50 dark:bg-[#141417]/60 text-[#5A5A63] dark:text-[#A1A1AA] border border-black/[0.08] dark:border-white/[0.08] hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] backdrop-blur-md'
            }`}
          >
            <Mic className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
            <span>Adaptive Mock Interview Demo</span>
          </button>
        </motion.div>

        {/* Main Widget Container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
          className="p-8 md:p-12 rounded-2xl bg-white/70 dark:bg-[#141417]/80 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/40 shadow-2xl backdrop-blur-2xl relative overflow-hidden transition-colors"
        >
          {activeTab === 'scorer' ? (
            <div>
              {/* Top Controls: Role Selection & AI Engine Switcher */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-black/[0.08] dark:border-[#2A2A30]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] font-mono">Sample Preset:</span>
                  <button
                    onClick={() => setSelectedRoleKey('ai_engineer')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      selectedRoleKey === 'ai_engineer'
                        ? 'bg-white dark:bg-[#1C1C21] border-[#6C5CE7] text-[#1A1A1E] dark:text-[#F5F5F7] shadow-sm'
                        : 'bg-black/[0.03] dark:bg-[#0A0A0C] border-black/[0.08] dark:border-white/[0.08] text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white'
                    }`}
                  >
                    AI Systems Architect
                  </button>
                  <button
                    onClick={() => setSelectedRoleKey('frontend_lead')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      selectedRoleKey === 'frontend_lead'
                        ? 'bg-white dark:bg-[#1C1C21] border-[#6C5CE7] text-[#1A1A1E] dark:text-[#F5F5F7] shadow-sm'
                        : 'bg-black/[0.03] dark:bg-[#0A0A0C] border-black/[0.08] dark:border-white/[0.08] text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white'
                    }`}
                  >
                    Lead Frontend Engineer
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] font-mono">Engine:</span>
                  <div className="inline-flex rounded-lg bg-black/[0.04] dark:bg-[#0A0A0C] p-1 border border-black/[0.08] dark:border-white/[0.08]">
                    <button
                      onClick={() => setAiMode('cloud')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        aiMode === 'cloud'
                          ? 'bg-[#6C5CE7] text-white shadow-sm'
                          : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white'
                      }`}
                    >
                      Cloud (Gemini)
                    </button>
                    <button
                      onClick={() => setAiMode('local')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        aiMode === 'local'
                          ? 'bg-[#6C5CE7] text-white shadow-sm'
                          : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white'
                      }`}
                    >
                      Local (LM Studio)
                    </button>
                  </div>
                </div>
              </div>

              {/* Two Column Input Preview with Laser Scanning Beam */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8 relative">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold uppercase text-[#5A5A63] dark:text-[#A1A1AA]">
                      Target Job Description (JD)
                    </label>
                    <span className="text-[10px] text-[#8A8A92] dark:text-[#6B6B76] font-mono">Input Vector Target</span>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#0A0A0C]/90">
                    {isAnalyzing && (
                      <div className="absolute left-0 right-0 h-0.5 bg-[#38BDF8] animate-scan-beam z-20 shadow-[0_0_10px_#38BDF8]" />
                    )}
                    <textarea
                      readOnly
                      rows={7}
                      value={activeRole.jd}
                      className="w-full p-4 bg-transparent text-xs font-mono text-[#1A1A1E] dark:text-[#F5F5F7] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold uppercase text-[#5A5A63] dark:text-[#A1A1AA]">
                      Candidate Resume (Extracted Chunks)
                    </label>
                    <span className="text-[10px] text-[#8A8A92] dark:text-[#6B6B76] font-mono">PyMuPDF Ingestion</span>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#0A0A0C]/90">
                    {isAnalyzing && (
                      <div className="absolute left-0 right-0 h-0.5 bg-[#6C5CE7] animate-scan-beam z-20 shadow-[0_0_10px_#6C5CE7]" />
                    )}
                    <textarea
                      readOnly
                      rows={7}
                      value={activeRole.resume}
                      className="w-full p-4 bg-transparent text-xs font-mono text-[#1A1A1E] dark:text-[#F5F5F7] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center pb-2">
                <Button
                  variant="primary"
                  size="md"
                  disabled={isAnalyzing}
                  onClick={handleRunAnalysis}
                  icon={
                    isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )
                  }
                  className="px-9 shadow-lg shadow-[#6C5CE7]/30"
                >
                  {isAnalyzing ? 'Running 384-d Cosine Vector Matrix...' : 'Run Live Gap Analysis'}
                </Button>
              </div>

              {/* Report Output Card */}
              {report && (
                <div className="mt-8 pt-8 border-t border-black/[0.08] dark:border-[#2A2A30] animate-slide-up space-y-6">
                  {/* Top Score Banner */}
                  <div className="p-6 md:p-8 rounded-2xl bg-white/85 dark:bg-[#1C1C21]/85 border border-black/[0.08] dark:border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-mono text-[#5A5A63] dark:text-[#A1A1AA]">
                          Audit Outcome
                        </span>
                        <Badge variant="success" size="sm">
                          {report.status_summary}
                        </Badge>
                      </div>
                      <h4 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A1E] dark:text-[#F5F5F7] mt-1">
                        Composite Score: {report.overall_score}%
                      </h4>
                      <p className="text-xs text-[#8A8A92] dark:text-[#6B6B76] mt-1">
                        Inference: {report.processing_metadata.model_used} · {report.processing_metadata.latency_ms}ms latency
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] text-center min-w-[110px]">
                        <div className="text-2xl font-bold text-[#6C5CE7]">
                          {report.semantic_score}%
                        </div>
                        <div className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] uppercase mt-0.5 font-semibold">
                          Vector Match
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] text-center min-w-[110px]">
                        <div className="text-2xl font-bold text-[#0284C7] dark:text-[#38BDF8]">
                          {report.keyword_score}%
                        </div>
                        <div className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] uppercase mt-0.5 font-semibold">
                          Keyword Density
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bipartite Gap Matrix Items */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#5A5A63] dark:text-[#A1A1AA]">
                      Bipartite Vector Alignment Matrix
                    </h5>
                    {report.gap_matrix.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl bg-white/80 dark:bg-[#0A0A0C]/90 border border-black/[0.08] dark:border-white/[0.08] space-y-2 hover:border-[#6C5CE7]/40 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                            {item.requirement}
                          </span>
                          <Badge
                            variant={
                              item.match_status === 'covered'
                                ? 'success'
                                : item.match_status === 'weak'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {item.match_status === 'covered'
                              ? 'Well Covered'
                              : item.match_status === 'weak'
                              ? 'Weak Match'
                              : 'Not Covered'}{' '}
                            ({(item.similarity_score * 100).toFixed(0)}%)
                          </Badge>
                        </div>
                        <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-[1.7]">
                          💡 <strong className="text-[#1A1A1E] dark:text-[#F5F5F7]">AI Suggestion:</strong>{' '}
                          {item.improvement_suggestion}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Animated Typewriter Bullet Rewrite Box */}
                  <div className="p-6 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/35 shadow-lg shadow-[#6C5CE7]/5">
                    <h5 className="text-xs font-bold uppercase text-[#6C5CE7] dark:text-[#7D6FF0] mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Generated Google XYZ Bullet Rewrite
                    </h5>
                    <div className="text-xs font-mono text-[#1A1A1E] dark:text-[#F5F5F7] min-h-[38px] leading-relaxed">
                      {typedText}
                      <span className="inline-block w-1.5 h-3 bg-[#6C5CE7] ml-0.5 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Adaptive Mock Interview Simulator */
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] dark:border-[#2A2A30]">
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                    Adaptive Mock Technical Round
                  </h3>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                    AI interviewer dynamically tailors questions based on your resume weak points.
                  </p>
                </div>
                <Badge variant="accent" size="sm">
                  Speech VAD Active
                </Badge>
              </div>

              {/* Video Mock Avatar Interface */}
              <div className="relative rounded-2xl bg-white/80 dark:bg-[#0A0A0C]/90 border border-black/[0.08] dark:border-white/[0.08] p-8 md:p-12 text-center overflow-hidden">
                {/* AI Interviewer Avatar Image */}
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-4 border-2 border-[#6C5CE7]/60 shadow-[0_0_35px_rgba(108,92,231,0.5)]">
                  <Image
                    src="/assets/ai-interviewer.jpg"
                    alt="AI Interviewer Avatar"
                    fill
                    className="object-cover"
                  />
                  {isSpeaking && (
                    <div className="absolute inset-0 bg-[#6C5CE7]/20 backdrop-blur-[1px] animate-pulse" />
                  )}
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/[0.04] dark:bg-[#1C1C21] border border-black/[0.08] dark:border-white/[0.08] text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#22C55E] animate-pulse" />
                  <span className="font-medium text-[#1A1A1E] dark:text-[#F5F5F7]">Aura // Digital Staff Mentor</span>
                  <span className="text-[#8A8A92] dark:text-[#6B6B76]">&bull;</span>
                  <span className="text-[#6C5CE7] dark:text-[#7D6FF0]">{interviewQuestions[interviewQuestionIndex].tag}</span>
                </div>

                <p className="text-base sm:text-lg text-[#1A1A1E] dark:text-[#F5F5F7] max-w-xl mx-auto italic leading-[1.7] font-medium">
                  &quot;{interviewQuestions[interviewQuestionIndex].q}&quot;
                </p>

                {/* Animated Frequency Audio Visualizer */}
                <div className="flex items-center justify-center gap-1.5 my-8 h-10">
                  {[16, 32, 48, 24, 40, 56, 28, 44, 52, 22, 36, 18, 30, 46, 20, 38].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: isSpeaking ? `${Math.max(8, Math.round(h * Math.random()))}px` : '6px',
                        transition: 'height 0.1s ease-in-out',
                      }}
                      className={`w-1.5 rounded-full ${
                        isSpeaking ? 'bg-[#6C5CE7] shadow-[0_0_8px_#6C5CE7]' : 'bg-black/[0.15] dark:bg-[#2A2A30]'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSpeaking(!isSpeaking)}
                    icon={<Volume2 className="w-3.5 h-3.5" />}
                  >
                    {isSpeaking ? 'Pause Audio Feed' : 'Simulate Question Audio'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setInterviewQuestionIndex((prev) => (prev + 1) % interviewQuestions.length);
                      setIsSpeaking(true);
                    }}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Next Technical Probe
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
