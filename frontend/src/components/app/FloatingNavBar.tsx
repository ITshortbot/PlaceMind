'use client';

// ============================================================================
// File: frontend/src/components/app/FloatingNavBar.tsx
// Description: Compact & Subtle Frosted Floating Navigation Bar
//              - Scaled down size (w-[52px], max 460px height) for an unobtrusive profile.
//              - Hovering any icon smoothly extends an individual frosted yellow card.
//              - Command Search (Cmd+K) trigger & clean theme switcher.
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Search,
  LayoutDashboard,
  FileText,
  FileCheck2,
  Mic,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { CommandPaletteModal } from '@/components/app/CommandPaletteModal';

const NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resume', href: '/resume', icon: FileText },
  { name: 'ATS', href: '/ats', icon: FileCheck2 },
  { name: 'Interview', href: '/interview', icon: Mic },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Quieter hover card animation: short 5px slide, <=150ms, gentler spring
const HOVER_CARD_VARIANTS = {
  initial: { opacity: 0, x: -5 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -5 },
};

const HOVER_TRANSITION = { type: 'tween' as const, duration: 0.12, ease: 'easeOut' as const };

export function FloatingNavBar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Respect OS accessibility preference — fully disable hover motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  return (
    <>
      <aside className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 hidden md:block select-none no-print">
        <div
          className="w-[48px] glass-frosted-dark rounded-2xl p-1 flex flex-col justify-between items-center shadow-xl border border-white/10 dark:border-white/15 text-white backdrop-blur-3xl"
          style={{ height: 'calc(100vh - 240px)', maxHeight: '440px' }}
        >
          {/* Top Section: Brand + Search Trigger */}
          <div className="w-full flex flex-col items-center gap-1 flex-shrink-0">
            {/* Header Brand */}
            <Link href="/dashboard" className="flex items-center justify-center p-0.5">
              <div className="w-6 h-6 rounded-lg bg-[#FACC15] text-[#0A0A0C] font-black flex items-center justify-center text-[10px] shadow-sm shadow-[#FACC15]/30 flex-shrink-0">
                P
              </div>
            </Link>

            {/* Quick Search Action Trigger (Cmd+K) */}
            <div
              className="relative w-full flex items-center justify-center"
              onMouseEnter={() => setHoveredItem('Search')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-white/70 hover:text-[#0A0A0C] hover:bg-[#FACC15] transition-all cursor-pointer shadow-xs ${
                  hoveredItem === 'Search' ? 'bg-[#FACC15] text-[#0A0A0C]' : 'bg-white/10'
                }`}
                title="Search Pages & Actions (Cmd+K)"
              >
                <Search className="w-3 h-3" />
              </button>

              {/* Search Hover Extended Card */}
              <AnimatePresence>
                {hoveredItem === 'Search' && !reducedMotion && (
                  <motion.div
                    variants={HOVER_CARD_VARIANTS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={HOVER_TRANSITION}
                    className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center"
                    style={{ width: 'max-content' }}
                  >
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FACC15] text-[#0A0A0C] font-black text-xs shadow-xl shadow-[#FACC15]/40 border border-[#FACC15] backdrop-blur-2xl"
                    >
                      <Search className="w-3.5 h-3.5 flex-shrink-0 text-[#0A0A0C]" />
                      <span className="whitespace-nowrap">Search Pages</span>
                      <kbd className="text-[9px] font-mono bg-black/20 px-1 py-0.2 rounded text-[#0A0A0C] font-bold">
                        ⌘K
                      </kbd>
                    </button>
                  </motion.div>
                )}
                {/* Static tooltip for reduced-motion */}
                {hoveredItem === 'Search' && reducedMotion && (
                  <div
                    className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center"
                    style={{ width: 'max-content' }}
                  >
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FACC15] text-[#0A0A0C] font-black text-xs shadow-xl shadow-[#FACC15]/40 border border-[#FACC15] backdrop-blur-2xl"
                    >
                      <Search className="w-3.5 h-3.5 flex-shrink-0 text-[#0A0A0C]" />
                      <span className="whitespace-nowrap">Search Pages</span>
                      <kbd className="text-[9px] font-mono bg-black/20 px-1 py-0.2 rounded text-[#0A0A0C] font-bold">
                        ⌘K
                      </kbd>
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center Navigation: Compact High-Density Product Tabs */}
          <nav className="w-full space-y-0.5 my-0.5 flex-1 flex flex-col items-center justify-evenly flex-shrink-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const isHovered = hoveredItem === item.name;

              return (
                <div
                  key={item.name}
                  className="relative w-full flex items-center justify-center"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Base Capsule Icon Button */}
                  <Link
                    href={item.href}
                    className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#FACC15] text-[#0A0A0C] shadow-sm shadow-[#FACC15]/30'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                        isActive ? 'text-[#0A0A0C]' : 'text-white/80'
                      }`}
                    />
                  </Link>

                  {/* Frosted Yellow Option Card Extending Outwards on Hover */}
                  <AnimatePresence>
                    {isHovered && !reducedMotion && (
                      <motion.div
                        variants={HOVER_CARD_VARIANTS}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={HOVER_TRANSITION}
                        className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center"
                        style={{ width: 'max-content' }}
                      >
                        <Link
                          href={item.href}
                          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FACC15] text-[#0A0A0C] font-black text-xs shadow-xl shadow-[#FACC15]/40 border border-[#FACC15] backdrop-blur-2xl"
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0 text-[#0A0A0C]" />
                          <span className="whitespace-nowrap pr-0.5">{item.name}</span>
                        </Link>
                      </motion.div>
                    )}
                    {/* Static tooltip for reduced-motion */}
                    {isHovered && reducedMotion && (
                      <div
                        className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center"
                        style={{ width: 'max-content' }}
                      >
                        <Link
                          href={item.href}
                          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FACC15] text-[#0A0A0C] font-black text-xs shadow-xl shadow-[#FACC15]/40 border border-[#FACC15] backdrop-blur-2xl"
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0 text-[#0A0A0C]" />
                          <span className="whitespace-nowrap pr-0.5">{item.name}</span>
                        </Link>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Bottom Section: Theme Switcher */}
          <div className="w-full pt-0.5 border-t border-white/10 flex items-center justify-center flex-shrink-0">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1 rounded-lg text-white/60 hover:text-[#FACC15] hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-3 h-3 text-[#FACC15]" />
              ) : (
                <Moon className="w-3 h-3 text-black" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Global Command Search Modal */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
