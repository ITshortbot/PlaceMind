'use client';

// ============================================================================
// File: frontend/src/components/app/CommandPaletteModal.tsx
// Description: Global Fast-Search & Quick Navigation Command Palette (Cmd+K / Search Bar)
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  LayoutGrid,
  FileText,
  FileEdit,
  FileCheck2,
  Mic,
  BarChart3,
  History,
  Settings,
  UploadCloud,
  ArrowRight,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_ITEMS = [
  { name: 'Dashboard', category: 'Navigation', href: '/dashboard', icon: LayoutDashboard, desc: 'Overview & daily ATS health' },
  { name: 'Templates Gallery', category: 'Resume', href: '/template', icon: LayoutGrid, desc: '10 verified enterprise formats' },
  { name: 'Resume Builder', category: 'Resume', href: '/resume', icon: FileText, desc: '3-panel document canvas & AI rewrites' },
  { name: 'Resume Studio Editor', category: 'Resume', href: '/studio', icon: FileEdit, desc: 'Direct typography & layout tuning' },
  { name: 'ATS 1-Pass Auto-Gen', category: 'Intelligence', href: '/ats', icon: FileCheck2, desc: 'Synthesize resume from JD in one pass' },
  { name: 'Upload & Parse Resume', category: 'Quick Action', href: '/resumes/upload', icon: UploadCloud, desc: 'Extract in-memory 0-egress signals' },
  { name: 'Live Mock Interview', category: 'Interview', href: '/interview', icon: Mic, desc: 'Recruiter speech & STAR probes' },
  { name: 'New Interview Setup', category: 'Interview', href: '/interview/new', icon: Zap, desc: 'Customize role & question count' },
  { name: 'Analytical Reports', category: 'Analytics', href: '/report', icon: BarChart3, desc: 'ATS sub-scores & radar charts' },
  { name: 'Artifacts & File History', category: 'Library', href: '/history', icon: History, desc: 'Manage created documents & exports' },
  { name: 'Account & AI Settings', category: 'Configuration', href: '/settings', icon: Settings, desc: 'Gemini Cloud vs Local LM Studio' },
];

export function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = SEARCH_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="relative w-full max-w-xl glass-frosted-dark rounded-3xl border border-white/20 shadow-2xl p-4 text-white overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/10 border border-white/15 focus-within:border-[#FACC15] focus-within:ring-2 focus-within:ring-[#FACC15]/30 transition-all">
              <Search className="w-5 h-5 text-[#FACC15] flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Jump to any page, action, or template (e.g. 'Edit', 'Upload', 'Interview')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/50 focus:outline-none font-medium"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:text-[#FACC15]">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-black/40 text-[10px] font-mono text-white/60">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="mt-3 max-h-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="p-3 rounded-2xl hover:bg-[#FACC15] hover:text-[#0A0A0C] transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/10 group-hover:bg-[#0A0A0C] group-hover:text-[#FACC15] flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-xs">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold truncate">{item.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 group-hover:bg-[#0A0A0C]/10 text-white/70 group-hover:text-[#0A0A0C] font-semibold">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60 group-hover:text-[#0A0A0C]/80 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#0A0A0C] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-white/50 space-y-1">
                  <p>No matching actions found for &quot;{query}&quot;</p>
                  <p className="text-[11px]">Try &quot;resume&quot;, &quot;interview&quot;, &quot;upload&quot;, or &quot;ats&quot;</p>
                </div>
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 px-2">
              <span>Quick Jump &bull; Placemind Command</span>
              <span>Use <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">Cmd+K</kbd> anytime</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
