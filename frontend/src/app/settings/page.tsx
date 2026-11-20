'use client';

// ============================================================================
// File: frontend/src/app/settings/page.tsx
// Description: Tab 8 - Settings: Profile Info, AI Engine Routing Preference,
//              Notifications & Privacy from Wireframe v1
//
// Persistence model: the account is the signed-in Google identity (session
// cookie). Profile and engine preference are saved to this browser's
// localStorage and read back by the Resume Builder and ATS page as form
// convenience data - they are not the account.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { useRouter } from 'next/navigation';
import { useAuth, logout } from '@/lib/auth';
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
  LogOut,
  Phone,
  GraduationCap,
  BookOpen,
  Mail,
  FileText,
  RotateCcw,
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
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'engine' | 'privacy'>('profile');
  const [profile, setProfile] = useState<StoredProfile>(EMPTY_PROFILE);
  const [enginePreference, setEnginePreference] = useState<'cloud' | 'local'>('cloud');
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<StoredProfile>(EMPTY_PROFILE);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load persisted preferences on mount.
  useEffect(() => {
    try {
      const rawProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile) as Partial<StoredProfile>;
        setProfile({ ...EMPTY_PROFILE, ...parsed });
        setSavedProfile({ ...EMPTY_PROFILE, ...parsed });
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
      const clean: StoredProfile = {
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        college: profile.college.trim(),
        specialization: profile.specialization.trim(),
      };
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(clean));
      setProfile(clean);
      setSavedProfile(clean);
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

  const clearProfile = () => {
    try { window.localStorage.removeItem(PROFILE_STORAGE_KEY); } catch {}
    setProfile(EMPTY_PROFILE);
    setSavedProfile(EMPTY_PROFILE);
    flashSaved('profile');
  };

  const doSignOut = async () => {
    setLogoutError(null);
    setSigningOut(true);
    try {
      await logout();
      setConfirmingSignOut(false);
      router.replace('/dashboard');
    } catch {
      setLogoutError('Could not complete sign out. Please retry when the backend is available.');
    } finally {
      setSigningOut(false);
    }
  };

  const keys = Object.keys(EMPTY_PROFILE) as (keyof StoredProfile)[];
  const isDirty = keys.some((k) => profile[k] !== savedProfile[k]);
  const filledCount = keys.filter((k) => savedProfile[k].trim()).length;
  const displayName = profile.fullName.trim() || user?.full_name || '';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

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
        actionButton={
          <Button
            variant="outline"
            size="sm"
            icon={<LogOut className="w-3.5 h-3.5" />}
            onClick={() => { setActiveTab('profile'); setConfirmingSignOut(true); }}
          >
            Sign out
          </Button>
        }
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Account & Application Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
            {user?.is_guest
              ? 'Guest access is active. Preferences are saved in this browser.'
              : 'Your Google account plus local preferences saved in this browser.'}
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
                <div className="space-y-6">
                  {/* Identity header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/[0.12] to-[#FACC15]/[0.10] border border-[#6C5CE7]/20">
                    <div className="flex items-center gap-4 min-w-0">
                      {user?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt="" className="w-14 h-14 rounded-full flex-shrink-0 ring-2 ring-white/60" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#0A0A0C] text-[#FACC15] flex items-center justify-center text-lg font-black flex-shrink-0 ring-2 ring-white/60">
                          {initials || <User className="w-6 h-6" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-base font-extrabold truncate">
                          {displayName || (user?.is_guest ? 'Guest' : 'Your profile')}
                        </div>
                        <div className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] truncate">
                          {user?.is_guest ? 'Guest session on this browser' : user?.email}
                        </div>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] text-[#4A4A52] dark:text-[#D4D4D8]">
                          {user?.is_guest ? 'Guest' : 'Signed in with Google'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="default"
                      icon={<LogOut className="w-4 h-4" />}
                      onClick={() => setConfirmingSignOut(true)}
                      className="flex-shrink-0"
                    >
                      Sign out
                    </Button>
                  </div>

                  {confirmingSignOut && (
                    <div role="alertdialog" aria-label="Confirm sign out" className="p-4 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/[0.06] space-y-3">
                      <p className="text-xs text-[#4A4A52] dark:text-[#D4D4D8] leading-relaxed">
                        {user?.is_guest
                          ? 'Signing out ends this guest session and starts a new empty guest session. Resumes saved in this session will no longer be available here.'
                          : 'Signing out ends your Google session and returns you to a new guest session. Your saved resumes stay with your account.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="destructive" size="sm" onClick={doSignOut} disabled={signingOut}>
                          {signingOut ? 'Signing out' : 'Yes, sign out'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmingSignOut(false)} disabled={signingOut}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {logoutError && (
                    <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                      {logoutError}
                    </p>
                  )}

                  {/* Section header and completeness */}
                  <div className="flex items-end justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <div>
                      <h3 className="text-base font-bold">Profile & Education Basics</h3>
                      <p className="text-xs text-[#8A8A92] mt-0.5">
                        Saved in this browser. The Resume Builder pre-fills new drafts with these details. Leave anything blank that you do not want filled.
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 w-28">
                      <div className="text-[11px] font-bold text-[#5A5A63] dark:text-[#A1A1AA]">{filledCount} of 4 added</div>
                      <div className="mt-1 h-1.5 rounded-full bg-black/[0.08] dark:bg-white/[0.1] overflow-hidden">
                        <div className="h-full rounded-full bg-[#FACC15] transition-all" style={{ width: `${(filledCount / 4) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#8A8A92]" /> Full name</Label>
                      <Input placeholder="As it should appear on your resume" value={profile.fullName} onChange={setField('fullName')} autoComplete="name" />
                    </div>
                    {!user?.is_guest && user?.email && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#8A8A92]" /> Account email</Label>
                        <Input value={user.email} readOnly disabled />
                        <p className="text-[11px] text-[#8A8A92]">Comes from your Google account. Edit the resume email in the builder.</p>
                      </div>
                    )}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#8A8A92]" /> Phone number</Label>
                      <Input placeholder="With country code if you like" value={profile.phone} onChange={setField('phone')} autoComplete="tel" inputMode="tel" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#8A8A92]" /> College / University</Label>
                      <Input placeholder="Name of your institution" value={profile.college} onChange={setField('college')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-[#8A8A92]" /> Specialization</Label>
                      <Input placeholder="Branch or major" value={profile.specialization} onChange={setField('specialization')} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={clearProfile} disabled={!keys.some((k) => profile[k] || savedProfile[k])}>
                        Clear details
                      </Button>
                      <Button variant="ghost" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => router.push('/resume')}>
                        Open Resume Builder
                      </Button>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      {savedTab === 'profile' && (
                        <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Saved in this browser
                        </span>
                      )}
                      {savedTab !== 'profile' && isDirty && (
                        <span className="text-xs font-semibold text-[#8A8A92]">Unsaved changes</span>
                      )}
                      {savedTab === 'error' && (
                        <span className="text-xs font-bold text-[#DC2626]">
                          Could not save - browser storage unavailable
                        </span>
                      )}
                      <Button variant="default" size="default" onClick={saveProfile} disabled={!isDirty}>
                        Save Profile
                      </Button>
                    </div>
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
                      In this environment no third-party service processes your data: the backend
                      runs with no Gemini API key and no Cloudflare R2 credentials, and the LM
                      Studio option points at a server on this machine
                      (http://localhost:1234/v1), which is not currently running. If you add a
                      Gemini key, resume and job-description text is sent to Google for AI-written
                      suggestions. If you point LM Studio at a remote host, text is sent to that
                      host. If you add R2 credentials, uploaded PDF files are stored in Cloudflare.
                      This is a single-user demo with no account system and no telemetry pipeline.
                      Delete saved records from the History page to remove them.
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
