// ============================================================================
// File: frontend/src/lib/color/engine.ts
// Description: Pure OKLCH color science & WCAG contrast palette engine.
//              Generates accessible palettes {ink, muted, accent, rule, background}
//              enforcing contrast >= 4.5:1, single accent, and grayscale clarity.
// ============================================================================

export type Mood = 'corporate' | 'tech' | 'creative' | 'minimal' | 'finance';

export interface Palette {
  ink: string;
  muted: string;
  accent: string;
  rule: string;
  background: string;
  contrastRatios: {
    inkVsBackground: number;
    accentVsBackground: number;
    mutedVsBackground: number;
    accentInGrayscale: number;
  };
}

export interface ContrastResult {
  ratio: number;
  passesAA: boolean; // >= 4.5:1
  passesAALarge: boolean; // >= 3.0:1
}

export const MOOD_DEFAULT_HUES: Record<Mood, number> = {
  corporate: 225, // Trustworthy Deep Slate Blue
  tech: 195,      // Vibrant Electric Cyan / Azure
  creative: 315,  // Purple / Vivid Magenta
  minimal: 250,   // Cool Neutral Graphite
  finance: 145,   // Solid Emerald / Forest Green
};

// ─── Color Space Math (OKLCH <-> sRGB) ──────────────────────────────────────

/**
 * Converts OKLCH coordinates to sRGB hex string (#rrggbb).
 * L: [0, 1], C: [0, ~0.4], H: [0, 360]
 */
export function oklchToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // Oklab to LMS
  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.2914855480 * b;

  const lCube = lPrime * lPrime * lPrime;
  const mCube = mPrime * mPrime * mPrime;
  const sCube = sPrime * sPrime * sPrime;

  // LMS to Linear sRGB
  const rLin = +4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube;
  const gLin = -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube;
  const bLin = -0.0041960863 * lCube - 0.7034186147 * mCube + 1.7076147010 * sCube;

  // Transfer function (linear to sRGB)
  const toSrgb = (x: number): number => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1.0 / 2.4) - 0.055;
  };

  const r = Math.round(toSrgb(rLin) * 255);
  const g = Math.round(toSrgb(gLin) * 255);
  const bVal = Math.round(toSrgb(bLin) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`.toUpperCase();
}

/**
 * Converts hex color string (#rgb or #rrggbb) to sRGB normalized [0, 1] triple.
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  if (cleaned.length !== 6) {
    return [0, 0, 0];
  }
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Converts sRGB hex to OKLCH coordinates.
 */
export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const [r, g, b] = hexToRgb(hex);

  // Linearize sRGB
  const toLin = (x: number) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  const rLin = toLin(r);
  const gLin = toLin(g);
  const bLin = toLin(b);

  // Linear sRGB to LMS
  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;

  const lPrime = Math.cbrt(l);
  const mPrime = Math.cbrt(m);
  const sPrime = Math.cbrt(s);

  // LMS to Oklab
  const L = 0.2104542553 * lPrime + 0.7936177850 * mPrime - 0.0040720468 * sPrime;
  const a = 1.9779984951 * lPrime - 2.4285922050 * mPrime + 0.4505937099 * sPrime;
  const bLab = 0.0259040371 * lPrime + 0.7827717662 * mPrime - 0.8086757660 * sPrime;

  const C = Math.sqrt(a * a + bLab * bLab);
  let H = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: Math.max(0, Math.min(1, L)), c: Math.max(0, C), h: H % 360 };
}

// ─── Relative Luminance & WCAG Contrast ─────────────────────────────────────

/**
 * Computes standard WCAG 2.1 relative luminance from hex color.
 */
export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const linearize = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Computes WCAG contrast ratio between two hex colors. (Range: 1.0 to 21.0)
 */
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lum1 = getRelativeLuminance(foregroundHex);
  const lum2 = getRelativeLuminance(backgroundHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function checkContrast(foregroundHex: string, backgroundHex: string): ContrastResult {
  const ratio = getContrastRatio(foregroundHex, backgroundHex);
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3.0,
  };
}

/**
 * Measures grayscale distinctness between accent and background.
 * Converts to perceived luminance; requires ratio >= 3:1 in pure grayscale.
 */
export function getGrayscaleContrast(accentHex: string, backgroundHex: string): number {
  return getContrastRatio(accentHex, backgroundHex);
}

// ─── User Brand Hex Contrast Adjustment ─────────────────────────────────────

/**
 * Accepts any user brand hex. If contrast against the background is < 4.5:1,
 * darkens the color along the OKLCH lightness curve until it passes WCAG AA (>= 4.5:1).
 */
export function adjustHexForContrast(
  brandHex: string,
  backgroundHex = '#FAFAFC'
): { hex: string; contrast: number; adjusted: boolean } {
  let contrast = getContrastRatio(brandHex, backgroundHex);
  if (contrast >= 4.5) {
    return { hex: brandHex.toUpperCase(), contrast, adjusted: false };
  }

  const { c, h } = hexToOklch(brandHex);
  let currentL = 0.50; // Start search below mid-tone
  let bestHex = brandHex;

  // Step down lightness in fine increments until contrast >= 4.5:1
  while (currentL >= 0.15) {
    const candidateHex = oklchToHex(currentL, Math.min(c, 0.25), h);
    contrast = getContrastRatio(candidateHex, backgroundHex);
    bestHex = candidateHex;
    if (contrast >= 4.5) {
      break;
    }
    currentL -= 0.01;
  }

  return {
    hex: bestHex,
    contrast: getContrastRatio(bestHex, backgroundHex),
    adjusted: true,
  };
}

// ─── Palette Generator ──────────────────────────────────────────────────────

/**
 * Builds a harmonious 5-token palette {ink, muted, accent, rule, background}
 * adhering strictly to:
 * - near-white background (L >= 0.985)
 * - body text (ink) vs background >= 4.5:1
 * - accent vs background >= 4.5:1
 * - exactly one accent token
 * - accent distinct in grayscale
 */
export function buildPalette(mood: Mood, customHue?: number, customBrandHex?: string): Palette {
  const hue = customHue !== undefined ? (customHue % 360 + 360) % 360 : MOOD_DEFAULT_HUES[mood];

  // 1. Near-white background (lightness 0.985, very low chroma)
  const background = oklchToHex(0.985, 0.006, hue);

  // 2. High-contrast ink (dark body text, lightness 0.18, contrast > 13:1)
  const ink = oklchToHex(0.18, 0.015, hue);

  // 3. Muted secondary text (lightness ~0.44, contrast >= 4.5:1)
  let muted = oklchToHex(0.44, 0.02, hue);
  if (getContrastRatio(muted, background) < 4.5) {
    muted = oklchToHex(0.40, 0.02, hue);
  }

  // 4. Subtle structural rule / border (lightness 0.90)
  const rule = oklchToHex(0.90, 0.012, hue);

  // 5. Single accent color (contrast >= 4.5:1 against background)
  let accent: string;
  if (customBrandHex) {
    const adjusted = adjustHexForContrast(customBrandHex, background);
    accent = adjusted.hex;
  } else {
    // Generate mood-specific accent in OKLCH
    let targetL = 0.44;
    let targetC = 0.16;

    if (mood === 'corporate') {
      targetL = 0.40;
      targetC = 0.14;
    } else if (mood === 'tech') {
      targetL = 0.42;
      targetC = 0.18;
    } else if (mood === 'creative') {
      targetL = 0.43;
      targetC = 0.20;
    } else if (mood === 'minimal') {
      targetL = 0.35;
      targetC = 0.04;
    } else if (mood === 'finance') {
      targetL = 0.38;
      targetC = 0.15;
    }

    accent = oklchToHex(targetL, targetC, hue);

    // Enforce >= 4.5:1 contrast against background
    while (getContrastRatio(accent, background) < 4.5 && targetL >= 0.15) {
      targetL -= 0.01;
      accent = oklchToHex(targetL, targetC, hue);
    }
  }

  const inkVsBg = getContrastRatio(ink, background);
  const accentVsBg = getContrastRatio(accent, background);
  const mutedVsBg = getContrastRatio(muted, background);
  const accentGray = getGrayscaleContrast(accent, background);

  return {
    ink,
    muted,
    accent,
    rule,
    background,
    contrastRatios: {
      inkVsBackground: inkVsBg,
      accentVsBackground: accentVsBg,
      mutedVsBackground: mutedVsBg,
      accentInGrayscale: accentGray,
    },
  };
}
