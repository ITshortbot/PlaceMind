'use client';

// ============================================================================
// File: frontend/src/app/resumes/upload/page.tsx
// Description: Resume Upload & In-Memory Parsing Wizard with sequential stage checklist
//              and inline editable structured fields.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PARSING_STAGES = [
  { id: 1, label: 'Reading in-memory PDF byte stream (PyMuPDF)...' },
  { id: 2, label: 'Identifying document structure & semantic sections...' },
  { id: 3, label: 'Extracting technical skills, metrics & entities...' },
  { id: 4, label: 'Validating single-column ATS parser compliance...' },
];

export default function ResumeUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedStage, setCompletedStage] = useState(0);
  const [isParsed, setIsParsed] = useState(false);

  // Parsed Editable Fields
  const [parsedData, setParsedData] = useState({
    name: 'Rohan K. Patel',
    email: 'rohan.patel@email.com',
    phone: '+1 (555) 234-5678',
    targetTitle: 'Staff Software Architect',
    summary:
      'High-performance distributed systems engineer with 8+ years building low-latency stream processing architectures.',
    skills: 'Apache Kafka, PostgreSQL, pgvector, Go, Rust, Python, Next.js 15, Kubernetes',
    experienceCompany: 'Stripe · Core Infrastructure',
    experienceRole: 'Senior Distributed Systems Engineer',
    experienceDates: '2022 — Present',
    experienceBullet:
      'Scaled distributed Kafka streaming pipelines to 4.5M events/sec, cutting p99 latency by 42%.',
  });

  const handleSimulateUpload = () => {
    setIsProcessing(true);
    setCompletedStage(0);

    // Simulate sequential animated parsing stages
    setTimeout(() => setCompletedStage(1), 700);
    setTimeout(() => setCompletedStage(2), 1400);
    setTimeout(() => setCompletedStage(3), 2100);
    setTimeout(() => {
      setCompletedStage(4);
      setIsProcessing(false);
      setIsParsed(true);
    }, 2800);
  };

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Resumes', href: '/dashboard' },
          { label: 'Upload & Parse' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight">
            Upload & Audit Your Resume
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA]">
            Extract structured fields in-memory with zero disk egress and verify single-column formatting.
          </p>
        </div>

        {/* State 1: Drag & Drop Zone */}
        {!isProcessing && !isParsed && (
          <div className="space-y-6">
            <div
              onClick={handleSimulateUpload}
              className="p-10 sm:p-14 rounded-3xl border-2 border-dashed border-[#6C5CE7]/40 hover:border-[#6C5CE7] bg-white/60 dark:bg-[#141417]/60 hover:bg-[#6C5CE7]/5 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#8F82FF] flex items-center justify-center group-hover:scale-110 transition-transform mb-4 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1E] dark:text-white">
                Drag and drop your resume PDF here
              </h3>
              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
                Supports PDF, DOCX, and LaTeX (.tex) up to 10MB
              </p>
              <div className="mt-5">
                <Button variant="primary" size="sm">
                  Browse Files
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#141417]/70 border border-black/[0.06] dark:border-white/[0.06] flex items-center gap-3 text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
              <span>
                <strong>100% Privacy Sandbox:</strong> Files are processed in temporary memory buffers and never written to disk or used for model training.
              </span>
            </div>
          </div>
        )}

        {/* State 2: Sequential Parsing Pipeline Checklist */}
        {isProcessing && (
          <div className="p-8 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-[#6C5CE7]/30 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[#6C5CE7] animate-spin" />
              <h3 className="text-base font-bold text-[#1A1A1E] dark:text-white">
                Parsing Resume In-Memory...
              </h3>
            </div>

            <div className="space-y-3.5">
              {PARSING_STAGES.map((stage) => {
                const isDone = completedStage >= stage.id;
                const isCurrent = completedStage === stage.id - 1;

                return (
                  <div
                    key={stage.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 text-xs font-semibold ${
                      isDone
                        ? 'bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A] dark:text-[#22C55E]'
                        : isCurrent
                        ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/30 text-[#6C5CE7] dark:text-[#8F82FF]'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-transparent text-[#8A8A92]'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#6C5CE7] flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 flex-shrink-0" />
                    )}
                    <span>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* State 3: Parsed Structured Preview & Inline Corrections */}
        {isParsed && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-[#16A34A] dark:text-[#22C55E] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resume parsed successfully (4 Semantic Sections Identified)</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#16A34A]/20 text-[#16A34A]">
                ATS Score: 94.8%
              </span>
            </div>

            {/* Editable Sections Accordion */}
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-xl space-y-5">
              <h3 className="text-sm font-bold text-[#1A1A1E] dark:text-white">
                Review & Edit Extracted Fields
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Full Name</label>
                  <input
                    type="text"
                    value={parsedData.name}
                    onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Email</label>
                  <input
                    type="text"
                    value={parsedData.email}
                    onChange={(e) => setParsedData({ ...parsedData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Executive Summary</label>
                <textarea
                  rows={2}
                  value={parsedData.summary}
                  onChange={(e) => setParsedData({ ...parsedData, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] leading-relaxed"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Extracted Key Skills</label>
                <input
                  type="text"
                  value={parsedData.skills}
                  onChange={(e) => setParsedData({ ...parsedData, skills: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] font-medium"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-bold uppercase text-[#8A8A92]">Key Experience Bullet</label>
                <input
                  type="text"
                  value={parsedData.experienceBullet}
                  onChange={(e) => setParsedData({ ...parsedData, experienceBullet: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] font-medium text-[#6C5CE7]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsParsed(false);
                  setIsProcessing(false);
                }}
              >
                Upload Different File
              </Button>

              <Link href="/resumes/stripe-staff/analyze">
                <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Continue to ATS Analysis
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
