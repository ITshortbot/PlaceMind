// ============================================================================
// File: frontend/src/types/templates.ts
// Description: Strongly-typed TypeScript interfaces matching FastAPI template schemas.
// ============================================================================

export type LayoutType = 'single_column' | 'sidebar_header' | 'two_column';
export type FontType = 'Calibri' | 'Arial' | 'Georgia' | 'Times';
export type DensityType = 'compact' | 'normal' | 'airy';
export type HeaderStyleType = 'centered' | 'left' | 'banner';
export type SectionNameType = 'summary' | 'skills' | 'experience' | 'projects' | 'education';
export type MoodType = 'corporate' | 'tech' | 'creative' | 'minimal' | 'finance';

export interface StyleSpec {
  layout: LayoutType;
  font: FontType;
  size_pt: number;
  density: DensityType;
  header_style: HeaderStyleType;
  section_order: SectionNameType[];
  mood: MoodType;
  hue?: number | null;
}

export interface ExperienceItem {
  role: string;
  company?: string | null;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  description?: string | null;
  bullets: string[];
  link?: string | null;
}

export interface EducationItem {
  degree: string;
  institution?: string | null;
  year?: string | null;
  details?: string | null;
}

export interface ResumeContent {
  headline: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
}

export interface GenerateRequest {
  prompt: string;
  jd_text?: string | null;
}

export interface GenerateResponse {
  style: StyleSpec;
  content: ResumeContent;
  warnings: string[];
  latency_ms: number;
  source: 'model' | 'fallback';
}

// Personal details live on the client only. The backend schema (extra="forbid")
// does not accept them, so they are kept out of GenerateResponse on purpose.
export interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  photo?: string | null; // small data URL, resized client-side
}
