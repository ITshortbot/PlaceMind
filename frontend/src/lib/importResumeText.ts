// Deterministic parser for pasted resume text. No AI. Only text the user
// pasted is placed into fields; anything not recognised stays out of the
// structured fields (it is still kept in raw_text) and is reported back.

export interface ImportedResume {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: { role: string; company: string | null; bullets: string[] }[];
  education: { degree: string; institution: string | null; year: string | null; details: string | null }[];
  projects: { name: string; description: string | null; bullets: string[] }[];
  unplaced: string[];
  missing: string[];
}

type Bucket = 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'other';

const HEADINGS: [RegExp, Bucket][] = [
  [/^(professional |career )?(summary|objective|profile|about( me)?)$/, 'summary'],
  [/^((technical|key|core) )?(skills?|competenc(y|ies)|technologies|tools( & technologies)?)( & tools)?$/, 'skills'],
  [/^((work|professional|relevant) )?(experience|employment( history)?|internships?|work history)$/, 'experience'],
  [/^(education|academics?|academic background|qualifications?|education & training)$/, 'education'],
  [/^((academic|personal|key|selected) )?projects?$/, 'projects'],
  [/^(certifications?|certificates?|achievements?|awards?|honou?rs|activities|extracurriculars?|publications?|languages|interests|hobbies|references|volunteer(ing)?( experience)?|positions? of responsibility)$/, 'other'],
];

function headingOf(line: string): { bucket: Bucket; label: string } | null {
  const t = line.replace(/[:\-–—_=*#|]+$/g, '').replace(/^[#*\-–—_=\s]+/, '').trim();
  if (!t || t.length > 40) return null;
  const k = t.toLowerCase();
  for (const [re, bucket] of HEADINGS) if (re.test(k)) return { bucket, label: t };
  return null;
}

const BULLET = /^\s*([•·▪●◦\-–—*]|\d+[.)])\s+/;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(\+?\d[\d\s\-().]{8,}\d)/;
const YEAR = /\b(19|20)\d{2}\b(\s*[-–—to]+\s*((19|20)\d{2}|present|current))?/i;

const clip = (s: string, n: number) => s.trim().slice(0, n);
// Keeps whole sentences (or whole words) when text is longer than n.
const clipSentence = (s: string, n: number) => {
  const t = s.trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (end > n * 0.5) return cut.slice(0, end + 1);
  return cut.slice(0, cut.lastIndexOf(' ')).trim() + '...';
};
const stripBullet = (s: string) => s.replace(BULLET, '').trim();

function splitBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (!l.trim()) { if (cur.length) blocks.push(cur); cur = []; } else cur.push(l.trim());
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

// An entry = header lines (non-bullets) followed by bullets. A non-bullet line
// that follows a bullet starts a new entry.
function entries(lines: string[]): { head: string[]; bullets: string[] }[] {
  const out: { head: string[]; bullets: string[] }[] = [];
  let cur: { head: string[]; bullets: string[] } | null = null;
  let lastWasBullet = false;
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { lastWasBullet = lastWasBullet; continue; }
    const isBullet = BULLET.test(l);
    if (isBullet) {
      if (!cur) { cur = { head: [], bullets: [] }; out.push(cur); }
      cur.bullets.push(stripBullet(l));
      lastWasBullet = true;
    } else {
      if (!cur || lastWasBullet) { cur = { head: [], bullets: [] }; out.push(cur); }
      cur.head.push(l);
      lastWasBullet = false;
    }
  }
  return out;
}

function roleCompany(line: string): { role: string; company: string | null } {
  const dm = line.match(/^(.*?)\s*\(([^()]*\d{4}[^()]*)\)\s*$/);
  if (dm && dm[1].trim()) {
    const base = roleCompany(dm[1]);
    const dates = `(${dm[2].trim()})`;
    return base.company ? { role: base.role, company: clip(`${base.company} ${dates}`, 80) } : { role: clip(`${base.role} ${dates}`, 80), company: null };
  }
  const m = line.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i) || line.match(/^(.+?)\s+[|–—-]\s+(.+)$/) || line.match(/^(.+?),\s+(.+)$/);
  if (m) return { role: clip(m[1], 60), company: clip(m[2], 60) };
  return { role: clip(line, 60), company: null };
}

export function parseResumeText(text: string): ImportedResume {
  const lines = text.replace(/\r/g, '').split('\n');
  const buckets: Record<Bucket, string[]> = { summary: [], skills: [], experience: [], education: [], projects: [], other: [] };
  const header: string[] = [];
  const unplaced: string[] = [];
  let cur: Bucket | null = null;
  let otherLabel = '';
  let otherLines: string[] = [];
  const flushOther = () => {
    const body = otherLines.map((l) => l.trim()).filter(Boolean).join('; ');
    if (otherLabel && body) unplaced.push(`${otherLabel}: ${clip(body, 160)}`);
    otherLabel = ''; otherLines = [];
  };

  for (const line of lines) {
    const h = headingOf(line);
    if (h) {
      flushOther();
      cur = h.bucket;
      if (h.bucket === 'other') otherLabel = h.label;
      continue;
    }
    if (cur === null) header.push(line);
    else if (cur === 'other') otherLines.push(line);
    else buckets[cur].push(line);
  }
  flushOther();

  const headerText = header.join('\n');
  const email = (headerText.match(EMAIL) || text.match(EMAIL) || [''])[0];
  const phoneRaw = (headerText.match(PHONE) || text.match(PHONE) || [''])[0];
  const phone = phoneRaw.trim();
  const firstLine = header.map((l) => l.trim()).find(Boolean) || '';
  const words = firstLine.split(/\s+/).filter(Boolean);
  const looksLikeName = words.length >= 1 && words.length <= 5 && words.every((w) => /^[A-Z][A-Za-z.'-]*$/.test(w));
  const name = firstLine && looksLikeName && !EMAIL.test(firstLine) ? firstLine : '';

  const summary = clipSentence(buckets.summary.map((l) => l.trim()).filter(Boolean).join(' '), 900);

  const skills: string[] = [];
  for (const l of buckets.skills) {
    const body = stripBullet(l).replace(/^[A-Za-z][A-Za-z &/]{1,30}:\s*/, '');
    for (const p of body.split(/[,;|•·]/)) { const s = p.trim(); if (s && s.length <= 40) skills.push(s); }
  }
  const skillsU = Array.from(new Set(skills)).slice(0, 20);

  const experience = entries(buckets.experience).slice(0, 4).map((e) => {
    const first = e.head[0] || 'Experience';
    const rc = roleCompany(first);
    const extra = e.head.slice(1).join(' | ');
    return {
      role: rc.role || 'Experience',
      company: rc.company || (extra ? clip(extra, 60) : null),
      bullets: e.bullets.map((b) => clip(b, 220)).filter(Boolean).slice(0, 5),
    };
  });

  const education = splitBlocks(buckets.education).slice(0, 3).map((b) => {
    const joined = b.join(' ');
    const y = joined.match(YEAR);
    const clean = b.map(stripBullet).filter((l, i) => i === 0 || !/^((19|20)\d{2})(\s*[-–—to]+\s*((19|20)\d{2}|present|current))?$/i.test(l));
    return {
      degree: clip(clean[0] || 'Education', 120),
      institution: clean[1] ? clip(clean[1], 120) : null,
      year: y ? clip(y[0], 40) : null,
      details: clean.length > 2 ? clip(clean.slice(2).join('; '), 200) : null,
    };
  });

  const projects = entries(buckets.projects).slice(0, 4).map((e) => ({
    name: clip(e.head[0] || 'Project', 60),
    description: e.head.length > 1 ? clip(e.head.slice(1).join(' '), 400) : null,
    bullets: e.bullets.map((b) => clip(b, 220)).filter(Boolean).slice(0, 5),
  }));

  const missing: string[] = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!phone) missing.push('phone');
  if (!summary) missing.push('summary');
  if (!skillsU.length) missing.push('skills');
  if (!experience.length) missing.push('experience');
  if (!education.length) missing.push('education');
  if (!projects.length) missing.push('projects');

  return { name, email, phone, summary, skills: skillsU, experience, education, projects, unplaced, missing };
}

export interface SectionOut { section_type: string; content: string; meta_info: Record<string, unknown> }

// Builds sections in the exact shape the builder saves, so the builder and the
// template page read the imported resume back without special cases.
export function toSections(r: ImportedResume): SectionOut[] {
  const s: SectionOut[] = [];
  const contact = [r.name, r.email, r.phone].filter(Boolean);
  if (contact.length) s.push({ section_type: 'contact', content: contact.join(' | '), meta_info: { version: 1, draft: { name: r.name, title: '', email: r.email, phone: r.phone } } });
  if (r.summary) s.push({ section_type: 'summary', content: r.summary, meta_info: { version: 1, draft: { summary: r.summary } } });
  if (r.skills.length) s.push({ section_type: 'skills', content: r.skills.join(', '), meta_info: { version: 1, draft: { skills: r.skills } } });
  if (r.experience.length) s.push({
    section_type: 'experience',
    content: r.experience.map((e) => [[e.role, e.company].filter(Boolean).join(', '), ...e.bullets].join('\n')).join('\n\n'),
    meta_info: { version: 1, draft: { items: r.experience } },
  });
  if (r.education.length) s.push({
    section_type: 'education',
    content: r.education.map((e) => [e.degree, e.institution, e.year].filter(Boolean).join(', ')).join('\n'),
    meta_info: { version: 1, draft: { items: r.education } },
  });
  if (r.projects.length) s.push({
    section_type: 'projects',
    content: r.projects.map((p) => [p.name, p.description, ...p.bullets].filter(Boolean).join('\n')).join('\n\n'),
    meta_info: { version: 1, draft: { items: r.projects.map((p) => ({ ...p, link: null })) } },
  });
  return s;
}
