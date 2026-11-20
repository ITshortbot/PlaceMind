// Deterministic chat edits for the active resume. No AI. Only values the user
// typed are written. Anything not understood is reported back, never guessed.

export interface Sec {
  id?: string;
  section_type: string;
  content: string;
  meta_info?: Record<string, unknown>;
}

export type Edit =
  | { kind: 'contact'; field: 'name' | 'email' | 'phone'; value: string }
  | { kind: 'summary'; value: string }
  | { kind: 'skill-add'; values: string[] }
  | { kind: 'skill-remove'; values: string[] }
  | { kind: 'entry'; field: 'role' | 'company' | 'degree' | 'institution' | 'year'; target: string; value: string }
  | { kind: 'undo' }
  | { kind: 'refine' };

export type Parsed = { edit: Edit } | { error: string } | null;

export const SUPPORTED =
  'I can do these: "change my name to ...", "set my email to ...", "set my phone to ...", "add skill Python, SQL", "remove skill Excel", "set my summary to ...", "change the year of <degree or school> to 2022 - 2026", "change the company of <role> to ...", and "undo". Anything else I will not guess.';

const clean = (s: string) => s.trim().replace(/^["'“”‘’]+|["'“”‘’.]+$/g, '').trim();
const EMAIL_ONLY = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function splitList(s: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of s.split(/,|;|\band\b|\n/i)) {
    const v = clean(p);
    if (v && v.length <= 60 && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); }
  }
  return out;
}

const VERB = /^(please\s+)?(change|set|update|rename|add|remove|delete|replace|fix|edit|make|correct|put|insert|drop)\b/i;
const TOPIC = /\b(name|e-?mail|phone|number|skills?|year|dates?|role|title|company|degree|institution|school|college|university|summary|experience|education|projects?)\b/i;
const QUESTION = /^(how|what|why|can|could|should|would|is|are|do|does|where|when|which)\b/i;

export function parseEdit(raw: string): Parsed {
  const t = raw.trim().replace(/\s+/g, ' ');
  if (!t) return null;
  if (/^(please\s+)?undo( (that|the last change|last change|my last change|it))?[.!]?$/i.test(t)) return { edit: { kind: 'undo' } };
  if (/^(please\s+)?(refine|improve|polish|make it better)( (it|this|my resume|more|further|again))?[.!]?$/i.test(t)) return { edit: { kind: 'refine' } };

  let m: RegExpMatchArray | null;
  if ((m = t.match(/^(?:please\s+)?(?:change|set|update|make|correct|fix|put)\s+(?:my|the)?\s*(name|e-?mail(?: address)?|phone(?: number)?|number)\s*(?:to|as|is|=|:)\s*(.+)$/i))) {
    const f = m[1].toLowerCase();
    const field = f.startsWith('name') ? 'name' : f.startsWith('e') ? 'email' : 'phone';
    const value = clean(m[2]);
    if (!value) return { error: `I did not see a new ${field}. Say it like "change my ${field} to ...".` };
    if (field === 'email' && !EMAIL_ONLY.test(value)) return { error: `"${value}" does not look like an email address, so I left it as it is.` };
    if (field === 'phone' && !/^\+?[\d\s\-().]{8,20}$/.test(value)) return { error: `"${value}" does not look like a phone number, so I left it as it is.` };
    if (field === 'name' && (value.length > 80 || /@|\d/.test(value))) return { error: `"${value}" does not look like a name, so I left it as it is.` };
    return { edit: { kind: 'contact', field, value } };
  }
  if ((m = t.match(/^(?:please\s+)?rename me (?:to|as)\s+(.+)$/i))) {
    const value = clean(m[1]);
    if (!value || value.length > 80 || /@|\d/.test(value)) return { error: `"${value}" does not look like a name, so I left it as it is.` };
    return { edit: { kind: 'contact', field: 'name', value } };
  }
  if ((m = t.match(/^(?:please\s+)?(?:change|set|update|replace|write)\s+(?:my|the)?\s*summary\s*(?:to|as|with|:)\s*(.+)$/i))) {
    const value = m[1].trim();
    if (value.length < 10) return { error: 'That summary is too short to save. Type the full sentence you want.' };
    return { edit: { kind: 'summary', value } };
  }
  if ((m = t.match(/^(?:please\s+)?(?:add|put|insert)\s+(?:the\s+)?skills?\s*[:\-]?\s*(.+?)(?:\s+(?:to|in|into|on)\s+(?:my\s+)?(?:resume|skills(?: section| list)?))?$/i))) {
    const values = splitList(m[1]);
    if (!values.length) return { error: 'I did not see which skill to add. Say it like "add skill Python, SQL".' };
    return { edit: { kind: 'skill-add', values } };
  }
  if ((m = t.match(/^(?:please\s+)?(?:remove|delete|drop)\s+(?:the\s+)?skills?\s*[:\-]?\s*(.+?)(?:\s+(?:from)\s+(?:my\s+)?(?:resume|skills(?: section| list)?))?$/i))) {
    const values = splitList(m[1]);
    if (!values.length) return { error: 'I did not see which skill to remove. Say it like "remove skill Excel".' };
    return { edit: { kind: 'skill-remove', values } };
  }
  if ((m = t.match(/^(?:please\s+)?(?:change|set|update|add|edit|correct|fix)\s+(?:the\s+)?(role|title|company|degree|institution|school|college|university|year|dates?)\s+(?:of|for|on|at)\s+(.+?)\s+(?:to|as|=)\s+(.+)$/i))) {
    const f = m[1].toLowerCase();
    const field = f === 'title' ? 'role' : /^(school|college|university)$/.test(f) ? 'institution' : /^(year|date)/.test(f) ? 'year' : (f as 'role' | 'company' | 'degree' | 'institution');
    const target = clean(m[2]);
    const value = clean(m[3]);
    if (!target || !value) return { error: 'Tell me which entry and the new value, like "change the year of B.Tech to 2022 - 2026".' };
    return { edit: { kind: 'entry', field, target, value } };
  }

  if (VERB.test(t) && TOPIC.test(t) && !QUESTION.test(t) && !t.endsWith('?')) {
    return { error: `I could not safely understand that edit, so nothing was changed. ${SUPPORTED}` };
  }
  return null;
}

// ---------------------------------------------------------------- applying

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function getDraft(sec: Sec): Record<string, unknown> {
  const meta = (sec.meta_info ||= {});
  if (meta.version !== 1 || typeof meta.draft !== 'object' || meta.draft === null) { meta.version = 1; meta.draft = {}; }
  return meta.draft as Record<string, unknown>;
}

function ensure(secs: Sec[], type: string): Sec {
  let s = secs.find((x) => x.section_type.toLowerCase() === type);
  if (!s) { s = { section_type: type, content: '', meta_info: { version: 1, draft: {} } }; secs.push(s); }
  return s;
}

type Item = Record<string, unknown>;
const itemsOf = (sec: Sec): Item[] => {
  const d = getDraft(sec);
  if (Array.isArray(d.items)) return d.items as Item[];
  if (Array.isArray(d)) return d as unknown as Item[];
  d.items = [];
  return d.items as Item[];
};
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const bulletsOf = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : str(v) ? str(v).split('\n') : []);

function regenExperience(sec: Sec) {
  sec.content = itemsOf(sec).map((e) => [[str(e.role), str(e.company)].filter(Boolean).join(', '), ...bulletsOf(e.bullets)].join('\n')).join('\n\n');
}
function regenEducation(sec: Sec) {
  sec.content = itemsOf(sec).map((e) => [str(e.degree), str(e.institution), str(e.year)].filter(Boolean).join(', ')).join('\n');
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function skillsOf(sec: Sec): string[] {
  const d = getDraft(sec);
  if (Array.isArray(d.skills)) return d.skills.map(String);
  if (typeof d.skills === 'string') return d.skills.split(',').map((x) => x.trim()).filter(Boolean);
  return sec.content ? sec.content.split(',').map((x) => x.trim()).filter(Boolean) : [];
}

export interface ApplyResult {
  sections?: Sec[];
  message: string;
  changed: boolean;
  replace?: { from: string; to: string }; // for raw_text sync of contact fields
}

export function applyEdit(input: Sec[], edit: Edit): ApplyResult {
  const secs = clone(input).map((s) => ({ section_type: s.section_type, content: s.content, meta_info: s.meta_info }));

  if (edit.kind === 'contact') {
    const sec = ensure(secs, 'contact');
    const d = getDraft(sec);
    const old = str(d[edit.field]);
    if (old === edit.value) return { message: `Your ${edit.field} is already ${edit.value}. Nothing changed.`, changed: false };
    d[edit.field] = edit.value;
    for (const k of ['name', 'email', 'phone']) if (d[k] === undefined) d[k] = '';
    if (d.title === undefined) d.title = '';
    sec.content = [str(d.name), str(d.email), str(d.phone)].filter(Boolean).join(' | ');
    return {
      sections: secs,
      changed: true,
      replace: old ? { from: old, to: edit.value } : undefined,
      message: old ? `Changed your ${edit.field} from ${old} to ${edit.value}.` : `Set your ${edit.field} to ${edit.value}.`,
    };
  }

  if (edit.kind === 'summary') {
    const sec = ensure(secs, 'summary');
    getDraft(sec).summary = edit.value;
    sec.content = edit.value;
    return { sections: secs, changed: true, message: 'Replaced your summary with the text you typed.' };
  }

  if (edit.kind === 'skill-add' || edit.kind === 'skill-remove') {
    const sec = ensure(secs, 'skills');
    const cur = skillsOf(sec);
    const have = new Set(cur.map((x) => x.toLowerCase()));
    let next = cur;
    let done: string[] = [];
    let skipped: string[] = [];
    if (edit.kind === 'skill-add') {
      for (const v of edit.values) (have.has(v.toLowerCase()) ? skipped : done).push(v);
      next = [...cur, ...done];
    } else {
      const drop = new Set(edit.values.map((x) => x.toLowerCase()));
      for (const v of edit.values) (have.has(v.toLowerCase()) ? done : skipped).push(v);
      next = cur.filter((x) => !drop.has(x.toLowerCase()));
    }
    if (!done.length) {
      return { changed: false, message: edit.kind === 'skill-add' ? `${skipped.join(', ')} ${skipped.length > 1 ? 'are' : 'is'} already in your skills. Nothing changed.` : `I did not find ${skipped.join(', ')} in your skills. Nothing changed.` };
    }
    getDraft(sec).skills = next;
    sec.content = next.join(', ');
    const verb = edit.kind === 'skill-add' ? 'Added' : 'Removed';
    const extra = skipped.length ? ` ${edit.kind === 'skill-add' ? 'Already there' : 'Not found'}: ${skipped.join(', ')}.` : '';
    return { sections: secs, changed: true, message: `${verb} ${done.join(', ')}.${extra}` };
  }

  if (edit.kind === 'entry') {
    const target = norm(edit.target);
    const eduField = edit.field === 'degree' || edit.field === 'institution' || edit.field === 'year';
    const expField = edit.field === 'role' || edit.field === 'company';
    const pool = eduField ? ['education'] : ['experience'];
    const sec = secs.find((s) => s.section_type.toLowerCase() === pool[0]);
    const other = secs.find((s) => s.section_type.toLowerCase() === (eduField ? 'experience' : 'education'));
    const matches = (items: Item[], keys: string[]) => items.map((it, i) => ({ it, i })).filter(({ it }) => keys.some((k) => norm(str(it[k])).includes(target) && target));
    if (!sec) return { changed: false, message: `There is no ${pool[0]} section in your active resume yet, so I changed nothing. Add it from the builder first.` };
    const items = itemsOf(sec);
    const hit = matches(items, eduField ? ['degree', 'institution'] : ['role', 'company']);
    if (hit.length === 0) {
      if (other && matches(itemsOf(other), eduField ? ['role', 'company'] : ['degree', 'institution']).length) {
        return { changed: false, message: eduField ? `"${edit.target}" is an experience entry. Experience entries have no ${edit.field} field in the builder, so I changed nothing.` : `"${edit.target}" is an education entry. It has no ${edit.field} field. Use degree, institution or year for it. Nothing changed.` };
      }
      const names = items.map((it) => (eduField ? [str(it.degree), str(it.institution)] : [str(it.role), str(it.company)]).filter(Boolean).join(' at ')).filter(Boolean);
      return { changed: false, message: `I could not find an entry matching "${edit.target}". ${names.length ? `Your ${pool[0]} entries: ${names.join('; ')}.` : `Your ${pool[0]} section has no entries.`} Nothing changed.` };
    }
    if (hit.length > 1) return { changed: false, message: `"${edit.target}" matches ${hit.length} entries. Use a more specific word from just one of them. Nothing changed.` };
    const { it } = hit[0];
    const old = str(it[edit.field]);
    if (old === edit.value) return { changed: false, message: `That ${edit.field} is already ${edit.value}. Nothing changed.` };
    it[edit.field] = edit.value;
    if (expField) regenExperience(sec); else regenEducation(sec);
    return { sections: secs, changed: true, message: old ? `Changed the ${edit.field} of that entry from ${old} to ${edit.value}.` : `Set the ${edit.field} of that entry to ${edit.value}.` };
  }

  return { changed: false, message: 'Nothing to do.' };
}
