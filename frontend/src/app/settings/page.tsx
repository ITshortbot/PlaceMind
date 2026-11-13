'use client';

// ============================================================================
// File: frontend/src/app/settings/page.tsx
// Description: Tab 8 - Settings: Profile Info, AI Engine Routing Preference,
//              Notifications & Privacy from Wireframe v1
//
// Persistence model (single-user demo): profile and engine preference are
// saved to this browser's localStorage and read back by the Resume Builder
// and ATS page. Nothing here creates an account or syncs anywhere.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import {
  User,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Sparkles,
  Server,
  Lock,
  Database,
} from 'lucide-react';

const PROFILE_STORAGE_KEY = 'placemind.profile';
const AI_MODE_STORAGE_KEY = 'placemind.aiMode';

interface StoredProfile {
  fullName: string;
  phone: string;
  college: string;
  specialization: string;
}

const EMPTY_PROFILE: StoredProfile = {
  fullName: '',
  phone: '',
  college: '',
  specialization: '',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'engine' | 'privacy'>('profile');
  const [profile, setProfile] = useState<StoredProfile>(EMPTY_PROFILE);
  const [enginePreference, setEnginePreference] = useState<'cloud' | 'local'>('cloud');
  const [savedTab, setSavedTab] = useState<string | null>(null);

  // Load persisted preferences on mount.
  useEffect(() => {
    try {
      const rawProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile) as Partial<StoredProfile>;
        setProfile({ ...EMPTY_PROFILE, ...parsed });
      }
      if (window.localStorage.getItem(AI_MODE_STORAGE_KEY) === 'local') {
        setEnginePreference('local');
      }
    } catch {
      // storage unavailable - start from empty defaults
    }
  }, []);

  const flashSaved = (tab: string) => {
    setSavedTab(tab);
    setTimeout(() => setSavedTab(null), 2500);
  };

  const saveProfile = () => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      flashSaved('profile');
    } catch {
      setSavedTab('error');
      setTimeout(() => setSavedTab(null), 2500);
    }
  };

  const saveEngine = () => {
    try {
      window.localStorage.setItem(AI_MODE_STORAGE_KEY, enginePreference);
      flashSaved('engine');
    } catch {
      setSavedTab('error');
      setTimeout(() => setSavedTab(null), 2500);
    }
  };

  const setField = (field: keyof StoredProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));

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
            Local preferences for this single-user demo. Saved in this browser only.
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
              <span>Profile & Education</span>
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
              <span>Privacy & Data Retention</span>
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
                      Saved in this browser. The Resume Builder pre-fills new drafts with these details.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Your full name"
                        value={profile.fullName}
                        onChange={setField('fullName')}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="Your phone number"
                        value={profile.phone}
                        onChange={setField('phone')}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>College / University</Label>
                      <Input
                        placeholder="Your college or university"
                        value={profile.college}
                        onChange={setField('college')}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Specialization</Label>
                      <Input
                        placeholder="Your specialization"
                        value={profile.specialization}
                        onChange={setField('specialization')}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    {savedTab === 'profile' && (
                      <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved in this browser
                      </span>
                    )}
                    {savedTab === 'error' && (
                      <span className="text-xs font-bold text-[#DC2626]">
                        Could not save - browser storage unavailable
                      </span>
                    )}
                    <Button variant="default" size="default" onClick={saveProfile}>
                      Save Profile
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
                      AI Engine Routing Preference
                    </h3>
                    <p className="text-xs text-[#8A8A92] mt-0.5">
                      Choose which engine the ATS 1-Pass page asks the backend to use.
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
                          <span>Prefer Local LM Studio</span>
                        </div>
                        <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                          Requests the LM Studio server on the backend host (server-side
                          LM_STUDIO_API_BASE, default http://localhost:1234/v1). If it is not
                          running, the report falls back to the built-in deterministic analysis.
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
                          <span>Prefer Gemini Cloud</span>
                        </div>
                        <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                          Requests Gemini for AI-written suggestions. Requires a Gemini API key
                          configured on the backend; without one, the report falls back to the
                          built-in deterministic analysis.
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

                  <p className="text-[11px] text-[#8A8A92]">
                    Core scoring (semantic similarity, keywords, structure) always runs locally on
                    the backend and does not depend on either provider.
                  </p>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    {savedTab === 'engine' && (
                      <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved in this browser
                      </span>
                    )}
                    {savedTab === 'error' && (
                      <span className="text-xs font-bold text-[#DC2626]">
                        Could not save - browser storage unavailable
                      </span>
                    )}
                    <Button variant="default" size="default" onClick={saveEngine}>
                      Save Preference
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: Privacy & Data Retention */}
              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <h3 className="text-base font-bold">Privacy & Data Retention</h3>
                    <p className="text-xs text-[#8A8A92] mt-0.5">
                      What this build stores, and where.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 text-xs text-[#4A4A52] dark:text-[#A1A1AA] space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-[#1A1A1E] dark:text-white">
                      <Database className="w-4 h-4 text-[#6C5CE7]" />
                      <span>Local demo persistence - records are kept, not flushed</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Resumes you upload or save, their parsed text, section embeddings, interview
                      sessions and ATS reports are stored in this environment&apos;s local Postgres
                      database so they survive reloads and appear on the Dashboard and History pages.
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      PDF text extraction runs in memory (PyMuPDF); the parsed result is then saved
                      like any other record. With Cloudflare R2 credentials configured, the backend
                      can also store the uploaded PDF file itself in cloud mode - no R2 credentials
                      are set in this environment, so that upload is skipped.
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      In this demo environment no third-party service processes your data: no
                      Gemini API key and no Cloudflare R2 credentials are configured. If you add a
                      Gemini key, resume and job-description text is sent to Google for AI-written
                      suggestions; if you add R2 credentials, uploaded PDF files are stored in
                      Cloudflare. This is a single-user demo with no account system and no
                      telemetry pipeline. Delete saved records from the History page to remove them.
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
