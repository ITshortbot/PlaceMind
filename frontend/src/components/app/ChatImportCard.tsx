'use client';

// Resume import result shown inside the dashboard conversation. Visible
// progress steps, then the parsed fields with a plain note about anything
// that stayed blank. Only the user's own text is used. No AI wording.

import React from 'react';
import Link from 'next/link';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { ImportedResume } from '@/lib/importResumeText';

export interface ImportStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export interface ImportState {
  fileName?: string;
  steps: ImportStep[];
  parsed?: ImportedResume;
  error?: string;
  saving?: boolean;
  savedId?: string | null;
  saveError?: string;
}

interface Props {
  state: ImportState;
  onField: (key: 'name' | 'email' | 'phone', value: string) => void;
  onSave: () => void;
}

export function ChatImportCard({ state, onField, onSave }: Props) {
  const p = state.parsed;
  const notFound = p ? p.missing.filter((m) => !['name', 'email', 'phone'].includes(m)) : [];
  const input = (key: 'name' | 'email' | 'phone', label: string) => (
    <label className="text-[11px] block space-y-0.5">
      <span className="font-semibold">{label}</span>
      <input
        value={p ? p[key] : ''}
        onChange={(e) => onField(key, e.target.value)}
        placeholder="Not found, type it here"
        className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#141417] px-2.5 py-1.5 text-xs"
      />
    </label>
  );

  return (
    <div className="space-y-3 mt-2" data-testid="chat-import-card">
      <ul className="space-y-1.5">
        {state.steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            {s.status === 'done' && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
            {s.status === 'active' && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EAB308]" />}
            {s.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
            {s.status === 'pending' && <span className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20" />}
            <span className={s.status === 'pending' ? 'opacity-50' : ''}>{s.label}</span>
          </li>
        ))}
      </ul>

      {state.error && (
        <p role="alert" className="text-xs rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-800 dark:text-rose-200">
          {state.error}
        </p>
      )}

      {p && (
        <div className="space-y-3 pt-1">
          <p className="text-xs leading-relaxed">
            I read {state.fileName ? state.fileName : 'your text'} and used only what is in it. Summary: {p.summary ? 'found' : 'not found'}.
            Skills: {p.skills.length}. Experience entries: {p.experience.length}. Education entries: {p.education.length}. Projects: {p.projects.length}.
          </p>
          <div className="grid sm:grid-cols-3 gap-2">
            {input('name', 'Name')}
            {input('email', 'Email')}
            {input('phone', 'Phone')}
          </div>
          {p.unplaced.length > 0 && (
            <p className="text-xs opacity-80">
              Kept as plain text but not placed in a section: {p.unplaced.map((u) => u.split(':')[0]).join(', ')}. Add them in the builder if you want them on the resume.
            </p>
          )}
          {notFound.length > 0 && (
            <p className="text-xs rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-200">
              Left blank because it was not in your text: {notFound.join(', ')}. To fill these, paste the missing details here in the chat as resume text, or save now and open the resume in the builder to type them yourself.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={state.saving}
              onClick={onSave}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0A0A0C] text-white dark:bg-[#FACC15] dark:text-[#0A0A0C] disabled:opacity-60"
            >
              {state.saving ? 'Saving...' : state.savedId ? 'Save changes' : 'Save as my resume'}
            </button>
            {state.savedId && (
              <>
                <span className="text-xs font-semibold text-[#16A34A]">Saved. This is now your active resume.</span>
                <Link href="/resume" className="text-xs underline font-semibold">Open in builder</Link>
                <Link href="/template" className="text-xs underline font-semibold">Generate a template from it</Link>
              </>
            )}
          </div>
          {state.saveError && <p role="alert" className="text-xs text-rose-600">{state.saveError}</p>}
        </div>
      )}
    </div>
  );
}
