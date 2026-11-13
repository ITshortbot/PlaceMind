import type { ResumeContent, StyleSpec } from '@/types/templates';

export interface BuilderTemplate {
  id: string;
  name: string;
  style: StyleSpec;
}

// Real template families rendered by ResumePreview - no thumbnail images.
export const BUILDER_TEMPLATES: BuilderTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    style: {
      layout: 'single_column',
      font: 'Times',
      size_pt: 11,
      density: 'normal',
      header_style: 'left',
      section_order: ['summary', 'experience', 'education', 'skills', 'projects'],
      mood: 'corporate',
      hue: 220,
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    style: {
      layout: 'single_column',
      font: 'Arial',
      size_pt: 11,
      density: 'normal',
      header_style: 'banner',
      section_order: ['summary', 'skills', 'experience', 'projects', 'education'],
      mood: 'tech',
      hue: 195,
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    style: {
      layout: 'single_column',
      font: 'Calibri',
      size_pt: 10,
      density: 'compact',
      header_style: 'left',
      section_order: ['summary', 'experience', 'skills', 'projects', 'education'],
      mood: 'minimal',
      hue: 250,
    },
  },
  {
    id: 'academic',
    name: 'Academic',
    style: {
      layout: 'single_column',
      font: 'Georgia',
      size_pt: 11,
      density: 'normal',
      header_style: 'centered',
      section_order: ['summary', 'education', 'experience', 'projects', 'skills'],
      mood: 'finance',
      hue: 160,
    },
  },
];

// Fictional sample content for labeled previews only - never presented as
// the user's data or as a generated result.
export const SAMPLE_RESUME_CONTENT: ResumeContent = {
  name: 'Alex Doe',
  contact: 'alex.doe@example.com',
  headline: 'Backend Engineer',
  summary: 'Backend engineer with 3 years building Python APIs and data pipelines.',
  skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
  experience: [
    {
      role: 'Backend Engineer',
      company: 'ExampleCorp',
      bullets: [
        'Built FastAPI services serving 2M requests/day',
        'Cut p95 latency from 800ms to 240ms',
      ],
    },
  ],
  projects: [],
  education: [
    { degree: 'B.Tech Computer Science', institution: 'Example University', year: '2023' },
  ],
};
