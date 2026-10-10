# ============================================================================
# File: backend/app/schemas/templates.py
# Description: Pydantic v2 schemas for Resume Template Style, Content, and Generation.
#              Configured with extra="forbid" across all models.
# ============================================================================

from enum import Enum
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictBaseModel(BaseModel):
    """Base schema forbidding extra fields to enforce strict model schema contracts."""
    model_config = ConfigDict(extra="forbid")


# ─── Style Enums ─────────────────────────────────────────────────────────────

class LayoutEnum(str, Enum):
    SINGLE_COLUMN = "single_column"
    SIDEBAR_HEADER = "sidebar_header"
    TWO_COLUMN = "two_column"


class FontEnum(str, Enum):
    CALIBRI = "Calibri"
    ARIAL = "Arial"
    GEORGIA = "Georgia"
    TIMES = "Times"


class DensityEnum(str, Enum):
    COMPACT = "compact"
    NORMAL = "normal"
    AIRY = "airy"


class HeaderStyleEnum(str, Enum):
    CENTERED = "centered"
    LEFT = "left"
    BANNER = "banner"


class SectionName(str, Enum):
    SUMMARY = "summary"
    SKILLS = "skills"
    EXPERIENCE = "experience"
    PROJECTS = "projects"
    EDUCATION = "education"


class MoodEnum(str, Enum):
    CORPORATE = "corporate"
    TECH = "tech"
    CREATIVE = "creative"
    MINIMAL = "minimal"
    FINANCE = "finance"


# ─── Style Specification ─────────────────────────────────────────────────────

class StyleSpec(StrictBaseModel):
    layout: LayoutEnum
    font: FontEnum
    size_pt: float = Field(..., ge=10.0, le=12.0, description="Base font size in points (10-12)")
    density: DensityEnum
    header_style: HeaderStyleEnum
    section_order: List[SectionName] = Field(
        ...,
        description="Exact permutation of [summary, skills, experience, projects, education]"
    )
    mood: MoodEnum
    hue: Optional[int] = Field(default=None, ge=0, le=360, description="Optional color hue angle 0-360")

    @field_validator("section_order")
    @classmethod
    def validate_section_order(cls, v: List[SectionName]) -> List[SectionName]:
        expected = {
            SectionName.SUMMARY,
            SectionName.SKILLS,
            SectionName.EXPERIENCE,
            SectionName.PROJECTS,
            SectionName.EDUCATION,
        }
        if len(v) != 5 or set(v) != expected:
            raise ValueError(
                "section_order must be a complete 5-item permutation of "
                "[summary, skills, experience, projects, education]"
            )
        return v


# ─── Resume Content ──────────────────────────────────────────────────────────

class ExperienceItem(StrictBaseModel):
    role: str = Field(..., min_length=1)
    company: Optional[str] = Field(default=None)
    bullets: List[str] = Field(default_factory=list, max_length=5)

    @field_validator("bullets")
    @classmethod
    def validate_bullets(cls, v: List[str]) -> List[str]:
        for idx, bullet in enumerate(v):
            if len(bullet) > 220:
                raise ValueError(f"Bullet #{idx + 1} exceeds maximum length of 220 characters (got {len(bullet)})")
        return v


class ProjectItem(StrictBaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = Field(default=None, max_length=400)
    bullets: List[str] = Field(default_factory=list, max_length=5)
    link: Optional[str] = Field(default=None)

    @field_validator("bullets")
    @classmethod
    def validate_project_bullets(cls, v: List[str]) -> List[str]:
        for idx, bullet in enumerate(v):
            if len(bullet) > 220:
                raise ValueError(f"Project bullet #{idx + 1} exceeds maximum length of 220 characters")
        return v


class EducationItem(StrictBaseModel):
    degree: str = Field(..., min_length=1)
    institution: Optional[str] = Field(default=None)
    year: Optional[str] = Field(default=None)
    details: Optional[str] = Field(default=None, max_length=200)


class ResumeContent(StrictBaseModel):
    headline: str = Field(..., max_length=120)
    summary: str = Field(..., max_length=400)
    skills: List[str] = Field(default_factory=list, max_length=20)
    experience: List[ExperienceItem] = Field(default_factory=list, max_length=4)
    projects: List[ProjectItem] = Field(default_factory=list, max_length=4)
    education: List[EducationItem] = Field(default_factory=list, max_length=3)


# ─── Request & Response ──────────────────────────────────────────────────────

class GenerateRequest(StrictBaseModel):
    prompt: str = Field(..., max_length=500)
    jd_text: Optional[str] = Field(default=None, max_length=4000)


class GenerateResponse(StrictBaseModel):
    style: StyleSpec
    content: ResumeContent
    warnings: List[str] = Field(default_factory=list)
    latency_ms: float = Field(default=0.0)
    source: Literal["model", "fallback"]
