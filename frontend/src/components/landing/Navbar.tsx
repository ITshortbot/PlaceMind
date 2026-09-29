'use client';

// ============================================================================
// File: frontend/src/components/landing/Navbar.tsx
// Description: Responsive Glassmorphic Navbar with Studio, Download, and Theme links
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import {
  Sun,
  Moon,
  Sparkles,
  Play,
  ArrowRight,
  Menu,
  X,
  Laptop,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  onOpenDemo?: () => void;
  onGetStarted?: () => void;
}

export function Navbar({ onOpenDemo, onGetStarted }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group select-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white shadow-md shadow-[#6C5CE7]/30 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
              Placemind
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]" />
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#5A5A63] dark:text-[#A1A1AA] p-1.5 px-6 rounded-full bg-white/40 dark:bg-[#1C1C21]/50 border border-white/60 dark:border-white/10 backdrop-blur-xl shadow-sm">
          <Link
            href="/dashboard"
            className="hover:text-[#6C5CE7] dark:hover:text-[#8F82FF] transition-colors font-bold flex items-center gap-1.5 hover:scale-105 text-[#1A1A1E] dark:text-white"
          >
            <Layers className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/template"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium flex items-center gap-1 hover:scale-105"
          >
            <span>Templates</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#6C5CE7]/15 text-[#6C5CE7] text-[10px] font-mono font-bold">10</span>
          </Link>
          <a
            href="/#how-it-works"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium hover:scale-105"
          >
            How it Works
          </a>
          <Link
            href="/download"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium flex items-center gap-1 hover:scale-105"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Download</span>
          </Link>
          <a
            href="/#pricing"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium hover:scale-105"
          >
            Pricing
          </a>
        </nav>

        {/* Right CTA & Controls */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark Theme"
            className="w-10 h-10 rounded-full bg-white/60 hover:bg-white dark:bg-[#1C1C21]/80 dark:hover:bg-[#25252D] border border-white/60 dark:border-white/10 text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-sm backdrop-blur-xl"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F5A623] transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-[#6C5CE7] transition-transform hover:-rotate-12" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Watch Demo Button */}
          <button
            onClick={onOpenDemo}
            className="px-4 py-2 text-xs font-semibold text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5 group"
          >
            <div className="w-5 h-5 rounded-full bg-[#6C5CE7]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-2.5 h-2.5 text-[#6C5CE7] fill-[#6C5CE7]" />
            </div>
            <span>Watch Demo</span>
          </button>

          {/* Open Onboarding / Try Free CTA */}
          <Link href="/onboarding">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              className="px-6 py-2.5 text-xs font-bold"
            >
              Try it Free
            </Button>
          </Link>
        </div>

        {/* Mobile Controls & Hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-full bg-white/60 dark:bg-[#1C1C21] border border-black/[0.08] dark:border-white/[0.08] text-[#5A5A63] dark:text-[#A1A1AA]"
          >
            {mounted && resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F5A623]" />
            ) : (
              <Moon className="w-4 h-4 text-[#6C5CE7]" />
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open navigation menu"
            className="p-2 rounded-xl bg-white/60 dark:bg-[#1C1C21] border border-black/[0.08] dark:border-white/[0.08] text-[#1A1A1E] dark:text-white"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 p-5 rounded-3xl bg-white/95 dark:bg-[#141417]/95 border border-white/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-semibold">
            <Link
              href="/studio"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-between"
            >
              <span>Placemind Studio Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/download"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between"
            >
              <span>Download Desktop / Mobile App</span>
              <Laptop className="w-4 h-4 text-[#8A8A92]" />
            </Link>
            <a
              href="/#templates"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            >
              ATS Resume Templates (18)
            </a>
            <a
              href="/#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            >
              How It Works
            </a>
            <a
              href="/#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            >
              Pricing
            </a>
          </div>

          <div className="pt-2">
            <Link href="/studio" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
