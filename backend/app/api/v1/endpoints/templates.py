# ============================================================================
# File: backend/app/api/v1/endpoints/templates.py
# Description: Template generation and presets endpoints with concurrency control.
# ============================================================================

import asyncio
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.resumes import _load_resume
from app.core.auth import get_current_user
from app.database.models import User
from app.database.session import get_db
from app.schemas.templates import CandidateFacts, GenerateRequest, GenerateResponse, ResumeContent
from app.services.resume_content import content_from_resume
from app.services.template_generator import (
    TemplateGenerationError,
    TemplateGenerator,
    _load_presets,
)


def _facts_to_content(facts: CandidateFacts) -> ResumeContent:
    """Normalizes explicit candidate facts into the ResumeContent shape the
    generator works with. Missing fields stay empty, never invented."""
    return ResumeContent(
        name=facts.name,
        contact=facts.contact,
        headline=facts.headline or "",
        summary=facts.summary or "",
        skills=facts.skills[:20],
        experience=facts.experience[:4],
        projects=facts.projects[:4],
        education=facts.education[:3],
    )

router = APIRouter(prefix="/templates", tags=["Resume Templates"])

# In-process semaphore to limit concurrency (max 1 concurrent generation)
_generation_semaphore = asyncio.Semaphore(1)

@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate customized resume template and content",
    responses={
        429: {
            "description": "Generation is busy or the selected provider is rate-limited; see detail.code.",
        },
        502: {"description": "Provider, model response, JSON, or template schema error."},
        503: {"description": "Selected provider is unavailable or Gemini credentials are missing."},
    },
)
async def generate_template(
    request: GenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerateResponse:
    """
    Generates tailored ATS resume template style and content using the local OSS model.
    Guarded by a concurrency semaphore allowing max 1 concurrent generation.
    Returns 429 with Retry-After header when busy.
    """
    # Resolve candidate facts before taking the generation slot: explicit
    # request facts win over resume_id. A missing resume 404s without ever
    # touching the semaphore.
    facts_content: ResumeContent | None = None
    if request.facts is not None:
        facts_content = _facts_to_content(request.facts)
    elif request.resume_id is not None:
        resume = await _load_resume(request.resume_id, db, user)  # 404 when missing or foreign
        facts_content = content_from_resume(resume)

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
        try:
            response = await generator.generate(request, facts=facts_content)
        except TemplateGenerationError as exc:
            raise HTTPException(
                status_code=exc.status_code,
                detail={"code": exc.code, "message": exc.message},
            ) from exc
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
