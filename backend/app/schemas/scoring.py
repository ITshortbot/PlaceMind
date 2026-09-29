# ============================================================================
# File: backend/app/schemas/scoring.py
# Description: Pydantic v2 schemas for ATS Scoring, Vector Gap Matrix, and AI Reports
# ============================================================================

from typing import List, Literal, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

class ParsedSectionDTO(BaseModel):
    section_type: str = Field(..., description="work_experience, skills, projects, education, summary")
    content: str

class ATSScorePdfRequest(BaseModel):
    job_title: str
    job_description_raw: str
    routing_mode: Literal["cloud", "local"] = "cloud"

class RequirementGapItem(BaseModel):
    requirement: str
    match_status: Literal["covered", "weak", "missing"]  # Maps to design tokens: success, warning, danger
    similarity_score: float                              # Cosine score [0.0 - 1.0]
    matched_resume_section: Optional[str] = None
    matched_snippet: Optional[str] = None
    improvement_suggestion: str

class ModelAuditMetadata(BaseModel):
    model_used: str
    routing_mode: str
    latency_ms: float
    is_fallback: bool = False
    embedding_dimension: int = 384

class ATSGapReportResponse(BaseModel):
    overall_score: float = Field(..., description="Composite ATS Score [0-100]")
    semantic_score: float = Field(..., description="Dense Vector Alignment Score [0-100]")
    keyword_score: float = Field(..., description="Lexical Keyword Match Score [0-100]")
    status_summary: Literal["High Match", "Moderate Match", "Needs Optimization"]
    gap_matrix: List[RequirementGapItem]
    missing_keywords: List[str]
    detected_strengths: List[str]
    actionable_bullet_points: List[str]
    parsed_sections: List[ParsedSectionDTO]
    pdf_r2_url: Optional[str] = None
    processing_metadata: ModelAuditMetadata
