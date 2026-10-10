# ============================================================================
# File: backend/app/api/v1/endpoints/templates.py
# Description: Template generation and presets endpoints with concurrency control.
# ============================================================================

import asyncio
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status

from app.schemas.templates import GenerateRequest, GenerateResponse
from app.services.template_generator import TemplateGenerator, _load_presets

router = APIRouter(prefix="/templates", tags=["Resume Templates"])

# In-process semaphore to limit concurrency (max 1 concurrent generation)
_generation_semaphore = asyncio.Semaphore(1)

# TODO: Add authentication (e.g. JWT/session) and database persistence (PostgreSQL/SQLAlchemy)
# for user templates and generation quotas in production.


@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate customized resume template and content",
    responses={
        429: {
            "description": "Server is busy with another generation request. Retry-After header included.",
        }
    },
)
async def generate_template(request: GenerateRequest) -> GenerateResponse:
    """
    Generates tailored ATS resume template style and content using the local OSS model.
    Guarded by a concurrency semaphore allowing max 1 concurrent generation.
    Returns 429 with Retry-After header when busy.
    """
    if _generation_semaphore.locked():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Template generation is currently busy. Please retry shortly.",
            headers={"Retry-After": "5"},
        )

    acquired = False
    try:
        # Non-blocking acquisition probe
        await asyncio.wait_for(_generation_semaphore.acquire(), timeout=0.01)
        acquired = True
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Template generation is currently busy. Please retry shortly.",
            headers={"Retry-After": "5"},
        )

    try:
        generator = TemplateGenerator()
        response = await generator.generate(request)
        return response
    finally:
        if acquired:
            _generation_semaphore.release()


@router.get(
    "/presets",
    summary="List default template presets",
    response_model=Dict[str, Dict[str, Any]],
)
async def get_presets() -> Dict[str, Dict[str, Any]]:
    """
    Returns the built-in resume template presets (Classic, Modern, Compact, Academic).
    """
    return _load_presets()
