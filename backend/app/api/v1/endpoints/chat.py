# ============================================================================
# File: backend/app/api/v1/endpoints/chat.py
# Description: Page-aware chat endpoint. Answers with a reply plus a safe menu
#              of page actions. Uses the free-only OpenRouter client when it
#              can; on any failure (offline, limit hit, unreadable reply) it
#              falls back to a deterministic local responder so the chat dock
#              on every page always does something real.
# ============================================================================

import json
import logging
import time
from typing import Optional

from fastapi import APIRouter

from app.schemas.chat import (
    ActionKind,
    ChatAction,
    ChatRequest,
    ChatResponse,
)
from app.services import openrouter

logger = logging.getLogger("placemind.chat")

router = APIRouter(prefix="/chat", tags=["chat"])


# What each page can genuinely do. The fallback responder and the model's
# action choices are both restricted to this map - the chat can never offer
# an action the page does not have.
PAGE_CAPABILITIES: dict[str, list[ChatAction]] = {
    "/": [
        ChatAction(id="dash.new-resume", label="Start a new resume", kind=ActionKind.NAVIGATE, target="/resume"),
        ChatAction(id="dash.upload", label="Upload an existing resume", kind=ActionKind.NAVIGATE, target="/resumes/upload"),
        ChatAction(id="dash.ats", label="Run an ATS check", kind=ActionKind.NAVIGATE, target="/ats"),
        ChatAction(id="dash.interview", label="Practice an interview", kind=ActionKind.NAVIGATE, target="/interview/new"),
    ],
    "/dashboard": [],
    "/resume": [
        ChatAction(id="resume.score", label="Score this resume", kind=ActionKind.RUN, target="ats.score"),
        ChatAction(id="resume.templates", label="Browse templates", kind=ActionKind.NAVIGATE, target="/template"),
        ChatAction(id="resume.upload", label="Upload instead", kind=ActionKind.NAVIGATE, target="/resumes/upload"),
    ],
    "/resumes/upload": [
        ChatAction(id="upload.builder", label="Open the builder instead", kind=ActionKind.NAVIGATE, target="/resume"),
    ],
    "/ats": [
        ChatAction(id="ats.upload", label="Upload a resume to check", kind=ActionKind.NAVIGATE, target="/resumes/upload"),
        ChatAction(id="ats.builder", label="Improve it in the builder", kind=ActionKind.NAVIGATE, target="/resume"),
    ],
    "/interview": [
        ChatAction(id="interview.new", label="Configure a practice session", kind=ActionKind.NAVIGATE, target="/interview/new"),
    ],
    "/interview/new": [
        ChatAction(id="interview.list", label="See past sessions", kind=ActionKind.NAVIGATE, target="/interview"),
    ],
    "/template": [
        ChatAction(id="template.builder", label="Open the builder", kind=ActionKind.NAVIGATE, target="/resume"),
    ],
    "/settings": [],
}
# Aliases: the dashboard capabilities also apply to /dashboard.
PAGE_CAPABILITIES["/dashboard"] = PAGE_CAPABILITIES["/"]

SYSTEM_PROMPT = (
    "You are the PlaceMind assistant inside a resume and interview-prep app. "
    "The user is a student. You know which page they are on and you only offer "
    "actions from the provided list - never invent features, scores, or pages. "
    "Answer in at most three short sentences, plain words, no fluff. If the "
    "request needs a fact you do not have, say what is missing instead of "
    "making it up. If you suggest actions, return them as the JSON array key "
    '"actions" holding ids from the allowed list, plus "reply" with your text, '
    'as one JSON object. If no action fits, return "actions" as an empty array.'
)

INTENT_KEYWORDS = {
    "resume": ["resume", "cv", "build", "create", "edit"],
    "ats": ["ats", "score", "gap", "keyword", "parse"],
    "interview": ["interview", "practice", "question", "mock", "rehearse"],
    "template": ["template", "design", "layout", "look"],
    "upload": ["upload", "pdf", "import", "existing"],
}


def _capabilities_for(path: str) -> list[ChatAction]:
    if path in PAGE_CAPABILITIES:
        return PAGE_CAPABILITIES[path]
    # Interview session pages share the interview capabilities.
    if path.startswith("/interview"):
        return PAGE_CAPABILITIES["/interview"]
    if path.startswith("/resumes"):
        return PAGE_CAPABILITIES["/resume"]
    return PAGE_CAPABILITIES["/"]


def _fallback_reply(req: ChatRequest) -> ChatResponse:
    """Deterministic local responder: honest intent matching over the current
    page's real capabilities. Runs with no model at all."""
    start = time.perf_counter()
    caps = _capabilities_for(req.page.path)
    text = req.message.lower()

    chosen: Optional[str] = None
    for intent, words in INTENT_KEYWORDS.items():
        if any(w in text for w in words):
            chosen = intent
            break

    actions: list[ChatAction] = []
    if chosen == "resume":
        actions = [a for a in caps if a.id in {"dash.new-resume", "resume.templates", "upload.builder"}][:2]
        reply = "The builder is where a resume takes shape - your content, a live template preview and an honest score. Want me to take you there?"
    elif chosen == "ats":
        actions = [a for a in caps if "ats" in a.id][:2]
        reply = "The ATS check scores your resume against a job description with transparent rules plus local analysis - no hidden AI judgement. I can point you at it."
    elif chosen == "interview":
        actions = [a for a in caps if "interview" in a.id][:2]
        reply = "Interview practice asks real questions based on your resume and scores each answer, then gives you a report. Setting up a session takes a minute."
    elif chosen == "template":
        actions = [a for a in caps if "template" in a.id][:2]
        reply = "Templates control how the resume looks; your content stays untouched when you switch. The gallery is one tap away."
    elif chosen == "upload":
        actions = [a for a in caps if "upload" in a.id][:2]
        reply = "You can upload an existing resume (PDF) and it gets parsed into editable sections. Want the upload screen?"
    else:
        actions = caps[:3]
        reply = (
            "I can help with your resume, ATS checks and interview practice. "
            "Here is what this page can do - or just tell me what you are working on."
        )

    return ChatResponse(
        reply=reply,
        actions=actions,
        model_used="local-fallback",
        is_fallback=True,
        latency_ms=(time.perf_counter() - start) * 1000,
    )


def _parse_model_payload(content: str, caps: list[ChatAction]) -> Optional[tuple[str, list[ChatAction]]]:
    """Extract reply+action ids from the model's JSON answer, keeping only
    actions that exist on this page."""
    allowed = {a.id: a for a in caps}
    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()
    try:
        data = json.loads(text)
        reply = str(data.get("reply", "")).strip()
        ids = data.get("actions") or []
        actions = [allowed[i] for i in ids if i in allowed]
        if reply:
            return reply, actions
    except (json.JSONDecodeError, AttributeError, TypeError):
        pass
    return None


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    caps = _capabilities_for(req.page.path)

    messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Page: {req.page.path}"
                + (f" ({req.page.label})" if req.page.label else "")
                + f"\nAllowed actions: {[a.id for a in caps]}\n\nUser: {req.message}"
            ),
        },
    ]
    for item in req.history[-6:]:
        messages.insert(-1, {"role": item.role, "content": item.content})

    try:
        result = await openrouter.chat_completion(messages)
        parsed = _parse_model_payload(result.content, caps)
        if parsed is None:
            # Model answered but not in the contract shape: keep its text if it
            # is short and plain, else fall back.
            text = result.content.strip()
            if text and len(text) <= 600 and not text.startswith(("{", "```")):
                return ChatResponse(
                    reply=text,
                    actions=[],
                    model_used=result.model_used,
                    is_fallback=False,
                    latency_ms=result.latency_ms,
                )
            logger.info("Model reply outside contract; using local fallback.")
            return _fallback_reply(req)
        reply, actions = parsed
        return ChatResponse(
            reply=reply,
            actions=actions,
            model_used=result.model_used,
            is_fallback=False,
            latency_ms=result.latency_ms,
        )
    except openrouter.OpenRouterError as exc:
        logger.info("OpenRouter unavailable (%s); local fallback.", exc)
        fallback = _fallback_reply(req)
        return fallback
