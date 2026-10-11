'use client';

// ============================================================================
// File: frontend/src/components/templates/ResumeEditor.tsx
// Description: Controlled form editor for resume content + profile. Every edit
//              calls onContentChange / onProfileChange so ResumePreview updates
//              live. Supports add/remove rows, section reorder and photo upload.
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

interface Props {
  content: ResumeContent;
  profile: ResumeProfile;
  sectionOrder: SectionNameType[];
  onContentChange: (next: ResumeContent) => void;
  onProfileChange: (next: ResumeProfile) => void;
  onSectionOrderChange: (next: SectionNameType[]) => void;
}

const field =
  'w-full bg-slate-800/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50';
const label = 'text-[11px] font-medium text-slate-400 block mb-1';
const smallBtn =
  'text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10';

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
      <summary className="text-xs font-semibold text-slate-200 cursor-pointer select-none">{title}</summary>
      <div className="space-y-3 pt-2">{children}</div>
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

  // bullets are edited as one-per-line text, limits mirror backend (<=5 items, <=220 chars)
  const bulletsToText = (b: string[]) => b.join('\n');
  const textToBullets = (t: string) =>
    t.split('\n').map((x) => x.slice(0, 220)).slice(0, 5);

  return (
    <div className="space-y-4 no-print" data-testid="resume-editor">
      <Block title="Your details">
        <div className="flex items-center gap-3">
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="Profile" className="w-14 h-14 rounded-full object-cover border border-white/20" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-dashed border-white/20 flex items-center justify-center text-[10px] text-slate-500">
              No photo
            </div>
          )}
          <div className="space-x-2">
            <button type="button" className={smallBtn} onClick={() => fileRef.current?.click()}>
              {profile.photo ? 'Replace photo' : 'Upload photo'}
            </button>
            {profile.photo && (
              <button type="button" className={smallBtn} onClick={() => setP({ photo: null })}>
                Remove
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
        {photoError && <p className="text-[11px] text-red-400">{photoError}</p>}
        <p className="text-[10px] text-slate-500">
          Many ATS systems ignore photos and some employers prefer none. Remove it if unsure.
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

      <Block title="Headline & summary">
        <div>
          <label className={label} htmlFor="ed-headline">Headline ({content.headline.length}/120)</label>
          <input id="ed-headline" className={field} maxLength={120} value={content.headline} onChange={(e) => setC({ headline: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="ed-summary">Summary ({content.summary.length}/400)</label>
          <textarea id="ed-summary" rows={4} maxLength={400} className={field} value={content.summary} onChange={(e) => setC({ summary: e.target.value })} />
        </div>
      </Block>

      <Block title="Skills">
        <label className={label} htmlFor="ed-skills">Comma separated (max 20)</label>
        <textarea
          id="ed-skills"
          rows={2}
          className={field}
          value={content.skills.join(', ')}
          onChange={(e) => setC({ skills: e.target.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20) })}
        />
      </Block>

      <Block title="Experience">
        {content.experience.map((exp, i) => (
          <div key={i} className="space-y-2 border border-white/5 rounded-lg p-3">
            <input aria-label="Role" placeholder="Role" className={field} value={exp.role} onChange={(e) => updateExp(i, { role: e.target.value })} />
            <input aria-label="Company" placeholder="Company" className={field} value={exp.company ?? ''} onChange={(e) => updateExp(i, { company: e.target.value })} />
            <textarea aria-label="Bullets" rows={4} placeholder="One bullet per line" className={field} value={bulletsToText(exp.bullets)} onChange={(e) => updateExp(i, { bullets: textToBullets(e.target.value) })} />
            <button type="button" className={smallBtn} onClick={() => setC({ experience: content.experience.filter((_, idx) => idx !== i) })}>Remove</button>
          </div>
        ))}
        {content.experience.length < 4 && (
          <button type="button" className={smallBtn} onClick={() => setC({ experience: [...content.experience, { role: 'New role', company: '', bullets: [] }] })}>
            + Add experience
          </button>
        )}
      </Block>

      <Block title="Projects">
        {content.projects.map((p, i) => (
          <div key={i} className="space-y-2 border border-white/5 rounded-lg p-3">
            <input aria-label="Project name" placeholder="Name" className={field} value={p.name} onChange={(e) => updateProj(i, { name: e.target.value })} />
            <textarea aria-label="Project description" rows={2} maxLength={400} placeholder="Description" className={field} value={p.description ?? ''} onChange={(e) => updateProj(i, { description: e.target.value })} />
            <input aria-label="Project link" placeholder="Link" className={field} value={p.link ?? ''} onChange={(e) => updateProj(i, { link: e.target.value })} />
            <textarea aria-label="Project bullets" rows={3} placeholder="One bullet per line" className={field} value={bulletsToText(p.bullets)} onChange={(e) => updateProj(i, { bullets: textToBullets(e.target.value) })} />
            <button type="button" className={smallBtn} onClick={() => setC({ projects: content.projects.filter((_, idx) => idx !== i) })}>Remove</button>
          </div>
        ))}
        {content.projects.length < 4 && (
          <button type="button" className={smallBtn} onClick={() => setC({ projects: [...content.projects, { name: 'New project', description: '', bullets: [], link: '' }] })}>
            + Add project
          </button>
        )}
      </Block>

      <Block title="Education">
        {content.education.map((ed, i) => (
          <div key={i} className="space-y-2 border border-white/5 rounded-lg p-3">
            <input aria-label="Degree" placeholder="Degree" className={field} value={ed.degree} onChange={(e) => updateEdu(i, { degree: e.target.value })} />
            <input aria-label="Institution" placeholder="Institution" className={field} value={ed.institution ?? ''} onChange={(e) => updateEdu(i, { institution: e.target.value })} />
            <input aria-label="Year" placeholder="Year" className={field} value={ed.year ?? ''} onChange={(e) => updateEdu(i, { year: e.target.value })} />
            <button type="button" className={smallBtn} onClick={() => setC({ education: content.education.filter((_, idx) => idx !== i) })}>Remove</button>
          </div>
        ))}
        {content.education.length < 3 && (
          <button type="button" className={smallBtn} onClick={() => setC({ education: [...content.education, { degree: 'New degree', institution: '', year: '' }] })}>
            + Add education
          </button>
        )}
      </Block>

      <Block title="Section order">
        <ul className="space-y-1">
          {sectionOrder.map((s, i) => (
            <li key={s} className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/60 rounded px-2 py-1">
              <span className="capitalize">{s}</span>
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
