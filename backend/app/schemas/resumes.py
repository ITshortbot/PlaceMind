# ============================================================================
# File: backend/app/schemas/resumes.py
# Description: Request/response schemas for resume persistence CRUD.
# ============================================================================

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ResumeSectionIn(BaseModel):
    section_type: str = Field(..., min_length=1, max_length=50)
    content: str = Field(..., min_length=1)
    meta_info: dict = Field(default_factory=dict)


class ResumeSectionOut(BaseModel):
    id: UUID
    section_type: str
    content: str
    meta_info: dict

    model_config = {"from_attributes": True}


class ResumeCreate(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    raw_text: str = Field(..., min_length=1)
    parsed_metadata: dict = Field(default_factory=dict)
    sections: list[ResumeSectionIn] = Field(default_factory=list)


class ResumeUpdate(BaseModel):
    file_name: str | None = Field(default=None, min_length=1, max_length=255)
    raw_text: str | None = Field(default=None, min_length=1)
    parsed_metadata: dict | None = None
    sections: list[ResumeSectionIn] | None = None  # full replacement when provided


class ResumeSummaryOut(BaseModel):
    id: UUID
    file_name: str
    created_at: datetime
    updated_at: datetime
    section_count: int
    latest_ats_score: float | None  # None until a real analysis ran - never fabricated


class AnalyzeRequest(BaseModel):
    job_title: str = Field(..., min_length=1, max_length=255)
    job_description: str = Field(..., min_length=20, max_length=10000)


class ResumeDetailOut(BaseModel):
    id: UUID
    file_name: str
    raw_text: str
    parsed_metadata: dict
    created_at: datetime
    updated_at: datetime
    sections: list[ResumeSectionOut]
    latest_ats_score: float | None
