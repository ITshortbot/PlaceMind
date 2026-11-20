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
import { backendApiUrl } from './base';

export type { CandidateFacts, GenerateRequest, GenerateResponse };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function generateTemplate(request: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(backendApiUrl('/api/v1/templates/generate'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const payload: unknown = await res.json().catch(() => null);
    if (isRecord(payload)) {
      const detail = payload.detail;
      if (typeof detail === 'string') {
        throw new Error(detail);
      }
      if (isRecord(detail) && typeof detail.message === 'string') {
        throw new Error(
          typeof detail.code === 'string'
            ? `${detail.message} (${detail.code})`
            : detail.message
        );
      }
      if (detail !== undefined) {
        throw new Error(JSON.stringify(detail));
      }
    }
    if (res.status === 429) {
      throw new Error('Template generation is currently busy. Please wait and retry.');
    }
    throw new Error(`Server returned error (${res.status})`);
  }

  return (await res.json()) as GenerateResponse;
}
