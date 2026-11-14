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


_DRAFT_VERSION = 1


def _draft_payload(section) -> object:
    meta = getattr(section, "meta_info", None) or {}
    if isinstance(meta, dict) and meta.get("version") == _DRAFT_VERSION:
        return meta.get("draft")
    return None


def _draft_items(draft) -> list | None:
    if isinstance(draft, list):
        return draft
    if isinstance(draft, dict) and isinstance(draft.get("items"), list):
        return draft["items"]
    return None


def _s(value) -> str:
    return str(value).strip() if value is not None else ""


def content_from_resume(resume: Resume) -> ResumeContent:
    """Best-effort structured view of a stored resume. Sections saved with a
    versioned meta_info draft payload are read back exactly (no prose parsing);
    content-only legacy sections fall back to the line-based mapping. Anything
    missing simply stays empty, which the readiness rules score honestly."""
    by_type: dict[str, list] = {}
    for section in resume.sections:
        by_type.setdefault(section.section_type.lower(), []).append(section)

    lines = [ln.strip() for ln in resume.raw_text.splitlines() if ln.strip()]
    headline = clip_text(lines[0] if lines else resume.file_name, 120) or "Untitled resume"
    summary_secs = by_type.get("summary", [])
    summary = clip_text(summary_secs[0].content if summary_secs else headline, 400) or headline

    skills: list[str] = []
    for sec in by_type.get("skills", []):
        draft = _draft_payload(sec)
        skill_list = draft if isinstance(draft, list) else (draft.get("skills") if isinstance(draft, dict) else None)
        if isinstance(skill_list, list):
            skills.extend(s for s in (_s(v) for v in skill_list) if s)
        else:
            skills.extend(p.strip() for p in sec.content.replace("\n", ",").split(",") if p.strip())

    experience = []
    for sec in by_type.get("experience", []):
        items = _draft_items(_draft_payload(sec))
        if items is not None:
            for it in items:
                if not isinstance(it, dict) or not _s(it.get("role")):
                    continue
                experience.append(ExperienceItem(
                    role=clip_text(_s(it.get("role")), 60) or "Experience",
                    company=clip_text(_s(it.get("company")), 60) or None,
                    start=clip_text(_s(it.get("start")), 40) or None,
                    end=clip_text(_s(it.get("end")), 40) or None,
                    bullets=[clip_text(b, 220) for b in (_s(v) for v in (it.get("bullets") or [])) if b][:5],
                ))
        else:
            c = sec.content
            experience.append(ExperienceItem(
                role=clip_text(c.splitlines()[0] if c.splitlines() else "Experience", 60) or "Experience",
                bullets=[clip_text(b, 220) for b in c.splitlines()[1:] if b.strip()][:5],
            ))
    experience = experience[:4]

    projects = []
    for sec in by_type.get("projects", []):
        items = _draft_items(_draft_payload(sec))
        if items is not None:
            for it in items:
                if not isinstance(it, dict) or not _s(it.get("name")):
                    continue
                projects.append(ProjectItem(
                    name=clip_text(_s(it.get("name")), 60) or "Project",
                    description=clip_text(_s(it.get("description")), 400) or None,
                    bullets=[clip_text(b, 220) for b in (_s(v) for v in (it.get("bullets") or [])) if b][:5],
                    link=_s(it.get("link")) or None,
                ))
        else:
            c = sec.content
            projects.append(ProjectItem(
                name=clip_text(c.splitlines()[0] if c.splitlines() else "Project", 60) or "Project",
                bullets=[clip_text(b, 220) for b in c.splitlines()[1:] if b.strip()][:5],
            ))
    projects = projects[:4]

    education = []
    for sec in by_type.get("education", []):
        items = _draft_items(_draft_payload(sec))
        if items is not None:
            for it in items:
                if not isinstance(it, dict) or not _s(it.get("degree")):
                    continue
                education.append(EducationItem(
                    degree=clip_text(_s(it.get("degree")), 120) or "Education",
                    institution=clip_text(_s(it.get("institution")), 120) or None,
                    year=clip_text(_s(it.get("year")), 40) or None,
                    details=clip_text(_s(it.get("details")), 200) or None,
                ))
        else:
            c = sec.content
            education.append(EducationItem(
                degree=clip_text(c.splitlines()[0] if c.splitlines() else "Education", 120) or "Education"
            ))
    education = education[:3]

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
