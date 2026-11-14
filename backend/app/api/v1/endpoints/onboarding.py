# ============================================================================
# File: backend/app/api/v1/endpoints/onboarding.py
# Description: Onboarding bootstrap. The wizard's answers become a real,
#              filled resume in one step - no "create it yourself" dead end.
#              Deterministic: sections contain only facts the user supplied;
#              anything missing is returned in `missing` so the chat can ask
#              for it. Nothing is ever invented.
# ============================================================================

import logging
from typing import Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.resumes import _local_user, get_resume
from app.database.models import Resume, ResumeSection
from app.database.session import get_db
from app.schemas.resumes import ResumeDetailOut

logger = logging.getLogger("placemind.onboarding")

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class OnboardingAnswers(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=40)
    university: Optional[str] = Field(default=None, max_length=200)
    specialization: Optional[str] = Field(default=None, max_length=200)
    target_role: Optional[str] = Field(default=None, max_length=200)
    target_company: Optional[str] = Field(default=None, max_length=200)


class BootstrapResponse(BaseModel):
    resume: ResumeDetailOut
    missing: list[str]


def _build_sections(a: OnboardingAnswers) -> list[ResumeSection]:
    """Sections strictly from supplied facts."""
    sections: list[ResumeSection] = []

    contact_lines = [a.full_name.strip()]
    if a.email:
        contact_lines.append(a.email.strip())
    if a.phone:
        contact_lines.append(a.phone.strip())
    sections.append(ResumeSection(
        section_type="contact",
        content="\n".join(contact_lines),
        meta_info={"source": "onboarding"},
    ))

    if a.university or a.specialization:
        edu = ", ".join(x for x in [a.specialization, a.university] if x)
        sections.append(ResumeSection(
            section_type="education",
            content=edu.strip(),
            meta_info={"source": "onboarding"},
        ))

    if a.target_role or a.target_company:
        if a.target_role and a.target_company:
            objective = f"Seeking a {a.target_role} role at {a.target_company}."
        elif a.target_role:
            objective = f"Seeking a {a.target_role} role."
        else:
            objective = f"Targeting opportunities at {a.target_company}."
        sections.append(ResumeSection(
            section_type="objective",
            content=objective,
            meta_info={"source": "onboarding"},
        ))

    return sections


def _missing_facts(a: OnboardingAnswers) -> list[str]:
    """Gaps worth asking about in chat, in priority order."""
    missing: list[str] = []
    if not a.university:
        missing.append("education.institution")
    missing.append("education.dates")
    missing.append("skills")
    missing.append("experience")
    if not a.email:
        missing.append("contact.email")
    if not a.phone:
        missing.append("contact.phone")
    return missing


@router.post("/bootstrap", response_model=BootstrapResponse, status_code=status.HTTP_201_CREATED)
async def bootstrap_resume(
    payload: OnboardingAnswers,
    db: AsyncSession = Depends(get_db),
) -> BootstrapResponse:
    user = await _local_user(db)

    name = payload.full_name.strip()
    role_part = f" - {payload.target_role.strip()}" if payload.target_role else ""
    raw_lines = [name + role_part]
    sections = _build_sections(payload)
    raw_lines.extend(s.content for s in sections)

    resume = Resume(
        user_id=user.id,
        file_name=f"{name} Resume",
        raw_text="\n\n".join(raw_lines),
        parsed_metadata={"source": "onboarding", "target_role": payload.target_role},
    )
    resume.sections = sections
    db.add(resume)
    await db.flush()

    logger.info("Onboarding bootstrap created resume %s for local user", resume.id)
    return BootstrapResponse(
        resume=await get_resume(resume.id, db),
        missing=_missing_facts(payload),
    )
