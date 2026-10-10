// ============================================================================
// File: frontend/src/lib/templates/registry.ts
// Description: Design token registry for 4 resume template families:
//              - Classic (traditional corporate serif)
//              - Modern (with accent header band and skill badges)
//              - Compact (high-density space-optimized layout)
//              - Academic (education and research projects prioritized first)
// ============================================================================

import {
  DensityType,
  FontType,
  HeaderStyleType,
  LayoutType,
  MoodType,
  SectionNameType,
} from '../../types/templates.ts';

export type FamilyId = 'Classic' | 'Modern' | 'Compact' | 'Academic';

export interface TemplateFamilyTokens {
  id: FamilyId;
  name: string;
  tagline: string;
  layout: LayoutType;
  defaultFont: FontType;
  defaultDensity: DensityType;
  headerStyle: HeaderStyleType;
  defaultSectionOrder: SectionNameType[];
  defaultMood: MoodType;
  headerBand: boolean;
  dividerStyle: 'none' | 'subtle_line' | 'thick_accent' | 'dotted';
  containerClass: string;
  headerClass: string;
  sectionTitleClass: string;
  itemTitleClass: string;
}

export const FONT_STACKS: Record<FontType, string> = {
  Calibri: "'Calibri', 'Carlito', 'Candara', -apple-system, BlinkMacSystemFont, sans-serif",
  Arial: "'Arial', 'Helvetica Neue', 'Helvetica', sans-serif",
  Georgia: "'Georgia', 'Cambria', 'Times New Roman', serif",
  Times: "'Times New Roman', 'Times', 'Georgia', serif",
};

export const DENSITY_TOKENS: Record<
  DensityType,
  {
    padding: string;
    sectionGap: string;
    itemGap: string;
    bulletGap: string;
    lineHeight: string;
  }
> = {
  compact: {
    padding: '1.25rem 1.5rem',
    sectionGap: '0.85rem',
    itemGap: '0.45rem',
    bulletGap: '0.2rem',
    lineHeight: '1.35',
  },
  normal: {
    padding: '2rem 2.25rem',
    sectionGap: '1.35rem',
    itemGap: '0.75rem',
    bulletGap: '0.35rem',
    lineHeight: '1.5',
  },
  airy: {
    padding: '2.5rem 2.75rem',
    sectionGap: '1.85rem',
    itemGap: '1.1rem',
    bulletGap: '0.5rem',
    lineHeight: '1.65',
  },
};

export const TEMPLATE_FAMILIES: Record<FamilyId, TemplateFamilyTokens> = {
  Classic: {
    id: 'Classic',
    name: 'Classic Professional',
    tagline: 'Timeless single-column architecture with refined typographic hierarchy.',
    layout: 'single_column',
    defaultFont: 'Times',
    defaultDensity: 'normal',
    headerStyle: 'left',
    defaultSectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
    defaultMood: 'corporate',
    headerBand: false,
    dividerStyle: 'subtle_line',
    containerClass: 'classic-resume-family bg-white',
    headerClass: 'pb-4 border-b',
    sectionTitleClass: 'font-serif uppercase tracking-widest text-sm font-bold border-b pb-1 mb-2',
    itemTitleClass: 'font-semibold',
  },

  Modern: {
    id: 'Modern',
    name: 'Modern Tech',
    tagline: 'Contemporary presentation highlighted by an accent header band and modern type.',
    layout: 'sidebar_header',
    defaultFont: 'Arial',
    defaultDensity: 'normal',
    headerStyle: 'banner',
    defaultSectionOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
    defaultMood: 'tech',
    headerBand: true,
    dividerStyle: 'thick_accent',
    containerClass: 'modern-resume-family bg-white shadow-sm',
    headerClass: 'p-6 mb-4 text-white',
    sectionTitleClass: 'font-sans font-bold text-sm tracking-wider uppercase border-l-4 pl-2 mb-2',
    itemTitleClass: 'font-bold text-slate-900',
  },

  Compact: {
    id: 'Compact',
    name: 'Compact One-Page',
    tagline: 'High-density information layout engineered to maximize single-page content.',
    layout: 'single_column',
    defaultFont: 'Calibri',
    defaultDensity: 'compact',
    headerStyle: 'left',
    defaultSectionOrder: ['skills', 'experience', 'projects', 'education', 'summary'],
    defaultMood: 'minimal',
    headerBand: false,
    dividerStyle: 'subtle_line',
    containerClass: 'compact-resume-family bg-white',
    headerClass: 'pb-2 border-b mb-2',
    sectionTitleClass: 'font-sans font-bold text-xs uppercase tracking-wider border-b pb-0.5 mb-1.5',
    itemTitleClass: 'font-semibold text-xs',
  },

  Academic: {
    id: 'Academic',
    name: 'Academic CV',
    tagline: 'Scholarly format placing education and research projects at the forefront.',
    layout: 'single_column',
    defaultFont: 'Georgia',
    defaultDensity: 'airy',
    headerStyle: 'centered',
    defaultSectionOrder: ['education', 'projects', 'skills', 'experience', 'summary'],
    defaultMood: 'creative',
    headerBand: false,
    dividerStyle: 'subtle_line',
    containerClass: 'academic-resume-family bg-white',
    headerClass: 'text-center pb-4 border-b mb-4',
    sectionTitleClass: 'font-serif text-center font-bold text-sm uppercase tracking-wider mb-3',
    itemTitleClass: 'font-semibold font-serif',
  },
};

/**
 * Resolves the matching family token set from a StyleSpec.
 */
export function resolveTemplateFamily(
  headerStyle?: HeaderStyleType,
  sectionOrder?: SectionNameType[]
): TemplateFamilyTokens {
  if (headerStyle === 'banner') {
    return TEMPLATE_FAMILIES.Modern;
  }
  if (sectionOrder && sectionOrder[0] === 'education') {
    return TEMPLATE_FAMILIES.Academic;
  }
  if (sectionOrder && sectionOrder[0] === 'skills') {
    return TEMPLATE_FAMILIES.Compact;
  }
  return TEMPLATE_FAMILIES.Classic;
}
