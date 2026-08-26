'use client';

// ============================================================================
// File: frontend/src/components/app/Sidebar.tsx
// Description: Collapsible SaaS Sidebar (250px -> 68px) with active route highlights,
//              user profile, theme toggle, and local engine status indicator.
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  FileText,
  Mic,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
  UploadCloud,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Resumes', href: '/resumes/upload', icon: FileText, altHref: '/resumes' },
  { name: 'Interview Practice', href: '/interview/new', icon: Mic, altHref: '/interview' },
  { name: 'History & Archive', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl transition-all duration-300 z-30 h-screen sticky top-0 flex-shrink-0 ${
        isCollapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* Top Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-base tracking-tight text-[#1A1A1E] dark:text-[#F5F5F7] truncate">
                Placemind
              </span>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#8A8A92] hover:text-[#1A1A1E] dark:hover:text-white transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation List */}
        <nav className="p-3 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.altHref && pathname.startsWith(item.altHref));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#8F82FF] font-bold border border-[#6C5CE7]/30 shadow-xs'
                    : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7]'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#6C5CE7]" />
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#6C5CE7] dark:text-[#8F82FF]' : ''}`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Hardware Engine Info */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-3">
        {/* Local Privacy Engine Status Badge */}
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
              <span className="font-semibold truncate">Local Engine Active</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          </div>
        ) : (
          <div className="flex justify-center" title="Local Engine Active: 0-Egress">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          </div>
        )}

        {/* User Profile / Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
              RP
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1A1A1E] dark:text-white truncate">Rohan Patel</div>
                <div className="text-[10px] text-[#8A8A92] truncate">Pro Workspace</div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#8A8A92] transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-[#F5A623]" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#6C5CE7]" />
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
