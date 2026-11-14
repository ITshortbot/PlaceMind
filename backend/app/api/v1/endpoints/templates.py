# ============================================================================
# File: backend/app/api/v1/endpoints/templates.py
# Description: Template generation and presets endpoints with concurrency control.
# ============================================================================

import asyncio
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.resumes import _load_resume, _local_user
from app.database.session import get_db
from app.schemas.templates import CandidateFacts, GenerateRequest, GenerateResponse, ResumeContent
from app.services.resume_content import content_from_resume
from app.services.template_generator import TemplateGenerator, _load_presets


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
async def generate_template(
    request: GenerateRequest,
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
        await _local_user(db)
        resume = await _load_resume(request.resume_id, db)  # 404 when missing
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
        response = await generator.generate(request, facts=facts_content)
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
