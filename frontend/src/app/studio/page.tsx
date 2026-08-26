'use client';

// ============================================================================
// File: frontend/src/app/studio/page.tsx
// Description: Rebuilt Placemind Studio page benchmarked against 21st.dev standards.
//              Strictly constructed using shadcn/ui primitives (Input, Textarea, Label,
//              Button, Card, Progress, Tabs, Badge, Separator) with a 3-level elevation
//              hierarchy, unified typography, restrained palette, and prominent hero preview.
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
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

// Standard shadcn/ui Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-300">
      {/* ========================================================================= */}
      {/* TOP APP BAR: Standardized Heights, Grouped Controls, and shadcn Buttons   */}
      {/* ========================================================================= */}
      <header className="h-16 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
        {/* Left: Navigation & Branding */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>

          <Separator orientation="vertical" className="h-4" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white font-black text-xs shadow-sm shadow-[#6C5CE7]/30">
              P
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">
              Placemind Studio
            </span>
            <Badge variant="accent" size="sm">
              v1.0 Pro
            </Badge>
          </div>
        </div>

        {/* Center: Unified Engine Selector (shadcn Tabs / ToggleGroup) */}
        <div className="hidden md:flex items-center">
          <Tabs value={engineMode} onValueChange={(v) => setEngineMode(v as 'cloud' | 'local')}>
            <TabsList className="h-9 p-1 bg-black/[0.04] dark:bg-white/[0.06]">
              <TabsTrigger value="cloud" className="gap-1.5 px-3 py-1">
                <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Gemini 2.5 Cloud</span>
              </TabsTrigger>
              <TabsTrigger value="local" className="gap-1.5 px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#22C55E]" />
                <span>Local LM Studio (0-Egress)</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right: Primary and Secondary Action Hierarchy */}
        <div className="flex items-center gap-2.5">
          <Link href="/interview/new">
            <Button
              variant="secondary"
              size="default"
              icon={<Zap className="w-3.5 h-3.5 text-[#6C5CE7]" />}
            >
              Mock Rehearsal
            </Button>
          </Link>

          <Button
            variant="default"
            size="default"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export PDF
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN 3-PANEL STUDIO WORKSPACE WITH 3-LEVEL ELEVATION HIERARCHY            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 1 (LEFT SIDEBAR): Level 1 Surface, Level 2 Template Cards         */}
        {/* ----------------------------------------------------------------------- */}
        <aside
          className={`${
            isSidebarOpen ? 'w-72' : 'w-0'
          } transition-all duration-300 border-r border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-[#101015]/80 backdrop-blur-xl flex flex-col justify-between overflow-hidden flex-shrink-0`}
        >
          <div className="p-5 space-y-6 overflow-y-auto">
            {/* Level 2 Card: ATS Health Radar */}
            <Card variant="default" className="p-4 space-y-3 bg-white/90 dark:bg-[#181820]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#1A1A1E] dark:text-white">ATS Audit Score</span>
                <span className="font-mono font-bold text-sm text-[#6C5CE7]">
                  {selectedTemplate.ats}%
                </span>
              </div>
              <Progress value={selectedTemplate.ats} />
              <div className="text-[11px] text-[#16A34A] dark:text-[#22C55E] font-semibold flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Single-Column Workday Verified</span>
              </div>
            </Card>

            {/* Level 2 Cards: Template Selector List */}
            <div className="space-y-3">
              <Label className="text-[#8A8A92] dark:text-[#6B6B76]">
                Verified ATS Templates
              </Label>
              <div className="space-y-2">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate.id === tmpl.id;
                  return (
                    <Card
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-3.5 transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/15 shadow-md shadow-[#6C5CE7]/10 ring-1 ring-[#6C5CE7]'
                          : 'hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-[#1A1A1E] dark:text-white truncate">
                          {tmpl.name}
                        </div>
                        <div className="text-[11px] text-[#8A8A92] truncate mt-0.5">
                          {tmpl.role}
                        </div>
                      </div>
                      <Badge
                        variant={isSelected ? 'accent' : 'neutral'}
                        size="sm"
                        className="font-mono flex-shrink-0"
                      >
                        {tmpl.ats}%
                      </Badge>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.06] text-[11px] text-[#8A8A92] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#22C55E]" />
            <span>Zero-Disk Stream Buffer Active</span>
          </div>
        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 2 (CENTER): Form Editor + Level 3 HERO Physical Document Preview   */}
        {/* ----------------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-black/[0.08] dark:border-white/[0.08] bg-white/40 dark:bg-[#0B0B0F]/60">
          {/* Sub-Header / Tool Controls */}
          <div className="h-12 px-6 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between bg-white/70 dark:bg-[#14141A]/70 text-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 h-8 w-8"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>
              <span className="font-bold text-[#1A1A1E] dark:text-white">
                Active Draft &bull; {selectedTemplate.name}
              </span>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'split' | 'editor' | 'preview')}>
              <TabsList className="h-8 p-0.5">
                <TabsTrigger value="split" className="text-[11px] px-3 py-0.5">Split View</TabsTrigger>
                <TabsTrigger value="editor" className="text-[11px] px-3 py-0.5">Editor</TabsTrigger>
                <TabsTrigger value="preview" className="text-[11px] px-3 py-0.5">Retina Preview</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Structured Form Fields */}
            {(activeTab === 'split' || activeTab === 'editor') && (
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
                {/* Full Name & Title */}
                <div className="space-y-1.5">
                  <Label>Full Name & Target Position</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="text"
                      value={resumeData.name}
                      onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                    />
                    <Input
                      type="text"
                      value={resumeData.title}
                      onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Executive Summary */}
                <div className="space-y-1.5">
                  <Label>Executive Summary</Label>
                  <Textarea
                    rows={3}
                    value={resumeData.summary}
                    onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  />
                </div>

                <Separator />

                {/* Key Experience Bullets */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="mb-0">Key Experience Bullets</Label>
                    <Badge variant="accent" size="sm">Google XYZ Active</Badge>
                  </div>
                  <Input
                    type="text"
                    value={resumeData.experienceBullet1}
                    onChange={(e) => setResumeData({ ...resumeData, experienceBullet1: e.target.value })}
                  />
                  <Input
                    type="text"
                    value={resumeData.experienceBullet2}
                    onChange={(e) => setResumeData({ ...resumeData, experienceBullet2: e.target.value })}
                  />
                </div>

                <Separator />

                {/* Core Technical Skills */}
                <div className="space-y-1.5">
                  <Label>Core Technical Skills</Label>
                  <Input
                    type="text"
                    value={resumeData.skills}
                    onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* LEVEL 3 HERO: Physical Document Retina Preview */}
            {(activeTab === 'split' || activeTab === 'preview') && (
              <div className="flex-1 p-8 bg-black/[0.03] dark:bg-black/40 flex items-center justify-center overflow-y-auto">
                <Card
                  variant="elevated"
                  className="relative w-full max-w-md aspect-[3/4] overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/80 border-2 border-black/[0.12] dark:border-white/[0.15] bg-white transition-transform duration-300 hover:scale-[1.01]"
                >
                  <Image
                    src={selectedTemplate.file}
                    alt={selectedTemplate.name}
                    fill
                    priority
                    className="object-cover object-top"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="neutral" size="sm" className="bg-black/80 text-white font-mono border-none shadow-md">
                      {selectedTemplate.ats}% ATS Verified
                    </Badge>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>

        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 3 (RIGHT SIDEBAR): Target Criteria & Level 3 AI Rewrite Callout   */}
        {/* ----------------------------------------------------------------------- */}
        <aside className="w-80 lg:w-[380px] p-6 space-y-6 overflow-y-auto bg-white/70 dark:bg-[#121217]/90 backdrop-blur-xl flex-shrink-0">
          {/* Target Job Criteria */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="mb-0">Target Job Criteria</Label>
              <Badge variant="accent" size="sm">Stripe Core</Badge>
            </div>
            <Textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="font-mono text-[11px] leading-relaxed"
            />
          </div>

          <Separator />

          {/* Semantic Skill Match Breakdown */}
          <div className="space-y-3">
            <Label className="text-[#8A8A92] dark:text-[#6B6B76]">
              Skill Match Breakdown
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="success" size="md" className="justify-center py-2">
                ✓ Kafka Streams
              </Badge>
              <Badge variant="success" size="md" className="justify-center py-2">
                ✓ PostgreSQL
              </Badge>
              <Badge variant="success" size="md" className="justify-center py-2">
                ✓ Architecture
              </Badge>
              <Badge variant="accent" size="md" className="justify-center py-2">
                ⚡ Vector RAG
              </Badge>
            </div>
          </div>

          <Separator />

          {/* LEVEL 3 HERO COMPONENT: AI Google XYZ Rewrite Callout */}
          <Card
            variant="elevated"
            className="p-5 border-2 border-[#6C5CE7]/60 bg-gradient-to-br from-[#6C5CE7]/12 via-[#6C5CE7]/5 to-transparent shadow-xl shadow-[#6C5CE7]/15 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#6C5CE7] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1E] dark:text-white">
                  Google XYZ Bullet Optimization
                </h4>
                <span className="text-[10px] text-[#6C5CE7] font-semibold">+2.4% Recruiter Lift</span>
              </div>
            </div>

            <div className="text-xs text-[#8A8A92] line-through leading-relaxed">
              &quot;Helped team optimize Kafka streaming latency.&quot;
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1C24] border border-[#6C5CE7]/30 text-xs font-medium text-[#1A1A1E] dark:text-white shadow-xs leading-relaxed">
              &quot;Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.&quot;
            </div>

            <Button
              variant={appliedRewrite ? 'success' : 'default'}
              size="default"
              onClick={() => setAppliedRewrite(true)}
              className="w-full text-xs font-bold shadow-lg shadow-[#6C5CE7]/25"
            >
              {appliedRewrite ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              <span>{appliedRewrite ? 'Optimization Applied' : '1-Click Apply'}</span>
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
