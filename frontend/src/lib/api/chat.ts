// ============================================================================
// File: frontend/src/lib/api/chat.ts
// Description: Typed client for the page-aware chat endpoint. The chat dock on
//              every screen calls this - never fetch directly from components.
//              Mirrors backend/app/schemas/chat.py; keep the two in sync.
// ============================================================================

const backendUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface PageContext {
  path: string;
  label?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  page: PageContext;
  resume_id?: string;
  session_id?: string;
  history?: ChatHistoryItem[];
}

export type ActionKind = 'navigate' | 'run' | 'prefill';

export interface ChatAction {
  id: string;
  label: string;
  kind: ActionKind;
  target: string;
  payload: Record<string, unknown>;
}

export interface ChatResponse {
  reply: string;
  actions: ChatAction[];
  model_used: string;
  is_fallback: boolean;
  latency_ms: number;
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${backendUrl()}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ history: [], ...req }),
  });
  if (!res.ok) {
    let detail = `Chat request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      /* keep default detail */
    }
    throw new Error(detail);
  }
  return (await res.json()) as ChatResponse;
}
