# ============================================================================
# File: backend/app/api/v1/endpoints/resumes.py
# Description: Resume persistence CRUD. Single local user (no auth in this
#   local-first demo): resumes attach to a get-or-created local account so
#   every row the UI lists is a real database record.
# ============================================================================

from uuid import UUID

import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import ATSMatchScore, JobDescription, Resume, ResumeSection, User
from app.database.session import get_db
from app.schemas.ats_rules import ScoreDocResponse
from app.schemas.resumes import (
    AnalyzeRequest,
    ResumeCreate,
    ResumeDetailOut,
    ResumeSummaryOut,
    ResumeUpdate,
)
from app.services.resume_content import clip_text as _clip, content_from_resume as _content_from_resume
from app.schemas.templates import (
    DensityEnum,
    EducationItem,
    ExperienceItem,
    FontEnum,
    HeaderStyleEnum,
    LayoutEnum,
    MoodEnum,
    ProjectItem,
    ResumeContent,
    SectionName,
    StyleSpec,
)
from app.services.ats_rules import compute_ats_readiness

router = APIRouter(prefix="/resumes", tags=["resumes"])

LOCAL_USER_EMAIL = "local@placemind.app"


async def _local_user(db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == LOCAL_USER_EMAIL))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=LOCAL_USER_EMAIL, full_name="Local User", is_local_only=True)
        db.add(user)
        await db.flush()
    return user


async def _latest_score(resume_id: UUID, db: AsyncSession) -> float | None:
    result = await db.execute(
        select(ATSMatchScore.overall_score)
        .where(ATSMatchScore.resume_id == resume_id)
        .order_by(ATSMatchScore.created_at.desc())
        .limit(1)
    )
    value = result.scalar_one_or_none()
    return float(value) if value is not None else None


async def _load_resume(resume_id: UUID, db: AsyncSession) -> Resume:
    result = await db.execute(
        select(Resume).options(selectinload(Resume.sections)).where(Resume.id == resume_id)
    )
    resume = result.scalar_one_or_none()
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return resume


def _summary(resume: Resume, latest_ats_score: float | None) -> ResumeSummaryOut:
    return ResumeSummaryOut(
        id=resume.id,
        file_name=resume.file_name,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
        section_count=len(resume.sections),
        latest_ats_score=latest_ats_score,
    )


@router.get("", response_model=list[ResumeSummaryOut])
async def list_resumes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resume).options(selectinload(Resume.sections)).order_by(Resume.created_at.desc())
    )
    resumes = list(result.scalars().all())
    out: list[ResumeSummaryOut] = []
    for resume in resumes:
        out.append(_summary(resume, await _latest_score(resume.id, db)))
    return out


@router.post("", response_model=ResumeDetailOut, status_code=status.HTTP_201_CREATED)
async def create_resume(payload: ResumeCreate, db: AsyncSession = Depends(get_db)):
    user = await _local_user(db)
    resume = Resume(
        user_id=user.id,
        file_name=payload.file_name.strip(),
        raw_text=payload.raw_text,
        parsed_metadata=payload.parsed_metadata,
    )
    resume.sections = [
        ResumeSection(section_type=s.section_type, content=s.content, meta_info=s.meta_info)
        for s in payload.sections
    ]
    db.add(resume)
    await db.flush()
    return await get_resume(resume.id, db)


@router.get("/{resume_id}", response_model=ResumeDetailOut)
async def get_resume(resume_id: UUID, db: AsyncSession = Depends(get_db)):
    resume = await _load_resume(resume_id, db)
    return ResumeDetailOut(
        id=resume.id,
        file_name=resume.file_name,
        raw_text=resume.raw_text,
        parsed_metadata=resume.parsed_metadata or {},
        created_at=resume.created_at,
        updated_at=resume.updated_at,
        sections=resume.sections,
        latest_ats_score=await _latest_score(resume.id, db),
    )


@router.put("/{resume_id}", response_model=ResumeDetailOut)
async def update_resume(resume_id: UUID, payload: ResumeUpdate, db: AsyncSession = Depends(get_db)):
    resume = await _load_resume(resume_id, db)
    if payload.file_name is not None:
        resume.file_name = payload.file_name.strip()
    if payload.raw_text is not None:
        resume.raw_text = payload.raw_text
    if payload.parsed_metadata is not None:
        resume.parsed_metadata = payload.parsed_metadata
    if payload.sections is not None:
        resume.sections.clear()
        await db.flush()
        resume.sections.extend(
            ResumeSection(section_type=s.section_type, content=s.content, meta_info=s.meta_info)
            for s in payload.sections
        )
    resume.updated_at = func.now()
    await db.flush()
    return await get_resume(resume.id, db)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(resume_id: UUID, db: AsyncSession = Depends(get_db)):
    resume = await _load_resume(resume_id, db)
    await db.delete(resume)
    await db.flush()


# Standard single-column ATS-safe style used when scoring stored plain-text
# resumes; the readiness engine is deterministic, no LLM calls.
ATS_SAFE_STYLE = StyleSpec(
    layout=LayoutEnum.SINGLE_COLUMN,
    font=FontEnum.CALIBRI,
    size_pt=11.0,
    density=DensityEnum.NORMAL,
    header_style=HeaderStyleEnum.LEFT,
    section_order=[
        SectionName.SUMMARY,
        SectionName.SKILLS,
        SectionName.EXPERIENCE,
        SectionName.PROJECTS,
        SectionName.EDUCATION,
    ],
    mood=MoodEnum.CORPORATE,
)


@router.post("/{resume_id}/analyze", response_model=ScoreDocResponse)
async def analyze_resume(resume_id: UUID, payload: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    """Run the deterministic ATS readiness engine on a stored resume against
    a pasted job description, and persist the resulting match score so list
    views show a real number."""
    resume = await _load_resume(resume_id, db)
    content = _content_from_resume(resume)

    started = time.perf_counter()
    report = compute_ats_readiness(content=content, style=ATS_SAFE_STYLE, jd_text=payload.job_description)
    elapsed_ms = (time.perf_counter() - started) * 1000.0

    user = await _local_user(db)
    job = JobDescription(user_id=user.id, title=payload.job_title.strip(), raw_text=payload.job_description)
    db.add(job)
    await db.flush()

    categories = report.categories
    db.add(
        ATSMatchScore(
            resume_id=resume.id,
            job_id=job.id,
            overall_score=report.overall,
            semantic_score=categories.get("semantic", report.overall),
            keyword_score=categories.get("keywords", report.overall),
            routing_mode="deterministic",
            gap_report=report.model_dump(),
            processing_time_ms=elapsed_ms,
        )
    )
    await db.flush()
    return report
