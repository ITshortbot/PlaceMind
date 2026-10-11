'use client';

// ============================================================================
// File: frontend/src/components/color/ColorPicker.tsx
// Description: Interactive Color & Accessibility Picker component featuring:
//              - Mood chips (corporate, tech, creative, minimal, finance)
//              - Continuous OKLCH Hue slider (0-360°)
//              - Custom brand hex input with automated contrast adjustment
//              - Real-time WCAG 2.1 AA (>= 4.5:1) pass/fail contrast badges
//              - 5-token palette swatches (ink, muted, accent, rule, background)
//              - Unified with Placemind Black, White & Pop-Yellow theme.
// ============================================================================

import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  buildPalette,
  adjustHexForContrast,
  MOOD_DEFAULT_HUES,
  type Mood,
  type Palette,
} from '@/lib/color/engine';

export interface ColorPickerProps {
  mood: Mood;
  hue?: number;
  brandHex?: string;
  onMoodChange: (mood: Mood) => void;
  onHueChange: (hue: number) => void;
  onBrandHexChange?: (hex: string) => void;
  onPaletteChange?: (palette: Palette) => void;
  className?: string;
}

const MOODS: { id: Mood; label: string; icon: string }[] = [
  { id: 'corporate', label: 'Corporate', icon: '🏛️' },
  { id: 'tech', label: 'Tech', icon: '⚡' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'minimal', label: 'Minimal', icon: '◻️' },
  { id: 'finance', label: 'Finance', icon: '📈' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  mood,
  hue: propHue,
  brandHex = '',
  onMoodChange,
  onHueChange,
  onBrandHexChange,
  onPaletteChange,
  className = '',
}) => {
  const [customBrandHex, setCustomBrandHex] = useState(brandHex);
  const hueSliderId = useId();
  const brandHexInputId = useId();

  const currentHue = propHue !== undefined ? propHue : MOOD_DEFAULT_HUES[mood];

  // Derive palette reactively without side-effects in useMemo
  const palette = useMemo(() => {
    return buildPalette(mood, currentHue, customBrandHex || undefined);
  }, [mood, currentHue, customBrandHex]);

  // Safely notify parent of palette updates in useEffect
  useEffect(() => {
    if (onPaletteChange) {
      onPaletteChange(palette);
    }
  }, [palette, onPaletteChange]);

  // Sync external brandHex if changed
  useEffect(() => {
    if (brandHex !== undefined) {
      setCustomBrandHex(brandHex);
    }
  }, [brandHex]);

  // Check if brand hex was auto-darkened
  const brandAdjustment = useMemo(() => {
    if (!customBrandHex || customBrandHex.length < 4) return null;
    return adjustHexForContrast(customBrandHex, palette.background);
  }, [customBrandHex, palette.background]);

  const handleMoodSelect = (newMood: Mood) => {
    onMoodChange(newMood);
    onHueChange(MOOD_DEFAULT_HUES[newMood]);
  };

  const handleBrandHexInput = (val: string) => {
    setCustomBrandHex(val);
    if (onBrandHexChange) {
      onBrandHexChange(val);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#121217] p-5 shadow-xs space-y-4 text-[#0A0A0C] dark:text-[#F8F9FA] ${className}`}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-[#0A0A0C] dark:text-white uppercase">
            Color & Accessibility Engine
          </h3>
          <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
            OKLCH spectrum with guaranteed WCAG 4.5:1 contrast
          </p>
        </div>
        <div
          className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 shadow-xs"
          style={{ backgroundColor: palette.accent }}
          title={`Active Accent: ${palette.accent}`}
        />
      </div>

      {/* ─── Mood Chips ─── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#5A5A63] dark:text-[#A1A1AA] uppercase tracking-wider block">
          Mood Preset
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => {
            const isActive = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMoodSelect(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FACC15] text-[#0A0A0C] shadow-md shadow-[#FACC15]/20 ring-2 ring-[#FACC15]'
                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#4A4A52] dark:text-[#A1A1AA] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] hover:text-[#0A0A0C] dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Hue Slider ─── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor={hueSliderId} className="font-bold text-[#5A5A63] dark:text-[#A1A1AA] text-[11px] uppercase tracking-wider">
            Hue Angle
          </label>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#0A0A0C] dark:text-[#F8F9FA] border border-black/[0.06] dark:border-white/[0.08]">
            {currentHue}°
          </span>
        </div>
        <input
          id={hueSliderId}
          type="range"
          min="0"
          max="360"
          value={currentHue}
          onChange={(e) => onHueChange(Number(e.target.value))}
          className="w-full h-2.5 rounded-lg appearance-none cursor-pointer border border-black/10 dark:border-white/10"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }}
        />
      </div>

      {/* ─── Brand Hex Input ─── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor={brandHexInputId} className="font-bold text-[#5A5A63] dark:text-[#A1A1AA] text-[11px] uppercase tracking-wider">
            Custom Brand Hex (Optional)
          </label>
          {brandAdjustment?.adjusted && (
            <span className="text-[11px] text-[#854D0E] dark:text-[#FACC15] font-bold">
              Adjusted for contrast
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            id={brandHexInputId}
            type="text"
            placeholder="#3B82F6"
            value={customBrandHex}
            onChange={(e) => handleBrandHexInput(e.target.value)}
            className="flex-1 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/[0.12] rounded-xl px-3 py-1.5 text-xs font-mono text-[#0A0A0C] dark:text-[#F8F9FA] placeholder-[#8A8A92] focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15]"
          />
          {customBrandHex && (
            <button
              type="button"
              onClick={() => handleBrandHexInput('')}
              className="text-xs text-[#8A8A92] hover:text-[#0A0A0C] dark:hover:text-white px-2 py-1 font-bold cursor-pointer"
              title="Clear custom brand color"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ─── 5-Token Palette Swatches ─── */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-[#5A5A63] dark:text-[#A1A1AA] uppercase tracking-wider">Generated Palette</div>
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { key: 'background', label: 'BG', hex: palette.background, lightText: false },
            { key: 'ink', label: 'Ink', hex: palette.ink, lightText: true },
            { key: 'muted', label: 'Muted', hex: palette.muted, lightText: true },
            { key: 'accent', label: 'Accent', hex: palette.accent, lightText: true },
            { key: 'rule', label: 'Rule', hex: palette.rule, lightText: false },
          ].map((token) => (
            <div
              key={token.key}
              className="flex flex-col items-center p-2 rounded-xl border border-black/10 dark:border-white/10 shadow-xs"
              style={{ backgroundColor: token.hex }}
            >
              <span
                className={`text-[10px] font-bold ${
                  token.lightText ? 'text-white' : 'text-slate-900'
                }`}
              >
                {token.label}
              </span>
              <span
                className={`text-[9px] font-mono mt-0.5 opacity-80 ${
                  token.lightText ? 'text-white' : 'text-slate-900'
                }`}
              >
                {token.hex}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Contrast Pass/Fail Badges ─── */}
      <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
        <div className="text-[11px] font-bold text-[#5A5A63] dark:text-[#A1A1AA] uppercase tracking-wider">Accessibility Audit (WCAG 2.1)</div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          {/* Body Text Contrast */}
          <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex flex-col items-center text-center">
            <span className="text-[#8A8A92] text-[10px]">Body Text</span>
            <span className="font-mono font-bold text-[#0A0A0C] dark:text-white mt-0.5">
              {palette.contrastRatios.inkVsBackground}:1
            </span>
            <span
              className={`mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                palette.contrastRatios.inkVsBackground >= 4.5
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {palette.contrastRatios.inkVsBackground >= 4.5 ? 'PASS' : 'FAIL'}
            </span>
          </div>

          {/* Accent Heading Contrast */}
          <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex flex-col items-center text-center">
            <span className="text-[#8A8A92] text-[10px]">Accent Heading</span>
            <span className="font-mono font-bold text-[#0A0A0C] dark:text-white mt-0.5">
              {palette.contrastRatios.accentVsBackground}:1
            </span>
            <span
              className={`mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                palette.contrastRatios.accentVsBackground >= 4.5
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {palette.contrastRatios.accentVsBackground >= 4.5 ? 'PASS' : 'FAIL'}
            </span>
          </div>

          {/* Grayscale Distinctness */}
          <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex flex-col items-center text-center">
            <span className="text-[#8A8A92] text-[10px]">Grayscale</span>
            <span className="font-mono font-bold text-[#0A0A0C] dark:text-white mt-0.5">
              {palette.contrastRatios.accentInGrayscale}:1
            </span>
            <span
              className={`mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                palette.contrastRatios.accentInGrayscale >= 3.0
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {palette.contrastRatios.accentInGrayscale >= 3.0 ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
