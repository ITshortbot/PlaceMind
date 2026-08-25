'use client';

// ============================================================================
// File: frontend/src/components/landing/Footer.tsx
// Description: Modern footer with dual Light/Dark styling and architecture references
// ============================================================================

import React from 'react';
import { Sparkles, Github, Twitter, Linkedin, Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-black/[0.08] dark:border-[#2A2A30] bg-white/40 dark:bg-[#0A0A0C]/80 backdrop-blur-xl py-16 relative z-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6C5CE7] to-[#7D6FF0] flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-bold text-[#1A1A1E] dark:text-[#F5F5F7] tracking-tight">
                Placemind
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-[#1C1C21] border border-black/[0.08] dark:border-[#2A2A30] text-[#5A5A63] dark:text-[#A1A1AA]">
                PBL v1.0
              </span>
            </div>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] max-w-sm leading-relaxed">
              Modern dual-deployment ATS career copilot engineered with Next.js 15, PostgreSQL pgvector, Google Gemini 2.5 Flash, and local LM Studio privacy support.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[#8A8A92] dark:text-[#6B6B76]">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#6C5CE7] transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[#6C5CE7] transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#6C5CE7] transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-[#F5F5F7] mb-4">
              Architecture
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
              <li><a href="#demo" className="hover:text-[#6C5CE7] transition-colors">pgvector HNSW Store</a></li>
              <li><a href="#how-it-works" className="hover:text-[#6C5CE7] transition-colors">FastEmbed ONNX Runtime</a></li>
              <li><a href="#features" className="hover:text-[#6C5CE7] transition-colors">HybridLLMRouter</a></li>
              <li><a href="#demo" className="hover:text-[#6C5CE7] transition-colors">PyMuPDF Ingestion</a></li>
              <li><a href="#pricing" className="hover:text-[#6C5CE7] transition-colors">Cloudflare R2 S3</a></li>
            </ul>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-[#F5F5F7] mb-4">
              Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
              <li><a href="#demo" className="hover:text-[#6C5CE7] transition-colors">ATS Match Scoring</a></li>
              <li><a href="#demo" className="hover:text-[#6C5CE7] transition-colors">XYZ Bullet Rewriter</a></li>
              <li><a href="#demo" className="hover:text-[#6C5CE7] transition-colors">Mock Voice Rehearsals</a></li>
              <li><a href="#features" className="hover:text-[#6C5CE7] transition-colors">Local LM Studio Privacy</a></li>
              <li><a href="#how-it-works" className="hover:text-[#6C5CE7] transition-colors">LaTeX PDF Generation</a></li>
            </ul>
          </div>

          {/* Academic & University Jury */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-[#F5F5F7] mb-4">
              Academic Jury
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
              <li className="flex items-center gap-1.5 text-[#6C5CE7] font-semibold">
                <Terminal className="w-3.5 h-3.5" />
                <span>PBL Capstone Defense</span>
              </li>
              <li><span>Computer Science & AI</span></li>
              <li><span>Zero-Retention Certified</span></li>
              <li><span>Dual SaaS / Desktop</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-6 border-t border-black/[0.06] dark:border-[#2A2A30]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8A92] dark:text-[#6B6B76] gap-4">
          <div>
            &copy; {new Date().getFullYear()} Placemind AI Platform. Project-Based Learning University Submission.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#6C5CE7] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#6C5CE7] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#6C5CE7] transition-colors">System Architecture</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
