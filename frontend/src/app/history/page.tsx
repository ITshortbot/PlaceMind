'use client';

// ============================================================================
// File: frontend/src/app/history/page.tsx
// Description: Tab 7 - History: File & Artifact Management View from Wireframe v1
//              Simple chronological cards with quick actions (Open in Editor, Duplicate, Delete)
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  History,
  FileText,
  Copy,
  Trash2,
  ExternalLink,
  Download,
  Clock,
  Sparkles,
} from 'lucide-react';

const RESUME_FILES = [
  {
    id: 'stripe-staff',
    name: 'Rohan_Patel_Staff_Architect_2026.pdf',
    target: 'Stripe · Staff Software Architect',
    date: 'Aug 26, 2026',
    atsScore: 94.8,
    file: '/assets/Resume/rem1.webp',
  },
  {
    id: 'ai-lead',
    name: 'Rohan_AI_Systems_Specialist.pdf',
    target: 'OpenAI · Senior AI Engineer',
    date: 'Aug 24, 2026',
    atsScore: 98.2,
    file: '/assets/Resume/rem3.webp',
  },
];

export default function HistoryPage() {
  return (
    <AppShell showAiBar={false}>
      <TopBar
        title="File History"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'History' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your Resume Artifacts & Files
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
            Manage your generated resumes, duplicate for custom applications, or export verified PDFs.
          </p>
        </div>

        {/* Chronological Card List from Wireframe v1 */}
        <div className="space-y-4">
          {RESUME_FILES.map((file) => (
            <Card
              key={file.id}
              className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-14 h-18 rounded-xl overflow-hidden border border-black/10 flex-shrink-0 bg-white shadow-xs">
                  <Image src={file.file} alt={file.name} fill className="object-cover object-top" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate">{file.name}</h3>
                    <Badge variant="success" size="sm" className="font-mono">
                      {file.atsScore}% ATS
                    </Badge>
                  </div>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] truncate">
                    {file.target}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#8A8A92] pt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Created: {file.date}</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link href="/resume">
                  <Button variant="default" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Open in Editor
                  </Button>
                </Link>

                <Button variant="secondary" size="sm" icon={<Copy className="w-3.5 h-3.5" />}>
                  Duplicate
                </Button>

                <Button variant="ghost" size="sm" className="text-[#EF4444] hover:bg-[#EF4444]/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
