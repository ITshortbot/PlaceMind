'use client';

// ============================================================================
// File: frontend/src/app/studio/page.tsx
// Description: Interactive SaaS / Desktop Studio Interior Workspace for Placemind
//              featuring 3-panel split layout, live ATS health radar, LaTeX/Doc editor,
//              interactive JD parser, and Google XYZ AI bullet rewriter.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ChevronRight,
  ArrowLeft,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Terminal,
  Cpu,
  Lock,
  Eye,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const TEMPLATES = [
  { id: 1, name: 'Minimalist Standard', file: '/assets/Resume/rem1.webp', ats: 94.8, role: 'Staff Software Architect' },
  { id: 3, name: 'AI & Systems Pro', file: '/assets/Resume/rem3.webp', ats: 98.2, role: 'Senior AI Systems Engineer' },
  { id: 4, name: 'Full-Stack Modern', file: '/assets/Resume/rem4.webp', ats: 97.2, role: 'Lead Full-Stack Engineer' },
  { id: 7, name: 'LaTeX Single-Column', file: '/assets/Resume/rem7.webp', ats: 95.6, role: 'Principal Backend Specialist' },
  { id: 11, name: 'Executive Clean', file: '/assets/Resume/rem11.webp', ats: 96.4, role: 'Engineering Director' },
];

export default function StudioPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [engineMode, setEngineMode] = useState<'cloud' | 'local'>('cloud');
  const [appliedRewrite, setAppliedRewrite] = useState(false);

  // Resume State
  const [resumeData, setResumeData] = useState({
    name: 'Rohan K. Patel',
    title: 'Staff Software Architect',
    email: 'rohan.patel@email.com',
    location: 'San Francisco, CA &bull; Remote',
    summary:
      'High-performance distributed systems architect with 8+ years building low-latency Kafka pipelines, high-throughput microservices, and AI RAG search infrastructure.',
    experienceBullet1:
      'Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.',
    experienceBullet2:
      'Engineered cloud database index handling 250M queries daily with 99.99% uptime and zero data egress.',
    skills: 'Distributed Systems, Kafka, Go, Rust, Python, pgvector, Next.js, Kubernetes',
  });

  const [jobDescription, setJobDescription] = useState(
    `Staff Software Engineer · Stripe Core Infrastructure
Requirements:
- 7+ years building high-throughput distributed systems in production
- Proven experience with Apache Kafka, low-latency stream processing, and PostgreSQL
- Strong background in high-availability cloud architecture (99.99% uptime SLAs)
- Deep understanding of vector embeddings and semantic search pipelines`
  );

  return (
    <div className="min-h-screen bg-[#F4EFEA] dark:bg-[#09090C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-300">
      {/* Top Studio App Bar */}
      <header className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Landing Page</span>
          </Link>

          <div className="h-4 w-px bg-black/[0.1] dark:bg-white/[0.1]" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white font-black text-xs shadow-sm">
              P
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">Placemind Studio</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20">
              v1.0 Pro
            </span>
          </div>
        </div>

        {/* Engine Toggle Pill */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => setEngineMode('cloud')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              engineMode === 'cloud'
                ? 'bg-white dark:bg-[#1C1C24] text-[#6C5CE7] shadow-sm'
                : 'text-[#8A8A92] hover:text-black dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Gemini 2.5 Cloud</span>
          </button>
          <button
            onClick={() => setEngineMode('local')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              engineMode === 'local'
                ? 'bg-[#16A34A] text-white shadow-sm'
                : 'text-[#8A8A92] hover:text-black dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Local LM Studio (0-Egress)</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Link href="/rehearse">
            <Button variant="secondary" size="sm" icon={<Zap className="w-3.5 h-3.5 text-[#6C5CE7]" />}>
              Mock Rehearsal
            </Button>
          </Link>

          <Button variant="primary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
            Export PDF
          </Button>
        </div>
      </header>

      {/* Main Studio Body (3-Panel Grid) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Template & Candidate Switcher) */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-0'
          } transition-all duration-300 border-r border-black/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-[#101015]/80 backdrop-blur-xl flex flex-col justify-between overflow-hidden flex-shrink-0`}
        >
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* ATS Score Meter Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181820] border border-black/[0.06] dark:border-white/[0.06] shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span>ATS Audit Score</span>
                <span className="text-[#6C5CE7]">{selectedTemplate.ats}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#38BDF8] rounded-full transition-all duration-500"
                  style={{ width: `${selectedTemplate.ats}%` }}
                />
              </div>
              <div className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Single-Column Workday Verified</span>
              </div>
            </div>

            {/* Template Selector List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
                Verified ATS Templates
              </span>
              <div className="space-y-1.5">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      selectedTemplate.id === tmpl.id
                        ? 'bg-[#6C5CE7]/15 text-[#6C5CE7] border border-[#6C5CE7]/30 shadow-sm'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#5A5A63] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold text-[#1A1A1E] dark:text-white truncate">{tmpl.name}</div>
                      <div className="text-[10px] text-[#8A8A92] truncate">{tmpl.role}</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#16A34A] ml-2">
                      {tmpl.ats}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy & Egress Footer */}
          <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] text-[10px] text-[#8A8A92] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Zero-Disk Stream Buffer</span>
          </div>
        </aside>

        {/* Center Panel (Live Document / LaTeX Editor) */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-black/[0.08] dark:border-white/[0.08] bg-white/40 dark:bg-[#0B0B0F]/60">
          {/* Editor Header Tools */}
          <div className="h-10 px-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between bg-white/70 dark:bg-[#14141A]/70 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[#8A8A92]"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <span className="font-bold text-[#1A1A1E] dark:text-white">Active Draft &bull; {selectedTemplate.name}</span>
            </div>

            <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab('split')}
                className={`px-2.5 py-0.5 rounded ${activeTab === 'split' ? 'bg-white dark:bg-[#1C1C24] shadow-xs' : 'text-[#8A8A92]'}`}
              >
                Split View
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-2.5 py-0.5 rounded ${activeTab === 'editor' ? 'bg-white dark:bg-[#1C1C24] shadow-xs' : 'text-[#8A8A92]'}`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-0.5 rounded ${activeTab === 'preview' ? 'bg-white dark:bg-[#1C1C24] shadow-xs' : 'text-[#8A8A92]'}`}
              >
                Retina Preview
              </button>
            </div>
          </div>

          {/* Editor & Preview Split Canvas */}
          <div className="flex-1 flex overflow-hidden">
            {/* Structured Form / Markdown Editor */}
            {(activeTab === 'split' || activeTab === 'editor') && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Full Name & Title</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={resumeData.name}
                      onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold focus:outline-[#6C5CE7]"
                    />
                    <input
                      type="text"
                      value={resumeData.title}
                      onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold focus:outline-[#6C5CE7]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Executive Summary</label>
                  <textarea
                    rows={3}
                    value={resumeData.summary}
                    onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] text-xs leading-relaxed focus:outline-[#6C5CE7]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Key Experience Bullets</label>
                    <span className="text-[10px] text-[#6C5CE7] font-bold">Google XYZ Synthesized</span>
                  </div>
                  <input
                    type="text"
                    value={resumeData.experienceBullet1}
                    onChange={(e) => setResumeData({ ...resumeData, experienceBullet1: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium focus:outline-[#6C5CE7]"
                  />
                  <input
                    type="text"
                    value={resumeData.experienceBullet2}
                    onChange={(e) => setResumeData({ ...resumeData, experienceBullet2: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium focus:outline-[#6C5CE7]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Core Technical Skills</label>
                  <input
                    type="text"
                    value={resumeData.skills}
                    onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium focus:outline-[#6C5CE7]"
                  />
                </div>
              </div>
            )}

            {/* Document Visual Preview Sheet */}
            {(activeTab === 'split' || activeTab === 'preview') && (
              <div className="flex-1 p-6 bg-black/[0.03] dark:bg-black/40 flex items-center justify-center overflow-y-auto">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-black/[0.12] dark:border-white/[0.15] bg-white">
                  <Image
                    src={selectedTemplate.file}
                    alt={selectedTemplate.name}
                    fill
                    className="object-cover object-top"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono font-bold">
                    {selectedTemplate.ats}% ATS
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Panel (Target Job Description & AI Copilot Rewrites) */}
        <aside className="w-80 lg:w-96 p-4 space-y-4 overflow-y-auto bg-white/70 dark:bg-[#121217]/90 backdrop-blur-xl flex-shrink-0">
          {/* Target Job Header */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181820] border border-black/[0.06] dark:border-white/[0.06] shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-[#6C5CE7]">Target Job Criteria</span>
              <Badge variant="accent" size="sm">Stripe Core</Badge>
            </div>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono leading-relaxed"
            />
          </div>

          {/* Semantic Skill Match Breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A92] dark:text-[#6B6B76]">
              Skill Match Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] font-semibold">
                ✓ Kafka Streams
              </div>
              <div className="p-2 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] font-semibold">
                ✓ PostgreSQL
              </div>
              <div className="p-2 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] font-semibold">
                ✓ Distributed Architecture
              </div>
              <div className="p-2 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 text-[#6C5CE7] font-semibold">
                ⚡ Vector RAG (Added)
              </div>
            </div>
          </div>

          {/* AI Google XYZ Optimization Proposal */}
          <div className="p-4 rounded-2xl bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/15 border border-[#6C5CE7]/35 space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
              <h4 className="text-xs font-bold text-[#1A1A1E] dark:text-white">
                Google XYZ Quantifiable Rewrite
              </h4>
            </div>

            <div className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] line-through">
              &quot;Helped team optimize Kafka streaming latency.&quot;
            </div>

            <div className="text-xs font-medium text-[#1A1A1E] dark:text-white p-2.5 rounded-xl bg-white/80 dark:bg-[#1C1C24] border border-[#6C5CE7]/30">
              &quot;Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.&quot;
            </div>

            <button
              onClick={() => setAppliedRewrite(true)}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer ${
                appliedRewrite
                  ? 'bg-[#16A34A] text-white'
                  : 'bg-[#6C5CE7] hover:bg-[#7D6FF0] text-white'
              }`}
            >
              {appliedRewrite ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{appliedRewrite ? 'Optimization Applied' : '1-Click Apply'}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
