'use client';

// ============================================================================
// File: frontend/src/components/app/AppShell.tsx
// Description: Master Shell wrapping internal product pages (Sidebar + TopBar +
//              Mobile Bottom Nav + Persistent AI Command Bar on Working Tabs)
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FloatingNavBar } from '@/components/app/FloatingNavBar';
import { AiCommandBar } from '@/components/app/AiCommandBar';
import { DynamicBackground } from '@/components/ui/DynamicBackground';
import {
  LayoutDashboard,
  LayoutGrid,
  FileText,
  FileCheck2,
  Mic,
  BarChart3,
  History,
  Settings,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  showAiBar?: boolean;
}

const MOBILE_NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Templates', href: '/template', icon: LayoutGrid },
  { name: 'Resume', href: '/resume', icon: FileText },
  { name: 'ATS', href: '/ats', icon: FileCheck2 },
  { name: 'Interview', href: '/interview', icon: Mic },
  { name: 'Report', href: '/report', icon: BarChart3 },
];

export function AppShell({ children, hideSidebar = false, showAiBar }: AppShellProps) {
  const pathname = usePathname();

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
      <div className={`flex-1 flex flex-col min-w-0 pb-16 md:pb-0 overflow-x-hidden relative z-10 ${!hideSidebar ? 'md:pl-20 lg:pl-24' : ''}`}>
        {children}

        {/* Persistent Bottom AI Command Bar */}
        {isWorkingTab && <AiCommandBar />}
      </div>

      {/* Mobile Bottom Tab Bar */}
      {!hideSidebar && (
        <div className="md:hidden fixed bottom-0 inset-x-0 h-16 border-t border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#121217]/95 backdrop-blur-2xl px-2 flex items-center justify-around z-40">
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
