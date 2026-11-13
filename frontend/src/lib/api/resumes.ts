// ============================================================================
// File: frontend/src/lib/api/resumes.ts
// Description: Typed client for the resume persistence backend API.
// ============================================================================

const backendUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface ResumeSection {
  id?: string;
  section_type: string;
  content: string;
  meta_info?: Record<string, unknown>;
}

export interface ResumeSummary {
  id: string;
  file_name: string;
  created_at: string;
  updated_at: string;
  section_count: number;
  latest_ats_score: number | null;
}

export interface ResumeDetail extends Omit<ResumeSummary, 'section_count'> {
  raw_text: string;
  parsed_metadata: Record<string, unknown>;
  sections: ResumeSection[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${backendUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // Only surface human-readable details; validation arrays stay as status codes.
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      /* keep default detail */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listResumes(): Promise<ResumeSummary[]> {
  return request<ResumeSummary[]>('/api/v1/resumes');
}

export function getResume(id: string): Promise<ResumeDetail> {
  return request<ResumeDetail>(`/api/v1/resumes/${id}`);
}

export function createResume(payload: {
  file_name: string;
  raw_text: string;
  parsed_metadata?: Record<string, unknown>;
  sections?: ResumeSection[];
}): Promise<ResumeDetail> {
  return request<ResumeDetail>('/api/v1/resumes', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateResume(
  id: string,
  payload: Partial<{
    file_name: string;
    raw_text: string;
    parsed_metadata: Record<string, unknown>;
    sections: ResumeSection[];
  }>,
): Promise<ResumeDetail> {
  return request<ResumeDetail>(`/api/v1/resumes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteResume(id: string): Promise<void> {
  return request<void>(`/api/v1/resumes/${id}`, { method: 'DELETE' });
}

export interface AtsRuleItem {
  rule_id: string;
  category: string;
  passed: boolean;
  points: number;
  evidence: string;
  fix: string;
}

export interface AtsAnalysisReport {
  overall: number;
  categories: Record<string, number>;
  items: AtsRuleItem[];
  top_fixes: string[];
  limits_note: string;
}

export function analyzeResume(
  id: string,
  payload: { job_title: string; job_description: string },
): Promise<AtsAnalysisReport> {
  return request<AtsAnalysisReport>(`/api/v1/resumes/${id}/analyze`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
