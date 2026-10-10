// ============================================================================
// File: frontend/tests/templates-snapshot.test.ts
// Description: Snapshot and structural unit tests per template family:
//              - Classic
//              - Modern (accent header band)
//              - Compact (high-density)
//              - Academic (education and projects first)
// ============================================================================

import assert from 'node:assert';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildPalette } from '../src/lib/color/engine.ts';
import {
  TEMPLATE_FAMILIES,
  resolveTemplateFamily,
  type FamilyId,
} from '../src/lib/templates/registry.ts';
import { ResumePreview } from '../src/components/templates/ResumePreview.tsx';
import type { ResumeContent, StyleSpec } from '../src/types/templates.ts';

const SAMPLE_CONTENT: ResumeContent = {
  headline: 'Senior Full Stack AI Engineer',
  summary: 'Architecting distributed LLM microservices with sub-50ms latency.',
  skills: ['TypeScript', 'Python', 'FastAPI', 'Next.js', 'PostgreSQL'],
  experience: [
    {
      role: 'Staff AI Engineer',
      company: 'Apex Systems',
      bullets: [
        'Built high-concurrency vector search engine.',
        'Decreased P99 retrieval latency by 45%.',
      ],
    },
  ],
  projects: [
    {
      name: 'Placemind Engine',
      description: 'Zero-data-retention local ATS matching system.',
      bullets: ['Deployed with ONNX runtime on Apple Silicon.'],
      link: 'github.com/placemind',
    },
  ],
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'UC Berkeley',
      year: '2020',
      details: 'Focus on distributed systems',
    },
  ],
};

function createStyleForFamily(familyId: FamilyId): StyleSpec {
  const family = TEMPLATE_FAMILIES[familyId];
  return {
    layout: family.layout,
    font: family.defaultFont,
    size_pt: family.defaultDensity === 'compact' ? 10.0 : 11.0,
    density: family.defaultDensity,
    header_style: family.headerStyle,
    section_order: family.defaultSectionOrder,
    mood: family.defaultMood,
    hue: null,
  };
}

test('Family registry tokens snapshot check', () => {
  const families: FamilyId[] = ['Classic', 'Modern', 'Compact', 'Academic'];

  for (const id of families) {
    const fam = TEMPLATE_FAMILIES[id];
    assert.strictEqual(fam.id, id);
    assert.ok(fam.name.length > 0);
    assert.ok(fam.tagline.length > 0);
    assert.strictEqual(fam.defaultSectionOrder.length, 5);
  }

  // Modern has header band
  assert.strictEqual(TEMPLATE_FAMILIES.Modern.headerBand, true);
  assert.strictEqual(TEMPLATE_FAMILIES.Modern.headerStyle, 'banner');

  // Academic has education first
  assert.strictEqual(TEMPLATE_FAMILIES.Academic.defaultSectionOrder[0], 'education');
  assert.strictEqual(TEMPLATE_FAMILIES.Academic.defaultSectionOrder[1], 'projects');

  // Compact has skills and compact density
  assert.strictEqual(TEMPLATE_FAMILIES.Compact.defaultSectionOrder[0], 'skills');
  assert.strictEqual(TEMPLATE_FAMILIES.Compact.defaultDensity, 'compact');

  // Classic is corporate serif
  assert.strictEqual(TEMPLATE_FAMILIES.Classic.defaultMood, 'corporate');
});

test('Snapshot test for Classic family', () => {
  const style = createStyleForFamily('Classic');
  const palette = buildPalette('corporate');

  assert.strictEqual(resolveTemplateFamily(style.header_style, style.section_order).id, 'Classic');

  const html = renderToStaticMarkup(
    React.createElement(ResumePreview, {
      style,
      content: SAMPLE_CONTENT,
      palette,
      showExportButton: false,
    })
  );

  // Real selectable text only - no images of text
  assert.ok(!html.includes('<img'), 'Classic must not contain images');
  assert.ok(!html.includes('<svg'), 'Classic must not contain icon images for text');

  // Must render content accurately as plain text
  assert.ok(html.includes('Senior Full Stack AI Engineer'));
  assert.ok(html.includes('Apex Systems'));
  assert.ok(html.includes('Professional Summary'));

  // Classic header should not have banner background
  assert.ok(!html.includes('p-8 text-white select-text'));
});

test('Snapshot test for Modern family (with accent header band)', () => {
  const style = createStyleForFamily('Modern');
  const palette = buildPalette('tech');

  assert.strictEqual(resolveTemplateFamily(style.header_style, style.section_order).id, 'Modern');

  const html = renderToStaticMarkup(
    React.createElement(ResumePreview, {
      style,
      content: SAMPLE_CONTENT,
      palette,
      showExportButton: false,
    })
  );

  // Modern accent header band is rendered with palette.accent background
  assert.ok(html.includes(`background-color:${palette.accent}`), 'Modern must have accent header band');
  assert.ok(html.includes('Senior Full Stack AI Engineer'));
  assert.ok(!html.includes('<img'), 'Modern must not contain image text');
});

test('Snapshot test for Compact family (high density)', () => {
  const style = createStyleForFamily('Compact');
  const palette = buildPalette('minimal');

  assert.strictEqual(resolveTemplateFamily(style.header_style, style.section_order).id, 'Compact');

  const html = renderToStaticMarkup(
    React.createElement(ResumePreview, {
      style,
      content: SAMPLE_CONTENT,
      palette,
      showExportButton: false,
    })
  );

  // Skills are placed first in the section order
  const skillsIdx = html.indexOf('Core Competencies &amp; Skills');
  const expIdx = html.indexOf('Work Experience');
  assert.ok(skillsIdx < expIdx, 'Compact must order skills before work experience');
  assert.ok(!html.includes('<img'), 'Compact must not contain images');
});

test('Snapshot test for Academic family (education and projects first)', () => {
  const style = createStyleForFamily('Academic');
  const palette = buildPalette('creative');

  assert.strictEqual(resolveTemplateFamily(style.header_style, style.section_order).id, 'Academic');

  const html = renderToStaticMarkup(
    React.createElement(ResumePreview, {
      style,
      content: SAMPLE_CONTENT,
      palette,
      showExportButton: false,
    })
  );

  // Education & projects must appear before work experience
  const eduIdx = html.indexOf('Education &amp; Credentials');
  const projIdx = html.indexOf('Key Projects');
  const expIdx = html.indexOf('Work Experience');

  assert.ok(eduIdx < expIdx, 'Academic must render education before experience');
  assert.ok(projIdx < expIdx, 'Academic must render projects before experience');
  assert.ok(!html.includes('<img'), 'Academic must not contain images');
});
