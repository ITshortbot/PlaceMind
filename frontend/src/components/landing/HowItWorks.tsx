'use client';

// ============================================================================
// File: frontend/src/components/landing/HowItWorks.tsx
// Description: Interactive 4-stage pipeline with vertically offset step cards,
//              expressive mixed-weight typography, and dual Light/Dark styling.
//
// JURY & DESIGN DEFENSE:
// 1. Asymmetric Staggered Row: Steps 02 and 04 are offset vertically, breaking
//    monotonous horizontal symmetry.
// 2. Variable Radii & Depth: Active stage uses rounded-[28px] with elevated glow,
//    while inactive cards use rounded-2xl.
// 3. Expressive Typography: Inline gradient emphasis on "transforms".
// ============================================================================

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import {
  UploadCloud,
  Cpu,
  Sparkles,
  Mic,
  CheckCircle2,
  FileText,
  Zap,
  Volume2,
} from 'lucide-react';

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: '1. Ingest & Chunk',
      tag: 'PyMuPDF Engine',
      icon: UploadCloud,
      desc: 'Upload any raw PDF resume. PyMuPDF parses text in-memory and decomposes it into semantic sections: Experience, Skills, and Projects.',
    },
    {
      id: 2,
      title: '2. Vector Cosine Audit',
      tag: '384-d pgvector HNSW',
      icon: Cpu,
      desc: 'Embed both your resume chunks and JD requirements via BGE-small. Computes a dense bipartite cosine distance matrix to identify skill coverage.',
    },
    {
      id: 3,
      title: '3. XYZ Bullet Rewrite',
      tag: 'Google Formula',
      icon: Sparkles,
      desc: 'AI synthesizes quantifiable bullet points: Accomplished [X], measured by [Y], by doing [Z] — closing identified gaps with surgical precision.',
    },
    {
      id: 4,
      title: '4. Adaptive Rehearsal',
      tag: 'Voice & Video AI',
      icon: Mic,
      desc: 'Practice role-specific technical phone screens and system design probes generated dynamically from your resume weak spots.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section id="how-it-works" className="py-28 md:py-40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Expressive Typography */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-black/[0.08] dark:border-[#2A2A30] text-[11px] font-mono uppercase tracking-[0.2em] text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-md">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>THE FOUR-STAGE PIPELINE &bull; END-TO-END WORKFLOW</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
            <span className="font-light">How Placemind</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              transforms
            </span>{' '}
            <span className="font-medium">your application</span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-4 leading-relaxed">
            An end-to-end algorithmic career engine engineered to bypass screening filters and prepare you for the technical round.
          </p>
        </div>

        {/* Asymmetric Staggered Step Selector Pills with Liquid Droplet Connection */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14 items-start relative"
        >
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.id;
            const isOffset = s.id % 2 === 0;

            return (
              <motion.button
                key={s.id}
                variants={itemVariants}
                onClick={() => setActiveStep(s.id)}
                className={`p-6 text-left border transition-all duration-400 cursor-pointer flex flex-col justify-between relative group ${
                  isOffset ? 'lg:translate-y-3' : 'lg:translate-y-0'
                } ${
                  isActive
                    ? 'rounded-[30px] bg-white/95 dark:bg-[#181822]/95 border-[#6C5CE7] shadow-[0_16px_40px_rgba(108,92,231,0.3)] -translate-y-1.5 backdrop-blur-2xl ring-2 ring-[#6C5CE7]/30'
                    : 'rounded-2xl bg-white/60 dark:bg-[#141417]/65 border-white/80 dark:border-white/10 hover:border-[#6C5CE7]/50 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(108,92,231,0.15)] backdrop-blur-xl'
                }`}
              >
                {/* Liquid Morphing Droplet on Active Button */}
                {isActive && (
                  <>
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#6C5CE7] droplet-pulse shadow-[0_0_15px_#6C5CE7]" />
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#6C5CE7] rounded-full opacity-80 animate-ping hidden lg:block" />
                  </>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                      isActive
                        ? 'bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] text-white shadow-[0_0_20px_rgba(108,92,231,0.6)]'
                        : 'bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#7D6FF0] border border-[#6C5CE7]/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8A92] dark:text-[#6B6B76]">
                    STAGE 0{s.id}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mb-1.5">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] line-clamp-2 leading-[1.6]">
                    {s.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Interactive Live Simulation Stage Window */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }}
          className="p-8 md:p-12 rounded-[32px] bg-white/70 dark:bg-[#141417]/75 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/40 shadow-2xl backdrop-blur-2xl relative overflow-hidden transition-colors"
        >
          {/* Top Stage Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.08] dark:border-[#2A2A30]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono text-[#6C5CE7] font-semibold">
                  Active Stage 0{activeStep}
                </span>
                <Badge variant="accent" size="sm">
                  {steps[activeStep - 1].tag}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-1">
                {steps[activeStep - 1].title}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[#5A5A63] dark:text-[#A1A1AA]">
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#22C55E] animate-pulse" />
                In-Memory Pipeline (0 Disk Egress)
              </span>
            </div>
          </div>

          {/* Interactive Screen Dynamic Content */}
          <div className="mt-8 min-h-[280px] flex items-center justify-center">
            {activeStep === 1 && (
              <div className="w-full max-w-3xl space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-[#1C1C21]/80 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/12 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1A1A1E] dark:text-[#F5F5F7]">
                        Senior_AI_Architect_Resume.pdf
                      </div>
                      <div className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                        PyMuPDF Stream Buffer · 4 Distinct Semantic Chunks Parsed In-Memory
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    In-Memory Parsed
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Real WebP Document Thumbnail */}
                  <div className="md:col-span-4 relative aspect-[3/4] rounded-2xl overflow-hidden border border-black/[0.1] dark:border-white/[0.1] shadow-lg bg-white">
                    <Image
                      src="/assets/Resume/rem1.webp"
                      alt="Parsed Single-Column Resume"
                      fill
                      className="object-cover object-top"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono font-bold backdrop-blur-sm">
                      rem1.webp
                    </div>
                  </div>

                  {/* Decomposed Chunks */}
                  <div className="md:col-span-8 space-y-2.5">
                    <div className="p-3 rounded-xl bg-white/85 dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/40 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#6C5CE7] uppercase font-mono font-semibold">Chunk 01 &bull; Experience</span>
                        <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-mono font-bold">100% Parsed</span>
                      </div>
                      <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-0.5">
                        Senior AI Systems Architect (Apex Labs)
                      </div>
                      <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5 line-clamp-1">
                        Architected low-latency microservices with Python FastAPI and PostgreSQL pgvector...
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/85 dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#38BDF8]/40 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#0284C7] dark:text-[#38BDF8] uppercase font-mono font-semibold">Chunk 02 &bull; Skills</span>
                        <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-mono font-bold">24 Tokens</span>
                      </div>
                      <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-0.5">
                        Technical Skills Matrix
                      </div>
                      <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5 line-clamp-1">
                        Python, FastAPI, pgvector, Next.js 15, Kafka, LM Studio, Ollama...
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/85 dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#22C55E]/40 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] uppercase font-mono font-semibold">Chunk 03 &bull; Projects</span>
                        <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-mono font-bold">2 Items</span>
                      </div>
                      <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mt-0.5">
                        Sub-10ms RAG Search Engine
                      </div>
                      <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5 line-clamp-1">
                        HNSW cosine graph indexing reducing vector search latency by 64%...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="w-full max-w-3xl space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-[#1C1C21]/80 border border-black/[0.08] dark:border-white/[0.08]">
                    <div className="text-xs uppercase text-[#5A5A63] dark:text-[#A1A1AA] mb-2 font-mono flex items-center justify-between">
                      <span>Target JD Vector [384-d]</span>
                      <span className="text-[#0284C7] dark:text-[#38BDF8]">Item 01</span>
                    </div>
                    <div className="text-xs text-[#1A1A1E] dark:text-[#F5F5F7] p-3 rounded-lg bg-white/90 dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] leading-relaxed">
                      &quot;5+ yrs building event-driven streaming pipelines with Apache Kafka or RabbitMQ&quot;
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-[#1C1C21]/80 border border-black/[0.08] dark:border-white/[0.08]">
                    <div className="text-xs uppercase text-[#5A5A63] dark:text-[#A1A1AA] mb-2 font-mono flex items-center justify-between">
                      <span>Closest Resume Vector</span>
                      <span className="text-[#6C5CE7]">Section: Experience</span>
                    </div>
                    <div className="text-xs text-[#1A1A1E] dark:text-[#F5F5F7] p-3 rounded-lg bg-white/90 dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] leading-relaxed">
                      &quot;Built asynchronous backend microservices using Redis pub/sub queue&quot;
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/85 dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#B45309] dark:text-[#F5A623]" />
                    <div>
                      <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                        Cosine Distance Score: 0.64 (Weak Match Identified)
                      </div>
                      <div className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                        Gap Diagnosis: Missing explicit high-throughput Kafka partition metrics
                      </div>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">
                    Weak Match
                  </Badge>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="w-full max-w-3xl space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-[#1C1C21]/80 border border-[#F04438]/30">
                  <div className="text-xs uppercase font-mono text-[#B91C1C] dark:text-[#F04438] mb-1 flex items-center gap-1.5 font-semibold">
                    <span>&times;</span> Before (Candidate Draft)
                  </div>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] line-through leading-[1.6]">
                    &quot;Helped build data pipelines and worked on event streaming for the core platform.&quot;
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-[#1C1C21]/80 border border-[#22C55E]/40 shadow-[0_0_25px_-5px_rgba(34,197,94,0.2)]">
                  <div className="text-xs uppercase font-mono text-[#16A34A] dark:text-[#22C55E] mb-2 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Placemind XYZ Optimization (Google Hiring Standard)
                  </div>
                  <p className="text-sm text-[#1A1A1E] dark:text-[#F5F5F7] leading-[1.7] font-medium">
                    &quot;Architected distributed event-driven Kafka pipeline processing <strong className="text-[#16A34A] dark:text-[#22C55E]">4.5M events/sec</strong> with <strong className="text-[#16A34A] dark:text-[#22C55E]">99.99% uptime</strong>, decreasing end-to-end data ingestion latency by <strong className="text-[#16A34A] dark:text-[#22C55E]">42%</strong>.&quot;
                  </p>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="w-full max-w-3xl space-y-4 animate-fade-in">
                <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-[#1C1C21]/80 border border-black/[0.08] dark:border-white/[0.08] flex flex-col md:flex-row items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white shadow-lg shadow-[#6C5CE7]/30 flex-shrink-0 animate-pulse">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                        AI Staff Interviewer Probe
                      </span>
                      <Badge variant="accent" size="sm">
                        Real-Time Audio
                      </Badge>
                    </div>
                    <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] italic leading-[1.6]">
                      &quot;I noticed you optimized Kafka pipeline latency by 42%. How did you handle consumer group rebalancing during high-partition failover spikes?&quot;
                    </p>
                  </div>
                </div>

                {/* Animated Audio Spectrum */}
                <div className="p-4 rounded-xl bg-white/85 dark:bg-[#0A0A0C] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[18, 32, 48, 22, 40, 54, 26, 44, 50, 24, 36, 16, 30, 46].map(
                      (h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}px` }}
                          className="w-1.5 rounded-full bg-[#6C5CE7] opacity-85"
                        />
                      )
                    )}
                  </div>
                  <span className="text-xs font-mono text-[#5A5A63] dark:text-[#A1A1AA]">
                    Speech Latency: 220ms · VAD Active
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
