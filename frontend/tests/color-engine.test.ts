// ============================================================================
// File: frontend/tests/color-engine.test.ts
// Description: Unit tests for OKLCH color engine and contrast calculations.
// ============================================================================

import assert from 'node:assert';
import test from 'node:test';

import {
  adjustHexForContrast,
  buildPalette,
  getContrastRatio,
  getRelativeLuminance,
  MOOD_DEFAULT_HUES,
  type Mood,
} from '../src/lib/color/engine.ts';

test('buildPalette creates valid palettes for all 5 moods', () => {
  const moods: Mood[] = ['corporate', 'tech', 'creative', 'minimal', 'finance'];

  for (const mood of moods) {
    const palette = buildPalette(mood);

    // Verify all 5 color tokens exist
    assert.ok(palette.ink.startsWith('#'), `${mood} ink should be hex`);
    assert.ok(palette.muted.startsWith('#'), `${mood} muted should be hex`);
    assert.ok(palette.accent.startsWith('#'), `${mood} accent should be hex`);
    assert.ok(palette.rule.startsWith('#'), `${mood} rule should be hex`);
    assert.ok(palette.background.startsWith('#'), `${mood} background should be hex`);

    // Verify near-white background (relative luminance >= 0.90)
    const bgLum = getRelativeLuminance(palette.background);
    assert.ok(bgLum >= 0.90, `${mood} background lum should be near-white, got ${bgLum}`);

    // Verify body text (ink) contrast >= 4.5:1
    const inkContrast = getContrastRatio(palette.ink, palette.background);
    assert.ok(
      inkContrast >= 4.5,
      `${mood} ink contrast against background should be >= 4.5:1, got ${inkContrast}`
    );

    // Verify accent contrast >= 4.5:1
    const accentContrast = getContrastRatio(palette.accent, palette.background);
    assert.ok(
      accentContrast >= 4.5,
      `${mood} accent contrast against background should be >= 4.5:1, got ${accentContrast}`
    );

    // Verify grayscale distinctness (contrast >= 3.0:1)
    const grayContrast = palette.contrastRatios.accentInGrayscale;
    assert.ok(
      grayContrast >= 3.0,
      `${mood} accent grayscale contrast should be >= 3.0:1, got ${grayContrast}`
    );
  }
});

test('buildPalette supports custom hue override', () => {
  const palette = buildPalette('tech', 280); // Purple-shifted tech palette
  assert.ok(palette.accent.startsWith('#'));
  assert.ok(palette.contrastRatios.accentVsBackground >= 4.5);
});

test('adjustHexForContrast preserves high-contrast brand colors', () => {
  // Dark navy has very high contrast against near-white
  const darkNavy = '#0F172A';
  const result = adjustHexForContrast(darkNavy);

  assert.strictEqual(result.adjusted, false);
  assert.ok(result.contrast >= 7.0);
  assert.strictEqual(result.hex, darkNavy);
});

test('adjustHexForContrast darkens low-contrast colors until contrast >= 4.5:1', () => {
  // Bright yellow fails AA contrast on white background (~1.2:1)
  const brightYellow = '#FDE047';
  const initialContrast = getContrastRatio(brightYellow, '#FAFAFC');
  assert.ok(initialContrast < 2.0);

  const result = adjustHexForContrast(brightYellow);
  assert.strictEqual(result.adjusted, true);
  assert.ok(
    result.contrast >= 4.5,
    `Adjusted color contrast must be >= 4.5:1, got ${result.contrast}`
  );
  assert.notStrictEqual(result.hex, brightYellow);
});

test('MOOD_DEFAULT_HUES covers all required moods with distinctive hues', () => {
  const moods: Mood[] = ['corporate', 'tech', 'creative', 'minimal', 'finance'];
  const hues = moods.map((m) => MOOD_DEFAULT_HUES[m]);

  assert.strictEqual(new Set(hues).size, 5, 'All default hues should be unique');
  for (const hue of hues) {
    assert.ok(hue >= 0 && hue <= 360, `Hue ${hue} should be between 0 and 360`);
  }
});
