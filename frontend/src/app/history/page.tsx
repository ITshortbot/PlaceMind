'use client';

// ============================================================================
// File: frontend/src/app/history/page.tsx
// Description: History & Library archive page with tabbed views, search filters,
//              and a dense, scannable data table for past resumes, ATS scans, and interviews.
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  History,
  Search,
  Filter,
  FileText,
  Mic,
  TrendingUp,
  ExternalLink,
  Trash2,
  Download,
  Calendar,
} from 'lucide-react';

const HISTORY_ITEMS = [
  {
    id: '1',
    type: 'resume',
    title: 'Rohan_Patel_Staff_Architect_2026.pdf',
    target: 'Stripe · Staff Software Architect',
    date: 'Aug 24, 2026',
    score: '94.8%',
    actionUrl: '/resumes/stripe-staff/analyze',
  },
  {
    id: '2',
    type: 'interview',
    title: 'AI Phone Screen Rehearsal · Stripe Core',
    target: 'Staff Distributed Systems Engineer',
    date: 'Aug 25, 2026',
    score: '88.5%',
    actionUrl: '/interview/sess-84920/report',
  },
  {
    id: '3',
    type: 'resume',
    title: 'Rohan_AI_Systems_Specialist.pdf',
    target: 'OpenAI · Senior AI Systems Engineer',
    date: 'Aug 21, 2026',
    score: '98.2%',
    actionUrl: '/resumes/ai-lead/analyze',
  },
];

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'resumes' | 'interviews'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = HISTORY_ITEMS.filter((item) => {
    if (activeTab === 'resumes' && item.type !== 'resume') return false;
    if (activeTab === 'interviews' && item.type !== 'interview') return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'History & Archive' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1E] dark:text-white tracking-tight">
              Activity History & Document Archive
            </h1>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
              Browse past ATS audit reports, optimized resume downloads, and interview evaluations.
            </p>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/80 dark:bg-[#141417]/80 border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-[#8A8A92] hover:text-[#1A1A1E] dark:hover:text-white'
              }`}
            >
              All Items ({HISTORY_ITEMS.length})
            </button>
            <button
              onClick={() => setActiveTab('resumes')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'resumes'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-[#8A8A92] hover:text-[#1A1A1E] dark:hover:text-white'
              }`}
            >
              Resumes (2)
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'interviews'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-[#8A8A92] hover:text-[#1A1A1E] dark:hover:text-white'
              }`}
            >
              Interviews (1)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A92]" />
            <input
              type="text"
              placeholder="Search by title or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-2xl bg-white/80 dark:bg-[#141417]/80 border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium focus:outline-[#6C5CE7] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Dense Scannable Data Table */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#141417]/90 shadow-sm overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.06] text-[#8A8A92] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Document / Session</th>
                  <th className="py-3.5 px-5">Target Position</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Score</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            item.type === 'resume'
                              ? 'bg-[#6C5CE7]/12 text-[#6C5CE7]'
                              : 'bg-[#22C55E]/12 text-[#16A34A] dark:text-[#22C55E]'
                          }`}
                        >
                          {item.type === 'resume' ? <FileText className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </div>
                        <span className="font-bold text-[#1A1A1E] dark:text-white truncate max-w-xs">
                          {item.title}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-[#5A5A63] dark:text-[#A1A1AA]">
                      {item.target}
                    </td>

                    <td className="py-4 px-5 text-[#8A8A92] whitespace-nowrap">
                      {item.date}
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#16A34A] dark:text-[#22C55E] bg-[#16A34A]/10 px-2.5 py-1 rounded-full text-xs">
                        {item.score}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={item.actionUrl}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 text-[#6C5CE7] dark:text-[#8F82FF] font-bold text-xs transition-colors"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
