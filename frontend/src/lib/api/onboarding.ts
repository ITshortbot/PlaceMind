// ============================================================================
// File: frontend/src/lib/api/onboarding.ts
// Description: Typed client for the onboarding bootstrap endpoint. Turns the
//              wizard's answers into a real, filled resume in one call and
//              returns the gaps the chat should ask about. Sections are built
//              from supplied facts only - nothing is invented server-side.
// ============================================================================

import type { ResumeDetail } from './resumes';

const backendUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface OnboardingAnswers {
  full_name: string;
  email?: string;
  phone?: string;
  university?: string;
  specialization?: string;
  target_role?: string;
  target_company?: string;
}

export interface BootstrapResponse {
  resume: ResumeDetail;
  missing: string[];
}

export async function bootstrapResume(answers: OnboardingAnswers): Promise<BootstrapResponse> {
  const res = await fetch(`${backendUrl()}/api/v1/onboarding/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(answers),
  });
  if (!res.ok) {
    let detail = `Onboarding failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      /* keep default detail */
    }
    throw new Error(detail);
  }
  return (await res.json()) as BootstrapResponse;
}
