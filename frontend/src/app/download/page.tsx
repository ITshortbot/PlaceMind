'use client';

// ============================================================================
// File: frontend/src/app/download/page.tsx
// Description: Universal Cross-Platform Download Hub & Local Engine Setup Guide
//              (macOS, Windows, Linux, iOS, Android, PWA with LM Studio pairing).
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Apple,
  Laptop,
  Smartphone,
  ShieldCheck,
  Cpu,
  Lock,
  Download,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Sparkles,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PLATFORMS = [
  {
    name: 'macOS',
    icon: Apple,
    tag: 'Apple Silicon & Intel',
    desc: 'Native universal binary (.dmg) with Metal hardware acceleration.',
    file: 'Placemind-v1.0.0-universal.dmg',
    size: '12.4 MB',
    isPrimary: true,
  },
  {
    name: 'Windows',
    icon: Laptop,
    tag: 'Windows 10 / 11',
    desc: 'Lightweight WebView2 native package (.msi / .exe).',
    file: 'Placemind-v1.0.0-x64-setup.exe',
    size: '9.8 MB',
  },
  {
    name: 'Linux',
    icon: Terminal,
    tag: 'Debian / AppImage',
    desc: 'Zero-dependency standalone binary for Ubuntu, Fedora & Arch.',
    file: 'Placemind-v1.0.0.AppImage',
    size: '14.1 MB',
  },
  {
    name: 'Mobile & PWA',
    icon: Smartphone,
    tag: 'iOS & Android',
    desc: 'Instant Progressive Web App install with offline vault access.',
    file: 'Install via Safari / Chrome',
    size: 'PWA Web Standalone',
  },
];

export default function DownloadPage() {
  const [copiedCmd, setCopiedCmd] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <div className="h-4 w-px bg-black/[0.1] dark:bg-white/[0.1]" />
          <span className="font-bold text-sm">Universal Cross-Platform Download Hub</span>
        </div>

        <Link href="/studio">
          <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
            Open Web Studio
          </Button>
        </Link>
      </header>

      {/* Main Download Hub Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#1C1C21]/90 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#6C5CE7] dark:text-[#7D6FF0] shadow-sm backdrop-blur-xl">
            <Cpu className="w-3.5 h-3.5" />
            <span>TAURI V2 NATIVE &bull; 100% OFFLINE PRIVACY</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-[#1A1A1E] dark:text-white">
            Download Placemind on{' '}
            <span className="bg-gradient-to-r from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] bg-clip-text text-transparent">
              any device
            </span>
          </h1>

          <p className="text-base text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
            Run complete ATS parsing and voice interview simulations locally on your machine with zero data egress. Powered by Tauri v2 and local LLM connectors.
          </p>
        </div>

        {/* Platform Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-6 ${
                  p.isPrimary
                    ? 'bg-white/95 dark:bg-[#141417]/95 border-[#6C5CE7] shadow-2xl ring-2 ring-[#6C5CE7]/30 -translate-y-1'
                    : 'bg-white/70 dark:bg-[#141417]/70 border-black/[0.08] dark:border-white/[0.08] hover:border-[#6C5CE7]/40 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#7D6FF0] flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[#8A8A92]">
                      {p.size}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1E] dark:text-white">{p.name}</h3>
                    <span className="text-xs font-semibold text-[#6C5CE7]">{p.tag}</span>
                    <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-2 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <Button
                  variant={p.isPrimary ? 'primary' : 'secondary'}
                  size="md"
                  icon={<Download className="w-4 h-4" />}
                  className="w-full"
                  onClick={() => alert(`Starting download for ${p.file}`)}
                >
                  Download {p.name}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Local LLM Zero-Egress Pairing Guide */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white/80 dark:bg-[#141417]/80 border border-black/[0.08] dark:border-white/[0.08] shadow-xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1E] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
                Pair with Local LM Studio / Ollama
              </h2>
              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
                Zero data ever leaves your computer. Placemind connects directly to your localhost server.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A]">
              ✓ Complete Privacy Guarantee
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.04] space-y-2">
              <strong className="text-sm font-bold text-[#1A1A1E] dark:text-white block">1. Start LM Studio</strong>
              <p className="text-[#5A5A63] dark:text-[#A1A1AA]">
                Launch LM Studio or Ollama and start the local server on default port <code>http://localhost:1234</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.04] space-y-2">
              <strong className="text-sm font-bold text-[#1A1A1E] dark:text-white block">2. Select Your Model</strong>
              <p className="text-[#5A5A63] dark:text-[#A1A1AA]">
                Load Llama 3 8B, Mistral, or Qwen2.5 for offline metric synthesis and question generation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.04] space-y-2">
              <strong className="text-sm font-bold text-[#1A1A1E] dark:text-white block">3. Instant Pairing</strong>
              <p className="text-[#5A5A63] dark:text-[#A1A1AA]">
                Placemind auto-detects the active port and handles in-memory PDF extraction with zero cloud egress.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
