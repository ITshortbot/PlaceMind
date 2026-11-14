// ============================================================================
// File: frontend/src/app/resume/page.tsx
// Description: Resume Builder - edit your own content, render it live into a
//              real template family, score it on demand, print/export, and
//              save drafts to the backend. No fabricated sample persona, no
//              static preview images, no unearned badges.
// ============================================================================
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Separator } from '@/components/ui/Separator';
import { ResumePreview } from '@/components/templates/ResumePreview';
import { buildPalette } from '@/lib/color/engine';
import { createResume, getResume } from '@/lib/api/resumes';
import { Download, Save, Gauge, UploadCloud, LayoutGrid, AlertTriangle } from 'lucide-react';
import type { ResumeContent } from '@/types/templates';
import { BUILDER_TEMPLATES } from '@/lib/builderTemplates';


interface DraftState {
  name: string;
  title: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  role: string;
  company: string;
  bullets: string;
  degree: string;
  institution: string;
  year: string;
}

const EMPTY_DRAFT: DraftState = {
  name: '',
  title: '',
  email: '',
  phone: '',
  summary: '',
  skills: '',
  role: '',
  company: '',
  bullets: '',
  degree: '',
  institution: '',
  year: '',
};

function formatMissingFactLabel(key: string): string {
  const KNOWN_LABELS: Record<string, string> = {
    'education.institution': 'University / College',
    'education.dates': 'Education dates',
    'skills': 'Skills',
    'experience': 'Experience',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.name': 'Full name',
    'full_name': 'Full name',
    'objective': 'Target role / Objective',
    'summary': 'Summary',
  };

  if (KNOWN_LABELS[key]) {
    return KNOWN_LABELS[key];
  }

  return key
    .replace(/[._]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export default function ResumePage() {
  const [selectedTemplate, setSelectedTemplate] = useState(BUILDER_TEMPLATES[0]);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [missingFacts, setMissingFacts] = useState<string[]>([]);
  const [showUnsavedNotice, setShowUnsavedNotice] = useState<boolean>(false);

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  // Hydrate from localStorage profile and backend active resume record.
  // Never overwrites fields the user has already typed into.
  React.useEffect(() => {
    let cancelled = false;

    try {
      if (window.localStorage.getItem('placemind.unsavedNotice') === 'true') {
        setShowUnsavedNotice(true);
      }

      const rawMissing = window.localStorage.getItem('placemind.missingFacts');
      if (rawMissing) {
        setMissingFacts(JSON.parse(rawMissing));
      }

      const rawProfile = window.localStorage.getItem('placemind.profile');
      let profile: {
        fullName?: string;
        email?: string;
        phone?: string;
        college?: string;
        specialization?: string;
      } = {};
      if (rawProfile) {
        profile = JSON.parse(rawProfile);
        setDraft((prev) => ({
          ...prev,
          name: prev.name || profile.fullName || '',
          email: prev.email || profile.email || '',
          phone: prev.phone || profile.phone || '',
          institution: prev.institution || profile.college || '',
          degree: prev.degree || profile.specialization || '',
        }));
      }

      const activeResumeId = window.localStorage.getItem('placemind.activeResumeId');
      if (activeResumeId) {
        getResume(activeResumeId)
          .then((detail) => {
            if (cancelled || !detail) return;
            let hydName = '';
            let hydEmail = '';
            let hydPhone = '';
            let hydDegree = '';
            let hydInstitution = '';
            let hydSummary = '';
            let hydSkills = '';

            for (const sec of detail.sections || []) {
              const type = (sec.section_type || '').toLowerCase();
              const text = sec.content || '';

              if (type === 'contact') {
                const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
                for (const line of lines) {
                  if (line.includes('@') && !hydEmail) {
                    hydEmail = line;
                  } else if (/^[+0-9\s()\-]{7,}$/.test(line) && !hydPhone) {
                    hydPhone = line;
                  } else if (!hydName) {
                    hydName = line;
                  }
                }
              } else if (type === 'education') {
                const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
                if (parts.length >= 2) {
                  hydDegree = parts[0];
                  hydInstitution = parts.slice(1).join(', ');
                } else if (parts.length === 1) {
                  const single = parts[0];
                  if (/(univ|college|institute|school|academy)/i.test(single)) {
                    hydInstitution = single;
                  } else {
                    hydDegree = single;
                  }
                }
              } else if (type === 'objective' || type === 'summary') {
                if (!hydSummary) hydSummary = text;
              } else if (type === 'skills') {
                if (!hydSkills) hydSkills = text;
              }
            }

            setDraft((prev) => ({
              ...prev,
              name: prev.name || hydName || profile.fullName || '',
              email: prev.email || hydEmail || profile.email || '',
              phone: prev.phone || hydPhone || profile.phone || '',
              summary: prev.summary || hydSummary || '',
              skills: prev.skills || hydSkills || '',
              degree: prev.degree || hydDegree || profile.specialization || '',
              institution: prev.institution || hydInstitution || profile.college || '',
            }));
          })
          .catch(() => {
            // Backend resume lookup failed; profile fallback already applied
          });
      }
    } catch {
      // storage unavailable - start empty
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Reactive missing-facts refresh: whenever user fills a listed gap in the builder,
  // remove that key from state and localStorage. Hide banner when empty.
  React.useEffect(() => {
    if (missingFacts.length === 0) return;
    const remaining = missingFacts.filter((fact) => {
      switch (fact) {
        case 'education.institution':
          return !draft.institution.trim();
        case 'education.dates':
          return !draft.year.trim();
        case 'skills':
          return !draft.skills.trim();
        case 'experience':
          return !(draft.role.trim() || draft.bullets.trim() || draft.company.trim());
        case 'contact.email':
          return !draft.email.trim();
        case 'contact.phone':
          return !draft.phone.trim();
        case 'contact.name':
        case 'full_name':
          return !draft.name.trim();
        default:
          return true;
      }
    });

    if (remaining.length !== missingFacts.length) {
      setMissingFacts(remaining);
      try {
        if (remaining.length > 0) {
          window.localStorage.setItem('placemind.missingFacts', JSON.stringify(remaining));
        } else {
          window.localStorage.removeItem('placemind.missingFacts');
        }
      } catch {}
    }
  }, [draft, missingFacts]);

  // Map the form onto the typed ResumeContent the renderer consumes.
  const content: ResumeContent = useMemo(() => {
    const bulletList = draft.bullets
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);
    return {
      name: draft.name || undefined,
      contact: [draft.email, draft.phone].filter(Boolean).join('  |  ') || undefined,
      // Never echo the name as the headline; keep the old empty-state placeholder
      // only when nothing has been entered at all.
      headline: draft.title || (draft.name ? '' : 'Your Resume'),
      summary: draft.summary,
      skills: draft.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      experience:
        draft.role || bulletList.length
          ? [
              {
                role: draft.role || 'Role',
                company: draft.company || null,
                bullets: bulletList,
              },
            ]
          : [],
      projects: [],
      education:
        draft.degree || draft.institution
          ? [
              {
                degree: draft.degree,
                institution: draft.institution || null,
                year: draft.year || null,
              },
            ]
          : [],
    };
  }, [draft]);

  const palette = useMemo(
    () => buildPalette(selectedTemplate.style.mood, selectedTemplate.style.hue ?? undefined),
    [selectedTemplate]
  );

  const toPlainText = () =>
    [
      draft.name,
      draft.title,
      [draft.email, draft.phone].filter(Boolean).join(' | '),
      '',
      draft.summary && `SUMMARY\n${draft.summary}`,
      draft.skills && `SKILLS\n${draft.skills}`,
      (draft.role || draft.bullets) &&
        `EXPERIENCE\n${[draft.role, draft.company].filter(Boolean).join(', ')}\n${draft.bullets}`,
      (draft.degree || draft.institution) &&
        `EDUCATION\n${[draft.degree, draft.institution, draft.year].filter(Boolean).join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n\n');

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setSaveState('error');
      setSaveMessage('Add at least a name before saving.');
      return;
    }
    setSaveState('saving');
    setSaveMessage('');
    try {
      const fileName = `${draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_draft.txt`;
      const saved = await createResume({
        file_name: fileName,
        raw_text: toPlainText(),
        parsed_metadata: { builder: true, template: selectedTemplate.id, contact: { email: draft.email, phone: draft.phone } },
      });
      if (saved?.id) {
        try {
          window.localStorage.setItem('placemind.activeResumeId', saved.id);
          window.localStorage.removeItem('placemind.unsavedNotice');
        } catch {}
        setShowUnsavedNotice(false);
      }
      setSaveState('saved');
      setSaveMessage('Draft saved to your workspace.');
    } catch (err) {
      setSaveState('error');
      setSaveMessage(err instanceof Error ? err.message : 'Save failed.');
    }
  };

  return (
    <AppShell>
      <TopBar
        title="Resume Builder"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Resume Builder' },
        ]}
        actionButton={
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Link href="/resumes/upload" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" icon={<UploadCloud className="w-3.5 h-3.5" />}>
                Upload
              </Button>
            </Link>
            <Link href="/template" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" icon={<LayoutGrid className="w-3.5 h-3.5" />}>
                Templates
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className="px-2 sm:px-3 text-xs flex-shrink-0"
              aria-label="Save Draft"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{saveState === 'saving' ? 'Saving...' : 'Save Draft'}</span>
              <span aria-hidden="true" className="sm:hidden">{saveState === 'saving' ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.print()}
              className="px-2 sm:px-3 text-xs flex-shrink-0"
              aria-label="Export PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#0A0A0C]" />
              <span className="hidden sm:inline">Export PDF</span>
              <span aria-hidden="true" className="sm:hidden">Export</span>
            </Button>
          </div>
        }
      />

      {saveMessage && (
        <div
          className={`mx-6 mt-3 p-3 rounded-xl text-xs font-semibold border ${
            saveState === 'saved'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {showUnsavedNotice && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              You are editing an unsaved local draft. Setup could not be saved to the backend during onboarding. Click &ldquo;Save Draft&rdquo; when ready.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowUnsavedNotice(false);
              try { window.localStorage.removeItem('placemind.unsavedNotice'); } catch {}
            }}
            className="text-[11px] underline hover:opacity-80 flex-shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {missingFacts.length > 0 && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-[#FACC15]/10 border border-[#FACC15]/30 text-xs font-semibold text-[#854D0E] dark:text-[#FACC15] flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FACC15] flex-shrink-0" />
            <span>Missing facts from setup: {missingFacts.map(formatMissingFactLabel).join(', ')}</span>
          </div>
          <button
            onClick={() => {
              setMissingFacts([]);
              try { window.localStorage.removeItem('placemind.missingFacts'); } catch {}
            }}
            className="text-[11px] underline hover:opacity-80 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-64px)] pb-20">
        {/* LEFT COLUMN: your real content */}
        <aside className="w-full lg:w-80 p-5 space-y-4 overflow-y-auto bg-white/60 dark:bg-[#101015]/70 border-r border-black/[0.08] dark:border-white/[0.08] flex-shrink-0 no-print">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-white">
            Your Information
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input type="text" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1">
              <Label>Target Title</Label>
              <Input type="text" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Backend Engineer" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input type="text" value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label>Professional Summary</Label>
              <Textarea rows={3} value={draft.summary} onChange={(e) => set('summary', e.target.value)} placeholder="2-3 sentences about your experience" />
            </div>
            <div className="space-y-1">
              <Label>Skills (comma separated)</Label>
              <Textarea rows={2} value={draft.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Python, FastAPI, PostgreSQL" />
            </div>
          </div>

          <Separator />

          <div className="space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-white">Most Recent Role</h4>
            <div className="space-y-1">
              <Label>Role</Label>
              <Input type="text" value={draft.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Backend Engineer" />
            </div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Input type="text" value={draft.company} onChange={(e) => set('company', e.target.value)} placeholder="Employer name" />
            </div>
            <div className="space-y-1">
              <Label>Achievement Bullets (one per line)</Label>
              <Textarea rows={4} value={draft.bullets} onChange={(e) => set('bullets', e.target.value)} placeholder={'Built FastAPI services serving 2M requests/day\nCut p95 latency from 800ms to 240ms'} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-white">Education</h4>
            <div className="space-y-1">
              <Label>Degree</Label>
              <Input type="text" value={draft.degree} onChange={(e) => set('degree', e.target.value)} placeholder="e.g. B.Tech Computer Science" />
            </div>
            <div className="space-y-1">
              <Label>Institution</Label>
              <Input type="text" value={draft.institution} onChange={(e) => set('institution', e.target.value)} placeholder="University name" />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="text" value={draft.year} onChange={(e) => set('year', e.target.value)} placeholder="e.g. 2023" />
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: live render of YOUR content in the selected layout */}
        <main className="flex-1 p-6 lg:p-8 bg-black/[0.03] dark:bg-black/40 overflow-y-auto">
          {draft.name || draft.summary || draft.role ? (
            <ResumePreview
              style={selectedTemplate.style}
              content={content}
              palette={palette}
              showExportButton={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 max-w-sm mx-auto">
              <Gauge className="w-8 h-8 text-[#6C5CE7]" />
              <p className="text-sm font-semibold text-[#1A1A1E] dark:text-white">
                Start typing on the left
              </p>
              <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
                Your own content renders here live in the selected template. Nothing is pre-filled
                and nothing is invented - what you type is exactly what exports.
              </p>
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: template picker (renders, not thumbnails) */}
        <aside className="w-full lg:w-72 p-5 space-y-4 overflow-y-auto bg-white/60 dark:bg-[#101015]/70 border-l border-black/[0.08] dark:border-white/[0.08] flex-shrink-0 no-print">
          <div className="space-y-2">
            <Label>Template Layout</Label>
            <div className="grid grid-cols-2 gap-2">
              {BUILDER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTemplate.id === tmpl.id
                      ? 'border-[#6C5CE7] bg-[#6C5CE7]/15 ring-1 ring-[#6C5CE7]'
                      : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/20'
                  }`}
                >
                  <div className="font-bold text-[11px] text-[#1A1A1E] dark:text-white">{tmpl.name}</div>
                  <div className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] font-mono">
                    {tmpl.style.font} {tmpl.style.size_pt}pt
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed pt-1">
              Layouts are rendered live with WCAG-checked palettes. Use Analyze to score a saved
              resume against a job description.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
