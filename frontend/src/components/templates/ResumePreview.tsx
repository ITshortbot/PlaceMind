'use client';

// ============================================================================
// File: frontend/src/components/templates/ResumePreview.tsx
// Description: Accessible, print-ready ATS resume renderer component.
//              - Real selectable plain text only (no image icons or image text)
//              - Supports 4 families & custom tokens from registry
//              - Native Print CSS engine for crisp, zero-artifact PDF export
// ============================================================================

import React from 'react';
import { Palette } from '../../lib/color/engine.ts';
import {
  DENSITY_TOKENS,
  FONT_STACKS,
  resolveTemplateFamily,
} from '../../lib/templates/registry.ts';
import { ResumeContent, SectionNameType, StyleSpec } from '../../types/templates.ts';

export interface ResumePreviewProps {
  style: StyleSpec;
  content: ResumeContent;
  palette: Palette;
  className?: string;
  onPrint?: () => void;
  showExportButton?: boolean;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  style,
  content,
  palette,
  className = '',
  onPrint,
  showExportButton = true,
}) => {
  const family = resolveTemplateFamily(style.header_style, style.section_order);
  const density = DENSITY_TOKENS[style.density] || DENSITY_TOKENS.normal;
  const fontStack = FONT_STACKS[style.font] || FONT_STACKS.Calibri;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Render individual sections dynamically based on style.section_order
  const renderSection = (secName: SectionNameType) => {
    switch (secName) {
      case 'summary':
        if (!content.summary) return null;
        return (
          <section key="summary" className="resume-section" style={{ marginBottom: density.sectionGap }}>
            <h2
              className="section-title text-xs font-bold uppercase tracking-wider pb-1"
              style={{
                color: palette.accent,
                borderBottom: `1px solid ${palette.rule}`,
                marginBottom: density.itemGap,
              }}
            >
              Professional Summary
            </h2>
            <p
              className="text-xs leading-relaxed select-text"
              style={{ color: palette.ink, lineHeight: density.lineHeight }}
            >
              {content.summary}
            </p>
          </section>
        );

      case 'skills':
        if (!content.skills || content.skills.length === 0) return null;
        return (
          <section key="skills" className="resume-section" style={{ marginBottom: density.sectionGap }}>
            <h2
              className="section-title text-xs font-bold uppercase tracking-wider pb-1"
              style={{
                color: palette.accent,
                borderBottom: `1px solid ${palette.rule}`,
                marginBottom: density.itemGap,
              }}
            >
              Core Competencies & Skills
            </h2>
            <div className="flex flex-wrap gap-1.5 select-text">
              {content.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded font-medium select-text"
                  style={{
                    backgroundColor: `${palette.rule}`,
                    color: palette.ink,
                    border: `1px solid ${palette.rule}`,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );

      case 'experience':
        if (!content.experience || content.experience.length === 0) return null;
        return (
          <section key="experience" className="resume-section" style={{ marginBottom: density.sectionGap }}>
            <h2
              className="section-title text-xs font-bold uppercase tracking-wider pb-1"
              style={{
                color: palette.accent,
                borderBottom: `1px solid ${palette.rule}`,
                marginBottom: density.itemGap,
              }}
            >
              Work Experience
            </h2>
            <div className="space-y-3">
              {content.experience.map((exp, idx) => (
                <div key={idx} className="experience-item select-text" style={{ marginBottom: density.itemGap }}>
                  <div className="flex items-baseline justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold select-text" style={{ color: palette.ink }}>
                      {exp.role}
                    </span>
                    {exp.company && (
                      <span className="text-xs italic select-text" style={{ color: palette.muted }}>
                        {exp.company}
                      </span>
                    )}
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li
                          key={bIdx}
                          className="text-xs leading-relaxed select-text"
                          style={{
                            color: palette.ink,
                            lineHeight: density.lineHeight,
                            marginBottom: density.bulletGap,
                          }}
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'projects':
        if (!content.projects || content.projects.length === 0) return null;
        return (
          <section key="projects" className="resume-section" style={{ marginBottom: density.sectionGap }}>
            <h2
              className="section-title text-xs font-bold uppercase tracking-wider pb-1"
              style={{
                color: palette.accent,
                borderBottom: `1px solid ${palette.rule}`,
                marginBottom: density.itemGap,
              }}
            >
              Key Projects
            </h2>
            <div className="space-y-3">
              {content.projects.map((proj, idx) => (
                <div key={idx} className="project-item select-text" style={{ marginBottom: density.itemGap }}>
                  <div className="flex items-baseline justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold select-text" style={{ color: palette.ink }}>
                      {proj.name}
                    </span>
                    {proj.link && (
                      <span className="text-[11px] font-mono select-text" style={{ color: palette.muted }}>
                        {proj.link}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <p
                      className="text-xs mt-0.5 leading-relaxed select-text"
                      style={{ color: palette.muted, lineHeight: density.lineHeight }}
                    >
                      {proj.description}
                    </p>
                  )}
                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5">
                      {proj.bullets.map((bullet, bIdx) => (
                        <li
                          key={bIdx}
                          className="text-xs leading-relaxed select-text"
                          style={{
                            color: palette.ink,
                            lineHeight: density.lineHeight,
                            marginBottom: density.bulletGap,
                          }}
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'education':
        if (!content.education || content.education.length === 0) return null;
        return (
          <section key="education" className="resume-section" style={{ marginBottom: density.sectionGap }}>
            <h2
              className="section-title text-xs font-bold uppercase tracking-wider pb-1"
              style={{
                color: palette.accent,
                borderBottom: `1px solid ${palette.rule}`,
                marginBottom: density.itemGap,
              }}
            >
              Education & Credentials
            </h2>
            <div className="space-y-2">
              {content.education.map((edu, idx) => (
                <div key={idx} className="education-item select-text" style={{ marginBottom: density.itemGap }}>
                  <div className="flex items-baseline justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold select-text" style={{ color: palette.ink }}>
                      {edu.degree}
                    </span>
                    {edu.year && (
                      <span className="text-xs select-text" style={{ color: palette.muted }}>
                        {edu.year}
                      </span>
                    )}
                  </div>
                  {edu.institution && (
                    <p className="text-xs italic select-text" style={{ color: palette.muted }}>
                      {edu.institution}
                    </p>
                  )}
                  {edu.details && (
                    <p className="text-xs select-text mt-0.5" style={{ color: palette.ink }}>
                      {edu.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const isBannerHeader = style.header_style === 'banner' || family.headerBand;
  const isCenteredHeader = style.header_style === 'centered';

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* ─── Top Control Bar ─── */}
      {showExportButton && (
        <div className="w-full max-w-[210mm] flex items-center justify-between mb-4 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{family.name}</span>
            <span>•</span>
            <span>{style.font}</span>
            <span>•</span>
            <span>{style.size_pt}pt</span>
            <span>•</span>
            <span className="capitalize">{style.density}</span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all"
          >
            <span>🖨️</span>
            <span>Export to PDF (Print)</span>
          </button>
        </div>
      )}

      {/* ─── Resume Document Sheet (A4 Dimensions) ─── */}
      <div
        id="resume-preview-sheet"
        className="w-full max-w-[210mm] min-h-[297mm] shadow-2xl rounded-sm transition-all overflow-hidden border border-black/5"
        style={{
          backgroundColor: palette.background,
          fontFamily: fontStack,
          fontSize: `${style.size_pt}pt`,
          color: palette.ink,
        }}
      >
        {/* ─── Header: Banner Style (Modern) ─── */}
        {isBannerHeader ? (
          <div
            className="p-8 text-white select-text"
            style={{ backgroundColor: palette.accent }}
          >
            <h1 className="text-2xl font-bold tracking-tight select-text text-white">
              Candidate Resume
            </h1>
            <p className="text-sm font-medium mt-1 opacity-90 select-text text-white/95">
              {content.headline}
            </p>
          </div>
        ) : (
          /* ─── Header: Classic / Minimal / Centered (No Images, Pure Text) ─── */
          <div
            className={`p-8 pb-4 select-text ${isCenteredHeader ? 'text-center' : 'text-left'}`}
            style={{ borderBottom: `2px solid ${palette.rule}` }}
          >
            <h1
              className="text-2xl font-bold tracking-tight select-text"
              style={{ color: palette.ink }}
            >
              Candidate Resume
            </h1>
            <p
              className="text-sm font-medium mt-1 select-text"
              style={{ color: palette.accent }}
            >
              {content.headline}
            </p>
          </div>
        )}

        {/* ─── Body Sections (Rendered in section_order permutation) ─── */}
        <div style={{ padding: density.padding }}>
          {style.section_order.map((secName) => renderSection(secName))}
        </div>
      </div>

      {/* ─── Embedded Print CSS Engine ─── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              #resume-preview-sheet {
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                min-height: auto !important;
                margin: 0 !important;
                page-break-after: avoid;
              }
              .resume-section {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          `,
        }}
      />
    </div>
  );
};
