'use client';

// ============================================================================
// File: frontend/src/components/templates/ResumeEditor.tsx
// Description: Controlled form editor for resume content + profile. Every edit
//              calls onContentChange / onProfileChange so ResumePreview updates
//              live. Supports add/remove rows, section reorder and photo upload.
//              Styled with Placemind High-Contrast Black, White & Pop-Yellow theme.
// ============================================================================

import React, { useRef, useState } from 'react';
import type {
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeContent,
  ResumeProfile,
  SectionNameType,
} from '@/types/templates';
import { imageFileToDataUrl } from '@/lib/templates/profile';
import {
  User,
  FileText,
  Code2,
  Briefcase,
  FolderGit2,
  GraduationCap,
  ArrowUpDown,
  Upload,
  Trash2,
  Plus,
  ChevronDown,
} from 'lucide-react';

interface Props {
  content: ResumeContent;
  profile: ResumeProfile;
  sectionOrder: SectionNameType[];
  onContentChange: (next: ResumeContent) => void;
  onProfileChange: (next: ResumeProfile) => void;
  onSectionOrderChange: (next: SectionNameType[]) => void;
}

const field =
  'w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/[0.12] rounded-xl px-3 py-2 text-xs text-[#0A0A0C] dark:text-[#F8F9FA] placeholder-[#8A8A92] focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all';
const label = 'text-[11px] font-bold text-[#5A5A63] dark:text-[#A1A1AA] block mb-1 uppercase tracking-wider';
const smallBtn =
  'text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#FACC15] hover:text-[#0A0A0C] text-[#0A0A0C] dark:text-[#F8F9FA] border border-black/[0.08] dark:border-white/[0.1] transition-all cursor-pointer flex items-center gap-1';

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function Block({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#121217] shadow-xs transition-all overflow-hidden"
    >
      <summary className="text-xs font-bold text-[#0A0A0C] dark:text-white cursor-pointer select-none px-4 py-3 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#854D0E] dark:text-[#FACC15]">{icon}</span>}
          <span>{title}</span>
          {badge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#5A5A63] dark:text-[#A1A1AA]">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-[#8A8A92] group-open:rotate-180 transition-transform duration-200" />
      </summary>
      <div className="p-4 pt-1 space-y-3 border-t border-black/[0.04] dark:border-white/[0.04]">{children}</div>
    </details>
  );
}

export const ResumeEditor: React.FC<Props> = ({
  content,
  profile,
  sectionOrder,
  onContentChange,
  onProfileChange,
  onSectionOrderChange,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const setC = (patch: Partial<ResumeContent>) => onContentChange({ ...content, ...patch });
  const setP = (patch: Partial<ResumeProfile>) => onProfileChange({ ...profile, ...patch });

  const updateExp = (i: number, patch: Partial<ExperienceItem>) =>
    setC({ experience: content.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const updateProj = (i: number, patch: Partial<ProjectItem>) =>
    setC({ projects: content.projects.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const updateEdu = (i: number, patch: Partial<EducationItem>) =>
    setC({ education: content.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setPhotoError(null);
    try {
      setP({ photo: await imageFileToDataUrl(file) });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  const bulletsToText = (b: string[]) => b.join('\n');
  const textToBullets = (t: string) =>
    t.split('\n').map((x) => x.slice(0, 220)).slice(0, 5);

  return (
    <div className="space-y-3 no-print" data-testid="resume-editor">
      {/* ─── Profile Details ─── */}
      <Block title="Your details" icon={<User className="w-4 h-4" />}>
        <div className="flex items-center gap-3">
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-[#FACC15]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center text-[10px] text-[#8A8A92]">
              No photo
            </div>
          )}
          <div className="space-x-2">
            <button type="button" className={smallBtn} onClick={() => fileRef.current?.click()}>
              <Upload className="w-3 h-3" />
              <span>{profile.photo ? 'Replace photo' : 'Upload photo'}</span>
            </button>
            {profile.photo && (
              <button type="button" className={smallBtn} onClick={() => setP({ photo: null })}>
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>Remove</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              data-testid="photo-input"
              onChange={(e) => {
                handlePhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        </div>
        {photoError && <p className="text-[11px] text-red-500 font-medium">{photoError}</p>}
        <p className="text-[10px] text-[#8A8A92]">
          Note: Some ATS systems prefer text-only resumes. Photos are optional.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className={label} htmlFor="pf-name">Full name</label>
            <input id="pf-name" className={field} value={profile.name} onChange={(e) => setP({ name: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="pf-email">Email</label>
            <input id="pf-email" className={field} value={profile.email} onChange={(e) => setP({ email: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="pf-phone">Phone</label>
            <input id="pf-phone" className={field} value={profile.phone} onChange={(e) => setP({ phone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className={label} htmlFor="pf-loc">Location</label>
            <input id="pf-loc" className={field} value={profile.location} onChange={(e) => setP({ location: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className={label} htmlFor="pf-links">Links (comma separated)</label>
            <input
              id="pf-links"
              className={field}
              value={profile.links.join(', ')}
              onChange={(e) => setP({ links: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
            />
          </div>
        </div>
      </Block>

      {/* ─── Headline & Summary ─── */}
      <Block title="Headline & summary" icon={<FileText className="w-4 h-4" />}>
        <div>
          <label className={label} htmlFor="ed-headline">Headline ({content.headline.length}/120)</label>
          <input id="ed-headline" className={field} maxLength={120} value={content.headline} onChange={(e) => setC({ headline: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="ed-summary">Summary ({content.summary.length}/400)</label>
          <textarea id="ed-summary" rows={4} maxLength={400} className={field} value={content.summary} onChange={(e) => setC({ summary: e.target.value })} />
        </div>
      </Block>

      {/* ─── Skills ─── */}
      <Block title="Skills" icon={<Code2 className="w-4 h-4" />} badge={`${content.skills.length}/20`}>
        <label className={label} htmlFor="ed-skills">Comma separated (max 20)</label>
        <textarea
          id="ed-skills"
          rows={2}
          className={field}
          value={content.skills.join(', ')}
          onChange={(e) => setC({ skills: e.target.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20) })}
        />
      </Block>

      {/* ─── Experience ─── */}
      <Block title="Experience" icon={<Briefcase className="w-4 h-4" />} badge={`${content.experience.length}/4`}>
        {content.experience.map((exp, i) => (
          <div key={i} className="space-y-2 border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3">
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="Role" placeholder="Role" className={field} value={exp.role} onChange={(e) => updateExp(i, { role: e.target.value })} />
              <input aria-label="Company" placeholder="Company" className={field} value={exp.company ?? ''} onChange={(e) => updateExp(i, { company: e.target.value })} />
            </div>
            <textarea aria-label="Bullets" rows={3} placeholder="One bullet per line" className={field} value={bulletsToText(exp.bullets)} onChange={(e) => updateExp(i, { bullets: textToBullets(e.target.value) })} />
            <div className="flex justify-end">
              <button type="button" className={smallBtn} onClick={() => setC({ experience: content.experience.filter((_, idx) => idx !== i) })}>
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
        {content.experience.length < 4 && (
          <button type="button" className={smallBtn} onClick={() => setC({ experience: [...content.experience, { role: 'New role', company: '', bullets: [] }] })}>
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add experience</span>
          </button>
        )}
      </Block>

      {/* ─── Projects ─── */}
      <Block title="Projects" icon={<FolderGit2 className="w-4 h-4" />} badge={`${content.projects.length}/4`}>
        {content.projects.map((p, i) => (
          <div key={i} className="space-y-2 border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3">
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="Project name" placeholder="Name" className={field} value={p.name} onChange={(e) => updateProj(i, { name: e.target.value })} />
              <input aria-label="Project link" placeholder="Link (Optional)" className={field} value={p.link ?? ''} onChange={(e) => updateProj(i, { link: e.target.value })} />
            </div>
            <textarea aria-label="Project description" rows={2} maxLength={400} placeholder="Brief summary" className={field} value={p.description ?? ''} onChange={(e) => updateProj(i, { description: e.target.value })} />
            <textarea aria-label="Project bullets" rows={3} placeholder="One bullet per line" className={field} value={bulletsToText(p.bullets)} onChange={(e) => updateProj(i, { bullets: textToBullets(e.target.value) })} />
            <div className="flex justify-end">
              <button type="button" className={smallBtn} onClick={() => setC({ projects: content.projects.filter((_, idx) => idx !== i) })}>
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
        {content.projects.length < 4 && (
          <button type="button" className={smallBtn} onClick={() => setC({ projects: [...content.projects, { name: 'New project', description: '', bullets: [], link: '' }] })}>
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add project</span>
          </button>
        )}
      </Block>

      {/* ─── Education ─── */}
      <Block title="Education" icon={<GraduationCap className="w-4 h-4" />} badge={`${content.education.length}/3`}>
        {content.education.map((ed, i) => (
          <div key={i} className="space-y-2 border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3">
            <input aria-label="Degree" placeholder="Degree" className={field} value={ed.degree} onChange={(e) => updateEdu(i, { degree: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="Institution" placeholder="Institution" className={field} value={ed.institution ?? ''} onChange={(e) => updateEdu(i, { institution: e.target.value })} />
              <input aria-label="Year" placeholder="Year" className={field} value={ed.year ?? ''} onChange={(e) => updateEdu(i, { year: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <button type="button" className={smallBtn} onClick={() => setC({ education: content.education.filter((_, idx) => idx !== i) })}>
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
        {content.education.length < 3 && (
          <button type="button" className={smallBtn} onClick={() => setC({ education: [...content.education, { degree: 'New degree', institution: '', year: '' }] })}>
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add education</span>
          </button>
        )}
      </Block>

      {/* ─── Section Order ─── */}
      <Block title="Section order" icon={<ArrowUpDown className="w-4 h-4" />}>
        <ul className="space-y-1.5">
          {sectionOrder.map((s, i) => (
            <li key={s} className="flex items-center justify-between text-xs font-medium text-[#1A1A1E] dark:text-[#E4E4E7] bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-2">
              <span className="capitalize font-bold">{s}</span>
              <span className="space-x-1">
                <button type="button" aria-label={`Move ${s} up`} className={smallBtn} disabled={i === 0} onClick={() => onSectionOrderChange(move(sectionOrder, i, i - 1))}>↑</button>
                <button type="button" aria-label={`Move ${s} down`} className={smallBtn} disabled={i === sectionOrder.length - 1} onClick={() => onSectionOrderChange(move(sectionOrder, i, i + 1))}>↓</button>
              </span>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
};
