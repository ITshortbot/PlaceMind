# ============================================================================
# File: backend/app/schemas/chat.py
# Description: Contract for the page-aware chat endpoint. The dock on every
#              screen sends the user's message plus where they are; the backend
#              answers with a reply and a safe menu of page actions the
#              frontend may offer. Actions are declarative - the frontend
#              decides how to render and run them, the backend never executes
#              UI itself.
# ============================================================================

from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PageContext(BaseModel):
    """Where the user is when they ask. path is the Next.js route."""

    path: str = Field(..., examples=["/resume", "/ats", "/interview"])
    label: Optional[str] = None


class ChatHistoryItem(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    page: PageContext
    resume_id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=12)


class ActionKind(str, Enum):
    NAVIGATE = "navigate"  # go to another route
    RUN = "run"            # call a named backend capability (see ChatAction.id)
    PREFILL = "prefill"    # put text into the page's own input


class ChatAction(BaseModel):
    """One thing the page can do for the user. `id` names a capability the
    frontend knows how to invoke; `target` is a route for NAVIGATE or a
    capability key for RUN; `payload` carries small typed arguments."""

    id: str
    label: str
    kind: ActionKind
    target: str
    payload: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply: str
    actions: list[ChatAction] = Field(default_factory=list)
    model_used: str
    is_fallback: bool = False
    latency_ms: float = 0.0
