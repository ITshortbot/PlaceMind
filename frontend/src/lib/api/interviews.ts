// ============================================================================
// File: frontend/src/lib/api/interviews.ts
// Description: Typed client for the mock-interview backend API.
// ============================================================================

const backendUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface PlannedQuestion {
  order: number;
  category: string;
  prompt: string;
  focus: string;
}

export interface InterviewTurn {
  order: number;
  category: string;
  question_text: string;
  focus: string | null;
  answer_text: string | null;
  score: number | null;
  feedback: AnswerFeedback | null;
}

export interface InterviewSessionState {
  session_id: string;
  target_role: string;
  company: string | null;
  interview_type: string;
  question_count: number;
  status: string;
  current_question: PlannedQuestion | null;
  answered: number;
  turns: InterviewTurn[];
}

export interface AnswerFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  signals: {
    word_count: number;
    metrics_cited: number;
    action_verbs: string[];
    star_sections: string[];
    filler_count: number;
  };
}

export interface AnswerResponse {
  // Conversational contract: no per-answer scorecard. feedback stays null
  // during the session; full heuristic feedback lives in the end-of-session
  // report (getInterviewReport). `acknowledgment` is the interviewer's short
  // reply; a gap in the answer returns next_question with category
  // 'follow-up' (same order as the planned question it probes).
  feedback: AnswerFeedback | null;
  acknowledgment: string;
  progress: string;
  next_question: PlannedQuestion | null;
  completed: boolean;
}

export interface SessionSummary {
  session_id: string;
  target_role: string;
  company: string | null;
  status: string;
  question_count: number;
  answered: number;
  average_score: number | null;
  created_at: string;
}

export interface InterviewReport {
  overall_score: number | null;
  dimensions: Record<string, number>;
  per_question: Array<{
    order: number;
    category: string;
    prompt: string;
    score: number;
    strengths: string[];
    improvements: string[];
  }>;
  recommendations: string[];
  method_note: string;
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
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      // keep generic detail
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function createInterviewSession(input: {
  target_role: string;
  company?: string;
  interview_type?: 'practice' | 'real';
  question_count?: number;
  resume_text?: string;
  job_description?: string;
}): Promise<InterviewSessionState> {
  return request<InterviewSessionState>('/api/v1/interviews/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getInterviewSession(sessionId: string): Promise<InterviewSessionState> {
  return request<InterviewSessionState>(`/api/v1/interviews/sessions/${sessionId}`);
}

export function listInterviewSessions(): Promise<SessionSummary[]> {
  return request<SessionSummary[]>('/api/v1/interviews/sessions');
}

export function answerInterviewQuestion(
  sessionId: string,
  answer: string,
  // Idempotency guard: pass the identity of the question being answered
  // (order + category from current_question/next_question). If the session
  // already moved on, the server replays state instead of consuming a retry
  // against the wrong turn. Categories repeat across turns; order+category
  // together identify the turn.
  expectedTurn?: { order: number; category: string },
): Promise<AnswerResponse> {
  const body: Record<string, unknown> = { answer };
  if (expectedTurn) {
    body.expected_order = expectedTurn.order;
    body.expected_category = expectedTurn.category;
  }
  return request<AnswerResponse>(`/api/v1/interviews/sessions/${sessionId}/answer`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getInterviewReport(sessionId: string): Promise<InterviewReport> {
  return request<InterviewReport>(`/api/v1/interviews/sessions/${sessionId}/report`);
}
