// Deterministic extractor for a resume written as a plain paragraph. No AI.
// Only phrases the user wrote are placed into fields. Anything not stated
// stays blank and is listed in `missing`.
import type { ImportedResume } from './importResumeText';

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(\+?\d[\d\s\-().]{8,}\d)/;
const ci = (w: string) => w.replace(/[a-z]/gi, (c) => `[${c.toLowerCase()}${c.toUpperCase()}]`);
const CAP = String.raw`[A-Z][A-Za-z0-9&-]*`;
const CAPS = (max: number) => `${CAP}(?:\\s+${CAP}){0,${max}}`;
const clip = (s: string, n: number) => s.trim().slice(0, n);
const cleanEnd = (s: string) => s.replace(/[\s,.;:]+$/g, '').trim();

export interface Freeform { resume: ImportedResume; signals: number }

function findName(t: string): string {
  const m = t.match(new RegExp(String.raw`\b(?:${ci('my name is')}|${ci('name is')}|${ci('name:')}|${ci('i am')}|${ci("i'm")}|${ci('this is')})\s+(${CAPS(3)})`));
  if (!m) return '';
  const words = m[1].split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  // stop at common non-name capitalised words
  const stop = new Set(['I', 'A', 'An', 'The', 'CS', 'IT', 'Student', 'Final']);
  const out: string[] = [];
  for (const w of words) { if (stop.has(w)) break; out.push(w); }
  return out.join(' ');
}

function findSkills(t: string): string[] {
  const m = t.match(/(?:\bskills?\b\s*(?:are|include|includes|:|-|=)?|\bi (?:know|use)\b|\bproficient in\b|\bfamiliar with\b|\bexperienced (?:in|with)\b)\s*([^.\n]+)/i);
  if (!m) return [];
  const out: string[] = [];
  const parts = m[1].split(/\s*(?:,|;|\/|\band\b|&)\s*/i);
  for (const p of parts) {
    const s = cleanEnd(p);
    if (!s) continue;
    if (/^(a|an|the|my|i|we|with|also|currently|and)\b/i.test(s) || s.split(/\s+/).length > 3 || s.length > 30) break;
    out.push(s);
  }
  return Array.from(new Set(out)).slice(0, 20);
}

export function parseFreeform(text: string): Freeform | null {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length < 60) return null;
  const email = (t.match(EMAIL) || [''])[0];
  const tNoEmail = t.replace(EMAIL, ' ');
  const phone = ((tNoEmail.match(PHONE) || [''])[0]).trim();
  const name = findName(t);
  const skills = findSkills(t);

  // Education: "<branch> student at <Institution>", with CGPA/GPA and a year-of-study if written.
  const education: ImportedResume['education'] = [];
  const stu = t.match(new RegExp(String.raw`(?:\b(?:${ci('a')}|${ci('an')}|${ci('the')})\s+)?((?:(?:${ci('final')}|${ci('first')}|${ci('second')}|${ci('third')}|${ci('fourth')})[- ]${ci('year')}\s+)?)([A-Za-z]+(?:\s[A-Za-z]+)?)\s+${ci('student')}\s+(?:${ci('at')}|${ci('in')}|${ci('from')})\s+(${CAPS(5)}(?:\s+(?:of|and|for)\s+${CAPS(3)})?)`));
  const cg = t.match(/\b(c?gpa)\s*(?:of|is|:|-)?\s*(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/i);
  if (stu || cg) {
    const year = stu && stu[1] ? stu[1].trim() : '';
    const branch = stu ? stu[2].trim().replace(/^(?:a|an|the|i am|i'm)\s+/i, '') : '';
    const details = [year ? year[0].toUpperCase() + year.slice(1) : '', cg ? `${cg[1].toUpperCase()} ${cg[2]}${cg[3] ? '/' + cg[3] : ''}` : ''].filter(Boolean).join(', ');
    education.push({
      degree: clip(branch ? `${branch} student` : 'Education', 120),
      institution: stu ? clip(cleanEnd(stu[3]), 120) : null,
      year: null,
      details: details || null,
    });
  }

  // Experience: "<n> month internship at <Company> (summer 2025)", and "<x> club coordinator".
  const experience: ImportedResume['experience'] = [];
  const num = `(?:\\d+|${['one','two','three','four','five','six','a'].map(ci).join('|')})`;
  const season = `(?:${['summer','winter','spring','autumn','fall'].map(ci).join('|')})\\s+(?:19|20)\\d{2}`;
  const intern = t.match(new RegExp(String.raw`\b(${num}[- ]?(?:${ci('month')}|${ci('week')})s?\s+)?(${ci('internship')}|${ci('intern')})\s+(?:${ci('at')}|${ci('with')})\s+(${CAPS(3)})(?:[^.]*?\b(${season}|(?:19|20)\d{2}))?`));
  if (intern) {
    const bits = [intern[1] ? cleanEnd(intern[1]) + ' internship' : '', intern[4] || ''].filter(Boolean);
    experience.push({ role: 'Intern', company: clip(cleanEnd(intern[3]), 60), bullets: bits.length ? [bits.join(', ')].map((b) => b[0].toUpperCase() + b.slice(1)) : [] });
  }
  const club = t.match(/\b([A-Za-z]+(?:\s[A-Za-z]+)?\s+club)\s+(coordinator|lead|president|secretary|member|head)\b/i);
  if (club) experience.push({ role: club[2][0].toUpperCase() + club[2].slice(1).toLowerCase(), company: clip(club[1].replace(/^(?:the|our|my)\s+/i, '').replace(/^./, (c) => c.toUpperCase()), 60), bullets: [] });

  // Projects: only if the user mentions one. Name only when they gave one.
  const projects: ImportedResume['projects'] = [];
  const proj = t.match(new RegExp(String.raw`\b((?:final[- ]year|capstone|major|minor|mini)\s+project|project)\s*(?:called|named|on|about|is|:)\s+(?:an?\s+|the\s+)?([^,.;]{3,100})`, 'i'));
  if (proj) projects.push({ name: clip(proj[2], 60), description: null, bullets: [] });
  else if (/\b(final[- ]year|capstone|major|mini)\s+project\b/i.test(t)) {
    const label = (t.match(/\b(final[- ]year|capstone|major|mini)\s+project\b/i) as RegExpMatchArray)[0];
    projects.push({ name: label[0].toUpperCase() + label.slice(1).toLowerCase(), description: null, bullets: [] });
  }

  // Goal: "want(s) a/an <role> internship/role/job".
  let summary = '';
  const goal = t.match(/\b(?:want(?:s)?|looking for|seeking|aiming for|applying for)\s+(?:to (?:get|find|apply for)\s+)?(?:an?\s+)?([a-z][a-z /&-]{3,50}?\s+(?:internship|role|job|position|opening))\b/i);
  if (goal) summary = `Seeking a ${cleanEnd(goal[1]).toLowerCase()}.`;

  const signals = [email, phone, name, skills.length, education.length, experience.length, projects.length, summary].filter(Boolean).length
    + 0;
  if (signals < 3 || !(email || phone || name)) return null;

  const missing: string[] = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!phone) missing.push('phone');
  if (!summary) missing.push('summary');
  if (!skills.length) missing.push('skills');
  if (!experience.length) missing.push('experience');
  if (!education.length) missing.push('education');
  if (!projects.length) missing.push('projects');
  const unplaced: string[] = [];
  if (projects.length && !projects[0].description) unplaced.push('Project: you did not say what it was about, so only its label is saved. Add details in the builder.');

  return { signals, resume: { name, email, phone, summary, skills, experience, education, projects, unplaced, missing } };
}

export function looksFreeform(text: string): boolean {
  return parseFreeform(text) !== null;
}
