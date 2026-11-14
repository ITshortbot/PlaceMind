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
import {
  createResume,
  getResume,
  updateResume,
  type ResumeSection,
  type ResumeDetail,
} from '@/lib/api/resumes';
import {
  Download,
  Save,
  Gauge,
  UploadCloud,
  LayoutGrid,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import type { ResumeContent } from '@/types/templates';
import { BUILDER_TEMPLATES } from '@/lib/builderTemplates';

export interface ExperienceEntry {
  role: string;
  company: string;
  bullets: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  bullets: string;
  link: string;
}

export interface DraftState {
  name: string;
  title: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  // Primary (item 0) fields for backwards compatibility:
  role: string;
  company: string;
  bullets: string;
  degree: string;
  institution: string;
  year: string;
  // Additional items:
  additionalExperience: ExperienceEntry[];
  additionalEducation: EducationEntry[];
  projects: ProjectEntry[];
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
  additionalExperience: [],
  additionalEducation: [],
  projects: [],
};

function getAllExperiences(draft: DraftState): ExperienceEntry[] {
  const list: ExperienceEntry[] = [];
  if (draft.role || draft.company || draft.bullets) {
    list.push({
      role: draft.role,
      company: draft.company,
      bullets: draft.bullets,
    });
  }
  if (draft.additionalExperience && draft.additionalExperience.length > 0) {
    list.push(...draft.additionalExperience);
  }
  return list;
}

function getAllEducation(draft: DraftState): EducationEntry[] {
  const list: EducationEntry[] = [];
  if (draft.degree || draft.institution || draft.year) {
    list.push({
      degree: draft.degree,
      institution: draft.institution,
      year: draft.year,
    });
  }
  if (draft.additionalEducation && draft.additionalEducation.length > 0) {
    list.push(...draft.additionalEducation);
  }
  return list;
}

function isSectionDirty(secKey: string, dirtyFields: Set<string>): boolean {
  switch (secKey) {
    case 'contact':
      return (
        dirtyFields.has('name') ||
        dirtyFields.has('title') ||
        dirtyFields.has('email') ||
        dirtyFields.has('phone')
      );
    case 'summary':
      return dirtyFields.has('summary');
    case 'skills':
      return dirtyFields.has('skills');
    case 'experience':
      return (
        dirtyFields.has('role') ||
        dirtyFields.has('company') ||
        dirtyFields.has('bullets') ||
        dirtyFields.has('additionalExperience')
      );
    case 'education':
      return (
        dirtyFields.has('degree') ||
        dirtyFields.has('institution') ||
        dirtyFields.has('year') ||
        dirtyFields.has('additionalEducation')
      );
    case 'projects':
      return dirtyFields.has('projects');
    default:
      return false;
  }
}

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
  const [clearedSections, setClearedSections] = useState<Set<string>>(new Set());

  // Explicit dirty tracking: fields the user touched this session must never be overwritten on hydrate
  const dirtyFieldsRef = React.useRef<Set<string>>(new Set());

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    dirtyFieldsRef.current.add(key as string);
    try {
      window.localStorage.setItem('placemind.builderDirty', 'true');
    } catch {}

    setDraft((prev) => {
      const updated = { ...prev, [key]: value };

      // Explicit cleared section tracking
      if (key === 'skills') {
        if (typeof value === 'string' && value.trim()) {
          setClearedSections((prevSet) => {
            const next = new Set(prevSet);
            next.delete('skills');
            return next;
          });
        } else {
          setClearedSections((prevSet) => new Set(prevSet).add('skills'));
        }
      } else if (key === 'summary') {
        if (typeof value === 'string' && value.trim()) {
          setClearedSections((prevSet) => {
            const next = new Set(prevSet);
            next.delete('summary');
            return next;
          });
        } else {
          setClearedSections((prevSet) => new Set(prevSet).add('summary'));
        }
      } else if (
        key === 'role' ||
        key === 'company' ||
        key === 'bullets' ||
        key === 'additionalExperience'
      ) {
        const exps = getAllExperiences(updated);
        if (exps.length > 0) {
          setClearedSections((prevSet) => {
            const next = new Set(prevSet);
            next.delete('experience');
            return next;
          });
        } else {
          setClearedSections((prevSet) => new Set(prevSet).add('experience'));
        }
      } else if (
        key === 'degree' ||
        key === 'institution' ||
        key === 'year' ||
        key === 'additionalEducation'
      ) {
        const edus = getAllEducation(updated);
        if (edus.length > 0) {
          setClearedSections((prevSet) => {
            const next = new Set(prevSet);
            next.delete('education');
            return next;
          });
        } else {
          setClearedSections((prevSet) => new Set(prevSet).add('education'));
        }
      } else if (key === 'projects') {
        if (Array.isArray(value) && value.length > 0) {
          setClearedSections((prevSet) => {
            const next = new Set(prevSet);
            next.delete('projects');
            return next;
          });
        } else {
          setClearedSections((prevSet) => new Set(prevSet).add('projects'));
        }
      }

      return updated;
    });
  };

  // Hydrate from builder handoff, backend active resume record, or profile.
  // Precedence uses EXPLICIT DIRTY TRACKING: dirty fields always win.
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

      // Check for review-before-apply handoff from Template Studio
      const rawHandoff = window.localStorage.getItem('placemind.builderHandoff');
      if (rawHandoff) {
        try {
          const hContent: ResumeContent = JSON.parse(rawHandoff);
          window.localStorage.removeItem('placemind.builderHandoff');
          window.localStorage.setItem('placemind.builderDirty', 'true');

          let hEmail = '';
          let hPhone = '';
          if (hContent.contact) {
            const parts = hContent.contact.split('|').map((s) => s.trim());
            for (const p of parts) {
              if (p.includes('@') && !hEmail) hEmail = p;
              else if (/^[+0-9\s()\-]{7,}$/.test(p) && !hPhone) hPhone = p;
            }
          }

          const exps = hContent.experience || [];
          const edus = hContent.education || [];
          const projs = hContent.projects || [];

          setDraft({
            name: hContent.name || '',
            title: hContent.headline || '',
            email: hEmail,
            phone: hPhone,
            summary: hContent.summary || '',
            skills: (hContent.skills || []).join(', '),
            role: exps[0]?.role || '',
            company: exps[0]?.company || '',
            bullets: (exps[0]?.bullets || []).join('\n'),
            additionalExperience: exps.slice(1).map((e) => ({
              role: e.role || '',
              company: e.company || '',
              bullets: (e.bullets || []).join('\n'),
            })),
            degree: edus[0]?.degree || '',
            institution: edus[0]?.institution || '',
            year: edus[0]?.year || '',
            additionalEducation: edus.slice(1).map((ed) => ({
              degree: ed.degree || '',
              institution: ed.institution || '',
              year: ed.year || '',
            })),
            projects: projs.map((pr) => ({
              name: pr.name || '',
              description: pr.description || '',
              bullets: (pr.bullets || []).join('\n'),
              link: pr.link || '',
            })),
          });
          return;
        } catch {
          // ignore corrupted handoff
        }
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
        try {
          profile = JSON.parse(rawProfile);
        } catch {}
      }

      const activeResumeId = window.localStorage.getItem('placemind.activeResumeId');
      if (activeResumeId) {
        getResume(activeResumeId)
          .then((detail) => {
            if (cancelled || !detail) return;

            const savedCleared = new Set<string>(
              Array.isArray(detail.parsed_metadata?.cleared_sections)
                ? (detail.parsed_metadata.cleared_sections as string[])
                : []
            );
            setClearedSections(new Set(savedCleared));

            // Structured backend parsed values
            const bData: {
              name?: string;
              title?: string;
              email?: string;
              phone?: string;
              summary?: string;
              skills?: string;
              role?: string;
              company?: string;
              bullets?: string;
              additionalExperience?: ExperienceEntry[];
              degree?: string;
              institution?: string;
              year?: string;
              additionalEducation?: EducationEntry[];
              projects?: ProjectEntry[];
            } = {};

            for (const sec of detail.sections || []) {
              const type = (sec.section_type || '').toLowerCase();
              if (savedCleared.has(type)) continue;

              const meta = sec.meta_info as Record<string, unknown> | undefined;
              const isVersion1 = meta?.version === 1 && meta.draft !== undefined;

              if (isVersion1) {
                const d = meta.draft as Record<string, unknown>;
                if (type === 'contact') {
                  if (d.name !== undefined) bData.name = String(d.name);
                  if (d.title !== undefined) bData.title = String(d.title);
                  if (d.email !== undefined) bData.email = String(d.email);
                  if (d.phone !== undefined) bData.phone = String(d.phone);
                } else if (type === 'summary') {
                  if (d.summary !== undefined) bData.summary = String(d.summary);
                } else if (type === 'skills') {
                  if (Array.isArray(d.skills)) {
                    bData.skills = d.skills.join(', ');
                  } else if (Array.isArray(d)) {
                    bData.skills = d.join(', ');
                  } else if (typeof d.skills === 'string') {
                    bData.skills = d.skills;
                  } else if (typeof d === 'string') {
                    bData.skills = d;
                  }
                } else if (type === 'experience') {
                  const items = Array.isArray(d.items)
                    ? (d.items as Array<Record<string, unknown>>)
                    : Array.isArray(d)
                    ? (d as Array<Record<string, unknown>>)
                    : [];
                  if (items.length > 0) {
                    bData.role = String(items[0]?.role || '');
                    bData.company = String(items[0]?.company || '');
                    const bList = items[0]?.bullets;
                    bData.bullets = Array.isArray(bList)
                      ? bList.join('\n')
                      : String(bList || '');
                    bData.additionalExperience = items.slice(1).map((it) => ({
                      role: String(it?.role || ''),
                      company: String(it?.company || ''),
                      bullets: Array.isArray(it?.bullets)
                        ? it.bullets.join('\n')
                        : String(it?.bullets || ''),
                    }));
                  }
                } else if (type === 'education') {
                  const items = Array.isArray(d.items)
                    ? (d.items as Array<Record<string, unknown>>)
                    : Array.isArray(d)
                    ? (d as Array<Record<string, unknown>>)
                    : [];
                  if (items.length > 0) {
                    bData.degree = String(items[0]?.degree || '');
                    bData.institution = String(items[0]?.institution || '');
                    bData.year = String(items[0]?.year || '');
                    bData.additionalEducation = items.slice(1).map((it) => ({
                      degree: String(it?.degree || ''),
                      institution: String(it?.institution || ''),
                      year: String(it?.year || ''),
                    }));
                  }
                } else if (type === 'projects') {
                  const items = Array.isArray(d.items)
                    ? (d.items as Array<Record<string, unknown>>)
                    : Array.isArray(d)
                    ? (d as Array<Record<string, unknown>>)
                    : [];
                  bData.projects = items.map((it) => ({
                    name: String(it?.name || ''),
                    description: String(it?.description || ''),
                    bullets: Array.isArray(it?.bullets)
                      ? it.bullets.join('\n')
                      : String(it?.bullets || ''),
                    link: String(it?.link || ''),
                  }));
                }
              } else {
                // Legacy non-destructive content heuristics
                const text = sec.content || '';
                if (type === 'contact') {
                  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
                  for (const line of lines) {
                    if (line.includes('@') && !bData.email) {
                      bData.email = line;
                    } else if (/^[+0-9\s()\-]{7,}$/.test(line) && !bData.phone) {
                      bData.phone = line;
                    } else if (!bData.name) {
                      bData.name = line;
                    }
                  }
                } else if (type === 'education') {
                  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
                  if (parts.length >= 2) {
                    bData.degree = parts[0];
                    bData.institution = parts.slice(1).join(', ');
                  } else if (parts.length === 1) {
                    const single = parts[0];
                    if (/(univ|college|institute|school|academy)/i.test(single)) {
                      bData.institution = single;
                    } else {
                      bData.degree = single;
                    }
                  }
                } else if (type === 'objective' || type === 'summary') {
                  if (!bData.summary) bData.summary = text;
                } else if (type === 'skills') {
                  if (!bData.skills) bData.skills = text.replace(/\n/g, ', ');
                } else if (type === 'experience') {
                  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
                  if (!bData.role) bData.role = lines[0] || '';
                  if (!bData.bullets && lines.length > 1) bData.bullets = lines.slice(1).join('\n');
                } else if (type === 'projects') {
                  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
                  if (!bData.projects) {
                    bData.projects = [
                      {
                        name: lines[0] || 'Project',
                        description: '',
                        bullets: lines.slice(1).join('\n'),
                        link: '',
                      },
                    ];
                  }
                }
              }
            }

            // Hydrate draft with explicit dirty tracking:
            // dirty fields win > savedCleared stay empty > backend resume wins > profile fallback
            setDraft((prev) => {
              const dirty = dirtyFieldsRef.current;
              return {
                ...prev,
                name: dirty.has('name')
                  ? prev.name
                  : savedCleared.has('contact')
                  ? ''
                  : bData.name !== undefined
                  ? bData.name
                  : profile.fullName || prev.name,
                title: dirty.has('title')
                  ? prev.title
                  : savedCleared.has('contact')
                  ? ''
                  : bData.title !== undefined
                  ? bData.title
                  : prev.title,
                email: dirty.has('email')
                  ? prev.email
                  : savedCleared.has('contact')
                  ? ''
                  : bData.email !== undefined
                  ? bData.email
                  : profile.email || prev.email,
                phone: dirty.has('phone')
                  ? prev.phone
                  : savedCleared.has('contact')
                  ? ''
                  : bData.phone !== undefined
                  ? bData.phone
                  : profile.phone || prev.phone,
                summary: dirty.has('summary')
                  ? prev.summary
                  : savedCleared.has('summary')
                  ? ''
                  : bData.summary !== undefined
                  ? bData.summary
                  : prev.summary,
                skills: dirty.has('skills')
                  ? prev.skills
                  : savedCleared.has('skills')
                  ? ''
                  : bData.skills !== undefined
                  ? bData.skills
                  : prev.skills,
                role: dirty.has('role')
                  ? prev.role
                  : savedCleared.has('experience')
                  ? ''
                  : bData.role !== undefined
                  ? bData.role
                  : prev.role,
                company: dirty.has('company')
                  ? prev.company
                  : savedCleared.has('experience')
                  ? ''
                  : bData.company !== undefined
                  ? bData.company
                  : prev.company,
                bullets: dirty.has('bullets')
                  ? prev.bullets
                  : savedCleared.has('experience')
                  ? ''
                  : bData.bullets !== undefined
                  ? bData.bullets
                  : prev.bullets,
                additionalExperience: dirty.has('additionalExperience')
                  ? prev.additionalExperience
                  : savedCleared.has('experience')
                  ? []
                  : bData.additionalExperience !== undefined
                  ? bData.additionalExperience
                  : prev.additionalExperience,
                degree: dirty.has('degree')
                  ? prev.degree
                  : savedCleared.has('education')
                  ? ''
                  : bData.degree !== undefined
                  ? bData.degree
                  : profile.specialization || prev.degree,
                institution: dirty.has('institution')
                  ? prev.institution
                  : savedCleared.has('education')
                  ? ''
                  : bData.institution !== undefined
                  ? bData.institution
                  : profile.college || prev.institution,
                year: dirty.has('year')
                  ? prev.year
                  : savedCleared.has('education')
                  ? ''
                  : bData.year !== undefined
                  ? bData.year
                  : prev.year,
                additionalEducation: dirty.has('additionalEducation')
                  ? prev.additionalEducation
                  : savedCleared.has('education')
                  ? []
                  : bData.additionalEducation !== undefined
                  ? bData.additionalEducation
                  : prev.additionalEducation,
                projects: dirty.has('projects')
                  ? prev.projects
                  : savedCleared.has('projects')
                  ? []
                  : bData.projects !== undefined
                  ? bData.projects
                  : prev.projects,
              };
            });
          })
          .catch((err) => {
            const msg = String(err?.message || err);
            if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
              try {
                window.localStorage.removeItem('placemind.activeResumeId');
              } catch {}
              setSaveMessage('Saved draft not found on server - your text is preserved locally');
            }
            // Non-destructive profile fallback when backend resume not found
            setDraft((prev) => ({
              ...prev,
              name: dirtyFieldsRef.current.has('name')
                ? prev.name
                : prev.name || profile.fullName || '',
              email: dirtyFieldsRef.current.has('email')
                ? prev.email
                : prev.email || profile.email || '',
              phone: dirtyFieldsRef.current.has('phone')
                ? prev.phone
                : prev.phone || profile.phone || '',
              institution: dirtyFieldsRef.current.has('institution')
                ? prev.institution
                : prev.institution || profile.college || '',
              degree: dirtyFieldsRef.current.has('degree')
                ? prev.degree
                : prev.degree || profile.specialization || '',
            }));
          });
      } else if (rawProfile) {
        // Initial setup from profile when no resume exists yet
        setDraft((prev) => ({
          ...prev,
          name: dirtyFieldsRef.current.has('name')
            ? prev.name
            : prev.name || profile.fullName || '',
          email: dirtyFieldsRef.current.has('email')
            ? prev.email
            : prev.email || profile.email || '',
          phone: dirtyFieldsRef.current.has('phone')
            ? prev.phone
            : prev.phone || profile.phone || '',
          institution: dirtyFieldsRef.current.has('institution')
            ? prev.institution
            : prev.institution || profile.college || '',
          degree: dirtyFieldsRef.current.has('degree')
            ? prev.degree
            : prev.degree || profile.specialization || '',
        }));
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
          return !(
            draft.role.trim() ||
            draft.bullets.trim() ||
            draft.company.trim() ||
            (draft.additionalExperience && draft.additionalExperience.length > 0)
          );
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
    const allExps = getAllExperiences(draft);
    const allEdus = getAllEducation(draft);
    const allProjs = (draft.projects || []).filter(
      (p) => p.name.trim() || p.description.trim() || p.bullets.trim() || p.link.trim()
    );

    return {
      name: draft.name || undefined,
      contact: [draft.email, draft.phone].filter(Boolean).join('  |  ') || undefined,
      headline: draft.title || (draft.name ? '' : 'Your Resume'),
      summary: draft.summary,
      skills: draft.skills
        ? draft.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      experience: allExps.map((e) => ({
        role: e.role || 'Role',
        company: e.company || null,
        bullets: e.bullets
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean),
      })),
      projects: allProjs.map((p) => ({
        name: p.name || 'Project',
        description: p.description || null,
        bullets: p.bullets
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean),
        link: p.link || null,
      })),
      education: allEdus.map((e) => ({
        degree: e.degree || 'Degree',
        institution: e.institution || null,
        year: e.year || null,
      })),
    };
  }, [draft]);

  const palette = useMemo(
    () => buildPalette(selectedTemplate.style.mood, selectedTemplate.style.hue ?? undefined),
    [selectedTemplate]
  );

  const toPlainText = () => {
    const parts: string[] = [];
    if (draft.name) parts.push(draft.name);
    if (draft.title) parts.push(draft.title);
    const contact = [draft.email, draft.phone].filter(Boolean).join(' | ');
    if (contact) parts.push(contact);

    if (draft.summary.trim()) {
      parts.push(`SUMMARY\n${draft.summary.trim()}`);
    }
    if (draft.skills.trim()) {
      parts.push(`SKILLS\n${draft.skills.trim()}`);
    }
    const allExps = getAllExperiences(draft);
    if (allExps.length > 0) {
      const expText = allExps
        .map((e) =>
          [[e.role, e.company].filter(Boolean).join(', '), e.bullets]
            .filter(Boolean)
            .join('\n')
        )
        .join('\n\n');
      parts.push(`EXPERIENCE\n${expText}`);
    }
    const allProjs = (draft.projects || []).filter(
      (p) => p.name.trim() || p.description.trim() || p.bullets.trim() || p.link.trim()
    );
    if (allProjs.length > 0) {
      const projText = allProjs
        .map((p) =>
          [
            [p.name, p.link].filter(Boolean).join(' - '),
            p.description,
            p.bullets,
          ]
            .filter(Boolean)
            .join('\n')
        )
        .join('\n\n');
      parts.push(`PROJECTS\n${projText}`);
    }
    const allEdus = getAllEducation(draft);
    if (allEdus.length > 0) {
      const eduText = allEdus
        .map((e) => [e.degree, e.institution, e.year].filter(Boolean).join(', '))
        .join('\n');
      parts.push(`EDUCATION\n${eduText}`);
    }

    return parts.filter(Boolean).join('\n\n');
  };

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
      const sections: ResumeSection[] = [];

      // 1. Contact section
      const contactLines = [draft.name, draft.title, draft.email, draft.phone]
        .map((s) => s.trim())
        .filter(Boolean);
      if (contactLines.length > 0) {
        sections.push({
          section_type: 'contact',
          content: contactLines.join(' | '),
          meta_info: {
            version: 1,
            draft: {
              name: draft.name,
              title: draft.title,
              email: draft.email,
              phone: draft.phone,
            },
          },
        });
      }

      // 2. Summary section
      if (draft.summary.trim()) {
        sections.push({
          section_type: 'summary',
          content: draft.summary.trim(),
          meta_info: {
            version: 1,
            draft: { summary: draft.summary },
          },
        });
      }

      // 3. Skills section
      if (draft.skills.trim()) {
        const skillItems = draft.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        sections.push({
          section_type: 'skills',
          content: draft.skills.trim(),
          meta_info: {
            version: 1,
            draft: { skills: skillItems },
          },
        });
      }

      // 4. Experience section
      const allExps = getAllExperiences(draft);
      if (allExps.length > 0) {
        const items = allExps.map((e) => ({
          role: e.role.trim() || 'Role',
          company: e.company.trim() || null,
          bullets: e.bullets
            .split('\n')
            .map((b) => b.trim())
            .filter(Boolean),
        }));
        const expText = allExps
          .map((e) =>
            [[e.role, e.company].filter(Boolean).join(', '), e.bullets]
              .filter(Boolean)
              .join('\n')
          )
          .join('\n\n');
        sections.push({
          section_type: 'experience',
          content: expText.trim() || 'Experience',
          meta_info: {
            version: 1,
            draft: { items },
          },
        });
      }

      // 5. Education section
      const allEdus = getAllEducation(draft);
      if (allEdus.length > 0) {
        const items = allEdus.map((e) => ({
          degree: e.degree.trim() || 'Education',
          institution: e.institution.trim() || null,
          year: e.year.trim() || null,
        }));
        const eduText = allEdus
          .map((e) => [e.degree, e.institution, e.year].filter(Boolean).join(', '))
          .join('\n');
        sections.push({
          section_type: 'education',
          content: eduText.trim() || 'Education',
          meta_info: {
            version: 1,
            draft: { items },
          },
        });
      }

      // 6. Projects section
      const allProjs = (draft.projects || []).filter(
        (p) => p.name.trim() || p.description.trim() || p.bullets.trim() || p.link.trim()
      );
      if (allProjs.length > 0) {
        const items = allProjs.map((p) => ({
          name: p.name.trim() || 'Project',
          description: p.description.trim() || null,
          bullets: p.bullets
            .split('\n')
            .map((b) => b.trim())
            .filter(Boolean),
          link: p.link.trim() || null,
        }));
        const projText = allProjs
          .map((p) =>
            [
              [p.name, p.link].filter(Boolean).join(' - '),
              p.description,
              p.bullets,
            ]
              .filter(Boolean)
              .join('\n')
          )
          .join('\n\n');
        sections.push({
          section_type: 'projects',
          content: projText.trim() || 'Projects',
          meta_info: {
            version: 1,
            draft: { items },
          },
        });
      }

      // Compute cleared sections
      const activeTypes = new Set(sections.map((s) => s.section_type));
      const ALL_SECTIONS = ['summary', 'skills', 'experience', 'education', 'projects'] as const;
      const clearedList = Array.from(
        new Set([
          ...Array.from(clearedSections),
          ...ALL_SECTIONS.filter(
            (sec) => !activeTypes.has(sec) && isSectionDirty(sec, dirtyFieldsRef.current)
          ),
        ])
      );

      const payload = {
        file_name: fileName,
        raw_text: toPlainText(),
        parsed_metadata: {
          builder: true,
          template: selectedTemplate.id,
          cleared_sections: clearedList,
          contact: { email: draft.email, phone: draft.phone },
        },
        sections,
      };

      let activeResumeId = window.localStorage.getItem('placemind.activeResumeId');
      let saved: ResumeDetail;

      if (activeResumeId) {
        try {
          saved = await updateResume(activeResumeId, payload);
        } catch (updateErr: unknown) {
          const msg = updateErr instanceof Error ? updateErr.message : String(updateErr);
          if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
            try {
              window.localStorage.removeItem('placemind.activeResumeId');
            } catch {}
            setSaveState('error');
            setSaveMessage(
              'Saved draft not found on server - your text is preserved locally. Click Save Draft to save as a new resume.'
            );
            return;
          }
          throw updateErr;
        }
      } else {
        saved = await createResume(payload);
      }

      if (saved?.id) {
        try {
          window.localStorage.setItem('placemind.activeResumeId', saved.id);
          window.localStorage.removeItem('placemind.unsavedNotice');
          window.localStorage.removeItem('placemind.builderDirty');
        } catch {}
        setShowUnsavedNotice(false);
      }
      setSaveState('saved');
      setSaveMessage('Draft saved to your workspace.');
    } catch (err: unknown) {
      setSaveState('error');
      setSaveMessage(err instanceof Error ? err.message : 'Save failed.');
    }
  };

  return (
    <AppShell>
      <div className="h-[100dvh] flex flex-col overflow-hidden">
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
            className={`flex-shrink-0 mx-4 sm:mx-6 mt-2 p-2.5 rounded-xl text-xs font-semibold border ${
              saveState === 'saved'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            {saveMessage}
          </div>
        )}

        {showUnsavedNotice && (
          <div className="flex-shrink-0 mx-4 sm:mx-6 mt-2 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 no-print">
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
          <div className="flex-shrink-0 mx-4 sm:mx-6 mt-2 p-2.5 rounded-2xl bg-[#FACC15]/10 border border-[#FACC15]/30 text-xs font-semibold text-[#854D0E] dark:text-[#FACC15] flex items-center justify-between gap-3 no-print">
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

        {/* 3-Column Workspace: Fills exactly remaining height without whole-window scroll */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT COLUMN: your real content */}
          <aside className="w-full lg:w-80 p-4 sm:p-5 space-y-4 overflow-y-auto bg-white/60 dark:bg-[#101015]/70 border-r border-black/[0.08] dark:border-white/[0.08] flex-shrink-0 no-print pb-28">
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
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-white">
                  Experience
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    set('additionalExperience', [
                      ...draft.additionalExperience,
                      { role: '', company: '', bullets: '' },
                    ]);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Role</span>
                </button>
              </div>

              {/* Primary Role (Role #1) */}
              <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
                <span className="font-semibold text-[11px] text-[#1A1A1E] dark:text-white block">
                  Primary Role
                </span>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Input
                    type="text"
                    value={draft.role}
                    onChange={(e) => set('role', e.target.value)}
                    placeholder="e.g. Backend Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Company</Label>
                  <Input
                    type="text"
                    value={draft.company}
                    onChange={(e) => set('company', e.target.value)}
                    placeholder="Employer name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Achievement Bullets (one per line)</Label>
                  <Textarea
                    rows={4}
                    value={draft.bullets}
                    onChange={(e) => set('bullets', e.target.value)}
                    placeholder={
                      'Built FastAPI services serving 2M requests/day\nCut p95 latency from 800ms to 240ms'
                    }
                  />
                </div>
              </div>

              {/* Additional Roles */}
              {draft.additionalExperience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-[#1A1A1E] dark:text-white">
                      Role #{idx + 2}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = draft.additionalExperience.filter((_, i) => i !== idx);
                        set('additionalExperience', updated);
                      }}
                      className="text-rose-500 hover:text-rose-600 p-1 rounded cursor-pointer"
                      title="Remove role"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Input
                      type="text"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...draft.additionalExperience];
                        updated[idx] = { ...updated[idx], role: e.target.value };
                        set('additionalExperience', updated);
                      }}
                      placeholder="e.g. Frontend Engineer"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Company</Label>
                    <Input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...draft.additionalExperience];
                        updated[idx] = { ...updated[idx], company: e.target.value };
                        set('additionalExperience', updated);
                      }}
                      placeholder="Employer name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Achievement Bullets (one per line)</Label>
                    <Textarea
                      rows={3}
                      value={exp.bullets}
                      onChange={(e) => {
                        const updated = [...draft.additionalExperience];
                        updated[idx] = { ...updated[idx], bullets: e.target.value };
                        set('additionalExperience', updated);
                      }}
                      placeholder="Key achievements..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Projects Section */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-white">
                  Projects
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    set('projects', [
                      ...draft.projects,
                      { name: '', description: '', bullets: '', link: '' },
                    ]);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Project</span>
                </button>
              </div>

              {draft.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-[#1A1A1E] dark:text-white">
                      Project #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = draft.projects.filter((_, i) => i !== idx);
                        set('projects', updated);
                      }}
                      className="text-rose-500 hover:text-rose-600 p-1 rounded cursor-pointer"
                      title="Remove project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <Label>Project Name</Label>
                    <Input
                      type="text"
                      value={proj.name}
                      onChange={(e) => {
                        const updated = [...draft.projects];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        set('projects', updated);
                      }}
                      placeholder="e.g. Distributed Vector Store"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Link (Optional)</Label>
                    <Input
                      type="text"
                      value={proj.link}
                      onChange={(e) => {
                        const updated = [...draft.projects];
                        updated[idx] = { ...updated[idx], link: e.target.value };
                        set('projects', updated);
                      }}
                      placeholder="e.g. github.com/user/project"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...draft.projects];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        set('projects', updated);
                      }}
                      placeholder="Brief overview of what you built..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Achievement Bullets (one per line)</Label>
                    <Textarea
                      rows={3}
                      value={proj.bullets}
                      onChange={(e) => {
                        const updated = [...draft.projects];
                        updated[idx] = { ...updated[idx], bullets: e.target.value };
                        set('projects', updated);
                      }}
                      placeholder="Key engineering challenges and results..."
                    />
                  </div>
                </div>
              ))}

              {draft.projects.length === 0 && (
                <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA] italic">
                  No projects added. Click &ldquo;Add Project&rdquo; to highlight key work.
                </p>
              )}
            </div>

            <Separator />

            {/* Education Section */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1E] dark:text-white">
                  Education
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    set('additionalEducation', [
                      ...draft.additionalEducation,
                      { degree: '', institution: '', year: '' },
                    ]);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Education</span>
                </button>
              </div>

              {/* Primary Education */}
              <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
                <span className="font-semibold text-[11px] text-[#1A1A1E] dark:text-white block">
                  Primary Credential
                </span>
                <div className="space-y-1">
                  <Label>Degree</Label>
                  <Input
                    type="text"
                    value={draft.degree}
                    onChange={(e) => set('degree', e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Institution</Label>
                  <Input
                    type="text"
                    value={draft.institution}
                    onChange={(e) => set('institution', e.target.value)}
                    placeholder="University name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Year</Label>
                  <Input
                    type="text"
                    value={draft.year}
                    onChange={(e) => set('year', e.target.value)}
                    placeholder="e.g. 2023"
                  />
                </div>
              </div>

              {/* Additional Education */}
              {draft.additionalEducation.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-[#1A1A1E] dark:text-white">
                      Education #{idx + 2}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = draft.additionalEducation.filter((_, i) => i !== idx);
                        set('additionalEducation', updated);
                      }}
                      className="text-rose-500 hover:text-rose-600 p-1 rounded cursor-pointer"
                      title="Remove education"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <Label>Degree</Label>
                    <Input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...draft.additionalEducation];
                        updated[idx] = { ...updated[idx], degree: e.target.value };
                        set('additionalEducation', updated);
                      }}
                      placeholder="e.g. Minor in Mathematics"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Institution</Label>
                    <Input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...draft.additionalEducation];
                        updated[idx] = { ...updated[idx], institution: e.target.value };
                        set('additionalEducation', updated);
                      }}
                      placeholder="University name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Year</Label>
                    <Input
                      type="text"
                      value={edu.year}
                      onChange={(e) => {
                        const updated = [...draft.additionalEducation];
                        updated[idx] = { ...updated[idx], year: e.target.value };
                        set('additionalEducation', updated);
                      }}
                      placeholder="e.g. 2024"
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* CENTER COLUMN: live render of YOUR content in the selected layout */}
          <main className="flex-1 p-4 lg:p-6 bg-black/[0.03] dark:bg-black/40 overflow-y-auto flex flex-col items-center justify-start pb-28">
            {draft.name ||
            draft.summary ||
            draft.role ||
            draft.skills ||
            (draft.projects && draft.projects.length > 0) ||
            (draft.additionalExperience && draft.additionalExperience.length > 0) ||
            draft.degree ? (
              <ResumePreview
                style={selectedTemplate.style}
                content={content}
                palette={palette}
                showExportButton={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 max-w-sm mx-auto my-auto">
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
          <aside className="w-full lg:w-72 p-4 sm:p-5 space-y-4 overflow-y-auto bg-white/60 dark:bg-[#101015]/70 border-l border-black/[0.08] dark:border-white/[0.08] flex-shrink-0 no-print pb-28">
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
      </div>
    </AppShell>
  );
}
