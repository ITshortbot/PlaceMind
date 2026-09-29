'use client';

// ============================================================================
// File: frontend/src/components/app/TopBar.tsx
// Description: Dynamic Breadcrumb and Contextual Header Bar for Internal Pages
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Plus, UploadCloud, Download, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actionButton?: React.ReactNode;
}

export function TopBar({ title, breadcrumbs, actionButton }: TopBarProps) {
  const pathname = usePathname();

  return (
    <header className="h-16 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-[#121217]/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs / Page Title */}
      <div className="flex items-center gap-2 text-xs">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="flex items-center gap-1.5 text-[#8A8A92]">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#B0B0B8]" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-[#1A1A1E] dark:hover:text-white transition-colors font-medium">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-bold text-[#1A1A1E] dark:text-white">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <h1 className="text-base font-bold text-[#1A1A1E] dark:text-white tracking-tight">
            {title || 'Placemind Dashboard'}
          </h1>
        )}
      </div>

      {/* Right Contextual Action Button */}
      <div className="flex items-center gap-3">
        {actionButton ? (
          actionButton
        ) : (
          <Link href="/resumes/upload">
            <Button variant="primary" size="sm" icon={<UploadCloud className="w-3.5 h-3.5" />}>
              Upload Resume
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
