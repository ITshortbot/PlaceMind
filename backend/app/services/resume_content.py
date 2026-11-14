# ============================================================================
# File: backend/app/services/resume_content.py
# Description: Shared best-effort structured view of a stored resume. Used by
#              the resumes endpoints (ATS analysis) and the templates endpoint
#              (candidate-facts derivation for generation).
# ============================================================================

from app.database.models import Resume
from app.schemas.templates import EducationItem, ExperienceItem, ProjectItem, ResumeContent


def clip_text(text: str, limit: int) -> str:
    return text.strip()[:limit]


def content_from_resume(resume: Resume) -> ResumeContent:
    """Best-effort structured view of a stored plain-text resume. Sections
    were saved by type; anything missing simply stays empty, which the
    readiness rules score honestly as gaps."""
    by_type: dict[str, list[str]] = {}
    for section in resume.sections:
        by_type.setdefault(section.section_type.lower(), []).append(section.content)

    lines = [ln.strip() for ln in resume.raw_text.splitlines() if ln.strip()]
    headline = clip_text(lines[0] if lines else resume.file_name, 120) or "Untitled resume"
    summary = clip_text(by_type.get("summary", [headline])[0], 400) or headline

    skills: list[str] = []
    for chunk in by_type.get("skills", []):
        skills.extend(p.strip() for p in chunk.replace("\n", ",").split(",") if p.strip())

    experience = [
        ExperienceItem(
            role=clip_text(c.splitlines()[0] if c.splitlines() else "Experience", 60) or "Experience",
            bullets=[clip_text(b, 220) for b in c.splitlines()[1:] if b.strip()][:5],
        )
        for c in by_type.get("experience", [])[:4]
    ]
    projects = [
        ProjectItem(
            name=clip_text(c.splitlines()[0] if c.splitlines() else "Project", 60) or "Project",
            bullets=[clip_text(b, 220) for b in c.splitlines()[1:] if b.strip()][:5],
        )
        for c in by_type.get("projects", [])[:4]
    ]
    education = [
        EducationItem(degree=clip_text(c.splitlines()[0] if c.splitlines() else "Education", 120) or "Education")
        for c in by_type.get("education", [])[:3]
    ]
    return ResumeContent(
        headline=headline,
        summary=summary,
        skills=skills[:20],
        experience=experience,
        projects=projects,
        education=education,
    )


def facts_are_empty(content: ResumeContent) -> bool:
    """True when a structured facts payload carries no usable candidate facts."""
    return (
        not (content.name and content.name.strip())
        and not (content.contact and content.contact.strip())
        and not content.headline.strip()
        and not content.summary.strip()
        and not any(s.strip() for s in content.skills)
        and not content.experience
        and not content.projects
        and not content.education
    )
