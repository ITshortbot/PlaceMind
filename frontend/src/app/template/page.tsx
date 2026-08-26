'use client';

// ============================================================================
// File: frontend/src/app/template/page.tsx
// Description: Tab 2 - Template: 2x5 Grid Gallery of 10 Verified ATS Templates
//              with Workday/Greenhouse verification badges and 1-click editor routing.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, ArrowRight, Sparkles, Filter } from 'lucide-react';

const TEMPLATES_GALLERY = [
  { id: 1, name: 'Minimalist Standard', file: '/assets/Resume/rem1.webp', ats: 94.8, category: 'Software', tag: 'Workday Verified' },
  { id: 2, name: 'Classic Single-Column', file: '/assets/Resume/rem2.webp', ats: 96.2, category: 'Engineering', tag: 'Greenhouse Ready' },
  { id: 3, name: 'AI & Systems Pro', file: '/assets/Resume/rem3.webp', ats: 98.2, category: 'AI/ML', tag: 'Top Tier Workday' },
  { id: 4, name: 'Full-Stack Modern', file: '/assets/Resume/rem4.webp', ats: 97.2, category: 'Web Systems', tag: 'Lever Verified' },
  { id: 5, name: 'Staff Infrastructure', file: '/assets/Resume/rem5.webp', ats: 95.4, category: 'Cloud/DevOps', tag: 'Taleo Safe' },
  { id: 6, name: 'Product Architect', file: '/assets/Resume/rem6.webp', ats: 93.8, category: 'Product/Eng', tag: 'Workday Verified' },
  { id: 7, name: 'LaTeX Single-Column', file: '/assets/Resume/rem7.webp', ats: 95.6, category: 'Backend/Core', tag: '100% Parsable' },
  { id: 8, name: 'Senior Data Specialist', file: '/assets/Resume/rem8.webp', ats: 96.8, category: 'Data/ML', tag: 'Greenhouse Ready' },
  { id: 9, name: 'Distributed Systems', file: '/assets/Resume/rem9.webp', ats: 97.5, category: 'Architecture', tag: 'Workday Verified' },
  { id: 10, name: 'Executive Lead', file: '/assets/Resume/rem10.webp', ats: 96.4, category: 'Leadership', tag: 'iCIMS Safe' },
];

export default function TemplatePage() {
  return (
    <AppShell showAiBar={false}>
      <TopBar
        title="Template Gallery"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Templates' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1E] dark:text-white tracking-tight">
              ATS-Verified Resume Templates
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
              Select any single-column layout tested against Workday, Greenhouse, and Lever enterprise parsers.
            </p>
          </div>

          <Badge variant="accent" size="md">
            10 Single-Column Formats
          </Badge>
        </div>

        {/* 2x5 Grid Gallery (From Wireframe v1) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {TEMPLATES_GALLERY.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="p-3.5 flex flex-col justify-between space-y-3 group hover:border-[#6C5CE7] hover:shadow-xl transition-all duration-300"
            >
              <div className="space-y-2.5">
                {/* Template Thumbnail */}
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white shadow-xs">
                  <Image
                    src={tmpl.file}
                    alt={tmpl.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono font-bold">
                    {tmpl.ats}% ATS
                  </div>
                </div>

                {/* Template Info */}
                <div>
                  <h3 className="text-xs font-bold text-[#1A1A1E] dark:text-white truncate">
                    {tmpl.name}
                  </h3>
                  <p className="text-[10px] text-[#8A8A92] truncate">{tmpl.category}</p>
                </div>
              </div>

              {/* Action Button */}
              <Link href="/resume" className="w-full">
                <Button variant="default" size="sm" className="w-full text-[11px] font-bold">
                  Use Template
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
