// ============================================================================
// File: frontend/src/lib/templates/profile.ts
// Description: Client-side persistence for the user's resume profile and the
//              current editable draft. Used by onboarding and /template.
// ============================================================================

import type { GenerateResponse, ResumeProfile } from '@/types/templates';

export const PROFILE_KEY = 'placemind_profile_v1';
export const DRAFT_KEY = 'placemind_draft_v1';

export const EMPTY_PROFILE: ResumeProfile = {
  name: '',
  email: '',
  phone: '',
  location: '',
  links: [],
  photo: null,
};

export function loadProfile(): ResumeProfile {
  if (typeof window === 'undefined') return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return EMPTY_PROFILE;
    const p = JSON.parse(raw);
    return {
      ...EMPTY_PROFILE,
      ...p,
      links: Array.isArray(p?.links) ? p.links.filter((l: unknown) => typeof l === 'string') : [],
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(profile: ResumeProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // quota exceeded (large photo): retry without the photo
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, photo: null }));
    } catch {
      /* ignore */
    }
  }
}

export function loadDraft(): GenerateResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d?.style && d?.content) return d as GenerateResponse;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveDraft(draft: GenerateResponse): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

/** Resize an uploaded image to a small JPEG data URL (max 256px side). */
export function imageFileToDataUrl(file: File, maxSide = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG or WebP).'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image is larger than 5 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode the image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not available.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
