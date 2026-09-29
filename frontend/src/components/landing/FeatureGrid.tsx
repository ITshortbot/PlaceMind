'use client';

// ============================================================================
// File: frontend/src/components/landing/FeatureGrid.tsx
// Description: 6 computational capability cards with cursor spotlight border glow
// ============================================================================

import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Video,
  ShieldCheck,
  Download,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export function FeatureGrid() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const features = [
    {
      icon: Target,
      title: 'ATS Match Scoring',
      tag: 'pgvector 384-d',
      desc: 'Decomposes your resume and job listings into 384-dimensional latent space to compute true semantic alignment rather than simple string matching.',
    },
    {
      icon: Sparkles,
      title: 'Tailored Bullet Rewriting',
      tag: 'XYZ Formula',
      desc: 'Transforms generic experience descriptions into quantifiable, impact-driven bullet points formatted precisely to pass recruiter screening.',
    },
    {
      icon: Video,
      title: 'Adaptive Mock Interviews',
      tag: 'Voice & Video AI',
      desc: 'Simulates technical phone screens and behavioral rounds. The AI listens to your responses and asks intelligent follow-up inquiries.',
    },
    {
      icon: ShieldCheck,
      title: 'Local Privacy Mode',
      tag: '100% Zero Egress',
      desc: 'Connect to your own local LM Studio instance at localhost:1234. Your PDF resume, PII, and company notes never leave your personal machine.',
    },
    {
      icon: Download,
      title: 'Instant ATS PDF Export',
      tag: 'Standard LaTeX',
      desc: 'Generate clean, single-column, ATS-parseable PDF resumes structured to ensure 100% parsability across Workday, Greenhouse, and Lever.',
    },
    {
      icon: BarChart3,
      title: 'Bipartite Gap Matrix',
      tag: 'Audit Engine',
      desc: 'Visualize every single job requirement side-by-side with your resume chunks, tagged with semantic match status: Covered, Weak, or Missing.',
    },
  ];

  return (
    <section id="features" className="py-24 md:py-36 bg-[#0E0E11] border-y border-[#2A2A30] relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-[#6C5CE7]/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 scroll-reveal">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7D6FF0] px-3 py-1 rounded-full bg-[#1C1C21] border border-[#2A2A30]">
            COMPUTATIONAL CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F7] mt-3">
            Engineered for precision at every career step
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] mt-2">
            Modular architecture combining deep vector retrieval, dual-engine LLM routing, and interactive mock rehearsals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                onMouseMove={handleMouseMove}
                className={`p-8 rounded-2xl bg-[#141417] border border-[#2A2A30] hover:border-[#6C5CE7]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#6C5CE7]/10 group relative flex flex-col justify-between overflow-hidden scroll-reveal stagger-${(i % 3) + 1}`}
              >
                {/* Radial Cursor Spotlight overlay */}
                <div
                  className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{
                    background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(108, 92, 231, 0.12), transparent 80%)`,
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1C1C21] border border-[#2A2A30] group-hover:border-[#6C5CE7]/40 flex items-center justify-center text-[#7D6FF0] group-hover:scale-110 transition-all shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded-full bg-[#1C1C21] border border-[#2A2A30] text-[#A1A1AA] group-hover:text-[#F5F5F7] transition-colors">
                      {f.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#F5F5F7] mb-2 group-hover:text-[#F5F5F7] transition-colors">
                    {f.title}
                  </h3>

                  <p className="text-sm text-[#A1A1AA] leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#2A2A30]/60 flex items-center text-xs text-[#6C5CE7] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
                  <span>Learn technical documentation</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
