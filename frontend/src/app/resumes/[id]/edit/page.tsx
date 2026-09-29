'use client';

// ============================================================================
// File: frontend/src/app/resumes/[id]/edit/page.tsx
// Description: Two-Pane Resume Editor with real-time document preview on left,
//              inline Google XYZ bullet rewrite suggestions on right, and live mini ATS score.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Check,
  Zap,
  Download,
  FileCheck,
  TrendingUp,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function ResumeEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [score, setScore] = useState(94.8);
  const [accepted1, setAccepted1] = useState(false);
  const [accepted2, setAccepted2] = useState(false);

  const [formData, setFormData] = useState({
    title: 'Staff Software Architect',
    bullet1: 'Helped team optimize Kafka streaming latency and services.',
    bullet2: 'Maintained PostgreSQL database cluster and ran queries for search.',
    skills: 'Apache Kafka, PostgreSQL, pgvector, Go, Rust, Next.js 15, Kubernetes',
  });

  const handleApply1 = () => {
    setFormData((prev) => ({
      ...prev,
      bullet1: 'Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.',
    }));
    setAccepted1(true);
    setScore(97.2);
  };

  const handleApply2 = () => {
    setFormData((prev) => ({
      ...prev,
      bullet2: 'Engineered cloud database index handling 250M queries daily with 99.99% uptime and zero data egress.',
    }));
    setAccepted2(true);
    setScore(98.6);
  };

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Resumes', href: '/dashboard' },
          { label: 'Resume Generator & Editor' },
        ]}
        actionButton={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#16A34A]/15 text-[#16A34A] dark:text-[#22C55E]">
              {score}% ATS Score
            </span>
            <Button variant="primary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
              Export PDF
            </Button>
          </div>
        }
      />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-64px)]">
        {/* Left Pane: Live Document Retina Preview */}
        <div className="flex-1 p-6 lg:p-8 bg-black/[0.03] dark:bg-black/40 border-b lg:border-b-0 lg:border-r border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center overflow-y-auto">
          <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-black/15 dark:border-white/15 bg-white">
            <Image
              src="/assets/Resume/rem1.webp"
              alt="Live Document Preview"
              fill
              className="object-cover object-top"
            />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/80 text-white text-[10px] font-bold shadow">
              Single-Column LaTeX Template
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#22C55E] text-white text-[10px] font-bold shadow">
              {score}% Verified ATS
            </div>
          </div>
        </div>

        {/* Right Pane: Editing Controls & Inline Google XYZ Suggestions */}
        <div className="w-full lg:w-[480px] p-6 space-y-6 overflow-y-auto bg-white/70 dark:bg-[#121217]/90 backdrop-blur-xl">
          <div>
            <h2 className="text-base font-bold text-[#1A1A1E] dark:text-white">
              Experience Optimization Studio
            </h2>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5">
              Review and apply Google XYZ metric suggestions to maximize recruiter ranking.
            </p>
          </div>

          {/* Bullet 1 AI Suggestion */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Bullet 01: Stream Pipelines</span>
              <Badge variant="accent" size="sm">+2.4% ATS Rank</Badge>
            </div>

            <div className="text-xs text-[#8A8A92] line-through">
              &quot;{formData.bullet1}&quot;
            </div>

            <div className="p-3 rounded-xl bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-xs font-medium text-[#1A1A1E] dark:text-white">
              <span className="text-[#6C5CE7] font-bold block mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recommended Rewrite:
              </span>
              &quot;Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting latency by 42%.&quot;
            </div>

            <Button
              variant={accepted1 ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleApply1}
              className="w-full text-xs font-bold"
            >
              {accepted1 ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{accepted1 ? 'Optimization Applied' : 'Accept & Apply'}</span>
            </Button>
          </div>

          {/* Bullet 2 AI Suggestion */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181820] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Bullet 02: PostgreSQL & Vectors</span>
              <Badge variant="accent" size="sm">+1.4% ATS Rank</Badge>
            </div>

            <div className="text-xs text-[#8A8A92] line-through">
              &quot;{formData.bullet2}&quot;
            </div>

            <div className="p-3 rounded-xl bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-xs font-medium text-[#1A1A1E] dark:text-white">
              <span className="text-[#6C5CE7] font-bold block mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recommended Rewrite:
              </span>
              &quot;Engineered cloud database index handling 250M queries daily with 99.99% uptime and zero data egress.&quot;
            </div>

            <Button
              variant={accepted2 ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleApply2}
              className="w-full text-xs font-bold"
            >
              {accepted2 ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{accepted2 ? 'Optimization Applied' : 'Accept & Apply'}</span>
            </Button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
