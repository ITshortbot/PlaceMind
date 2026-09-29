import { useState } from 'react';
import type { ATSGapReport, ScoreResumeParams } from '@/types/ats';

export type ScoringStatus = 'idle' | 'parsing' | 'embedding' | 'synthesizing' | 'done' | 'error';

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
        body: formData,
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const detail = typeof payload === 'object' && payload !== null && 'detail' in payload
          ? String(payload.detail)
          : `ATS request failed (${response.status}).`;
        throw new Error(detail);
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