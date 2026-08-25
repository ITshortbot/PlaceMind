'use client';

// ============================================================================
// File: frontend/src/components/landing/Navbar.tsx
// Description: Modern Frosted Glass Navigation Bar with high-vibe copy and animations
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  Play,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  onOpenDemo?: () => void;
  onGetStarted?: () => void;
}

export function Navbar({ onOpenDemo, onGetStarted }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/70 dark:bg-[#141417]/80 backdrop-blur-2xl border-b border-white/50 dark:border-white/10 py-3.5 shadow-xl shadow-black/5 dark:shadow-black/40'
          : 'bg-transparent py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8] flex items-center justify-center shadow-[0_0_20px_rgba(108,92,231,0.5)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-[#1A1A1E] dark:text-[#F5F5F7]">
              Placemind
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]" />
          </div>
        </a>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-[#5A5A63] dark:text-[#A1A1AA] p-1.5 px-6 rounded-full bg-white/40 dark:bg-[#1C1C21]/50 border border-white/60 dark:border-white/10 backdrop-blur-xl shadow-sm">
          <a
            href="#features"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium hover:scale-105"
          >
            Features
          </a>
          <a
            href="#templates"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium flex items-center gap-1 hover:scale-105"
          >
            <span>Templates</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#6C5CE7]/15 text-[#6C5CE7] text-[10px] font-mono font-bold">18</span>
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium hover:scale-105"
          >
            How it Works
          </a>
          <a
            href="#demo"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium hover:scale-105"
          >
            Live Demo
          </a>
          <a
            href="#pricing"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium hover:scale-105"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] transition-colors font-medium hover:scale-105"
          >
            FAQ
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

          {/* Watch Demo Button with Micro-Animation */}
          <button
            onClick={onOpenDemo}
            className="px-4 py-2 text-xs font-semibold text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5 group"
          >
            <div className="w-5 h-5 rounded-full bg-[#6C5CE7]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-2.5 h-2.5 text-[#6C5CE7] fill-[#6C5CE7]" />
            </div>
            <span>Watch Demo</span>
          </button>

          {/* Vibrant Animated Primary CTA */}
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => {
              const el = document.getElementById('demo');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-2.5 text-xs font-bold"
          >
            Try it Free
          </Button>
        </div>

        {/* Mobile Hamburger */}
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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/60 dark:bg-[#1C1C21] border border-black/[0.08] dark:border-white/[0.08] text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-4 pb-6 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-2xl border-b border-black/[0.08] dark:border-white/[0.08] space-y-4 animate-fade-in shadow-xl">
          <nav className="flex flex-col gap-3 text-sm text-[#5A5A63] dark:text-[#A1A1AA]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#1A1A1E] dark:hover:text-white font-medium"
            >
              Features
            </a>
            <a
              href="#templates"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#1A1A1E] dark:hover:text-white font-medium"
            >
              Templates (18)
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#1A1A1E] dark:hover:text-white font-medium"
            >
              How it Works
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#1A1A1E] dark:hover:text-white font-medium"
            >
              Live Demo
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#1A1A1E] dark:hover:text-white font-medium"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#1A1A1E] dark:hover:text-white font-medium"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('demo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
