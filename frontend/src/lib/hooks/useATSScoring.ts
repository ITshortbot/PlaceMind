import { useState } from 'react';
import type { ATSGapReport, ScoreResumeParams } from '@/types/ats';

export type ScoringStatus = 'idle' | 'parsing' | 'embedding' | 'synthesizing' | 'done' | 'error';

const FIELD_LABELS: Record<string, string> = {
  file: 'Resume PDF',
  job_title: 'Job title',
  job_description_raw: 'Job description',
  routing_mode: 'Engine setting',
};

// Turns any backend error body into readable text. FastAPI validation errors
// arrive as an array of objects; they must never be stringified directly.
export function readableApiError(payload: unknown, status: number): string {
  const fallback = `The ATS request failed (${status}). Please try again.`;
  if (typeof payload !== 'object' || payload === null) return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        if (typeof d === 'string') return d;
        if (typeof d !== 'object' || d === null) return '';
        const loc = (d as { loc?: unknown }).loc;
        const msg = (d as { msg?: unknown }).msg;
        const key = Array.isArray(loc) ? String(loc[loc.length - 1] ?? '') : '';
        const label = FIELD_LABELS[key] || '';
        const kind = (d as { type?: unknown }).type;
        const text = kind === 'missing' ? 'is required' : typeof msg === 'string' ? msg.replace(/^Value error, /, '') : 'is not valid';
        return label ? `${label} ${text}` : typeof msg === 'string' ? msg : '';
      })
      .filter(Boolean);
    if (parts.length) return `${parts.join('. ')}.`;
  }
  if (typeof detail === 'object' && detail !== null) {
    const m = (detail as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export function useATSScoring() {
  const [status, setStatus] = useState<ScoringStatus>('idle');
  const [report, setReport] = useState<ATSGapReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const reset = () => {
    setStatus('idle');
    setReport(null);
    setError(null);
    setLatencyMs(null);
  };

  const scoreResume = async ({ file, jobTitle, jobDescription, mode = 'cloud' }: ScoreResumeParams) => {
    const startedAt = performance.now();
    if (!jobTitle.trim()) {
      setError('Enter the job title you are applying for.');
      setStatus('error');
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError('Paste the job description first (at least 20 characters). The score compares your resume with the job text, so it cannot run on a job title alone.');
      setStatus('error');
      return;
    }
    setStatus('parsing');
    setReport(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_title', jobTitle);
    formData.append('job_description_raw', jobDescription);
    formData.append('routing_mode', mode);

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

    try {
      const response = await fetch(`${backendUrl}/api/v1/resume/score`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(readableApiError(payload, response.status));
      }

      setReport(payload as ATSGapReport);
      setLatencyMs(performance.now() - startedAt);
      setStatus('done');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reach the ATS service.');
      setStatus('error');
    }
  };

  return { status, report, error, latencyMs, scoreResume, reset };
}