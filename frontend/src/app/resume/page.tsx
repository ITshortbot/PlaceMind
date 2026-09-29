'use client';

// ============================================================================
// File: frontend/src/app/resume/page.tsx
// Description: Tab 3 - Resume: 3-Column Editor from Wireframe v1
//              Left: "Your Info" (Details, Photo, Certificates, AI Tips)
//              Center: "Live Preview" (Hero physical document canvas)
//              Right: "Templates & Suggestions" (Template picker + XYZ rewrites)
//              Bottom: Persistent AI Command Bar
// ============================================================================

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Progress } from '@/components/ui/Progress';
import {
  Download,
  Sparkles,
  Zap,
  Check,
  Award,
  Upload,
  FileCheck,
  User,
  ShieldCheck,
} from 'lucide-react';

const TEMPLATES = [
  { id: 1, name: 'Minimalist Standard', file: '/assets/Resume/rem1.webp', ats: 94.8 },
  { id: 3, name: 'AI & Systems Pro', file: '/assets/Resume/rem3.webp', ats: 98.2 },
  { id: 4, name: 'Full-Stack Modern', file: '/assets/Resume/rem4.webp', ats: 97.2 },
  { id: 7, name: 'LaTeX Single-Column', file: '/assets/Resume/rem7.webp', ats: 95.6 },
];

export default function ResumePage() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [appliedRewrite, setAppliedRewrite] = useState(false);

  // Resume Form Data
  const [resumeData, setResumeData] = useState({
    name: 'Rohan K. Patel',
    title: 'Staff Software Architect',
    email: 'rohan.patel@email.com',
    phone: '+1 (555) 349-2049',
    summary:
      'High-performance distributed systems architect with 8+ years building low-latency Kafka pipelines, high-throughput microservices, and AI RAG search infrastructure.',
    bullet1: 'Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.',
    bullet2: 'Engineered cloud database index handling 250M queries daily with 99.99% uptime and zero data egress.',
    skills: 'Distributed Systems, Kafka, Go, Rust, Python, pgvector, Next.js, Kubernetes',
  });

  return (
    <AppShell>
      <TopBar
        title="Resume Builder"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Resume Builder' },
        ]}
        actionButton={
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm" className="font-mono bg-[#FACC15] text-[#0A0A0C] border-none font-bold">
              {selectedTemplate.ats}% ATS Score
            </Badge>
            <Button variant="default" size="sm" icon={<Download className="w-3.5 h-3.5 text-[#0A0A0C]" />}>
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Main 3-Column Layout from Wireframe v1 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-64px)] pb-20">
        {/* ----------------------------------------------------------------- */}
        {/* LEFT COLUMN: "Your Info" (Info, Contact, Certificates, AI Tips)   */}
        {/* ----------------------------------------------------------------- */}
        <aside className="w-full lg:w-80 p-5 space-y-5 overflow-y-auto bg-white/60 dark:bg-[#101015]/70 border-r border-black/[0.08] dark:border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#6C5CE7]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-white">
              Your Information
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                type="text"
                value={resumeData.name}
                onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Target Title</Label>
              <Input
                type="text"
                value={resumeData.title}
                onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={resumeData.email}
                onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Executive Summary</Label>
              <Textarea
                rows={3}
                value={resumeData.summary}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Uploaded Certificates & Credentials */}
          <div className="space-y-2">
            <Label>Verified Certificates</Label>
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#16A34A]" />
                <span className="font-semibold truncate">AWS Solutions Architect Pro</span>
              </div>
              <Badge variant="success" size="sm">Verified</Badge>
            </div>
          </div>

          <Separator />

          {/* Contextual AI Feedback Tip */}
          <Card className="p-3.5 bg-[#6C5CE7]/10 border-[#6C5CE7]/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6C5CE7] dark:text-[#8F82FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Formatting Signal</span>
            </div>
            <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
              Target role requires deep stream-processing metrics. Ensure Kafka throughput is quantified.
            </p>
          </Card>
        </aside>

        {/* ----------------------------------------------------------------- */}
        {/* CENTER COLUMN: Live Physical Document Retina Canvas (Hero)         */}
        {/* ----------------------------------------------------------------- */}
        <main className="flex-1 p-6 lg:p-8 bg-black/[0.03] dark:bg-black/40 flex items-center justify-center overflow-y-auto">
          <Card
            variant="elevated"
            className="relative w-full max-w-md aspect-[3/4] overflow-hidden shadow-2xl shadow-black/25 dark:shadow-black/80 border-2 border-black/[0.12] dark:border-white/[0.15] bg-white transition-transform duration-300 hover:scale-[1.01]"
          >
            <Image
              src={selectedTemplate.file}
              alt={selectedTemplate.name}
              fill
              priority
              className="object-cover object-top"
            />
            <div className="absolute top-3 right-3">
              <Badge variant="neutral" size="sm" className="bg-black/85 text-white font-mono border-none shadow-md">
                {selectedTemplate.ats}% ATS Verified
              </Badge>
            </div>
          </Card>
        </main>

        {/* ----------------------------------------------------------------- */}
        {/* RIGHT COLUMN: "Templates & Suggestions" (Picker + XYZ Rewrites)   */}
        {/* ----------------------------------------------------------------- */}
        <aside className="w-full lg:w-80 p-5 space-y-5 overflow-y-auto bg-white/60 dark:bg-[#101015]/70 border-l border-black/[0.08] dark:border-white/[0.08] flex-shrink-0">
          <div className="space-y-2">
            <Label>Quick Template Switcher</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTemplate.id === tmpl.id
                      ? 'border-[#6C5CE7] bg-[#6C5CE7]/15 ring-1 ring-[#6C5CE7]'
                      : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/20'
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">{tmpl.name}</div>
                  <span className="text-[10px] font-mono text-[#16A34A] font-bold">
                    {tmpl.ats}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* AI Google XYZ Rewrite Proposal */}
          <Card
            variant="elevated"
            className="p-4 border-2 border-[#FACC15] bg-gradient-to-br from-[#FACC15]/15 via-white dark:via-[#16161D] to-transparent space-y-3 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FACC15]" />
              <h4 className="text-xs font-black text-[#0A0A0C] dark:text-white">
                Google XYZ Metric Optimization
              </h4>
            </div>

            <div className="text-[11px] text-[#7A7A85] line-through">
              &quot;Helped team optimize Kafka streaming latency.&quot;
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#0E0E12] border border-[#FACC15]/40 text-xs font-semibold text-[#0A0A0C] dark:text-white shadow-xs">
              &quot;Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.&quot;
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setAppliedRewrite(true)}
              className="w-full text-xs font-extrabold text-[#0A0A0C]"
            >
              {appliedRewrite ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4 text-[#0A0A0C]" />}
              <span>{appliedRewrite ? 'Optimization Applied' : '1-Click Apply'}</span>
            </Button>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
