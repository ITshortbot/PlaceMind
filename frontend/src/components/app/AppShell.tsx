'use client';

// ============================================================================
// File: frontend/src/components/app/AppShell.tsx
// Description: Master Shell wrapping internal product pages (Sidebar + TopBar + Mobile Nav)
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/app/Sidebar';
import {
  LayoutDashboard,
  FileText,
  Mic,
  History,
  Settings,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

const MOBILE_NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resumes', href: '/resumes/upload', icon: FileText },
  { name: 'Interview', href: '/interview/new', icon: Mic },
  { name: 'History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppShell({ children, hideSidebar = false }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // If live interview session, collapse or hide sidebar for minimal chrome
  const isMinimalSession = hideSidebar || pathname.startsWith('/interview/') && !pathname.endsWith('/new') && !pathname.endsWith('/report');

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col md:flex-row antialiased font-sans transition-colors duration-300 selection:bg-[#6C5CE7] selection:text-white">
      {/* Persistent Left Sidebar (hidden on minimal live interview sessions) */}
      {!isMinimalSession && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      )}

      {/* Main App Work Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 overflow-x-hidden">
        {children}
      </div>

      {/* Mobile Bottom Tab Bar (for on-the-go quick access) */}
      {!isMinimalSession && (
        <div className="md:hidden fixed bottom-0 inset-x-0 h-16 border-t border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#121217]/95 backdrop-blur-2xl px-3 flex items-center justify-around z-40">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'text-[#6C5CE7] dark:text-[#8F82FF]'
                    : 'text-[#8A8A92] hover:text-[#1A1A1E] dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#6C5CE7] dark:text-[#8F82FF]' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
