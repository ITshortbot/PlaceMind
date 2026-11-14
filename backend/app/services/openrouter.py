# ============================================================================
# File: backend/app/services/openrouter.py
# Description: Free-only OpenRouter client. Talks to OpenRouter's
#              OpenAI-compatible chat endpoint with the account key, but hard
#              pins an allowlist of verified $0 models and never falls back to
#              a paid model: if the free route is unavailable (402/limit), the
#              caller gets an honest error to surface, not a silent paid call.
# ============================================================================

import logging
import time
from typing import Any, Optional

import httpx
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("placemind.openrouter")

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

# Verified $0 (input and output) on 2026-11-14 via GET /api/v1/models.
# Anything not in this set is refused before a request is even attempted,
# so a config typo can never produce a paid call.
FREE_MODEL_ALLOWLIST = {
    "openrouter/free",
}


class OpenRouterError(Exception):
    """Raised when the free route cannot serve the request. The message is
    safe to show to the user: it never contains the key or request bodies."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class OpenRouterResult(BaseModel):
    content: str
    model_used: str
    latency_ms: float
    token_usage: dict[str, int] = Field(default_factory=dict)


def _enforce_free_only(model: str) -> None:
    if model not in FREE_MODEL_ALLOWLIST:
        raise OpenRouterError(
            f"Model '{model}' is not on the verified-free allowlist. "
            "Paid model calls are disabled in this build."
        )


async def chat_completion(
    messages: list[dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.4,
    max_tokens: int = 800,
) -> OpenRouterResult:
    """One chat completion against OpenRouter, free models only.

    Raises OpenRouterError on any failure - offline, rate limit (429),
    payment required (402), or upstream error. Callers decide the fallback;
    this function itself never retries onto a paid route.
    """
    model = model or settings.OPENROUTER_MODEL
    _enforce_free_only(model)

    if not settings.OPENROUTER_API_KEY:
        raise OpenRouterError("OpenRouter key is not configured on this server.")

    start = time.perf_counter()
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.OPENROUTER_TIMEOUT_S) as client:
            res = await client.post(OPENROUTER_CHAT_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        raise OpenRouterError(f"OpenRouter is unreachable: {exc.__class__.__name__}") from exc

    latency_ms = (time.perf_counter() - start) * 1000

    if res.status_code == 402:
        raise OpenRouterError(
            "The free model allowance is exhausted for now. Paid calls are off, "
            "so this is a pause, not a charge.",
            status_code=402,
        )
    if res.status_code == 429:
        raise OpenRouterError(
            "Free model rate limit hit. Try again in a minute.",
            status_code=429,
        )
    if res.status_code != 200:
        logger.warning("OpenRouter returned %s", res.status_code)
        raise OpenRouterError(
            f"The model endpoint returned an error ({res.status_code}).",
            status_code=res.status_code,
        )

    data = res.json()
    try:
        choice = data["choices"][0]
        content = choice["message"]["content"] or ""
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenRouterError("The model returned an unreadable response.") from exc

    usage = data.get("usage") or {}
    return OpenRouterResult(
        content=content,
        model_used=data.get("model", model),
        latency_ms=latency_ms,
        token_usage={
            "prompt_tokens": int(usage.get("prompt_tokens", 0)),
            "completion_tokens": int(usage.get("completion_tokens", 0)),
        },
    )
