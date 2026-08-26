'use client';

// ============================================================================
// File: frontend/src/app/studio/page.tsx
// Description: Placemind Studio Page fully unified inside <AppShell />
//              - Integrated with the Frosted Floating Left Navigation Bar & TopBar.
//              - Uses the Black, White & Pop-Yellow High-Contrast Design System.
//              - 3-Column Studio layout with Template Switcher, Live Form, and Physical Preview.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Download,
  CheckCircle2,
  ArrowLeft,
  Check,
  Lock,
  Cpu,
  FileCheck,
  TrendingUp,
  FileText,
} from 'lucide-react';

import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TEMPLATES = [
  { id: 1, name: 'Minimalist Standard', file: '/assets/Resume/rem1.webp', ats: 94.8, role: 'Staff Software Architect' },
  { id: 3, name: 'AI & Systems Pro', file: '/assets/Resume/rem3.webp', ats: 98.2, role: 'Senior AI Systems Engineer' },
  { id: 4, name: 'Full-Stack Modern', file: '/assets/Resume/rem4.webp', ats: 97.2, role: 'Lead Full-Stack Engineer' },
  { id: 7, name: 'LaTeX Single-Column', file: '/assets/Resume/rem7.webp', ats: 95.6, role: 'Principal Backend Specialist' },
  { id: 11, name: 'Executive Clean', file: '/assets/Resume/rem11.webp', ats: 96.4, role: 'Engineering Director' },
];

export default function StudioPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [activeTab, setActiveTab] = useState<'split' | 'editor' | 'preview'>('split');
  const [engineMode, setEngineMode] = useState<'cloud' | 'local'>('cloud');
  const [appliedRewrite, setAppliedRewrite] = useState(false);

  // Resume Form State
  const [resumeData, setResumeData] = useState({
    name: 'Rohan K. Patel',
    title: 'Staff Software Architect',
    email: 'rohan.patel@email.com',
    location: 'San Francisco, CA · Remote',
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

  const handleApplyRewrite = () => {
    setAppliedRewrite(true);
    setResumeData((prev) => ({
      ...prev,
      experienceBullet1:
        'Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.',
    }));
  };

  return (
    <AppShell>
      <TopBar
        title="Studio Editor"
        actionButton={
          <div className="flex items-center gap-2">
            {/* Engine Selector */}
            <div className="hidden sm:flex items-center bg-black/10 dark:bg-white/10 p-1 rounded-xl border border-black/10 dark:border-white/15">
              <button
                onClick={() => setEngineMode('cloud')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  engineMode === 'cloud'
                    ? 'bg-[#FACC15] text-[#0A0A0C] shadow-sm'
                    : 'text-[#4A4A52] dark:text-[#A1A1AA] hover:text-black dark:hover:text-white'
                }`}
              >
                Gemini 2.5 Cloud
              </button>
              <button
                onClick={() => setEngineMode('local')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  engineMode === 'local'
                    ? 'bg-[#FACC15] text-[#0A0A0C] shadow-sm'
                    : 'text-[#4A4A52] dark:text-[#A1A1AA] hover:text-black dark:hover:text-white'
                }`}
              >
                Local LM Studio
              </button>
            </div>

            <Link href="/interview">
              <Button variant="secondary" size="sm" icon={<Zap className="w-3.5 h-3.5 text-[#FACC15]" />}>
                Mock Rehearsal
              </Button>
            </Link>

            <Button
              variant="default"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              className="bg-[#FACC15] text-[#0A0A0C] font-extrabold hover:bg-[#FFE033]"
            >
              Export PDF
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Studio 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Template Selector & ATS Audit Score                          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-4">
            {/* ATS Score Card */}
            <Card className="p-5 border border-black/10 dark:border-white/12 bg-white/90 dark:bg-[#121217]/90 backdrop-blur-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA]">
                  ATS Audit Score
                </span>
                <span className="text-base font-black text-[#FACC15]">
                  {selectedTemplate.ats}%
                </span>
              </div>
              <Progress value={selectedTemplate.ats} className="h-2 bg-black/10 dark:bg-white/10" />
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#16A34A] dark:text-[#22C55E]">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Single-Column Workday Verified</span>
              </div>
            </Card>

            {/* Template Selector */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA] px-1">
                Verified ATS Templates
              </h3>
              <div className="space-y-2">
                {TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedTemplate.id === tmpl.id
                        ? 'border-2 border-[#FACC15] bg-[#FACC15]/10 dark:bg-[#FACC15]/15 shadow-md shadow-[#FACC15]/10'
                        : 'border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#121217]/80 hover:border-[#FACC15]/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#0A0A0C] dark:text-white truncate">
                        {tmpl.name}
                      </p>
                      <p className="text-[11px] text-[#4A4A52] dark:text-[#A1A1AA] truncate mt-0.5">
                        {tmpl.role}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#16A34A]/15 text-[#16A34A] dark:text-[#22C55E] flex-shrink-0">
                      {tmpl.ats}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CENTER COLUMN: Resume Form Inputs & Real-Time Document Canvas             */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white/90 dark:bg-[#121217]/90 border border-black/10 dark:border-white/12 shadow-sm">
              <span className="text-xs font-bold px-2 text-[#0A0A0C] dark:text-white flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Active Draft &bull; {selectedTemplate.name}</span>
              </span>

              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('split')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'split' ? 'bg-[#FACC15] text-[#0A0A0C] shadow-xs' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'editor' ? 'bg-[#FACC15] text-[#0A0A0C] shadow-xs' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'preview' ? 'bg-[#FACC15] text-[#0A0A0C] shadow-xs' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {/* Split Content: Form + Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Side */}
              {(activeTab === 'split' || activeTab === 'editor') && (
                <div className="space-y-3 p-4 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-black/10 dark:border-white/12 shadow-sm">
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA]">
                      Full Name
                    </Label>
                    <Input
                      value={resumeData.name}
                      onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                      className="mt-1 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA]">
                      Target Title
                    </Label>
                    <Input
                      value={resumeData.title}
                      onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                      className="mt-1 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA]">
                      Executive Summary
                    </Label>
                    <Textarea
                      rows={3}
                      value={resumeData.summary}
                      onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                      className="mt-1 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-xs font-medium leading-relaxed resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA]">
                        Key Experience Bullet
                      </Label>
                      <span className="text-[10px] font-bold text-[#854D0E] dark:text-[#FACC15] bg-[#FACC15]/20 px-2 py-0.5 rounded-full">
                        Google XYZ Active
                      </span>
                    </div>
                    <Textarea
                      rows={2}
                      value={resumeData.experienceBullet1}
                      onChange={(e) => setResumeData({ ...resumeData, experienceBullet1: e.target.value })}
                      className="mt-1 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-xs font-medium resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Physical Document Canvas Preview */}
              {(activeTab === 'split' || activeTab === 'preview') && (
                <div className="p-4 rounded-3xl bg-[#E8EAED] dark:bg-[#0E0E12] border border-black/10 dark:border-white/12 shadow-inner flex items-center justify-center min-h-[380px]">
                  <div className="relative w-full max-w-[280px] aspect-[1/1.414] bg-white text-black shadow-2xl rounded-lg overflow-hidden border border-black/20">
                    <Image
                      src={selectedTemplate.file}
                      alt={selectedTemplate.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Target JD Criteria & Google XYZ AI Bullet Optimization     */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-4">
            {/* Target Job Criteria Card */}
            <Card className="p-4 border border-black/10 dark:border-white/12 bg-white/90 dark:bg-[#121217]/90 backdrop-blur-xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA]">
                  Target Job Criteria
                </span>
                <Badge variant="accent" size="sm">
                  Stripe Core
                </Badge>
              </div>
              <Textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-[11px] font-mono leading-tight resize-none"
              />
            </Card>

            {/* Skill Match Badges */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#4A4A52] dark:text-[#A1A1AA] px-1">
                Skill Match Breakdown
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="px-2.5 py-1.5 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] dark:text-[#22C55E] text-xs font-extrabold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Kafka Streams</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] dark:text-[#22C55E] text-xs font-extrabold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>PostgreSQL</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] dark:text-[#22C55E] text-xs font-extrabold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Architecture</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#FACC15]/20 border border-[#FACC15]/40 text-[#854D0E] dark:text-[#FACC15] text-xs font-extrabold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Vector RAG</span>
                </div>
              </div>
            </div>

            {/* Google XYZ Bullet Optimization Callout Card */}
            <Card className="p-4 border-2 border-[#FACC15] bg-[#FACC15]/10 dark:bg-[#FACC15]/15 backdrop-blur-xl shadow-lg shadow-[#FACC15]/15 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FACC15] text-[#0A0A0C] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#0A0A0C] dark:text-white">
                    Google XYZ Bullet Optimization
                  </h4>
                  <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-bold">
                    +2.4% Recruiter Lift
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/60 border border-black/10 dark:border-white/10 text-xs font-semibold text-[#0A0A0C] dark:text-white leading-relaxed">
                &ldquo;Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.&rdquo;
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleApplyRewrite}
                icon={<Zap className="w-3.5 h-3.5" />}
                className="w-full bg-[#FACC15] text-[#0A0A0C] font-black hover:bg-[#FFE033] shadow-md shadow-[#FACC15]/25"
              >
                {appliedRewrite ? 'Applied!' : '1-Click Apply'}
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
