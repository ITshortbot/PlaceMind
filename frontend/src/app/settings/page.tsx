'use client';

// ============================================================================
// File: frontend/src/app/settings/page.tsx
// Description: Settings & Account Management Page with functional AI Engine preference
//              toggle (Auto-Detect / Gemini Cloud / Local LM Studio), privacy, and danger zone.
// ============================================================================

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Settings,
  User,
  ShieldCheck,
  Bell,
  Cpu,
  Trash2,
  CheckCircle2,
  Sparkles,
  Server,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'engine' | 'notifications' | 'danger'>('engine');
  const [enginePreference, setEnginePreference] = useState<'auto' | 'cloud' | 'local'>('local');
  const [localUrl, setLocalUrl] = useState('http://localhost:1234/v1');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <AppShell>
      <TopBar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1E] dark:text-white tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
            Manage your AI engine routing, local hardware endpoints, and account security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Vertical Nav Tabs */}
          <aside className="md:col-span-4 space-y-1">
            <button
              onClick={() => setActiveTab('engine')}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'engine'
                  ? 'bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#8F82FF] border border-[#6C5CE7]/30 shadow-xs'
                  : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>AI Engine & Local Privacy</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#8F82FF] border border-[#6C5CE7]/30 shadow-xs'
                  : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#8F82FF] border border-[#6C5CE7]/30 shadow-xs'
                  : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications & Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('danger')}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'danger'
                  ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 shadow-xs'
                  : 'text-[#8A8A92] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#EF4444]'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone</span>
            </button>
          </aside>

          {/* Right Tab Content Panel */}
          <div className="md:col-span-8 p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#141417]/90 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-6">
            {/* TAB: AI Engine & Privacy */}
            {activeTab === 'engine' && (
              <div className="space-y-6">
                <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
                  <h3 className="text-base font-bold text-[#1A1A1E] dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
                    AI Engine Routing & Egress Control
                  </h3>
                  <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
                    Choose where your resume text is processed and audited.
                  </p>
                </div>

                {/* 3-Engine Options */}
                <div className="space-y-3">
                  <label
                    onClick={() => setEnginePreference('local')}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                      enginePreference === 'local'
                        ? 'bg-[#16A34A]/10 border-[#16A34A]/40 shadow-xs'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1E] dark:text-white">
                        <Server className="w-4 h-4 text-[#16A34A]" />
                        <span>Always Use Local LM Studio / Ollama (Zero-Egress)</span>
                      </div>
                      <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                        All embeddings and LLM analysis stay 100% on your device. Never calls external APIs.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="engine"
                      checked={enginePreference === 'local'}
                      onChange={() => setEnginePreference('local')}
                      className="mt-1"
                    />
                  </label>

                  <label
                    onClick={() => setEnginePreference('cloud')}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                      enginePreference === 'cloud'
                        ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/40 shadow-xs'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1E] dark:text-white">
                        <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
                        <span>Always Use Gemini 2.5 Cloud Fast-Track</span>
                      </div>
                      <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                        Maximum speed and highest benchmark reasoning with ephemeral server memory buffers.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="engine"
                      checked={enginePreference === 'cloud'}
                      onChange={() => setEnginePreference('cloud')}
                      className="mt-1"
                    />
                  </label>

                  <label
                    onClick={() => setEnginePreference('auto')}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                      enginePreference === 'auto'
                        ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/40 shadow-xs'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1E] dark:text-white">
                        <Cpu className="w-4 h-4 text-[#38BDF8]" />
                        <span>Auto-Detect (Local Preferred, Cloud Fallback)</span>
                      </div>
                      <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                        Pings localhost:1234 on launch; falls back to Gemini Cloud if offline.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="engine"
                      checked={enginePreference === 'auto'}
                      onChange={() => setEnginePreference('auto')}
                      className="mt-1"
                    />
                  </label>
                </div>

                {/* Local Endpoint Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold uppercase text-[#8A8A92]">
                    Local Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {isSaved && (
                    <span className="text-xs text-[#16A34A] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Preferences saved!
                    </span>
                  )}
                  <div className="ml-auto">
                    <Button variant="primary" size="md" onClick={handleSave}>
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-[#1A1A1E] dark:text-white">
                  Profile Information
                </h3>
                <div className="space-y-2">
                  <label className="font-bold text-[#8A8A92]">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Rohan K. Patel"
                    className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-[#8A8A92]">Email Address</label>
                  <input
                    type="email"
                    defaultValue="rohan.patel@email.com"
                    className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.08] dark:border-white/[0.08]"
                  />
                </div>
              </div>
            )}

            {/* TAB: Danger Zone */}
            {activeTab === 'danger' && (
              <div className="p-5 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-3">
                <h3 className="text-sm font-bold text-[#EF4444]">
                  Erase All Stored Resumes & Transcripts
                </h3>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  Permanently purge all parsed documents, ATS gap history, and audio recordings. This cannot be undone.
                </p>
                <button className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-colors cursor-pointer">
                  Purge All Stored Data
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
