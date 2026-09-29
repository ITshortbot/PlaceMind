'use client';

// ============================================================================
// File: frontend/src/components/landing/ResumeGallery.tsx
// Description: Interactive ATS Resume Template Gallery with 3 Initial Cards +
//              "View More Templates (18)" expandable toggle & full-screen modal.
// ============================================================================

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FileCheck,
  CheckCircle2,
  Download,
  Eye,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ResumeTemplate {
  id: number;
  filename: string;
  name: string;
  category: 'Software Engineering' | 'AI & ML' | 'Full-Stack' | 'Leadership' | 'Data Science' | 'Systems & DevOps';
  role: string;
  atsScore: number;
  tags: string[];
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 1,
    filename: '/assets/Resume/rem1.webp',
    name: 'Standard ATS Minimalist',
    category: 'Software Engineering',
    role: 'Senior Software Engineer',
    atsScore: 98,
    tags: ['Single-Column', 'LaTeX Styled', 'Workday Optimized'],
  },
  {
    id: 3,
    filename: '/assets/Resume/rem3.webp',
    name: 'AI & Systems Architect',
    category: 'AI & ML',
    role: 'Staff AI Systems Architect',
    atsScore: 99,
    tags: ['Google XYZ Bullets', 'pgvector & RAG', '100% Parsable'],
  },
  {
    id: 4,
    filename: '/assets/Resume/rem4.webp',
    name: 'Modern Full-Stack Pro',
    category: 'Full-Stack',
    role: 'Full-Stack TypeScript Engineer',
    atsScore: 97,
    tags: ['Next.js 15', 'FastAPI', 'High Contrast'],
  },
  {
    id: 2,
    filename: '/assets/Resume/rem2.webp',
    name: 'Executive Technical Lead',
    category: 'Leadership',
    role: 'VP of Engineering / Tech Lead',
    atsScore: 95,
    tags: ['Metrics Heavy', 'Executive', 'Greenhouse Verified'],
  },
  {
    id: 5,
    filename: '/assets/Resume/rem5.webp',
    name: 'Distributed Cloud & DevOps',
    category: 'Systems & DevOps',
    role: 'Cloud Infrastructure Engineer',
    atsScore: 96,
    tags: ['Kubernetes', 'AWS/GCP', 'Clean Hierarchy'],
  },
  {
    id: 6,
    filename: '/assets/Resume/rem6.webp',
    name: 'Data & Machine Learning Specialist',
    category: 'Data Science',
    role: 'Senior Data Scientist',
    atsScore: 98,
    tags: ['PyTorch', 'Vector Embeddings', 'Quantitative'],
  },
  {
    id: 7,
    filename: '/assets/Resume/rem7.webp',
    name: 'Algorithmic Backend Specialist',
    category: 'Software Engineering',
    role: 'Backend Core Engineer',
    atsScore: 97,
    tags: ['Rust / Go', 'Microservices', 'Clean LaTeX'],
  },
  {
    id: 8,
    filename: '/assets/Resume/rem8.webp',
    name: 'Product-Focused Frontend Lead',
    category: 'Full-Stack',
    role: 'Lead Frontend Developer',
    atsScore: 94,
    tags: ['UI/UX Systems', 'React / Tailwind', 'Lever Parsable'],
  },
  {
    id: 9,
    filename: '/assets/Resume/rem9.webp',
    name: 'Deep Learning Researcher',
    category: 'AI & ML',
    role: 'AI Research Scientist',
    atsScore: 99,
    tags: ['Publications', 'Transformer Architectures', 'BGE Embeddings'],
  },
  {
    id: 10,
    filename: '/assets/Resume/rem10.webp',
    name: 'Enterprise Platform Engineer',
    category: 'Systems & DevOps',
    role: 'Principal Platform Engineer',
    atsScore: 96,
    tags: ['Terraform', 'Kafka Streams', 'High Scalability'],
  },
  {
    id: 11,
    filename: '/assets/Resume/rem11.webp',
    name: 'Engineering Director / VP',
    category: 'Leadership',
    role: 'Director of Engineering',
    atsScore: 95,
    tags: ['Team Scaling', 'Budget / OKR', 'Executive'],
  },
  {
    id: 12,
    filename: '/assets/Resume/rem12.webp',
    name: 'Quant & Big Data Architect',
    category: 'Data Science',
    role: 'Quantitative ML Engineer',
    atsScore: 98,
    tags: ['HFT / Real-Time', 'Low Latency', 'pgvector'],
  },
  {
    id: 13,
    filename: '/assets/Resume/rem13.webp',
    name: 'Full-Stack Mobile & Web',
    category: 'Full-Stack',
    role: 'Mobile & Web Architect',
    atsScore: 95,
    tags: ['React Native', 'Node.js', 'Cross-Platform'],
  },
  {
    id: 14,
    filename: '/assets/Resume/rem14.webp',
    name: 'High-Throughput Systems Lead',
    category: 'Software Engineering',
    role: 'Distributed Systems Engineer',
    atsScore: 97,
    tags: ['eBPF / Kernel', 'Zero Egress', 'Tauri / C++'],
  },
  {
    id: 15,
    filename: '/assets/Resume/rem15.webp',
    name: 'Applied LLM Applications Lead',
    category: 'AI & ML',
    role: 'GenAI Applications Engineer',
    atsScore: 99,
    tags: ['Gemini 2.5', 'Ollama / LM Studio', 'Multi-Agent'],
  },
  {
    id: 16,
    filename: '/assets/Resume/rem16.webp',
    name: 'Security & Zero-Trust Engineer',
    category: 'Systems & DevOps',
    role: 'Security Infrastructure Engineer',
    atsScore: 96,
    tags: ['Zero Egress', 'SOC2 / GDPR', 'Hardened'],
  },
  {
    id: 17,
    filename: '/assets/Resume/rem17.webp',
    name: 'Senior Full-Stack Generalist',
    category: 'Full-Stack',
    role: 'Senior Full-Stack Engineer',
    atsScore: 97,
    tags: ['PostgreSQL', 'FastAPI', 'Next.js 15'],
  },
  {
    id: 18,
    filename: '/assets/Resume/rem18.webp',
    name: 'Principal Analytics Architect',
    category: 'Data Science',
    role: 'Principal Analytics Engineer',
    atsScore: 96,
    tags: ['Snowflake / dbt', 'Bipartite Matching', 'Executive'],
  },
];

const CATEGORIES = [
  'All Templates (18)',
  'AI & ML',
  'Software Engineering',
  'Full-Stack',
  'Systems & DevOps',
  'Data Science',
  'Leadership',
] as const;

export function ResumeGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Templates (18)');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activePreview, setActivePreview] = useState<ResumeTemplate | null>(null);

  const filteredTemplates = RESUME_TEMPLATES.filter((tpl) => {
    if (selectedCategory === 'All Templates (18)') return true;
    return tpl.category === selectedCategory;
  });

  // Display top 3 initially, or all when expanded
  const displayedTemplates = isExpanded ? filteredTemplates : filteredTemplates.slice(0, 3);

  return (
    <section id="templates" className="py-24 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Expressive Mixed-Weight Typography */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-black/[0.08] dark:border-[#2A2A30] text-[11px] font-mono uppercase tracking-[0.2em] text-[#6C5CE7] dark:text-[#7D6FF0] mb-4 shadow-sm backdrop-blur-md">
            <span className="w-2 h-0.5 rounded-full bg-[#6C5CE7]" />
            <span>AUTHENTIC ATS TEMPLATE GALLERY &bull; 18 VERIFIED LAYOUTS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
            <span className="font-light">Battle-tested templates</span>{' '}
            <span className="font-extrabold bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              guaranteed
            </span>{' '}
            <span className="font-medium">to pass screening</span>
          </h2>

          <p className="text-base sm:text-lg text-[#5A5A63] dark:text-[#A1A1AA] mt-4 leading-relaxed">
            Clean single-column technical resume architectures engineered for 100% parsability across Workday, Greenhouse, and Lever.
          </p>
        </div>

        {/* Category Filter Pills with Liquid Organic Bounce */}
        <div className="flex items-center justify-center flex-wrap gap-3 mb-12">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsExpanded(true); // Auto-expand when selecting a specific filter
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center gap-1.5 btn-liquid ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8F82FF] text-white shadow-[0_0_25px_rgba(108,92,231,0.5)] scale-105 ring-2 ring-[#6C5CE7]/30'
                    : 'bg-white/70 dark:bg-[#141417]/75 text-[#5A5A63] dark:text-[#A1A1AA] border border-white/80 dark:border-white/10 hover:border-[#6C5CE7]/50 hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] backdrop-blur-xl hover:scale-105'
                }`}
              >
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white droplet-pulse" />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Responsive Grid of Resume Cards (Top 3 or All) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          <AnimatePresence>
            {displayedTemplates.map((template, idx) => {
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35, delay: (idx % 3) * 0.08 }}
                  className="group relative rounded-[28px] bg-white/80 dark:bg-[#141417]/85 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/50 shadow-xl hover:shadow-[0_20px_50px_rgba(108,92,231,0.2)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Resume Image Preview with Zoom Hover & Glass Overlay */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/[0.03] dark:bg-[#0A0A0C] border-b border-black/[0.06] dark:border-white/[0.06]">
                    <Image
                      src={template.filename}
                      alt={template.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                      <button
                        onClick={() => setActivePreview(template)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/90 text-[#1A1A1E] text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer hover:bg-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#6C5CE7]" />
                        <span>Inspect Template</span>
                      </button>

                      <span className="px-2.5 py-1 rounded-lg bg-[#22C55E]/90 text-white text-[10px] font-mono font-bold">
                        {template.atsScore}% ATS PASS
                      </span>
                    </div>

                    {/* Top-Right Score Pill */}
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-white/90 dark:bg-[#141417]/95 border border-black/[0.08] dark:border-white/[0.08] shadow-md backdrop-blur-md flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#16A34A] dark:text-[#22C55E]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{template.atsScore}% Match</span>
                    </div>
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8A92] dark:text-[#6B6B76]">
                        {template.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#6C5CE7] font-semibold">
                        TEMPLATE 0{template.id < 10 ? `0${template.id}` : template.id}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight group-hover:text-[#6C5CE7] transition-colors">
                      {template.name}
                    </h3>

                    <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
                      Target Role: <strong className="text-[#1A1A1E] dark:text-[#F5F5F7] font-medium">{template.role}</strong>
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-[#1C1C21] text-[#5A5A63] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.06]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                      <button
                        onClick={() => setActivePreview(template)}
                        className="text-[#6C5CE7] dark:text-[#7D6FF0] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Preview Full Resume</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[11px] font-mono text-[#8A8A92] dark:text-[#6B6B76]">
                        LaTeX / PDF
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* View More Templates Expand / Collapse Button */}
        <div className="mt-14 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-8 py-3.5 rounded-full bg-white/80 dark:bg-[#141417]/85 border border-white/80 dark:border-white/10 hover:border-[#6C5CE7]/60 shadow-[0_8px_30px_rgba(108,92,231,0.12)] text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7] flex items-center gap-2.5 transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-2xl btn-liquid group"
          >
            <span className="w-2 h-2 rounded-full bg-[#6C5CE7] droplet-pulse" />
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <ChevronUp className="w-4 h-4 text-[#6C5CE7] transition-transform group-hover:-translate-y-1" />
              </>
            ) : (
              <>
                <span>View More Templates ({filteredTemplates.length - 3} more)</span>
                <ChevronDown className="w-4 h-4 text-[#6C5CE7] transition-transform group-hover:translate-y-1" />
              </>
            )}
          </button>
        </div>

        {/* Full-Screen Modal Preview */}
        <AnimatePresence>
          {activePreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActivePreview(null)}
                className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#141417] rounded-[32px] border border-black/[0.1] dark:border-white/[0.1] shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row"
              >
                {/* Close Button */}
                <button
                  onClick={() => setActivePreview(null)}
                  className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Left: Big High-Res Resume Image */}
                <div className="w-full md:w-1/2 relative bg-[#F7EFE8] dark:bg-[#0A0A0C] flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-black/[0.08] dark:border-white/[0.08] overflow-y-auto">
                  <div className="relative w-full aspect-[3/4] max-w-md shadow-2xl rounded-xl overflow-hidden border border-black/[0.1]">
                    <Image
                      src={activePreview.filename}
                      alt={activePreview.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Right: Technical Breakdown & Audit Stats */}
                <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent" size="sm">
                        {activePreview.category}
                      </Badge>
                      <span className="text-xs font-mono text-[#16A34A] dark:text-[#22C55E] font-bold">
                        ✓ {activePreview.atsScore}% ATS Verified
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-[#1A1A1E] dark:text-[#F5F5F7]">
                        {activePreview.name}
                      </h3>
                      <p className="text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
                        Tailored Architecture for: <strong className="text-[#1A1A1E] dark:text-white">{activePreview.role}</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-[#0A0A0C] border border-black/[0.06] dark:border-white/[0.06] space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#5A5A63] dark:text-[#A1A1AA]">ATS Parser Compatibility:</span>
                        <strong className="text-[#16A34A] dark:text-[#22C55E]">100% (Workday, Greenhouse, Lever)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A5A63] dark:text-[#A1A1AA]">Layout Structure:</span>
                        <strong className="text-[#1A1A1E] dark:text-[#F5F5F7]">Single-Column Linear Hierarchy</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A5A63] dark:text-[#A1A1AA]">Bullet Point Standard:</span>
                        <strong className="text-[#6C5CE7]">Google XYZ Formula</strong>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#1A1A1E] dark:text-[#F5F5F7] mb-2">
                        Included Semantic Modules:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activePreview.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#7D6FF0] border border-[#6C5CE7]/20 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      onClick={() => {
                        setActivePreview(null);
                        const el = document.getElementById('demo');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Audit With This Template
                    </Button>
                    <button
                      onClick={() => setActivePreview(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
