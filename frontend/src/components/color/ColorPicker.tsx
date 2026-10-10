'use client';

// ============================================================================
// File: frontend/src/components/color/ColorPicker.tsx
// Description: Interactive Color & Accessibility Picker component featuring:
//              - Mood chips (corporate, tech, creative, minimal, finance)
//              - Continuous OKLCH Hue slider (0-360°)
//              - Custom brand hex input with automated contrast adjustment
//              - Real-time WCAG 2.1 AA (>= 4.5:1) pass/fail contrast badges
//              - 5-token palette swatches (ink, muted, accent, rule, background)
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
      className={`rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 shadow-2xl space-y-5 text-slate-100 ${className}`}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
            Color & Accessibility Engine
          </h3>
          <p className="text-xs text-slate-400">
            OKLCH spectrum with guaranteed WCAG 4.5:1 contrast
          </p>
        </div>
        <div
          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
          style={{ backgroundColor: palette.accent }}
          title={`Active Accent: ${palette.accent}`}
        />
      </div>

      {/* ─── Mood Chips ─── */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">Mood Preset</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const isActive = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMoodSelect(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-white/5'
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
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor={hueSliderId} className="font-medium text-slate-300">
            Hue Angle
          </label>
          <span className="font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
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
          className="w-full h-2.5 rounded-lg appearance-none cursor-pointer border border-white/10"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }}
        />
      </div>

      {/* ─── Brand Hex Input ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor={brandHexInputId} className="font-medium text-slate-300">
            Custom Brand Hex (Optional)
          </label>
          {brandAdjustment?.adjusted && (
            <span className="text-[11px] text-amber-400 font-medium">
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
            className="flex-1 bg-slate-800/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {customBrandHex && (
            <button
              type="button"
              onClick={() => handleBrandHexInput('')}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
              title="Clear custom brand color"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ─── 5-Token Palette Swatches ─── */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-300">Generated Palette</div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { key: 'background', label: 'BG', hex: palette.background, lightText: false },
            { key: 'ink', label: 'Ink', hex: palette.ink, lightText: true },
            { key: 'muted', label: 'Muted', hex: palette.muted, lightText: true },
            { key: 'accent', label: 'Accent', hex: palette.accent, lightText: true },
            { key: 'rule', label: 'Rule', hex: palette.rule, lightText: false },
          ].map((token) => (
            <div
              key={token.key}
              className="flex flex-col items-center p-2 rounded-xl border border-white/10 shadow-sm"
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
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="text-xs font-medium text-slate-300">Accessibility Audit (WCAG 2.1)</div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          {/* Body Text Contrast */}
          <div className="p-2 rounded-lg bg-slate-800/60 border border-white/5 flex flex-col items-center text-center">
            <span className="text-slate-400 text-[10px]">Body Text</span>
            <span className="font-mono font-semibold text-slate-200 mt-0.5">
              {palette.contrastRatios.inkVsBackground}:1
            </span>
            <span
              className={`mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                palette.contrastRatios.inkVsBackground >= 4.5
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {palette.contrastRatios.inkVsBackground >= 4.5 ? 'PASS' : 'FAIL'}
            </span>
          </div>

          {/* Accent Heading Contrast */}
          <div className="p-2 rounded-lg bg-slate-800/60 border border-white/5 flex flex-col items-center text-center">
            <span className="text-slate-400 text-[10px]">Accent Heading</span>
            <span className="font-mono font-semibold text-slate-200 mt-0.5">
              {palette.contrastRatios.accentVsBackground}:1
            </span>
            <span
              className={`mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                palette.contrastRatios.accentVsBackground >= 4.5
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {palette.contrastRatios.accentVsBackground >= 4.5 ? 'PASS' : 'FAIL'}
            </span>
          </div>

          {/* Grayscale Distinctness */}
          <div className="p-2 rounded-lg bg-slate-800/60 border border-white/5 flex flex-col items-center text-center">
            <span className="text-slate-400 text-[10px]">Grayscale</span>
            <span className="font-mono font-semibold text-slate-200 mt-0.5">
              {palette.contrastRatios.accentInGrayscale}:1
            </span>
            <span
              className={`mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                palette.contrastRatios.accentInGrayscale >= 3.0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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
