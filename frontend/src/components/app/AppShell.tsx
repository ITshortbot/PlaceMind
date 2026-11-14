'use client';

// ============================================================================
// File: frontend/src/components/app/AppShell.tsx
// Description: Master Shell wrapping internal product pages (Sidebar + TopBar +
//              Mobile Bottom Nav + Persistent AI Command Bar on Working Tabs)
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FloatingNavBar } from '@/components/app/FloatingNavBar';
import { AiCommandBar, type AiCommandBarProps } from '@/components/app/AiCommandBar';
import { DynamicBackground } from '@/components/ui/DynamicBackground';
import {
  LayoutDashboard,
  FileText,
  FileCheck2,
  Mic,
  Settings,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  showAiBar?: boolean;
  aiBarProps?: Partial<AiCommandBarProps>;
}

const MOBILE_NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resume', href: '/resume', icon: FileText },
  { name: 'ATS', href: '/ats', icon: FileCheck2 },
  { name: 'Interview', href: '/interview', icon: Mic },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const AI_PROMPT_HANDOFF_KEY = 'placemind.pendingPrompt';

export function AppShell({ children, hideSidebar = false, showAiBar, aiBarProps }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const update = () => document.documentElement.style.setProperty('--keyboard-inset-bottom', `${Math.max(0, window.innerHeight - v.height - v.offsetTop)}px`);
    v.addEventListener('resize', update);
    v.addEventListener('scroll', update);
    update();
    return () => { v.removeEventListener('resize', update); v.removeEventListener('scroll', update); document.documentElement.style.removeProperty('--keyboard-inset-bottom'); };
  }, []);


  // The bar's one real job: carry the typed prompt into the Template Studio,
  // which generates from it. No page-local fake responses.
  const handleAiCommand = (command: string) => {
    try {
      window.localStorage.setItem(AI_PROMPT_HANDOFF_KEY, command);
    } catch {
      // storage unavailable - navigate anyway, prompt is lost but nothing fake happens
    }
    router.push('/template');
  };

  // The persistent AI command bar is active on the 4 working tabs: Dashboard, Resume, ATS, Interview
  const isWorkingTab =
    showAiBar !== undefined
      ? showAiBar
      : ['/dashboard', '/resume', '/ats', '/interview'].some(
          (route) => pathname === route || pathname.startsWith(route + '/')
        );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#08080A] text-[#0A0A0C] dark:text-[#F8F9FA] flex flex-col md:flex-row antialiased font-sans transition-colors duration-300 selection:bg-[#FACC15] selection:text-black relative">
      {/* Ambient Moving Dynamic Mesh Background */}
      <DynamicBackground />

      {/* Floating Left Frosted Capsule Navigation Bar */}
      {!hideSidebar && <FloatingNavBar />}

      {/* Main App Work Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${['/dashboard', '/resume'].includes(pathname) ? '' : 'pb-16 md:pb-0'} overflow-x-hidden relative z-10 ${!hideSidebar ? 'md:pl-20 lg:pl-24' : ''}`}>
        <style>{`
:root { --dock-bottom: 12px; --dock-clearance: 92px; }
@media (max-width: 767px) { :root { --dock-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); --dock-clearance: calc(144px + env(safe-area-inset-bottom, 0px)); } }
.dock-scroll { padding-bottom: calc(var(--dock-clearance) + var(--keyboard-inset-bottom, 0px)); scroll-padding-bottom: calc(var(--dock-clearance) + var(--keyboard-inset-bottom, 0px)); }
.dock-spacer { height: calc(var(--dock-clearance) + var(--keyboard-inset-bottom, 0px)); flex-shrink: 0; }
@media print { .dock-spacer { display: none !important; } }
`}</style>{children}

        {/* Persistent Bottom AI Command Bar */}
        {isWorkingTab && <AiCommandBar onExecute={handleAiCommand} {...aiBarProps} />}
      </div>

      {/* Mobile Bottom Tab Bar */}
      {!hideSidebar && (
        <div className="md:hidden fixed bottom-0 inset-x-0 h-16 border-t border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#121217]/95 backdrop-blur-2xl px-2 flex items-center justify-around z-40 no-print">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[9px] font-semibold transition-all ${
                  isActive
                    ? 'text-[#6C5CE7] dark:text-[#8F82FF] font-bold'
                    : 'text-[#8A8A92] hover:text-[#1A1A1E] dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#6C5CE7] dark:text-[#8F82FF]' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
