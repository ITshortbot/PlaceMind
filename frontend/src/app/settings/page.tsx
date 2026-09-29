'use client';

// ============================================================================
// File: frontend/src/app/settings/page.tsx
// Description: Tab 8 - Settings: Profile Info, AI Engine Routing Preference,
//              Notifications & Privacy from Wireframe v1
// ============================================================================

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'engine' | 'privacy'>('profile');
  const [enginePreference, setEnginePreference] = useState<'auto' | 'cloud' | 'local'>('local');
  const [localUrl, setLocalUrl] = useState('http://localhost:1234/v1');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <AppShell showAiBar={false}>
      <TopBar
        title="Settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Account & Application Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
            Manage your personal profile, local LLM pairing, and telemetry preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Vertical Nav Tabs */}
          <aside className="md:col-span-4 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#8F82FF] border border-[#6C5CE7]/30 shadow-xs'
                  : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Education (Step 2)</span>
            </button>

            <button
              onClick={() => setActiveTab('engine')}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'engine'
                  ? 'bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#8F82FF] border border-[#6C5CE7]/30 shadow-xs'
                  : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>AI Engine (Gemini vs LM Studio)</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#8F82FF] border border-[#6C5CE7]/30 shadow-xs'
                  : 'text-[#5A5A63] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Privacy & Zero-Disk Sandbox</span>
            </button>
          </aside>

          {/* Right Panel Content */}
          <div className="md:col-span-8">
            <Card className="p-6 sm:p-8 space-y-6 shadow-sm">
              {/* TAB 1: Profile & Education Info */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <h3 className="text-base font-bold">Profile & Education Basics</h3>
                    <p className="text-xs text-[#8A8A92] mt-0.5">
                      Pre-fills your contact and university fields across all 10 templates.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <Input defaultValue="Rohan K. Patel" />
                    </div>

                    <div className="space-y-1">
                      <Label>Phone Number</Label>
                      <Input defaultValue="+1 (555) 349-2049" />
                    </div>

                    <div className="space-y-1">
                      <Label>College / University</Label>
                      <Input defaultValue="Stanford University" />
                    </div>

                    <div className="space-y-1">
                      <Label>Specialization</Label>
                      <Input defaultValue="Computer Science & Distributed Systems" />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button variant="default" size="default" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 2: AI Engine Preference */}
              {activeTab === 'engine' && (
                <div className="space-y-5">
                  <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
                      AI Engine Routing & Egress Control
                    </h3>
                    <p className="text-xs text-[#8A8A92] mt-0.5">
                      Toggle between Cloud Gemini 2.5 and Local LM Studio / Ollama.
                    </p>
                  </div>

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
                          <span>Always Use Local LM Studio / Ollama (0-Egress)</span>
                        </div>
                        <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                          Zero data ever leaves your device.
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="engine"
                        checked={enginePreference === 'local'}
                        onChange={() => setEnginePreference('local')}
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
                          <span>Gemini 2.5 Cloud Fast-Track</span>
                        </div>
                        <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                          Fastest cloud synthesis with ephemeral memory buffers.
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="engine"
                        checked={enginePreference === 'cloud'}
                        onChange={() => setEnginePreference('cloud')}
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label>Local Endpoint URL</Label>
                    <Input
                      type="text"
                      value={localUrl}
                      onChange={(e) => setLocalUrl(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button variant="default" size="default" onClick={handleSave}>
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: Privacy & Zero-Disk Sandbox */}
              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <h3 className="text-base font-bold">Privacy Sandbox & Telemetry</h3>
                    <p className="text-xs text-[#8A8A92] mt-0.5">
                      Verify your security posture and data retention policies.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/30 text-xs text-[#16A34A] dark:text-[#22C55E] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Zero-Disk Stream Extraction Active</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Resumes are parsed via in-memory PyMuPDF buffers and flushed instantly after session evaluation.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
