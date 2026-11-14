// ============================================================================
// File: frontend/src/lib/api/templates.ts
// Description: Typed client for template generation. Mirrors
//              backend/app/schemas/templates.py; keep the two in sync.
//              Generation is facts-first: pass resume_id or explicit facts so
//              content comes from the candidate's real data. Without facts
//              and without a model the backend returns EMPTY content with a
//              warning - never invented placeholder copy.
// ============================================================================

import type {
  CandidateFacts,
  GenerateRequest,
  GenerateResponse,
} from '@/types/templates';

const backendUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

export type { CandidateFacts, GenerateRequest, GenerateResponse };

export async function generateTemplate(request: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${backendUrl()}/api/v1/templates/generate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Template generation is currently busy. Please wait 5 seconds and retry.');
    }
    const errJson = await res.json().catch(() => null);
    const detail = errJson?.detail || `Server returned error (${res.status})`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return (await res.json()) as GenerateResponse;
}
