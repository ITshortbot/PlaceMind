'use client';

// ============================================================================
// File: frontend/src/components/app/FloatingNavBar.tsx
// Description: Compact & Subtle Frosted Floating Navigation Bar
//              - Scaled down size (w-[52px], max 460px height) for an unobtrusive profile.
//              - Hovering any icon smoothly extends an individual frosted yellow card.
//              - Command Search (Cmd+K) trigger & clean theme switcher.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Search,
  LayoutDashboard,
  LayoutGrid,
  FileText,
  FileEdit,
  FileCheck2,
  UploadCloud,
  Mic,
  BarChart3,
  History,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { CommandPaletteModal } from '@/components/app/CommandPaletteModal';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Templates', href: '/template', icon: LayoutGrid },
  { name: 'Resume Builder', href: '/resume', icon: FileText },
  { name: 'Studio Editor', href: '/studio', icon: FileEdit },
  { name: 'ATS 1-Pass', href: '/ats', icon: FileCheck2 },
  { name: 'Upload & Parse', href: '/resumes/upload', icon: UploadCloud },
  { name: 'Live Interview', href: '/interview', icon: Mic },
  { name: 'Score Reports', href: '/report', icon: BarChart3 },
  { name: 'File History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function FloatingNavBar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <>
      <aside className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 hidden md:block select-none">
        <div
          className="w-[52px] glass-frosted-dark rounded-2xl p-1.5 flex flex-col justify-between items-center shadow-xl border border-white/10 dark:border-white/15 text-white backdrop-blur-3xl"
          style={{ height: 'calc(100vh - 240px)', maxHeight: '460px' }}
        >
          {/* Top Section: Brand + Search Trigger */}
          <div className="w-full flex flex-col items-center gap-1.5 flex-shrink-0">
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
                {hoveredItem === 'Search' && (
                  <motion.div
                    initial={{ opacity: 0, x: -6, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -6, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                    className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center"
                    style={{ width: 'max-content' }}
                  >
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FACC15] text-[#0A0A0C] font-black text-xs shadow-xl shadow-[#FACC15]/40 border border-[#FACC15] backdrop-blur-2xl"
                    >
                      <Search className="w-3.5 h-3.5 flex-shrink-0 text-[#0A0A0C]" />
                      <span className="whitespace-nowrap">Search Pages</span>
                      <kbd className="text-[9px] font-mono bg-black/20 px-1 py-0.2 rounded text-[#0A0A0C] font-bold">
                        ⌘K
                      </kbd>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center Navigation: Compact High-Density Product Tabs */}
          <nav className="w-full space-y-1 my-1 flex-1 flex flex-col items-center justify-evenly flex-shrink-0">
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
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, x: -6, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -6, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                        className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center"
                        style={{ width: 'max-content' }}
                      >
                        <Link
                          href={item.href}
                          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FACC15] text-[#0A0A0C] font-black text-xs shadow-xl shadow-[#FACC15]/40 border border-[#FACC15] backdrop-blur-2xl"
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0 text-[#0A0A0C]" />
                          <span className="whitespace-nowrap pr-1">{item.name}</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Bottom Section: Theme Switcher */}
          <div className="w-full pt-1 border-t border-white/10 flex items-center justify-center flex-shrink-0">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1 rounded-lg text-white/60 hover:text-[#FACC15] hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-3 h-3 text-[#FACC15]" />
              ) : (
                <Moon className="w-3 h-3 text-white" />
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
