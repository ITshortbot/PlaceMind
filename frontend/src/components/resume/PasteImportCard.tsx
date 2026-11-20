'use client';

// Paste-your-resume import. Deterministic, no AI: only text the user pastes is
// used. Missing fields stay blank and are listed so the user can add them.

import React, { useState } from 'react';
import Link from 'next/link';
import { createResume, updateResume } from '@/lib/api/resumes';
import { parseResumeText, toSections, type ImportedResume } from '@/lib/importResumeText';

const LABELS: Record<string, string> = {
  name: 'name', email: 'email', phone: 'phone', summary: 'summary',
  skills: 'skills', experience: 'experience', education: 'education', projects: 'projects',
};

export function PasteImportCard() {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ImportedResume | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const read = () => {
    setError(null);
    if (!text.trim()) { setError('Paste your resume text first.'); return; }
    setParsed(parseResumeText(text));
  };

  const save = async () => {
    if (!parsed) return;
    setSaving(true); setError(null);
    try {
      const r: ImportedResume = { ...parsed };
      const sections = toSections(r);
      if (!sections.length) { setError('Nothing could be read from this text. Add headings like Skills, Experience, Education, or use the builder.'); return; }
      const label = (r.name || 'imported').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const payload = {
        file_name: `${label}_pasted.txt`,
        raw_text: text,
        parsed_metadata: { builder: true, imported: 'pasted-text', cleared_sections: [], contact: { email: r.email, phone: r.phone } },
        sections,
      };
      const saved = savedId ? await updateResume(savedId, payload) : await createResume(payload);
      setSavedId(saved.id);
      try {
        window.localStorage.setItem('placemind.activeResumeId', saved.id);
        window.localStorage.removeItem('placemind.unsavedNotice');
        window.localStorage.removeItem('placemind.builderDirty');
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: 'name' | 'email' | 'phone', label: string) => (
    <label className="text-xs space-y-1 block">
      <span className="font-semibold">{label}</span>
      <input
        id={`paste-import-${key}`}
        className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#141417] px-3 py-2 text-sm"
        value={parsed ? parsed[key] : ''}
        onChange={(e) => parsed && setParsed({ ...parsed, [key]: e.target.value })}
        placeholder="Not found, type it here"
      />
    </label>
  );

  return (
    <section id="paste-import-card" className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-[#141417]/70 border border-black/[0.06] dark:border-white/[0.06] space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#1A1A1E] dark:text-white">Or paste your resume text</h2>
        <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-1">
          Paste the text of your existing resume. PlaceMind only uses what you paste. Anything it cannot find stays blank, it is never made up.
        </p>
      </div>
      <textarea
        id="paste-import-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={9}
        placeholder={'Your Name\nyou@example.com | +91 ...\n\nSKILLS\nPython, SQL\n\nEXPERIENCE\nRole at Company\n- what you did\n\nEDUCATION\nDegree\nCollege, 2026'}
        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0F0F12] p-3 text-sm font-mono"
      />
      <div className="flex gap-2">
        <button id="paste-import-read" type="button" onClick={read} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6C5CE7] text-white">
          {parsed ? 'Read again' : 'Read my text'}
        </button>
      </div>

      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}

      {parsed && (
        <div id="paste-import-review" className="space-y-3 text-xs">
          <div className="grid sm:grid-cols-3 gap-3">
            {field('name', 'Name')}
            {field('email', 'Email')}
            {field('phone', 'Phone')}
          </div>
          <ul className="space-y-0.5 text-[#5A5A63] dark:text-[#A1A1AA]">
            <li>Summary: {parsed.summary ? 'found' : 'not found'}</li>
            <li>Skills found: {parsed.skills.length}</li>
            <li>Experience entries: {parsed.experience.length}</li>
            <li>Education entries: {parsed.education.length}</li>
            <li>Projects: {parsed.projects.length}</li>
          </ul>
          {parsed.unplaced.length > 0 && (
            <p className="text-[#5A5A63] dark:text-[#A1A1AA]">
              Kept as plain text but not placed in a section: {parsed.unplaced.map((u) => u.split(':')[0]).join(', ')}. Add them in the builder if you want them on the resume.
            </p>
          )}
          {parsed.missing.filter((m) => !['name', 'email', 'phone'].includes(m)).length > 0 && (
            <p id="paste-import-missing" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-200">
              Left blank because it was not in your text: {parsed.missing.filter((m) => LABELS[m]).join(', ')}.
              To fill them, paste the missing details into the box above, click Read again, then Save changes to rebuild this resume, or save now and open it in the builder to type them yourself.
            </p>
          )}
          <button id="paste-import-save" type="button" disabled={saving} onClick={save} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16A34A] text-white disabled:opacity-60">
            {saving ? 'Saving...' : savedId ? 'Save changes' : 'Save as my resume'}
          </button>
          {savedId && (
            <div id="paste-import-saved" className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[#16A34A]">Saved. This is now your active resume.</span>
              <Link href="/resume" className="underline font-semibold">Open in builder</Link>
              <Link href="/template" className="underline font-semibold">Generate a template from it</Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
